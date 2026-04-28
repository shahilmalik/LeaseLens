# LeaseLens 🔍🏠

**AI-Companion Chatbot for renters** — built to help international students in
Stuttgart navigate the German rental market, both **before** and **after**
signing a contract.

---

## ✨ Features (3 Cores)

1. **Clause Scanner**
   - Detects and categorizes critical clauses in a rental contract.
   - Each clause gets a visual marker (🟢 / 🟡 / 🔴 traffic-light style).
   - Provides short, plain-language explanations.

2. **Mietpreisbremse Checker**
   - Extracts location, square meters and rent from the contract.
   - Compares against the **Stuttgarter Mietspiegel**.
   - Applies the legal **+10 %** rule and flags violations.

3. **Companion Chatbot**
   - Q&A about the user's contract (contract used as context).
   - Helps with practical issues (something breaks, subletting, deadlines, …).
   - Available in **English** and **German** (multilingual-ready).

---

## 🧭 User Flow

1. **Login / Sign up**
2. **Select language** (German 🇩🇪 / English 🇬🇧)
3. **Upload contract** (PDF / DOCX)
4. Use Clause Scanner → Mietpreisbremse → Chatbot

---

## 🗂 Project Structure

```
LeaseLens/
├── backend/              # Django + DRF API
│   ├── manage.py
│   ├── backend/          # project settings
│   └── apps/             # Django apps (accounts, contracts, chatbot, mietspiegel)
├── frontend/             # Next.js (App Router) + TypeScript + Tailwind
│   ├── app/
│   ├── components/
│   └── lib/
├── requirements.txt      # Python deps (single source of truth)
└── README.md
```

> **Rule:** every new Python dependency **must** be added to `requirements.txt`.
> Every new JS dependency goes through `npm install` in `frontend/`.

---

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver
```

API will be available at `http://localhost:8000/api/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:3000`.

---

## 🧑‍💻 Coding Style & Conventions

Consistency > cleverness. Please follow these rules.

### Backend (Django / DRF)

- **Always use `ViewSet` / `ModelViewSet`** — never function-based views.
  Register them via `DefaultRouter` in `urls.py`.
- One Django app per domain concept (`accounts`, `contracts`, `chatbot`,
  `mietspiegel`). Each app exposes:
  - `models.py`
  - `serializers.py`
  - `views.py`  ← only viewsets here
  - `urls.py`   ← uses `DefaultRouter`
  - `services.py` (optional, business logic — keep viewsets thin)
- **Serializers** handle validation, **services** handle logic, **viewsets**
  only orchestrate.
- Format with **black**, lint with **ruff**:
  ```bash
  black backend && ruff check backend
  ```
- Type-hint public functions. Docstrings in English.
- Auth: **JWT** via `djangorestframework-simplejwt`.
- API base path: `/api/v1/...`.

#### Example viewset

```python
# backend/apps/contracts/views.py
from rest_framework import viewsets, permissions
from .models import Contract
from .serializers import ContractSerializer

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
```

### Frontend (Next.js)

- **Next.js App Router** + **TypeScript** + **Tailwind CSS**.
- Components are **functional** + typed props (`type Props = { ... }`).
- File naming: `kebab-case` for folders, `PascalCase.tsx` for components.
- Co-locate component styles; use Tailwind utility classes by default.
- Global state: **Zustand** (small) or React context. Avoid Redux.
- API calls go through `frontend/lib/api.ts` (single axios/fetch wrapper).
- i18n via `next-intl` with `de` and `en` locales — **no hard-coded strings**.
- Format with **Prettier**, lint with **ESLint** (`npm run lint`).

### Git

- Branches: `feature/<short-name>`, `fix/<short-name>`.
- Commits: **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`).
- One PR = one concern. Keep PRs small.

---

## 🌍 Languages

UI and AI responses must support **English** and **German**. The selected
language is stored on the user profile and sent with every API request via
the `Accept-Language` header.

---

## 📄 License

TBD.
