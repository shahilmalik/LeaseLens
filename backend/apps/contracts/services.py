"""Business logic for contract parsing & clause scanning using Gemini."""
from __future__ import annotations

import io
import json
import os
import re
import time

import pdfplumber
from django.core.files.base import ContentFile

from .models import Clause, Contract

# Models to try in order if the primary is overloaded
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-001"]

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _get_gemini_key(user=None) -> str:
    if user is not None:
        try:
            key = user.profile.gemini_api_key
            if key and key.strip():
                return key.strip()
        except Exception:
            pass
    return os.environ.get("GEMINI_API_KEY", "")


def _gemini_client(api_key: str):
    from google import genai
    return genai.Client(api_key=api_key)


def _call(client, prompt: str, retries: int = 3) -> str:
    """Call Gemini with automatic model fallback on 503 and retry on 429."""
    from google.genai.errors import ServerError, ClientError
    last_exc: Exception | None = None
    for model in GEMINI_MODELS:
        for attempt in range(retries):
            try:
                response = client.models.generate_content(model=model, contents=prompt)
                return response.text.strip()
            except ServerError as e:
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    last_exc = e
                    if attempt < retries - 1:
                        time.sleep(4 * (attempt + 1))
                    continue  # retry same model
                raise
            except ClientError as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    last_exc = e
                    wait = 15 * (attempt + 1)
                    time.sleep(wait)
                    continue
                raise
        # All retries exhausted for this model — try next model
    raise RuntimeError(f"All Gemini models unavailable: {last_exc}")


# --------------------------------------------------------------------------- #
# PDF text extraction
# --------------------------------------------------------------------------- #

def extract_text(contract: Contract) -> str:
    """Extract raw text from the uploaded PDF using pdfplumber."""
    try:
        path = contract.file.path
        with pdfplumber.open(path) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n\n".join(pages).strip()
    except Exception as exc:
        return f"[extraction error: {exc}]"


# --------------------------------------------------------------------------- #
# Clause scanner
# --------------------------------------------------------------------------- #

SCAN_PROMPT = """
You are a German tenancy-law expert. Analyse the rental contract text below and
return a JSON array of clause objects. Each object must have these exact keys:

  section         - the paragraph/section identifier if present (e.g. "§ 12"), else ""
  category        - short English label (e.g. "Cosmetic repairs")
  severity        - one of: "red", "yellow", "green"
  original_text   - the relevant sentence(s) quoted verbatim from the contract
  explanation_en  - plain-English explanation (1-3 sentences)
  explanation_de  - same explanation in German
  recommendation_en - what the tenant should do next (1-2 sentences, English)
  recommendation_de - same recommendation in German

Severity rules:
  red    = clause is likely void, illegal or highly unfavourable for the tenant
  yellow = clause is potentially problematic or worth scrutinising
  green  = standard, fair, or legally unproblematic

Cover ALL major clauses: rent amount, deposit, notice period, cosmetic repairs
(Schoenheitsreparaturen), operating costs (Betriebskosten), pets (Tierhaltung),
subletting (Untervermietung), renovation on move-out, landlord entry rights,
rent escalation (Indexmiete/Staffelmiete), and any other notable clause.

If the contract text is short or unclear, still return at least 5 clause objects.
Return ONLY the JSON array — no markdown code fences, no prose, no extra text.

CONTRACT TEXT:
{text}
"""

SCORE_PROMPT = """
Given the JSON array of rental-contract clauses below, compute an overall
"tenant fairness" score from 0 to 100 (100 = perfectly fair lease).

Use this formula: start at 100, subtract 12 for each red clause and 4 for each
yellow clause, floor at 0.

Return ONLY a single integer, nothing else.

CLAUSES JSON:
{clauses_json}
"""


def scan_clauses(contract: Contract, user=None) -> list[dict]:
    """
    Call Gemini to analyse the contract, persist Clause rows, update score.
    Returns the list of raw clause dicts (same data as what was saved).
    """
    api_key = _get_gemini_key(user)
    if not api_key:
        return []

    text = contract.extracted_text
    if not text:
        text = extract_text(contract)
        contract.extracted_text = text
        contract.save(update_fields=["extracted_text"])

    if not text or text.startswith("[extraction error"):
        return []

    model = _gemini_client(api_key)

    # ---- get clauses ----
    raw = _call(model, SCAN_PROMPT.format(text=text[:12000]))
    raw = re.sub(r"```(?:json)?", "", raw).strip()

    try:
        clauses_data: list[dict] = json.loads(raw)
    except json.JSONDecodeError:
        repair = _call(
            model,
            "Fix this broken JSON array so it parses. Return ONLY valid JSON:\n" + raw[:4000]
        )
        repair = re.sub(r"```(?:json)?", "", repair).strip()
        clauses_data = json.loads(repair)

    # ---- compute score ----
    try:
        score_raw = _call(model, SCORE_PROMPT.format(clauses_json=json.dumps(clauses_data)[:4000]))
        score = max(0, min(100, int(re.search(r"\d+", score_raw).group())))
    except Exception:
        reds    = sum(1 for c in clauses_data if c.get("severity") == "red")
        yellows = sum(1 for c in clauses_data if c.get("severity") == "yellow")
        score   = max(0, 100 - reds * 12 - yellows * 4)

    # ---- persist ----
    contract.clauses.all().delete()
    for c in clauses_data:
        Clause.objects.create(
            contract=contract,
            section=c.get("section", ""),
            category=c.get("category", ""),
            severity=c.get("severity", "yellow"),
            original_text=c.get("original_text", ""),
            explanation_en=c.get("explanation_en", ""),
            explanation_de=c.get("explanation_de", ""),
            recommendation_en=c.get("recommendation_en", ""),
            recommendation_de=c.get("recommendation_de", ""),
        )

    contract.score = score
    contract.save(update_fields=["score"])

    # Generate and store the PDF report
    try:
        _generate_report_pdf(contract)
    except Exception:
        pass  # PDF generation failure should never block the scan result

    return clauses_data


# --------------------------------------------------------------------------- #
# Report PDF generator (server-side, stored in media/reports/)
# --------------------------------------------------------------------------- #

def _generate_report_pdf(contract: Contract) -> None:
    """Build a formatted PDF report and persist it to contract.report_pdf."""
    try:
        from fpdf import FPDF  # type: ignore
    except ImportError:
        return  # fpdf2 not installed — skip silently

    clauses = list(contract.clauses.all())
    score = contract.score

    SEV_COLORS = {
        "red":    (220, 38, 38),
        "yellow": (217, 119, 6),
        "green":  (5, 150, 105),
    }
    SEV_BG = {
        "red":    (254, 242, 242),
        "yellow": (255, 251, 235),
        "green":  (236, 253, 245),
    }
    SEV_LABELS = {"red": "CRITICAL", "yellow": "REVIEW", "green": "GOOD"}

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    W = 210
    M = 16
    CW = W - 2 * M

    # ── Header banner ──
    pdf.set_fill_color(37, 99, 235)
    pdf.set_xy(M, 12)
    pdf.cell(CW, 22, "", border=0, fill=True)
    pdf.set_xy(M + 5, 17)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(CW - 10, 8, "LeaseLens - Contract Analysis Report", ln=False)
    pdf.set_xy(M + 5, 25)
    pdf.set_font("Helvetica", "", 8)
    from datetime import date as _date
    pdf.cell(CW - 10, 5, f"Generated {_date.today().strftime('%d %B %Y')}")
    pdf.ln(12)

    # ── Filename / date ──
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 30, 30)
    pdf.set_x(M)
    pdf.cell(CW, 6, f"File: {contract.original_filename}", ln=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.set_x(M)
    pdf.cell(CW, 5, f"Uploaded: {contract.uploaded_at.strftime('%d %B %Y')}", ln=True)
    pdf.ln(4)

    # ── Score boxes ──
    box_w = (CW - 6) / 4
    counts = {s: sum(1 for c in clauses if c.severity == s) for s in ("red", "yellow", "green")}
    boxes = [
        ("Overall Score", f"{score}/100" if score is not None else "-",
         (37, 99, 235) if score is None else ((5, 150, 105) if score >= 80 else (217, 119, 6) if score >= 60 else (220, 38, 38)),
         (248, 250, 252)),
        ("Critical",  str(counts["red"]),    (220, 38, 38),  (254, 242, 242)),
        ("Review",    str(counts["yellow"]), (217, 119, 6),  (255, 251, 235)),
        ("Good",      str(counts["green"]),  (5, 150, 105),  (236, 253, 245)),
    ]
    base_y = pdf.get_y()
    for i, (label, value, fg, bg) in enumerate(boxes):
        bx = M + i * (box_w + 2)
        pdf.set_fill_color(*bg)
        pdf.set_xy(bx, base_y)
        pdf.cell(box_w, 18, "", border=0, fill=True)
        pdf.set_font("Helvetica", "B", 15)
        pdf.set_text_color(*fg)
        pdf.set_xy(bx, base_y + 3)
        pdf.cell(box_w, 8, value, align="C")
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(80, 80, 80)
        pdf.set_xy(bx, base_y + 12)
        pdf.cell(box_w, 5, label, align="C")
    pdf.ln(22)

    # ── Section heading ──
    pdf.set_fill_color(243, 244, 246)
    pdf.set_x(M)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(CW, 8, "  Clause-by-Clause Analysis", fill=True, ln=True)
    pdf.ln(3)

    # ── Clauses ──
    for idx, clause in enumerate(clauses, 1):
        sev = clause.severity or "yellow"
        fg = SEV_COLORS.get(sev, (80, 80, 80))
        bg = SEV_BG.get(sev, (248, 248, 248))
        label = SEV_LABELS.get(sev, sev.upper())

        # Title row
        pdf.set_fill_color(*bg)
        pdf.set_x(M)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*fg)
        pill = f"[{label}]"
        section_part = f" {clause.section}" if clause.section else ""
        title = f"{idx}.{section_part}  {clause.category}"
        pdf.cell(CW, 7, f"{pill}  {title}", fill=True, ln=True)

        # Original text
        if clause.original_text:
            pdf.set_x(M + 3)
            pdf.set_font("Helvetica", "I", 7)
            pdf.set_text_color(90, 90, 90)
            snippet = clause.original_text[:220] + ("…" if len(clause.original_text) > 220 else "")
            pdf.multi_cell(CW - 3, 4, f'"{snippet}"')

        # Explanation
        pdf.set_x(M + 3)
        pdf.set_font("Helvetica", "B", 7)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(30, 4, "What this means:")
        pdf.ln(4)
        pdf.set_x(M + 3)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(30, 30, 30)
        pdf.multi_cell(CW - 3, 4, clause.explanation_en or "")

        # Recommendation
        pdf.set_x(M + 3)
        pdf.set_font("Helvetica", "B", 7)
        pdf.set_text_color(*fg)
        pdf.cell(30, 4, "Recommendation:")
        pdf.ln(4)
        pdf.set_x(M + 3)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(30, 30, 30)
        pdf.multi_cell(CW - 3, 4, clause.recommendation_en or "")

        # Divider
        pdf.set_draw_color(220, 220, 220)
        pdf.set_x(M)
        pdf.cell(CW, 0, "", border="T", ln=True)
        pdf.ln(3)

    # ── Footer ──
    pdf.set_y(-12)
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 5, "LeaseLens · For informational purposes only · Not legal advice", align="C")

    # ── Save to Django FileField ──
    buf = io.BytesIO(pdf.output())
    safe_name = re.sub(r"[^\w\-.]", "_", contract.original_filename.replace(".pdf", ""))
    filename = f"report_{contract.id}_{safe_name}.pdf"
    contract.report_pdf.save(filename, ContentFile(buf.getvalue()), save=True)


# --------------------------------------------------------------------------- #
# Deadlines extractor
# --------------------------------------------------------------------------- #

DEADLINES_PROMPT = """
You are a German tenancy-law expert. Today's date is {today}.

Based on the rental contract clauses JSON below, extract all time-sensitive
deadlines, notice periods, and important dates the tenant must be aware of.

Return a JSON array. Each object must have these exact keys:
  title_en        - short deadline title in English (e.g. "Notice period ends")
  title_de        - same in German
  detail_en       - 1-2 sentence explanation in English
  detail_de       - same in German
  type_en         - category in English (e.g. "Termination", "Utility bill", "Deposit", "Renewal", "Rent dispute")
  type_de         - same in German
  date            - ISO date string YYYY-MM-DD (best estimate relative to today if contract start date is unknown, assume contract started 6 months ago)
  tone            - one of: "danger", "warning", "info", "success"

Include deadlines for:
- Notice period to terminate (3 months standard; calculate earliest next quarter-end)
- Operating cost objection window (12 months from assumed statement date)
- Deposit return deadline (6 months after assumed move-out if contract ended)
- Any fixed-term contract renewal / auto-conversion date
- Rent increase notification deadlines (Indexmiete/Staffelmiete if present)
- Mietpreisbremse objection window if a red rent clause exists

Return ONLY the JSON array — no markdown fences, no prose.

CLAUSES JSON:
{clauses_json}
"""


def get_deadlines(contract: Contract, user=None) -> list[dict]:
    """Derive tenant deadlines from already-scanned clauses using Gemini."""
    from datetime import date
    api_key = _get_gemini_key(user)
    if not api_key:
        return []

    clauses = list(contract.clauses.values(
        "section", "category", "severity", "recommendation_en"
    ))
    if not clauses:
        return []

    client = _gemini_client(api_key)
    today = date.today().isoformat()
    raw = _call(client, DEADLINES_PROMPT.format(
        today=today,
        clauses_json=json.dumps(clauses)[:6000],
    ))
    raw = re.sub(r"```(?:json)?", "", raw).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        repair = _call(
            client,
            "Fix this broken JSON array so it parses. Return ONLY valid JSON:\n" + raw[:4000]
        )
        repair = re.sub(r"```(?:json)?", "", repair).strip()
        try:
            return json.loads(repair)
        except Exception:
            return []
