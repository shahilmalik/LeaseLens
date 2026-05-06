/**
 * LeaseLens — internationalisation
 * 15 languages supported by the UI.
 */

export const LANGUAGES = [
  { code: "en",  label: "English",        native: "English",        flag: "🇬🇧" },
  { code: "de",  label: "German",         native: "Deutsch",        flag: "🇩🇪" },
  { code: "tr",  label: "Turkish",        native: "Türkçe",         flag: "🇹🇷" },
  { code: "ru",  label: "Russian",        native: "Русский",        flag: "🇷🇺" },
  { code: "pl",  label: "Polish",         native: "Polski",         flag: "🇵🇱" },
  { code: "ar",  label: "Arabic",         native: "العربية",        flag: "🇸🇦" },
  { code: "ku",  label: "Kurdish",        native: "Kurdî",          flag: "🏳️" },
  { code: "sr",  label: "Serbo-Croatian", native: "Srpsko-Hrvatski", flag: "🇷🇸" },
  { code: "ro",  label: "Romanian",       native: "Română",         flag: "🇷🇴" },
  { code: "it",  label: "Italian",        native: "Italiano",       flag: "🇮🇹" },
  { code: "el",  label: "Greek",          native: "Ελληνικά",       flag: "🇬🇷" },
  { code: "sq",  label: "Albanian",       native: "Shqip",          flag: "🇦🇱" },
  { code: "es",  label: "Spanish",        native: "Español",        flag: "🇪🇸" },
  { code: "fr",  label: "French",         native: "Français",       flag: "🇫🇷" },
  { code: "vi",  label: "Vietnamese",     native: "Tiếng Việt",     flag: "🇻🇳" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export const RTL_LANGS: LangCode[] = ["ar"];
export function isRTL(lang: LangCode) { return RTL_LANGS.includes(lang); }

export const T = {
  "Dashboard":        { en:"Dashboard",       de:"Übersicht",          tr:"Gösterge",         ru:"Главная",          pl:"Panel",            ar:"لوحة التحكم",   ku:"Serûpel",        sr:"Početna",         ro:"Tablou de bord",   it:"Bacheca",          el:"Πίνακας",        sq:"Paneli",          es:"Panel",            fr:"Tableau de bord",  vi:"Bảng điều khiển" },
  "Scan Contract":    { en:"Scan Contract",   de:"Vertrag scannen",    tr:"Sözleşme Tara",    ru:"Сканировать",      pl:"Skanuj umowę",     ar:"مسح العقد",     ku:"Peymana bişkîne",sr:"Skeniraj ugovor",  ro:"Scanează contract", it:"Scansiona",        el:"Σάρωση",          sq:"Skano kontratën", es:"Escanear",         fr:"Scanner",          vi:"Quét hợp đồng" },
  "Rent Check":       { en:"Rent Check",      de:"Mietpreisbremse",    tr:"Kira Kontrolü",    ru:"Проверка аренды",  pl:"Kontrola czynszu", ar:"فحص الإيجار",   ku:"Kontrola kirê",  sr:"Provjera najma",   ro:"Verificare chirie", it:"Controllo affitto",el:"Έλεγχος ενοικίου", sq:"Kontrollo qiranë",es:"Control alquiler", fr:"Vérification loyer",vi:"Kiểm tra tiền thuê" },
  "AI Assistant":     { en:"AI Assistant",    de:"KI-Assistent",       tr:"AI Asistanı",      ru:"ИИ Ассистент",     pl:"Asystent AI",      ar:"المساعد الذكي", ku:"Alîkarê AI",     sr:"AI Asistent",      ro:"Asistent AI",      it:"Assistente AI",    el:"Βοηθός AI",       sq:"Asistenti AI",    es:"Asistente IA",     fr:"Assistant IA",     vi:"Trợ lý AI" },
  "Deadlines":        { en:"Deadlines",       de:"Fristen",            tr:"Son Tarihler",     ru:"Сроки",            pl:"Terminy",          ar:"المواعيد النهائية",ku:"Dêmarên dawî",  sr:"Rokovi",           ro:"Termene limită",   it:"Scadenze",         el:"Προθεσμίες",      sq:"Afatet",          es:"Plazos",           fr:"Échéances",        vi:"Thời hạn" },
  "Profile":          { en:"Profile",         de:"Profil",             tr:"Profil",           ru:"Профиль",          pl:"Profil",           ar:"الملف الشخصي",  ku:"Profîl",         sr:"Profil",           ro:"Profil",           it:"Profilo",          el:"Προφίλ",          sq:"Profili",         es:"Perfil",           fr:"Profil",           vi:"Hồ sơ" },
  "Sign out":         { en:"Sign out",        de:"Abmelden",           tr:"Çıkış Yap",        ru:"Выйти",            pl:"Wyloguj",          ar:"تسجيل الخروج",  ku:"Derkevin",       sr:"Odjava",           ro:"Deconectare",      it:"Esci",             el:"Αποσύνδεση",      sq:"Dilni",           es:"Cerrar sesión",    fr:"Déconnexion",      vi:"Đăng xuất" },
  "Loading…":         { en:"Loading…",        de:"Wird geladen…",      tr:"Yükleniyor…",      ru:"Загрузка…",        pl:"Ładowanie…",       ar:"جارٍ التحميل…", ku:"Bar dibe…",      sr:"Učitavanje…",      ro:"Se încarcă…",      it:"Caricamento…",     el:"Φόρτωση…",        sq:"Po ngarkohet…",   es:"Cargando…",        fr:"Chargement…",      vi:"Đang tải…" },
  "Welcome back":     { en:"Welcome back",    de:"Willkommen zurück",  tr:"Hoş geldiniz",     ru:"С возвращением",   pl:"Witaj ponownie",   ar:"مرحباً بعودتك", ku:"Bi xêr hatî",    sr:"Dobrodošli nazad", ro:"Bun revenit",      it:"Bentornato",       el:"Καλώς ήρθατε",    sq:"Mirë se u kthye", es:"Bienvenido/a",     fr:"Bon retour",       vi:"Chào mừng trở lại" },
  "Your contracts":   { en:"Your contracts",  de:"Deine Verträge",     tr:"Sözleşmeleriniz",  ru:"Ваши договоры",    pl:"Twoje umowy",      ar:"عقودك",          ku:"Peymana we",     sr:"Vaši ugovori",     ro:"Contractele tale", it:"I tuoi contratti", el:"Τα συμβόλαιά σας", sq:"Kontratat tuaja", es:"Tus contratos",    fr:"Vos contrats",     vi:"Hợp đồng của bạn" },
  "Upload contract":  { en:"Upload contract", de:"Vertrag hochladen",  tr:"Sözleşme Yükle",   ru:"Загрузить",        pl:"Wgraj umowę",      ar:"رفع العقد",      ku:"Peymanê barkirin",sr:"Učitaj ugovor",   ro:"Încarcă contract", it:"Carica contratto", el:"Μεταφόρτωση",      sq:"Ngarko kontratën",es:"Subir contrato",   fr:"Téléverser",       vi:"Tải hợp đồng" },
  "Scan now":         { en:"Scan now",        de:"Jetzt analysieren",  tr:"Şimdi Tara",       ru:"Сканировать",      pl:"Skanuj teraz",     ar:"امسح الآن",      ku:"Niha bişkîne",   sr:"Skeniraj sada",    ro:"Scanează acum",    it:"Scansiona ora",    el:"Σάρωση τώρα",     sq:"Skano tani",      es:"Escanear ahora",   fr:"Scanner maintenant",vi:"Quét ngay" },
  "No contracts yet": { en:"No contracts yet",de:"Noch keine Verträge",tr:"Henüz sözleşme yok",ru:"Пока нет договоров",pl:"Brak umów",       ar:"لا توجد عقود بعد",ku:"Hîn peyman tune",sr:"Nema ugovora",    ro:"Niciun contract",  it:"Nessun contratto", el:"Δεν υπάρχουν",    sq:"Nuk ka kontrata", es:"Sin contratos aún",fr:"Aucun contrat",    vi:"Chưa có hợp đồng" },
  "Upload new contract":  { en:"Upload new contract",  de:"Neuen Vertrag hochladen",  tr:"Yeni Sözleşme Yükle",  ru:"Загрузить новый",   pl:"Wgraj nową umowę",  ar:"رفع عقد جديد",    ku:"Peymaneke nû barkirin",sr:"Učitaj novi ugovor",ro:"Încarcă contract nou",it:"Carica nuovo contratto",el:"Νέο συμβόλαιο",   sq:"Ngarko kontratë të re",es:"Subir nuevo contrato",  fr:"Téléverser nouveau contrat",vi:"Tải hợp đồng mới" },
  "Analyse with Gemini":  { en:"Analyse with Gemini",  de:"Mit Gemini analysieren",   tr:"Gemini ile Analiz Et", ru:"Анализ с Gemini",   pl:"Analizuj z Gemini", ar:"تحليل بـ Gemini",  ku:"Bi Gemini analîz bike",sr:"Analiziraj s Geminijem",ro:"Analizează cu Gemini",it:"Analizza con Gemini",  el:"Ανάλυση με Gemini",sq:"Analizoni me Gemini",   es:"Analizar con Gemini",    fr:"Analyser avec Gemini",  vi:"Phân tích với Gemini" },
  "Overall score":    { en:"Overall score",   de:"Gesamt-Score",       tr:"Genel Puan",       ru:"Общий балл",       pl:"Wynik ogólny",     ar:"النتيجة الإجمالية",ku:"Xala giştî",    sr:"Ukupna ocjena",    ro:"Scor general",     it:"Punteggio totale", el:"Συνολική βαθμολογία",sq:"Rezultati total", es:"Puntuación total", fr:"Score global",     vi:"Điểm tổng" },
  "Download PDF":     { en:"Download PDF",    de:"PDF herunterladen",  tr:"PDF İndir",        ru:"Скачать PDF",      pl:"Pobierz PDF",      ar:"تنزيل PDF",      ku:"PDF dakêşin",    sr:"Preuzmi PDF",      ro:"Descarcă PDF",     it:"Scarica PDF",      el:"Λήψη PDF",        sq:"Shkarko PDF",     es:"Descargar PDF",    fr:"Télécharger PDF",  vi:"Tải PDF" },
  "Critical":         { en:"Critical",        de:"Kritisch",           tr:"Kritik",           ru:"Критично",         pl:"Krytyczne",        ar:"حرج",            ku:"Krîtîk",         sr:"Kritično",         ro:"Critic",           it:"Critico",          el:"Κρίσιμο",         sq:"Kritike",         es:"Crítico",          fr:"Critique",         vi:"Nghiêm trọng" },
  "Review":           { en:"Review",          de:"Prüfen",             tr:"İnceleyin",        ru:"Проверьте",        pl:"Sprawdź",          ar:"مراجعة",         ku:"Kontrol bike",   sr:"Pregled",          ro:"Revizuire",        it:"Da rivedere",      el:"Έλεγχος",         sq:"Shqyrtim",        es:"Revisar",          fr:"À réviser",        vi:"Xem xét" },
  "Good":             { en:"Good",            de:"OK",                 tr:"İyi",              ru:"Хорошо",           pl:"Dobry",            ar:"جيد",            ku:"Baş",            sr:"Dobro",            ro:"Bun",              it:"Buono",            el:"Καλό",            sq:"Mirë",            es:"Bien",             fr:"Bien",             vi:"Tốt" },
  "Contract analysis":{ en:"Contract analysis",de:"Vertragsanalyse",  tr:"Sözleşme Analizi", ru:"Анализ договора",  pl:"Analiza umowy",    ar:"تحليل العقد",    ku:"Analîza peymanê",sr:"Analiza ugovora",  ro:"Analiză contract", it:"Analisi contratto",el:"Ανάλυση συμβολαίου",sq:"Analizë kontrate",es:"Análisis contrato",fr:"Analyse contrat",  vi:"Phân tích hợp đồng" },
  "AI Assistant — Contract Chat": { en:"AI Assistant — Contract Chat",de:"KI-Assistent — Vertrags-Chat",tr:"AI Asistan — Sözleşme Sohbeti",ru:"ИИ — Чат по договору",pl:"Asystent AI — czat o umowie",ar:"المساعد الذكي — محادثة العقد",ku:"Alîkarê AI — Sohbeta Peymanê",sr:"AI Asistent — Chat o ugovoru",ro:"Asistent AI — chat contract",it:"Assistente AI — Chat contratto",el:"Βοηθός AI — Συνομιλία",sq:"Asistenti AI — Bisedë kontrate",es:"Asistente IA — Chat contrato",fr:"Assistant IA — Chat contrat",vi:"Trợ lý AI — Trò chuyện hợp đồng" },
  "Ask a question…":  { en:"Ask a question…", de:"Frage stellen…",    tr:"Soru sor…",        ru:"Задать вопрос…",   pl:"Zadaj pytanie…",   ar:"اطرح سؤالاً…",  ku:"Pirsekê bpirse…",sr:"Postavi pitanje…", ro:"Adresează o întrebare…",it:"Fai una domanda…", el:"Κάνε ερώτηση…",  sq:"Bëj një pyetje…", es:"Haz una pregunta…",fr:"Posez une question…",vi:"Đặt câu hỏi…" },
  "Send":             { en:"Send",             de:"Senden",            tr:"Gönder",           ru:"Отправить",        pl:"Wyślij",           ar:"إرسال",          ku:"Bişîne",         sr:"Pošalji",          ro:"Trimite",          it:"Invia",            el:"Αποστολή",        sq:"Dërgo",           es:"Enviar",           fr:"Envoyer",          vi:"Gửi" },
  "Deadlines & Notices":    { en:"Deadlines & Notices",    de:"Fristen & Hinweise",           tr:"Son Tarihler & Bildirimler",ru:"Сроки и уведомления",    pl:"Terminy i powiadomienia",  ar:"المواعيد والإشعارات",   ku:"Dêmarên dawî û Agahdarî",sr:"Rokovi i obavijesti",ro:"Termene și notificări", it:"Scadenze e avvisi",       el:"Προθεσμίες & Ειδοποιήσεις",sq:"Afatet dhe njoftimet",es:"Plazos y avisos",         fr:"Échéances et avis",         vi:"Thời hạn & Thông báo" },
  "Add to Google Calendar": { en:"Add to Google Calendar", de:"Zu Google Kalender hinzufügen",tr:"Google Takvime Ekle",        ru:"Добавить в Google Календарь",pl:"Dodaj do Google Calendar", ar:"إضافة إلى تقويم Google", ku:"Bi Google Salnameyê re",  sr:"Dodaj u Google Calendar",ro:"Adaugă în Google Calendar",it:"Aggiungi a Google Calendar",el:"Προσθήκη στο Google Calendar",sq:"Shto në Google Calendar",es:"Añadir a Google Calendar", fr:"Ajouter à Google Agenda",   vi:"Thêm vào Google Calendar" },
  "Profile & settings": { en:"Profile & settings",de:"Profil & Einstellungen",tr:"Profil & Ayarlar",ru:"Профиль и настройки",pl:"Profil i ustawienia",ar:"الملف الشخصي والإعدادات",ku:"Profîl û Mîhengên",sr:"Profil i postavke",ro:"Profil și setări",it:"Profilo e impostazioni",el:"Προφίλ & Ρυθμίσεις",sq:"Profili dhe cilësimet",es:"Perfil y ajustes",fr:"Profil et paramètres",vi:"Hồ sơ & cài đặt" },
  "Interface language": { en:"Interface language",de:"Anzeigesprache",tr:"Arayüz Dili",ru:"Язык интерфейса",pl:"Język interfejsu",ar:"لغة الواجهة",ku:"Zimanê navboriyê",sr:"Jezik sučelja",ro:"Limbă interfaţă",it:"Lingua interfaccia",el:"Γλώσσα διεπαφής",sq:"Gjuha e ndërfaqes",es:"Idioma de interfaz",fr:"Langue de l'interface",vi:"Ngôn ngữ giao diện" },
  "Save changes":     { en:"Save changes",    de:"Änderungen speichern",tr:"Değişiklikleri Kaydet",ru:"Сохранить",       pl:"Zapisz zmiany",    ar:"حفظ التغييرات", ku:"Guhertinan tomarkin",sr:"Spremi promjene",  ro:"Salvează modificări",it:"Salva modifiche",  el:"Αποθήκευση",      sq:"Ruaj ndryshimet", es:"Guardar cambios",  fr:"Enregistrer",      vi:"Lưu thay đổi" },
  "Saved!":           { en:"Saved!",          de:"Gespeichert!",       tr:"Kaydedildi!",      ru:"Сохранено!",       pl:"Zapisano!",        ar:"تم الحفظ!",      ku:"Tomarkirin!",    sr:"Sačuvano!",        ro:"Salvat!",          it:"Salvato!",         el:"Αποθηκεύτηκε!",   sq:"U ruajt!",        es:"¡Guardado!",       fr:"Enregistré!",      vi:"Đã lưu!" },
  "Choose your language": { en:"Choose your language",de:"Wähle deine Sprache",tr:"Dilinizi Seçin",ru:"Выберите язык",pl:"Wybierz język",ar:"اختر لغتك",ku:"Zimanê xwe hilbijêre",sr:"Odaberite jezik",ro:"Alegeți limba",it:"Scegli la lingua",el:"Επιλέξτε γλώσσα",sq:"Zgjidhni gjuhën",es:"Elige tu idioma",fr:"Choisissez votre langue",vi:"Chọn ngôn ngữ của bạn" },
  "Continue":         { en:"Continue",        de:"Weiter",             tr:"Devam Et",         ru:"Продолжить",       pl:"Kontynuuj",        ar:"متابعة",         ku:"Berdewam bike",  sr:"Nastavi",          ro:"Continuă",         it:"Continua",         el:"Συνέχεια",        sq:"Vazhdo",          es:"Continuar",        fr:"Continuer",        vi:"Tiếp tục" },
} satisfies Record<string, Record<LangCode, string>>;

export type TKey = keyof typeof T;

export function translate(key: TKey, lang: LangCode): string {
  return T[key][lang] ?? T[key]["en"];
}

export function makeTFn(lang: LangCode) {
  return (key: TKey) => translate(key, lang);
}
