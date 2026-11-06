# PRODUCTION READINESS & SECURITY MASTER CHECKLIST

> **Uniwersalny standard audytowy** dopuszczenia stron WWW, aplikacji webowych, platform SaaS, sklepów internetowych i systemów z panelem użytkownika do środowiska produkcyjnego.
>
> | Pole | Wartość |
> |---|---|
> | Wersja dokumentu | 1.0.0 |
> | Data weryfikacji standardów | 2026-11-06 |
> | Język | polski (nazwy technologii, standardów i podatności — po angielsku) |
> | Status | Dokument roboczy standardu — kopiuj do każdego projektu i wypełniaj kolumnę **Status** |
> | Powiązane dokumenty | [Security Testing Playbook](SECURITY-TESTING-PLAYBOOK.md) · [Go/No-Go](PRODUCTION-RELEASE-GO-NO-GO.md) · [Incident Response](INCIDENT-RESPONSE-PLAN.md) · [Risk Register](RISK-REGISTER-TEMPLATE.md) · [Audit Report](AUDIT-REPORT-TEMPLATE.md) · [Maintenance Calendar](PRODUCTION-MAINTENANCE-CALENDAR.md) · [Standards & References](STANDARDS-AND-REFERENCES.md) |

> ⚠️ **To nie jest porada prawna ani zamiennik pentestu.** Kwestie prawne (RODO, PKE, dostępność, konsument, PCI DSS) wymagają potwierdzenia przez prawnika / IOD / QSA. Zob. [Known Limitations & Audit Boundaries](#known-limitations--audit-boundaries).

---

## Spis treści

- [Jak czytać ten dokument (skrót)](#jak-czytać-ten-dokument-skrót)
- [CZĘŚĆ I — Project Baseline](#część-i--project-baseline)
- [CZĘŚĆ II — Architektura i jakość kodu](#część-ii--architektura-i-jakość-kodu)
- [CZĘŚĆ III — Application Security](#część-iii--application-security)
- [CZĘŚĆ IV — Authentication & Authorization](#część-iv--authentication--authorization)
- [CZĘŚĆ V — API Security](#część-v--api-security)
- [CZĘŚĆ VI — Database Security](#część-vi--database-security)
- [CZĘŚĆ VII — Infrastructure & Deployment](#część-vii--infrastructure--deployment)
- [CZĘŚĆ VIII — Frontend Security](#część-viii--frontend-security)
- [CZĘŚĆ IX — Performance & Stability](#część-ix--performance--stability)
- [CZĘŚĆ X — Testing & Quality Assurance](#część-x--testing--quality-assurance)
- [CZĘŚĆ XI — Accessibility](#część-xi--accessibility)
- [CZĘŚĆ XII — SEO & Technical SEO](#część-xii--seo--technical-seo)
- [CZĘŚĆ XIII — Privacy, GDPR & Legal Compliance](#część-xiii--privacy-gdpr--legal-compliance)
- [CZĘŚĆ XIV — E-commerce & Payments](#część-xiv--e-commerce--payments)
- [CZĘŚĆ XV — File Upload & Storage](#część-xv--file-upload--storage)
- [CZĘŚĆ XVI — Logging, Monitoring & Incident Response](#część-xvi--logging-monitoring--incident-response)
- [CZĘŚĆ XVII — Backup & Disaster Recovery](#część-xvii--backup--disaster-recovery)
- [CZĘŚĆ XVIII — Third-party Dependencies & Supply Chain](#część-xviii--third-party-dependencies--supply-chain)
- [CZĘŚĆ XIX — PWA & Mobile Web](#część-xix--pwa--mobile-web)
- [CZĘŚĆ XX — Technology-specific Checklists](#część-xx--technology-specific-checklists)
- [CZĘŚĆ XXI — Release Management](#część-xxi--release-management)
- [CZĘŚĆ XXII — Production Go / No-Go](#część-xxii--production-go--no-go)
- [CZĘŚĆ XXIII — Praktyczny plan audytu](#część-xxiii--praktyczny-plan-audytu)
- [CZĘŚĆ XXIV — Audit Report Template](#część-xxiv--audit-report-template)
- [CZĘŚĆ XXV — Risk Register](#część-xxv--risk-register)
- [CZĘŚĆ XXVI — Maintenance after Release](#część-xxvi--maintenance-after-release)
- [Known Limitations & Audit Boundaries](#known-limitations--audit-boundaries)
- [Quality Review dokumentu](#quality-review-dokumentu)

---

## Jak czytać ten dokument (skrót)

1. **Każdy punkt kontrolny ma unikalne ID** (np. `SEC-012`), priorytet `P0–P3` i pole statusu.
2. **Punkty krytyczne (głównie P0/P1)** mają pełną kartę: *Wymaganie · Dlaczego / skutek braku · Procedura testowa · Oczekiwany wynik · Narzędzia · Źródło · Status · Dowód*.
3. **Punkty P2/P3 i oczywiste kontrole konfiguracyjne** są w tabelach — kolumny zawierają te same informacje w skróconej formie.
4. **`CONDITIONAL: …`** oznacza, że punkt dotyczy tylko projektu z daną cechą (np. płatności, Supabase, upload plików). Jeśli cecha nie występuje → **N/A z uzasadnieniem**.
5. Szczegółowe procedury testów bezpieczeństwa (payloady, kolejność narzędzi, komendy) są w [SECURITY-TESTING-PLAYBOOK.md](SECURITY-TESTING-PLAYBOOK.md) — checklista odwołuje się do nich identyfikatorami `PB-…`.
6. Źródła są skrócone (np. `ASVS 5.0 V8`, `WSTG-ATHZ-04`); pełne linki i wersje → [STANDARDS-AND-REFERENCES.md](STANDARDS-AND-REFERENCES.md).

**Szablon karty punktu kontrolnego:**

```text
ID: SEC-001                      Priorytet: P0           Obszar: API Security
Wymaganie:    co dokładnie musi być spełnione
Dlaczego:     zagrożenie + skutek braku zabezpieczenia
Procedura:    kroki testu (manualny / automatyczny)
Oczekiwany:   obserwowalny wynik oznaczający PASS
Narzędzia:    np. Burp Suite, Playwright, curl
Źródło:       standard + sekcja
Status:       PASS | FAIL | N/A | NOT TESTED | BLOCKED
Dowód:        link do testu / logu / zrzutu / raportu narzędzia
```

---

# CZĘŚĆ I — Project Baseline

## I.1 Cel dokumentu

Dokument definiuje **minimalny, sprawdzalny poziom jakości, bezpieczeństwa, stabilności i zgodności**, który musi osiągnąć system przed publikacją oraz który musi utrzymywać po publikacji. Służy jako:

- **lista kontrolna** dla zespołu developerskiego przed release'em,
- **protokół audytu** dla audytora wewnętrznego lub zewnętrznego,
- **podstawa decyzji Go/No-Go** dla właściciela produktu,
- **rejestr dowodów** (evidence) na potrzeby klienta, ubezpieczyciela, IOD lub kontroli.

Dokument jest **technologicznie neutralny**; wymagania specyficzne dla stosu są w [Części XX](#część-xx--technology-specific-checklists) i oznaczone `CONDITIONAL`.

## I.2 Zakres audytu

| Obszar | W zakresie | Domyślnie poza zakresem (wymaga osobnego zlecenia) |
|---|---|---|
| Kod aplikacji (frontend, backend, IaC) | ✅ przegląd + skanery | Pełny manualny code review każdej linii |
| Konfiguracja runtime (nagłówki, TLS, CORS, cache) | ✅ | Hardening systemu operacyjnego hostów (CIS Benchmark dla OS) |
| Uwierzytelnianie, autoryzacja, sesje | ✅ | Kryptoanaliza własnych algorytmów |
| API (REST/GraphQL/webhooks) | ✅ | Fuzzing długoterminowy, testy DoS na produkcji |
| Bazy danych i storage | ✅ konfiguracja i uprawnienia | Audyt fizycznego bezpieczeństwa data center |
| Zależności i supply chain | ✅ | Audyt kodu źródłowego zależności |
| Wydajność | ✅ pomiar lab + field | Testy obciążeniowe na produkcji bez zgody |
| Dostępność | ✅ automaty + testy manualne | Certyfikacja / audyt z udziałem użytkowników z niepełnosprawnościami |
| SEO | ✅ technical SEO | Strategia contentowa, link building |
| Prywatność i prawo | ✅ techniczna weryfikacja obowiązków | Opinia prawna, audyt RODO całej organizacji |
| Płatności | ✅ integracja i logika | Formalna ocena PCI DSS (QSA / SAQ) |
| Backup / DR | ✅ istnienie + test odtworzenia | Pełne ćwiczenie BCP organizacji |

**Wyłączenia muszą być wpisane do raportu** ([Część XXIV](#część-xxiv--audit-report-template)) — punkt wyłączony ma status `N/A` lub `BLOCKED` z uzasadnieniem, nigdy `PASS`.

## I.3 Definicje i terminologia

| Termin | Definicja w tym dokumencie |
|---|---|
| **Produkcja** | Środowisko dostępne dla realnych użytkowników lub przetwarzające realne dane. |
| **Staging** | Środowisko możliwie identyczne z produkcją, z danymi testowymi lub zanonimizowanymi. |
| **Dane krytyczne** | Dane, których utrata lub ujawnienie powoduje szkodę prawną, finansową lub reputacyjną (dane osobowe, płatności, zamówienia, sekrety). |
| **Sekret** | Każda wartość dająca dostęp: klucz API, token, hasło, klucz prywatny, connection string, `service_role key`, webhook secret. |
| **Authentication (AuthN)** | Ustalenie *kim* jest podmiot. |
| **Authorization (AuthZ)** | Ustalenie, *co* podmiot może zrobić z danym zasobem. |
| **IDOR / BOLA** | Insecure Direct Object Reference / Broken Object Level Authorization — dostęp do cudzego obiektu przez zmianę identyfikatora. |
| **BFLA** | Broken Function Level Authorization — dostęp do funkcji (np. admin) bez uprawnień. |
| **Evidence (dowód)** | Artefakt potwierdzający wynik testu: log, raport narzędzia, nagranie, zrzut, link do pipeline'u, commit. |
| **RPO / RTO** | Recovery Point Objective (maks. akceptowalna utrata danych w czasie) / Recovery Time Objective (maks. czas przywrócenia usługi). |
| **CONDITIONAL** | Wymaganie obowiązuje tylko, gdy projekt ma wskazaną cechę. |
| **Accepted risk** | Znana niezgodność, której właściciel ryzyka formalnie nie naprawia przed publikacją (z terminem i środkami kompensującymi). |
| **Compensating control** | Alternatywne zabezpieczenie obniżające ryzyko, gdy właściwe nie jest możliwe. |

## I.4 Model oceny gotowości produkcyjnej

Ocena jest **bramkowa**, nie punktowa — średnia nie może „przykryć” luki krytycznej.

| Bramka | Warunek przejścia |
|---|---|
| **G1 — Brak blokerów** | 0 × `FAIL` dla P0; 0 × `NOT TESTED` dla P0 mających zastosowanie. |
| **G2 — Ryzyko wysokie zarządzone** | Każdy `FAIL` P1 jest naprawiony **albo** ma formalnie zaakceptowane ryzyko z terminem ≤ 30 dni i środkiem kompensującym. |
| **G3 — Pokrycie** | ≥ 90 % punktów P1 mających zastosowanie ma status `PASS`/`N/A`; każdy `N/A` ma uzasadnienie. |
| **G4 — Dowody** | Każdy `PASS` P0/P1 ma dowód (link/plik). Bez dowodu → `NOT TESTED`. |
| **G5 — Operacyjność** | Monitoring, alerting, backup z udanym testem odtworzenia i ścieżka rollbacku istnieją (LOG-, BCK-, REL-). |

Wynik bramek przekłada się na decyzję w [Części XXII](#część-xxii--production-go--no-go).

**Wskaźnik pomocniczy (informacyjny, nie decyzyjny):**
`Readiness % = PASS / (PASS + FAIL + NOT TESTED)` — liczony osobno dla każdego priorytetu. `N/A` i `BLOCKED` są wyłączone z mianownika, ale `BLOCKED` musi być wyjaśniony w raporcie.

## I.5 Klasyfikacja priorytetów

| Priorytet | Nazwa | Kryterium | Konsekwencja dla release'u |
|---|---|---|---|
| **P0** | Krytyczny — blokujący | Bezpośrednie ryzyko: wyciek danych, przejęcie konta/systemu, utrata danych bez możliwości odtworzenia, naruszenie prawa skutkujące natychmiastową szkodą, niedziałający krytyczny proces biznesowy. | **Release niemożliwy.** Nie można zaakceptować ryzyka (wyjątek: tylko gdy funkcja zostaje wyłączona z release'u). |
| **P1** | Wysoki | Realna, wykonalna ścieżka ataku lub awarii, wymagająca dodatkowych warunków; istotna niezgodność prawna. | Naprawa przed publikacją **lub** formalna akceptacja ryzyka przez właściciela (Część XXII). |
| **P2** | Istotny | Osłabienie obrony w głąb, problem jakości/wydajności/dostępności o umiarkowanym wpływie. | Do zaplanowania (backlog z terminem, zwykle ≤ 90 dni). |
| **P3** | Optymalizacja | Dobra praktyka, poprawa UX, hardening dodatkowy. | Opcjonalnie; przegląd kwartalny. |

> Priorytet w dokumencie jest **domyślny**. Audytor może go **podnieść** z uzasadnieniem (np. P2 → P1 dla systemu medycznego). **Obniżenie P0** wymaga zgody właściciela ryzyka i wpisu do Risk Register.

## I.6 Statusy

| Status | Znaczenie | Wymagany dowód / opis |
|---|---|---|
| **PASS** | Test wykonany, wynik zgodny z oczekiwanym. | Dowód (P0/P1 obowiązkowo). |
| **FAIL** | Test wykonany, wynik niezgodny. | Opis odchylenia + wpis do Risk Register (ID `RISK-…`). |
| **N/A** | Wymaganie nie dotyczy projektu. | Uzasadnienie (np. „brak uploadu plików — zweryfikowano w kodzie i UI”). |
| **NOT TESTED** | Nie przetestowano (brak czasu, środowiska, kompetencji). | Powód + plan. **Dla P0 traktowane jak FAIL.** |
| **BLOCKED** | Test niemożliwy z przyczyn zewnętrznych (brak dostępu, brak zgody na test, awaria środowiska). | Kto/co blokuje + data ponownej próby. |

## I.7 Zasady oceny ryzyka

Ryzyko = **Prawdopodobieństwo × Wpływ** (skala 1–5), z korektą o kontekst.

| | Wpływ 1 (pomijalny) | 2 (niski) | 3 (średni) | 4 (wysoki) | 5 (krytyczny) |
|---|---|---|---|---|---|
| **Prawd. 5 (prawie pewne)** | 5 M | 10 H | 15 H | 20 C | 25 C |
| **4 (prawdopodobne)** | 4 L | 8 M | 12 H | 16 C | 20 C |
| **3 (możliwe)** | 3 L | 6 M | 9 M | 12 H | 15 H |
| **2 (mało prawd.)** | 2 L | 4 L | 6 M | 8 M | 10 H |
| **1 (rzadkie)** | 1 L | 2 L | 3 L | 4 L | 5 M |

`C` (Critical, 16–25) → P0 · `H` (High, 10–15) → P1 · `M` (Medium, 5–9) → P2 · `L` (Low, 1–4) → P3.

**Wpływ** oceniaj w czterech wymiarach i bierz **najwyższy**: poufność danych, integralność (finanse, zamówienia), dostępność usługi, zgodność prawna. **Prawdopodobieństwo** zależy od: ekspozycji (publiczne vs. wewnętrzne), wymaganych uprawnień atakującego, złożoności ataku, istnienia publicznego exploita. Dla podatności z CVE można dodatkowo użyć CVSS v4.0 i EPSS — nie zastępują one oceny kontekstu.

## I.8 Zakres odpowiedzialności (RACI)

| Działanie | Developer | Tech Lead / Architekt | DevOps / SRE | Security / Audytor | Product Owner | IOD / Prawnik |
|---|---|---|---|---|---|---|
| Wypełnienie checklisty (self-assessment) | **R** | A | C | C | I | — |
| Testy bezpieczeństwa | C | C | C | **R/A** | I | — |
| Konfiguracja infrastruktury i nagłówków | C | C | **R/A** | C | — | — |
| Weryfikacja obowiązków prawnych | — | C | — | C | A | **R** |
| Akceptacja ryzyka P1 | — | C | C | C (rekomendacja) | **A** | C (prawne) |
| Decyzja Go/No-Go | I | C | C | C | **A** | C |
| Test odtworzenia backupu | — | C | **R** | I | A | — |

R — Responsible, A — Accountable, C — Consulted, I — Informed. Jedna osoba może pełnić wiele ról w małym zespole, ale **osoba akceptująca ryzyko nie powinna być jedynym autorem zmiany, której ryzyko dotyczy** (four-eyes principle).

## I.9 Jak korzystać z checklisty

1. **Skopiuj** katalog `docs/` do repozytorium projektu (lub trzymaj jako szablon w repozytorium standardów i linkuj).
2. **Profil projektu** — zaznacz cechy (patrz tabela niżej). Wszystkie punkty `CONDITIONAL` dla nieobecnych cech → `N/A` z uzasadnieniem „cecha nieobecna”.
3. **Self-assessment zespołu** — developer uzupełnia statusy i dowody.
4. **Weryfikacja audytora** — niezależna osoba sprawdza wszystkie P0/P1 i próbkę ≥ 20 % P2.
5. **Rejestracja FAIL** w [RISK-REGISTER-TEMPLATE.md](RISK-REGISTER-TEMPLATE.md).
6. **Naprawa → retest** (status zmienia się dopiero po retescie, z nowym dowodem).
7. **Decyzja** wg [PRODUCTION-RELEASE-GO-NO-GO.md](PRODUCTION-RELEASE-GO-NO-GO.md) i raport wg [AUDIT-REPORT-TEMPLATE.md](AUDIT-REPORT-TEMPLATE.md).

**Profil projektu (zaznacz, aby aktywować punkty CONDITIONAL):**

- [ ] Konta użytkowników / logowanie → AUTH-, AUTHZ-, SES-
- [ ] Panel administracyjny → AUTHZ-, ADM-
- [ ] Własne API (REST / GraphQL) → API-, GQL-
- [ ] Webhooks przychodzące → API-04x
- [ ] Integracje z zewnętrznymi API → EXT-
- [ ] Baza danych SQL / NoSQL / BaaS → DB-, SUPA-, FIRE-
- [ ] Upload plików → FILE-
- [ ] Płatności / e-commerce → PAY-, ECOM-
- [ ] Dane osobowe (praktycznie zawsze, także logi IP) → PRIV-
- [ ] Śledzenie / analityka / marketing → PRIV-03x
- [ ] PWA / service worker / push → PWA-
- [ ] Next.js / React+Vite / Node / Supabase / Firebase / Shopify / WordPress → Część XX
- [ ] Strona publiczna indeksowana → SEO-
- [ ] Usługa objęta przepisami o dostępności (np. e-commerce B2C) → A11Y- (wymóg prawny, nie tylko dobra praktyka)

## I.10 Jak dokumentować dowody

| Typ dowodu | Kiedy | Format / zasady |
|---|---|---|
| **Raport narzędzia** | skanery (SCA, SAST, DAST, Lighthouse, axe) | Plik JSON/SARIF/HTML w `docs/audit/<data>/evidence/` lub artefakt CI z linkiem; zapisz wersję narzędzia i komendę. |
| **Request/response** | testy API, AuthZ, IDOR | Zapis HTTP (Burp/ZAP „Save item”, `curl -v`, plik `.http`/kolekcja Bruno). **Zamaskuj tokeny i dane osobowe.** |
| **Zrzut ekranu / nagranie** | testy UI, dostępność, flow płatności | PNG/MP4 z datą, środowiskiem i kontem testowym w nazwie. |
| **Link do pipeline'u** | testy automatyczne, build, SBOM | URL do runu CI z hashem commita. |
| **Fragment konfiguracji** | nagłówki, polityki RLS, reguły Firebase | Ścieżka pliku + commit SHA, nie kopiuj sekretów. |
| **Protokół** | test odtworzenia backupu, ćwiczenie IR | Data, osoby, kroki, czas trwania (do RTO), wynik, rozbieżności. |

**Zasady:** dowód musi być **odtwarzalny** (kto, kiedy, jakie środowisko, jaka wersja/commit), **nie może zawierać sekretów** ani nieosłoniętych danych osobowych, a przy retescie dodaj **nowy** dowód (nie nadpisuj starego). Konwencja nazw: `<ID>_<YYYY-MM-DD>_<env>_<opis>.<ext>`, np. `SEC-003_2026-11-06_staging_idor-orders.har`.

---

# CZĘŚĆ II — Architektura i jakość kodu

**Źródła ogólne:** NIST SSDF (SP 800-218 v1.1) praktyki PW.1, PW.4–PW.9; OWASP ASVS 5.0 V15 (Secure Coding and Architecture); OWASP Proactive Controls. Jakość kodu nie jest celem samym w sobie — punkty poniżej istnieją, bo kod trudny do zrozumienia jest trudny do zabezpieczenia i do bezpiecznej zmiany.

## II.1 Architektura i struktura

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status · Dowód |
|---|---|---|---|---|---|
| **ARC-001** | P1 | Istnieje aktualny diagram architektury (komponenty, przepływy danych, granice zaufania, usługi zewnętrzne). | Diagram (np. C4 / Mermaid w repo) odpowiada stanowi z kodu i infrastruktury; zawiera każdą usługę zewnętrzną przetwarzającą dane. | SSDF PW.1 | ☐ |
| **ARC-002** | P1 | Wykonano threat modeling dla krytycznych przepływów (logowanie, płatności, dane osobowe, admin). | Dokument (STRIDE / OWASP Threat Dragon) z listą zagrożeń i powiązanymi kontrolami; daty < 12 mies. lub po istotnej zmianie architektury. | SSDF PW.1.1; OWASP Threat Modeling Cheat Sheet | ☐ |
| **ARC-003** | P1 | Logika bezpieczeństwa i reguły biznesowe wykonywane **po stronie serwera** (UI jest tylko warstwą prezentacji). | Przegląd: ceny, uprawnienia, limity, statusy liczone w backendzie; zmiana wartości w devtools/żądaniu nie zmienia wyniku. | ASVS 5.0 V2, V8 | ☐ |
| **ARC-004** | P2 | Separacja warstw: UI ↔ logika domenowa ↔ dostęp do danych ↔ integracje. | Komponenty UI nie wykonują zapytań SQL / nie trzymają kluczy; dostęp do danych przez jedną warstwę (repo/service). | ASVS V15 | ☐ |
| **ARC-005** | P2 | Struktura katalogów konsekwentna i udokumentowana (README / ARCHITECTURE.md). | Nowy developer znajduje moduł auth, API, konfigurację w < 5 min wg README. | — | ☐ |
| **ARC-006** | P2 | Moduły mają jasno określone odpowiedzialności, brak cyklicznych zależności. | `npx madge --circular src` (JS/TS) → 0 cykli lub cykle udokumentowane. | — | ☐ |
| **ARC-007** | P3 | Komponenty UI reużywalne (design system / biblioteka komponentów), brak kopii tych samych komponentów z drobnymi zmianami. | Przegląd: elementy interaktywne (przyciski, modale, formularze) z jednego źródła. | — | ☐ |
| **ARC-008** | P2 | Kod wykonywany wyłącznie na serwerze jest technicznie odseparowany od bundla klienta. | Next.js: `import "server-only"` w modułach z sekretami; Vite: brak importów modułów serwerowych w `src/` klienta; build nie zawiera stringów sekretów (zob. SEC-033). | ASVS V13, V14 | ☐ |

## II.2 Walidacja, błędy, stan, typy

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status · Dowód |
|---|---|---|---|---|---|
| **ARC-010** | P0 | Każde wejście z zewnątrz (body, query, params, headers, cookies, pliki, webhooki, wiadomości z kolejki) walidowane schematem po stronie serwera (allow-list typów, długości, zakresów, formatów). | Przegląd: schemat (Zod/Valibot/Joi/Pydantic/JSON Schema) na każdym handlerze; test: nieprawidłowe typy/długości → `400/422` bez stack trace. | ASVS 5.0 V2; OWASP Input Validation CS | ☐ |
| **ARC-011** | P1 | Spójna strategia obsługi błędów: błędy oczekiwane (walidacja, 404) vs. nieoczekiwane (500) — użytkownik dostaje bezpieczny komunikat, szczegóły trafiają do logów z correlation ID. | Wymuś wyjątek (np. błędny parametr DB w stagingu) → odpowiedź bez stack trace/SQL/ścieżek; log zawiera szczegóły + `requestId` widoczny w odpowiedzi. | ASVS V16; OWASP Error Handling CS | ☐ |
| **ARC-012** | P2 | Brak „połykania” wyjątków (`catch {}` bez logowania lub uzasadnienia). | `grep -rnE "catch\s*(\([^)]*\))?\s*\{\s*\}" src` → każdy wynik ma komentarz uzasadniający. | — | ☐ |
| **ARC-013** | P2 | Zarządzanie stanem: jedno źródło prawdy dla danych serwerowych (cache zapytań) i jasno oddzielony stan UI; brak duplikacji tych samych danych w wielu store'ach bez synchronizacji. | Przegląd store'ów; test: zmiana danych w jednym widoku odzwierciedla się w innych bez reloadu lub reload jest udokumentowany. | — | ☐ |
| **ARC-014** | P1 | `CONDITIONAL: TypeScript` — `strict: true` (lub plan migracji), `tsc --noEmit` przechodzi bez błędów w CI. | `npx tsc --noEmit` → exit 0; `any` / `@ts-ignore` policzone i uzasadnione. | TS docs | ☐ |
| **ARC-015** | P2 | Typy na granicach systemu wyprowadzane ze schematu walidacji lub kontraktu API (OpenAPI/GraphQL codegen), nie ręcznie duplikowane. | Przegląd: `z.infer<>` / codegen; zmiana schematu łamie build w miejscach użycia. | — | ☐ |
| **ARC-016** | P3 | Brak martwego kodu, nieużywanych eksportów, plików i zależności. | `npx knip` (JS/TS) → wynik przejrzany; nieużywane zależności usunięte. | — | ☐ |
| **ARC-017** | P3 | Duplikacja kodu kontrolowana. | `npx jscpd src --min-lines 10` → duplikaty przejrzane; krytyczne fragmenty (auth, walidacja) nieduplikowane. | — | ☐ |

## II.3 Konfiguracja, środowiska, sekrety

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status · Dowód |
|---|---|---|---|---|---|
| **ARC-020** | P0 | Brak sekretów w repozytorium — **w całej historii git**, nie tylko w HEAD. | `gitleaks git --redact -v` (lub `trufflehog git file://. --only-verified`) → 0 znalezisk; każde historyczne znalezisko = sekret **zrotowany** (samo usunięcie z historii nie wystarcza). | ASVS V13; OWASP Secrets Management CS | ☐ |
| **ARC-021** | P0 | Konfiguracja wczytywana i **walidowana przy starcie** (fail-fast) — brak wymaganej zmiennej zatrzymuje start, a nie powoduje działania z wartością domyślną. | Uruchom bez kluczowej zmiennej → proces kończy się czytelnym błędem; brak „fallbacków” typu `process.env.SECRET \|\| "dev-secret"`. | ASVS V13 | ☐ |
| **ARC-022** | P0 | Rozdzielenie zmiennych publicznych i prywatnych; do bundla klienta trafiają tylko zmienne z prefiksem publicznym (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`) i żadna z nich nie jest sekretem. | Przegląd `.env*` + `grep` zbudowanego `dist/`/`.next/static` na wartości kluczy prywatnych → 0 trafień. | ASVS V14 | ☐ |
| **ARC-023** | P1 | Odrębne środowiska dev / staging / production z **odrębnymi** sekretami, bazami i kontami usług zewnętrznych (np. klucze płatności test vs live). | Porównanie konfiguracji: żaden sekret produkcyjny nie występuje w dev/staging; staging nie łączy się z bazą produkcyjną. | SSDF PO.5 | ☐ |
| **ARC-024** | P1 | `.env.example` (bez wartości) dokumentuje każdą zmienną: cel, czy wymagana, czy publiczna. | Plik istnieje i jest zgodny z walidacją konfiguracji (ARC-021). | — | ☐ |
| **ARC-025** | P1 | Pliki `.env*` z wartościami są w `.gitignore`; w repo jest tylko `.env.example`. | `git ls-files \| grep -E "\.env"` → tylko `.env.example`. | — | ☐ |
| **ARC-026** | P2 | Tryby debug / dev tools / verbose logging wyłączone w produkcji przez konfigurację, nie przez pamięć zespołu. | Build produkcyjny: `NODE_ENV=production`; brak `debug: true`, `console.log` danych wrażliwych (zob. SEC-035). | ASVS V13 | ☐ |

## II.4 Proces: review, lint, testy, dokumentacja

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status · Dowód |
|---|---|---|---|---|---|
| **ARC-030** | P1 | Każda zmiana na gałęzi produkcyjnej przechodzi code review (min. 1 osoba inna niż autor) — wymuszone ustawieniami repozytorium. | Branch protection / ruleset: required PR review, brak bezpośrednich pushy (lub udokumentowany wyjątek dla zespołu 1-osobowego + kompensacja: automatyczne skany w CI). | SSDF PW.7 | ☐ |
| **ARC-031** | P1 | CI wykonuje: lint, typecheck, testy, build, skan zależności i sekretów — merge zablokowany przy błędzie. | Required status checks w repo; celowo zepsuty test blokuje merge. | SSDF PW.7–PW.8 | ☐ |
| **ARC-032** | P2 | Formatowanie i lint automatyczne i spójne (Prettier/ESLint/Biome lub odpowiedniki); reguły bezpieczeństwa włączone (np. `eslint-plugin-security`, `no-eval`, `react/no-danger`). | `npm run lint` → 0 errorów; konfiguracja w repo. | — | ☐ |
| **ARC-033** | P1 | Testy pokrywają **krytyczne ścieżki**, nie tylko procent linii: logowanie, autoryzacja, płatność, zapis/odczyt danych krytycznych, uprawnienia ról. | Mapa: krytyczny proces → test(y) automatyczne; brak testu = luka opisana w raporcie. Coverage jest wskaźnikiem pomocniczym. | SSDF PW.8 | ☐ |
| **ARC-034** | P2 | Dokumentacja techniczna: README (uruchomienie, build, test, deploy), opis architektury, runbook operacyjny, decyzje architektoniczne (ADR) dla kluczowych wyborów. | Osoba spoza zespołu uruchamia projekt lokalnie wg README; runbook opisuje rollback i kontakt awaryjny. | — | ☐ |
| **ARC-035** | P2 | Zarządzanie zależnościami: lockfile w repo, instalacja deterministyczna w CI (`npm ci`/`pnpm install --frozen-lockfile`), jasna polityka aktualizacji. Szczegóły: Część XVIII. | CI używa trybu frozen; `package.json` bez zakresów `*`/`latest`. | SSDF PW.4 | ☐ |

---

# CZĘŚĆ III — Application Security

**Źródła ogólne:** OWASP Top 10:2025 · OWASP ASVS 5.0.0 · OWASP WSTG v4.2 (stabilna; v5 w rozwoju) · OWASP Cheat Sheet Series. Pełne procedury testów i payloady: [SECURITY-TESTING-PLAYBOOK.md](SECURITY-TESTING-PLAYBOOK.md).

> **Zasady części III:** (1) Wynik skanera automatycznego **nie** jest dowodem bezpieczeństwa — jest dowodem tylko tego, co skaner umie wykryć. (2) Walidacja frontendowa **nie** jest zabezpieczeniem. (3) Testy aktywne wykonuj na **stagingu**, a na produkcji tylko pasywne/nienaruszające, za pisemną zgodą właściciela.

## III.0 Mapa OWASP Top 10:2025 → punkty kontrolne

| Kategoria OWASP Top 10:2025 | Punkty kontrolne |
|---|---|
| A01 Broken Access Control (w 2025 obejmuje też SSRF) | SEC-003, SEC-006, SEC-007, SEC-008, SEC-016, SEC-019; Część IV (AUTHZ-), V (API-) |
| A02 Security Misconfiguration | SEC-011, SEC-018, SEC-034, SEC-035; Część VII |
| A03 Software Supply Chain Failures | SEC-031, SEC-032; Część XVIII |
| A04 Cryptographic Failures | SEC-012; INF- (TLS) |
| A05 Injection | SEC-001, SEC-002, SEC-004, SEC-014, SEC-015 |
| A06 Insecure Design | SEC-025, SEC-026, SEC-027; ARC-002 |
| A07 Authentication Failures | SEC-009, SEC-020–SEC-024; Część IV |
| A08 Software or Data Integrity Failures | SEC-013, SEC-032; API- (webhooki) |
| A09 Security Logging and Alerting Failures | SEC-038; Część XVI |
| A10 Mishandling of Exceptional Conditions | SEC-036; ARC-011; PERF- (timeouty) |

> Nazwy i kolejność kategorii zweryfikowane 2026-11-06 na owasp.org/Top10/2025. Jeżeli korzystasz z mapowania na 2021, pamiętaj, że SSRF (A10:2021) został włączony do A01:2025.

---

### Injection

#### **SEC-001** · P0 · SQL Injection
- [ ] **Wymaganie:** Wszystkie zapytania SQL używają zapytań parametryzowanych / prepared statements lub ORM bez konkatenacji wejścia. Identyfikatory dynamiczne (nazwy kolumn do sortowania, nazwy tabel) wybierane z allow-listy, nigdy wstawiane bezpośrednio.
- **Dlaczego / skutek braku:** Odczyt, modyfikacja lub usunięcie całej bazy, obejście logowania, w niektórych silnikach wykonanie poleceń systemowych.
- **Test manualny:** W każdym parametrze trafiającym do bazy (filtry, sort, wyszukiwarka, ID) wstrzyknij `'`, `"`, `' OR '1'='1`, `1 AND SLEEP(5)` / `1; SELECT pg_sleep(5)--` → obserwuj błąd 500, różnice odpowiedzi, opóźnienie. Przegląd kodu: `grep -rnE "(query|raw|execute|\\\$queryRawUnsafe|sequelize\.query)\(" src` i sprawdź każde użycie z template stringiem.
- **Test automatyczny:** Semgrep (`p/sql-injection`, `p/owasp-top-ten`), CodeQL; na stagingu ZAP active scan; `sqlmap` **wyłącznie na stagingu**, z ograniczonym `--level/--risk`.
- **Oczekiwany wynik:** Żaden payload nie zmienia logiki zapytania; brak błędów SQL w odpowiedzi; brak różnic czasowych; SAST bez nierozwiązanych znalezisk.
- **Źródło:** OWASP Top 10:2025 A05 · ASVS 5.0 V1 · WSTG-INPV-05 · OWASP SQL Injection Prevention CS.
- **Status:** ☐ PASS ☐ FAIL ☐ N/A ☐ NOT TESTED ☐ BLOCKED · **Dowód:** ____

#### **SEC-002** · P0 · NoSQL Injection — `CONDITIONAL: MongoDB / Firestore / inne NoSQL`
- [ ] **Wymaganie:** Wejście użytkownika nie może zmieniać struktury zapytania (operatorów). Dla MongoDB: odrzucanie obiektów z kluczami zaczynającymi się od `$` lub zawierającymi `.` tam, gdzie oczekiwany jest skalar; rzutowanie typów schematem; brak `$where`/`$function`/`mapReduce` z danymi użytkownika.
- **Dlaczego:** `{"password": {"$ne": null}}` omija logowanie; `$regex` umożliwia enumerację; `$where` wykonuje JS.
- **Test:** Wyślij JSON `{"email":"a@a.pl","password":{"$ne":null}}`, query `?id[$ne]=1`, `?name[$regex]=.*` → oczekiwane `400/422`.
- **Automatyzacja:** Semgrep (`p/nosql-injection` lub reguły dla Mongoose/Mongo driver); testy integracyjne z payloadami.
- **Oczekiwany wynik:** Operatory w wejściu są odrzucane lub traktowane jako zwykły string; brak obejścia logowania.
- **Źródło:** WSTG-INPV-05.6 · OWASP NoSQL Security CS (jeśli dostępny) · ASVS V1/V2.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-004** · P0 · Cross-Site Scripting (XSS) — reflected, stored, DOM-based
- [ ] **Wymaganie:** Dane są enkodowane kontekstowo przy renderowaniu (HTML, atrybut, URL, JS, CSS). Frameworki z automatycznym escapingiem (React, Vue, Svelte) nie są omijane (`dangerouslySetInnerHTML`, `v-html`, `{@html}`, `innerHTML`, `document.write`, `eval`, `new Function`, `setTimeout(string)`) bez sanitizacji (DOMPurify) i uzasadnienia. URL-e od użytkownika walidowane (tylko `http:`/`https:`/`mailto:` — blokada `javascript:`, `data:`). CSP jako druga linia obrony (SEC-018 / HDR-).
- **Dlaczego:** Przejęcie sesji (jeśli tokeny dostępne dla JS), wykonywanie akcji w imieniu ofiary, phishing w obrębie zaufanej domeny, kradzież danych z DOM.
- **Test manualny:** W każde pole zapisywane i wyświetlane (profil, komentarz, nazwa pliku, nazwa produktu, parametry URL, fragment `#`) wprowadź `"><svg onload=alert(document.domain)>`, `javascript:alert(1)` (dla pól URL), `{{7*7}}` (template injection). Sprawdź miejsca wyświetlania: lista, szczegóły, e-mail, PDF, panel admina (stored XSS często „odpala się” u admina).
- **Automatyzacja:** Semgrep (`p/react`, `p/xss`), ESLint `react/no-danger`; ZAP active scan (staging); `grep -rnE "dangerouslySetInnerHTML|innerHTML|v-html|eval\(|new Function" src`.
- **Oczekiwany wynik:** Payload wyświetlany jako tekst; brak wykonania JS; CSP blokuje i raportuje inline script.
- **Źródło:** OWASP Top 10:2025 A05 · ASVS 5.0 V1, V3 · WSTG-INPV-01/02, WSTG-CLNT-01 · OWASP XSS Prevention CS, DOM-based XSS Prevention CS.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-014** · P0 · Path Traversal — `CONDITIONAL: operacje na plikach z nazwą/ścieżką zależną od wejścia`
- [ ] **Wymaganie:** Ścieżki plików nie są budowane z wejścia użytkownika. Jeśli to konieczne: mapowanie ID → ścieżka po stronie serwera, normalizacja (`path.resolve`) i sprawdzenie, że wynik zaczyna się od katalogu bazowego; odrzucanie `..`, `%2e%2e`, `\`, bajtów NUL.
- **Dlaczego:** Odczyt `/etc/passwd`, `.env`, kluczy, kodu źródłowego; zapis plików poza katalogiem (RCE).
- **Test:** `?file=../../../../etc/passwd`, `..%2f..%2f`, `....//`, `%00`, ścieżki absolutne; na Windows `..\..\`.
- **Oczekiwany wynik:** `400/404`; brak dostępu poza katalog bazowy.
- **Narzędzia:** Burp Intruder (lista payloadów traversal), Semgrep (`p/path-traversal`).
- **Źródło:** WSTG-ATHZ-01 · ASVS V5 · OWASP Path Traversal.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-015** · P0 · Command Injection — `CONDITIONAL: wywołania procesów systemowych`
- [ ] **Wymaganie:** Brak `exec`/`system`/`shell=True` z danymi użytkownika. Jeśli wywołanie procesu konieczne: `execFile`/`spawn` z tablicą argumentów, bez powłoki, z allow-listą wartości; preferuj biblioteki zamiast narzędzi CLI (np. `sharp` zamiast `convert`).
- **Dlaczego:** Pełne przejęcie serwera.
- **Test:** Przegląd kodu (`grep -rnE "child_process|exec\(|execSync|spawn\(.*shell|os\.system|subprocess" .`); w parametrach przekazywanych do procesów: `; id`, `&& whoami`, `` `id` ``, `$(id)`, `| sleep 5`.
- **Oczekiwany wynik:** Brak wykonania poleceń; brak opóźnienia czasowego.
- **Źródło:** OWASP Top 10:2025 A05 · WSTG-INPV-12 · OWASP OS Command Injection Defense CS.
- **Status:** ☐ · **Dowód:** ____

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEC-040** | P1 | Server-Side Template Injection: dane użytkownika nie są kompilowane jako szablon (Handlebars, EJS, Nunjucks, Liquid, Jinja). | Payload `{{7*7}}`, `${7*7}`, `<%= 7*7 %>` w polach używanych w szablonach e-mail/PDF → wyświetlane dosłownie, nie `49`. | WSTG-INPV-18 | ☐ |
| **SEC-041** | P1 | Header / CRLF injection: wartości wstawiane do nagłówków (redirect, `Content-Disposition`, e-mail) oczyszczone z `\r\n`. | `%0d%0aSet-Cookie:x=1` w parametrach używanych w nagłówkach → brak nowego nagłówka. Pola e-mail formularza kontaktowego bez wstrzyknięcia `Bcc:`. | WSTG-INPV-15 | ☐ |
| **SEC-042** | P1 | XXE: parsery XML (SVG, DOCX, SAML, import XML) z wyłączonymi zewnętrznymi encjami i DTD. | Upload/wysłanie XML z `<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>` → odrzucone lub encja niewczytana. `CONDITIONAL: przetwarzanie XML`. | WSTG-INPV-07; OWASP XXE Prevention CS | ☐ |
| **SEC-043** | P1 | LDAP / XPath / ORM-specific injection (`CONDITIONAL`) — parametryzacja odpowiednia dla technologii; w ORM brak metod „raw/unsafe” z wejściem. | Przegląd użycia `$queryRawUnsafe`, `whereRaw`, `literal()`, `knex.raw` z konkatenacją. | ASVS V1 | ☐ |
| **SEC-044** | P2 | Prototype pollution (JS/Node): scalanie obiektów z wejścia nie pozwala na `__proto__`, `constructor`, `prototype`. | Body `{"__proto__":{"isAdmin":true}}` → brak efektu na innych obiektach; biblioteki merge w aktualnych wersjach; walidacja schematem z `strict()`. | OWASP Prototype Pollution Prevention CS | ☐ |

### Request forgery i przekierowania

#### **SEC-005** · P0 · CSRF — `CONDITIONAL: uwierzytelnianie oparte na cookies`
- [ ] **Wymaganie:** Każda operacja zmieniająca stan (POST/PUT/PATCH/DELETE, Server Actions, GraphQL mutations) jest chroniona: cookies sesyjne `SameSite=Lax` lub `Strict` **oraz** co najmniej jedno z: token anty-CSRF (synchronizer / double-submit podpisany), weryfikacja `Origin`/`Sec-Fetch-Site`, wymóg niestandardowego nagłówka + CORS bez wildcarda. Żadna zmiana stanu przez GET.
- **Dlaczego:** Atakujący wymusza akcję (zmiana e-maila → przejęcie konta, przelew, usunięcie danych) z przeglądarki zalogowanej ofiary.
- **Test:** Zaloguj się; z innej domeny (lokalny plik HTML) wyślij auto-submit formularz `POST` na endpoint zmiany e-maila/hasła/zamówienia; dodatkowo `fetch` z `credentials:"include"`. Sprawdź też endpointy GET zmieniające stan.
- **Oczekiwany wynik:** Żądanie odrzucone (`403`) lub wykonane bez sesji (cookie nie wysłane); brak zmiany stanu.
- **Narzędzia:** Burp „Generate CSRF PoC”, ręczny plik HTML, ZAP.
- **Źródło:** ASVS 5.0 V3 · WSTG-SESS-05 · OWASP CSRF Prevention CS.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-006** · P0 · SSRF — `CONDITIONAL: serwer pobiera zasoby z URL podanego przez użytkownika (webhooki wychodzące, podgląd linków, import z URL, generowanie PDF z HTML, przetwarzanie obrazów z URL)`
- [ ] **Wymaganie:** Allow-lista docelowych hostów/schematów; rozwiązanie DNS i blokada adresów prywatnych, loopback, link-local (`169.254.169.254` — metadata chmury), IPv6 odpowiedników, po **każdym** przekierowaniu (lub wyłączone przekierowania); timeout i limit rozmiaru odpowiedzi; brak zwracania surowej odpowiedzi użytkownikowi. Na infrastrukturze: egress firewall, IMDSv2 (AWS).
- **Dlaczego:** Kradzież poświadczeń chmury z metadata service, skan sieci wewnętrznej, dostęp do paneli administracyjnych dostępnych tylko z wewnątrz.
- **Test:** Podaj URL-e: `http://127.0.0.1:port`, `http://169.254.169.254/latest/meta-data/`, `http://[::1]`, `http://0x7f000001`, domenę rozwiązującą się na `127.0.0.1`, URL z przekierowaniem 302 na adres wewnętrzny, `file:///etc/passwd`, `gopher://`.
- **Oczekiwany wynik:** Wszystkie odrzucone przed wykonaniem żądania; logowane jako zdarzenie bezpieczeństwa.
- **Narzędzia:** Burp Collaborator / interactsh (detekcja ślepego SSRF — tylko staging).
- **Źródło:** OWASP Top 10:2025 A01 · ASVS 5.0 V1 · WSTG-INPV-19 · OWASP SSRF Prevention CS.
- **Status:** ☐ · **Dowód:** ____

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEC-017** | P1 | Open Redirect: parametry `redirect`, `next`, `returnUrl`, `callback` akceptują tylko ścieżki względne lub hosty z allow-listy. | `?next=https://evil.example`, `//evil.example`, `/\evil.example`, `https:evil.example`, `%2F%2Fevil.example` → przekierowanie tylko wewnątrz domeny. Szczególnie: po logowaniu i w OAuth `redirect_uri`. | WSTG-CLNT-04; OWASP Unvalidated Redirects CS | ☐ |
| **SEC-018** | P1 | Clickjacking: `Content-Security-Policy: frame-ancestors 'none'` (lub lista dozwolonych) i dla starszych przeglądarek `X-Frame-Options: DENY/SAMEORIGIN`. | `curl -sI https://host \| grep -iE "frame-ancestors\|x-frame-options"`; próba osadzenia w `<iframe>` z innej domeny → zablokowana. | WSTG-CLNT-09; ASVS V3 | ☐ |

### Kontrola dostępu

#### **SEC-003** · P0 · IDOR / BOLA — autoryzacja na poziomie obiektu
- [ ] **Wymaganie:** Każde żądanie odczytu/zmiany/usunięcia zasobu weryfikuje **po stronie serwera**, że uwierzytelniony podmiot ma prawo do **tego konkretnego** obiektu (własność, członkostwo w organizacji/tenancie, rola). Zapytania filtrują po właścicielu (`WHERE id = $1 AND owner_id = $2`) lub egzekwują to w bazie (RLS). Nieprzewidywalne ID (UUID) są **dodatkiem**, nie zabezpieczeniem.
- **Dlaczego:** Najczęstsza krytyczna podatność aplikacji webowych i API: wyciek danych wszystkich użytkowników przez iterację ID.
- **Procedura testowa:** Utwórz konta A i B (oraz C w innej organizacji, jeśli multi-tenant). Jako A wykonaj każdą operację na zasobach (GET/PUT/PATCH/DELETE, eksport, pobranie pliku, GraphQL query/mutation), zapisz żądania. Podmień token na B i powtórz z identyfikatorami A. Zmieniaj ID w ścieżce, query, body, nagłówkach, w zagnieżdżonych obiektach (`order.items[0].productId`) i w GraphQL `node(id:)`.
- **Oczekiwany wynik:** `403` lub `404` (bez ujawnienia, czy obiekt istnieje); żadnych danych A w odpowiedzi; brak zmiany stanu. Test powtórzony dla **każdego** typu zasobu.
- **Narzędzia:** Burp Suite + rozszerzenia Autorize / AuthMatrix; testy integracyjne (Playwright API / Vitest + supertest) z dwoma kontami jako regresja.
- **Źródło:** OWASP Top 10:2025 A01 · OWASP API Security Top 10 2023 API1 · ASVS 5.0 V8 · WSTG-ATHZ-04.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-007** · P0 · Broken Access Control — poziom funkcji (BFLA) i eskalacja uprawnień
- [ ] **Wymaganie:** Każdy endpoint/akcja administracyjna lub uprzywilejowana sprawdza rolę/uprawnienie po stronie serwera (deny by default). Ukrycie przycisku w UI nie jest kontrolą. Użytkownik nie może zmienić własnej roli, przypisać się do innej organizacji ani wywołać endpointu admina.
- **Dlaczego:** Zwykły użytkownik uzyskuje funkcje administratora (zarządzanie użytkownikami, eksport danych, zmiana cen).
- **Test:** Zbierz listę endpointów (OpenAPI, ruch admina w proxy, bundle JS, `/api/admin/*`). Wywołaj każdy: bez tokenu, z tokenem zwykłego użytkownika, z tokenem użytkownika innej organizacji. Spróbuj metod HTTP innych niż przewidziane (`PUT` zamiast `GET`, `X-HTTP-Method-Override`). Zmień `role` w body rejestracji/aktualizacji profilu (zob. SEC-025).
- **Oczekiwany wynik:** `401` bez tokenu, `403` dla niewystarczającej roli; żadnej zmiany stanu.
- **Narzędzia:** Burp Autorize, macierz ról × endpointów w testach automatycznych.
- **Źródło:** OWASP Top 10:2025 A01 · API Security Top 10 2023 API5 · ASVS 5.0 V8 · WSTG-ATHZ-02/03.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-008** · P0 · Domyślna odmowa i kompletność autoryzacji
- [ ] **Wymaganie:** Autoryzacja jest egzekwowana centralnie (middleware/policy layer/RLS) z zasadą **deny by default**: nowy endpoint bez jawnej polityki jest niedostępny. Brak „publicznych z przypadku” tras (np. zapomniany route handler, `/api/debug`, `/api/internal`).
- **Test:** Inwentaryzacja tras z kodu vs. tras chronionych; automatyczny test, który iteruje po wszystkich zarejestrowanych trasach i oczekuje `401` bez sesji (z jawną allow-listą tras publicznych).
- **Oczekiwany wynik:** Lista tras publicznych jest jawna i przejrzana; każda inna wymaga sesji.
- **Źródło:** ASVS 5.0 V8 · OWASP Authorization CS.
- **Status:** ☐ · **Dowód:** ____

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEC-016** | P1 | Multi-tenant isolation (`CONDITIONAL: wiele organizacji/klientów`): `tenant_id` pochodzi z sesji, nie z żądania; każde zapytanie filtruje po tenancie (lub RLS). | Test SEC-003 z kontami w różnych tenantach + próba podania obcego `tenant_id`/`orgId` w body/nagłówku → ignorowane/odrzucone. | ASVS V8 | ☐ |
| **SEC-019** | P1 | CORS: `Access-Control-Allow-Origin` z allow-listy (bez odbijania dowolnego `Origin`, bez `null`), `Allow-Credentials: true` tylko z konkretnymi originami, ograniczone metody i nagłówki. | `curl -sI -H "Origin: https://evil.example" https://api/...` → brak ACAO dla obcego originu; `Origin: null` → brak. Wildcard `*` dopuszczalny tylko dla w pełni publicznych, nieuwierzytelnionych zasobów. | WSTG-CLNT-07; OWASP HTML5 Security CS | ☐ |

### Uwierzytelnianie i nadużycia (szczegóły w Części IV)

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEC-009** | P0 | Authentication Failures: brak domyślnych/testowych kont i haseł w produkcji; hasła hashowane algorytmem do haseł (Argon2id, scrypt, bcrypt; PBKDF2 tylko gdy wymagane FIPS) z parametrami wg OWASP Password Storage CS. | Przegląd seedów/migracji i konfiguracji auth; przegląd kodu hashowania; próba logowania `admin/admin`, `test@test.com` itp. → odrzucona. | OWASP Top 10:2025 A07; ASVS 5.0 V6; OWASP Password Storage CS | ☐ |
| **SEC-010** | P0 | Session Management: identyfikator sesji losowy (≥128 bit entropii), nowy po zalogowaniu i zmianie uprawnień (ochrona przed session fixation), unieważniany po wylogowaniu po stronie serwera. Szczegóły: SES-. | Porównaj ID sesji przed/po logowaniu (różne); po wylogowaniu odtwórz stare cookie/token → `401`. | ASVS 5.0 V7; WSTG-SESS-03/06 | ☐ |
| **SEC-020** | P1 | Rate limiting na endpointach kosztownych i wrażliwych (logowanie, rejestracja, reset hasła, OTP, wyszukiwanie, wysyłka e-mail/SMS, generowanie raportów, AI/LLM). Limity per IP **i** per konto/identyfikator, z odpowiedzią `429` + `Retry-After`. | Skrypt wysyłający N+1 żądań w oknie (np. `k6`, pętla `curl`) na stagingu → `429` po przekroczeniu; limit działa przy rozproszeniu po wielu IP dla tego samego konta. | API Security Top 10 2023 API4; ASVS V2 | ☐ |
| **SEC-021** | P0 | Brute force protection logowania i OTP/MFA: progresywne opóźnienie / blokada czasowa per konto + per IP, CAPTCHA lub proof-of-work po progu, limit prób kodu OTP (np. 5) z unieważnieniem kodu. | 20 błędnych haseł dla jednego konta → wzrastające opóźnienie/blokada; 10 błędnych kodów OTP → kod unieważniony. Blokada nie pozwala zablokować dowolnego konta na stałe (DoS) — preferuj opóźnienia/limity czasowe. | ASVS 5.0 V6; OWASP Authentication CS | ☐ |
| **SEC-022** | P1 | Credential stuffing: rate limiting po IP/ASN, wykrywanie wielu kont z jednego źródła, sprawdzanie haseł na listach wycieków (np. HIBP k-anonymity) przy rejestracji/zmianie, MFA dla kont uprzywilejowanych. | Przegląd mechanizmów; próba ustawienia hasła `Password123!` / z listy wycieków → odrzucone. | ASVS V6; NIST SP 800-63B | ☐ |
| **SEC-023** | P1 | User enumeration: identyczna odpowiedź (treść, kod, **czas**) dla istniejącego i nieistniejącego konta w logowaniu, rejestracji, resecie hasła. | Porównaj odpowiedzi dla `istnieje@x.pl` vs `nieistnieje@x.pl` (treść, status, średni czas z 20 prób). Rejestracja: komunikat neutralny + e-mail informacyjny do właściciela istniejącego konta. | WSTG-IDNT-04; ASVS V6 | ☐ |
| **SEC-024** | P0 | Account takeover paths: zmiana e-maila, hasła, MFA, metod odzyskiwania wymaga ponownego uwierzytelnienia; powiadomienie e-mail na **stary** adres; linki/tokeny jednorazowe, krótkotrwałe i związane z kontem. | Przejdź każdy flow zmiany danych logowania z sesją „starą” (np. 30 min) → wymaga hasła/MFA; token resetu użyty dwa razy → drugi raz odrzucony. | ASVS V6; WSTG-ATHN-09 | ☐ |

### Logika, dane i współbieżność

#### **SEC-025** · P0 · Mass Assignment
- [ ] **Wymaganie:** Obiekty z żądania nie są przypisywane bezpośrednio do modeli/rekordów. Aktualizacje używają allow-listy pól (DTO/schemat z `strict()`), pola wrażliwe (`role`, `isAdmin`, `ownerId`, `tenantId`, `price`, `balance`, `emailVerified`, `status`) są ustawiane wyłącznie przez logikę serwera.
- **Dlaczego:** Eskalacja uprawnień (`"role":"admin"`), przejęcie zasobu (`"ownerId":…`), zmiana ceny.
- **Test:** Do żądań rejestracji, edycji profilu, tworzenia zamówienia dodaj pola: `role`, `isAdmin`, `is_admin`, `permissions`, `ownerId`, `user_id`, `price`, `total`, `verified`, `createdAt`. Sprawdź stan po żądaniu (GET).
- **Oczekiwany wynik:** Dodatkowe pola odrzucone (`400`) lub zignorowane; stan bez zmian.
- **Źródło:** API Security Top 10 2023 API3 · ASVS 5.0 V2 · OWASP Mass Assignment CS.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-026** · P0 · Business Logic Vulnerabilities
- [ ] **Wymaganie:** Reguły biznesowe egzekwowane na serwerze i odporne na: ujemne/zerowe/ułamkowe ilości, pomijanie kroków procesu (np. bezpośredni call „potwierdź zamówienie” bez płatności), wielokrotne użycie jednorazowych zasobów (kupony, zaproszenia, darmowe okresy), manipulację kolejnością kroków, przekroczenie limitów planu.
- **Test:** Dla każdego krytycznego procesu spisz kroki i założenia, następnie: wywołaj kroki w złej kolejności, powtórz krok, podaj wartości graniczne (`-1`, `0`, `0.001`, `999999999`, ogromne stringi), użyj kuponu dwa razy / na dwóch kontach, zmień walutę.
- **Oczekiwany wynik:** Każde naruszenie założeń odrzucone, stan spójny, zdarzenie zalogowane.
- **Narzędzia:** Testy manualne (skanery tego nie wykrywają), Burp Repeater, testy E2E/integracyjne jako regresja.
- **Źródło:** OWASP Top 10:2025 A06 · API Security Top 10 2023 API6 (Unrestricted Access to Sensitive Business Flows) · WSTG-BUSL-01..09 · ASVS 5.0 V2.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-027** · P1 · Race Conditions (TOCTOU)
- [ ] **Wymaganie:** Operacje typu „sprawdź-potem-zmień” na zasobach ograniczonych (saldo, stan magazynu, kupon jednorazowy, limit zaproszeń, głosowanie) są atomowe: transakcje z odpowiednim poziomem izolacji, `SELECT … FOR UPDATE`, warunkowe `UPDATE … WHERE stock > 0`, unikalne indeksy, idempotency keys.
- **Test:** Wyślij 20–50 równoległych identycznych żądań (Burp Repeater „Send group in parallel” / single-packet attack, `xargs -P`, skrypt k6) — np. użycie kuponu, wypłata, rezerwacja ostatniej sztuki.
- **Oczekiwany wynik:** Dokładnie jedno (lub dozwolona liczba) żądanie zakończone sukcesem; stan bazy spójny.
- **Źródło:** WSTG-BUSL-07 (process timing) · ASVS 5.0 V2 · PortSwigger research „race conditions”.
- **Status:** ☐ · **Dowód:** ____

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEC-013** | P0 | Insecure Deserialization: brak deserializacji niezaufanych danych do obiektów wykonywalnych (`node-serialize`, `pickle`, `unserialize` PHP, Java native, YAML `load` bez safe). Dane z klienta tylko jako JSON + walidacja schematem. Podpisane dane (JWT, cookies) weryfikowane przed użyciem. | Przegląd kodu i zależności (`grep -rnE "unserialize\|pickle.loads\|yaml.load\(\|node-serialize"`); SAST. | OWASP Top 10:2025 A08; OWASP Deserialization CS | ☐ |
| **SEC-028** | P1 | Web cache poisoning / deception: odpowiedzi personalizowane mają `Cache-Control: private, no-store`; CDN nie cachuje odpowiedzi z `Set-Cookie` ani zależnych od nagłówków spoza cache key (`X-Forwarded-Host`, `X-Original-URL`); ścieżki typu `/account/profile.css` nie zwracają danych konta do cache. | Żądanie z `X-Forwarded-Host: evil.example` → brak odbicia w odpowiedzi/linkach; `/moje-konto/x.css` → `404` lub `no-store`; nagłówki `Age`/`X-Cache` na stronach prywatnych = brak trafień. | WSTG-INPV (HTTP), PortSwigger research | ☐ |
| **SEC-029** | P2 | HTTP Request Smuggling (`CONDITIONAL: własne reverse proxy / load balancer / wiele warstw HTTP`): spójna obsługa `Content-Length`/`Transfer-Encoding` między warstwami; aktualne wersje proxy; HTTP/2 end-to-end tam, gdzie możliwe. W hostingu zarządzanym (Vercel, Netlify, Cloudflare) — odpowiedzialność dostawcy, oznacz N/A z odnośnikiem. | Burp „HTTP Request Smuggler” — **wyłącznie na stagingu z identyczną infrastrukturą** i za zgodą. | WSTG-INPV-15/16 | ☐ |
| **SEC-030** | P1 | Denial of Service (aplikacyjny): limity rozmiaru body/uploadu/JSON depth, limity paginacji, timeouty zapytań DB, ochrona przed ReDoS (regexy na wejściu), limity GraphQL (głębokość/złożoność), kosztowne operacje asynchroniczne w kolejce. Ochrona wolumetryczna (DDoS) na poziomie CDN/WAF — Część VII. | Wyślij body 50 MB, JSON zagnieżdżony 10 000 poziomów, `?limit=1000000`, długi string do regexu walidacji → szybkie odrzucenie (`413/400`) bez wzrostu CPU. Regexy: `npx recheck` / Semgrep reguły ReDoS. | API Security Top 10 2023 API4; ASVS V2 | ☐ |

### Supply chain, sekrety, wycieki informacji

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEC-031** | P0 | Dependency vulnerabilities: brak znanych podatności **Critical/High mających zastosowanie** w zależnościach produkcyjnych (lub udokumentowany brak exploitowalności / akceptacja). Szczegóły: SCM-. | `npm audit --omit=dev --audit-level=high` / `pnpm audit --prod` / `osv-scanner scan source -r .` → 0 nierozwiązanych; każdy wyjątek z uzasadnieniem (VEX lub wpis w Risk Register). | OWASP Top 10:2025 A03; SSDF RV.1 | ☐ |
| **SEC-032** | P1 | Supply chain attacks: lockfile z integralnością, instalacja frozen, ograniczenie skryptów instalacyjnych, pinowanie GitHub Actions do SHA, minimalne uprawnienia tokenów CI. Szczegóły: SCM-. | Przegląd CI i lockfile; OSSF Scorecard. | OWASP Top 10:2025 A03, A08; SLSA | ☐ |
| **SEC-033** | P0 | Secrets leakage w artefaktach: zbudowany frontend, obrazy kontenerów, logi CI, publiczne buckety i odpowiedzi API nie zawierają sekretów. | `gitleaks dir dist/` (oraz `.next/static`); `trivy image --scanners secret <obraz>`; przegląd logów CI (maskowanie); wyszukiwanie znanych prefiksów kluczy (`sk_live_`, `service_role`, `AKIA`, `-----BEGIN`). | ASVS V13; OWASP Secrets Management CS | ☐ |
| **SEC-034** | P1 | Source maps: w produkcji source mapy nie są publicznie serwowane **albo** świadomie publiczne (np. projekt open-source) i nie zawierają sekretów/komentarzy wewnętrznych. Preferowane: upload do error trackera (Sentry) i usunięcie z publicznego hostingu. | `curl -sI https://host/assets/<plik>.js.map` → `404`; brak komentarza `//# sourceMappingURL=` wskazującego publiczny plik (lub decyzja udokumentowana). | ASVS V13; WSTG-INFO-05 | ☐ |
| **SEC-035** | P0 | Debug information exposure: wyłączone tryby debug, stack traces, Swagger/GraphiQL/introspekcja (chyba że świadomie publiczne), endpointy `/debug`, `/phpinfo`, `/.env`, `/.git/`, `/actuator`, `/server-status`, listing katalogów. | `curl -s -o /dev/null -w "%{http_code}" https://host/<ścieżka>` dla listy ścieżek z Playbooka (PB-RECON-03) → `404/403`; `nuclei` z szablonami `exposures` **tylko za zgodą**. | OWASP Top 10:2025 A02; WSTG-CONF-04/05 | ☐ |
| **SEC-036** | P1 | Error information disclosure / Mishandling of Exceptional Conditions: odpowiedzi błędów bez stack trace, zapytań SQL, ścieżek plików, wersji frameworka; aplikacja w stanie błędu **zamyka się bezpiecznie** (fail-closed: błąd w sprawdzaniu uprawnień = odmowa, nie dostęp). | Wymuś błędy: zły typ parametru, nieistniejący zasób, przerwanie połączenia z DB na stagingu, timeout usługi zewnętrznej → generyczny komunikat + `requestId`; brak dostępu „przez błąd”. | OWASP Top 10:2025 A10; ASVS V16; WSTG-ERRH-01/02 | ☐ |
| **SEC-037** | P0 | Information leakage przez API (Excessive Data Exposure): odpowiedzi zwracają tylko pola potrzebne klientowi — brak `passwordHash`, tokenów resetu, danych innych użytkowników, pól wewnętrznych, pełnych obiektów ORM. | Przejrzyj odpowiedzi wszystkich endpointów (proxy) pod kątem pól nadmiarowych; testy kontraktowe/snapshoty odpowiedzi; serializacja przez DTO/`select` jawnych pól. | API Security Top 10 2023 API3; ASVS V8, V14 | ☐ |
| **SEC-038** | P1 | Bezpieczne logowanie: zdarzenia bezpieczeństwa logowane (logowanie OK/fail, zmiana uprawnień, dostęp odmówiony, zmiany danych logowania, operacje admina), **bez** haseł, tokenów, pełnych numerów kart, sekretów i nadmiarowych danych osobowych; ochrona przed log injection (escapowanie `\n`). Szczegóły: Część XVI. | Wykonaj zdarzenia → sprawdź logi: zdarzenie obecne, dane wrażliwe zamaskowane; wstrzyknij `\n[ADMIN] fake` w pole logowane → brak sfałszowanej linii. | OWASP Top 10:2025 A09; ASVS V16; OWASP Logging CS | ☐ |

### Kryptografia i ochrona danych

#### **SEC-012** · P0 · Cryptographic Failures
- [ ] **Wymaganie:** (1) Transport: wyłącznie TLS 1.2+ (preferowany 1.3), HSTS (INF-). (2) Dane wrażliwe w spoczynku szyfrowane (dysk/baza — mechanizmy dostawcy; pola szczególnie wrażliwe — szyfrowanie aplikacyjne z kluczem w KMS). (3) Brak własnej kryptografii; tylko sprawdzone biblioteki i algorytmy (AES-GCM, ChaCha20-Poly1305, Ed25519/ECDSA P-256, SHA-256+). (4) Losowość z CSPRNG (`crypto.randomBytes`, `crypto.getRandomValues`), nigdy `Math.random()` dla tokenów. (5) Klucze rotowalne, poza kodem. (6) Hasła — SEC-009.
- **Dlaczego:** Wyciek danych przy przechwyceniu ruchu lub kopii bazy, przewidywalne tokeny (reset hasła, sesje).
- **Test:** `testssl.sh https://host` / SSL Labs; `grep -rn "Math.random" src` w kontekście tokenów/ID; przegląd algorytmów (`md5`, `sha1`, `des`, `ecb` → FAIL dla zastosowań bezpieczeństwa); sprawdzenie konfiguracji szyfrowania bazy u dostawcy.
- **Oczekiwany wynik:** TLS ocena A/A+ (SSL Labs), brak słabych szyfrów; tokeny z CSPRNG; brak przestarzałych algorytmów w zastosowaniach bezpieczeństwa.
- **Źródło:** OWASP Top 10:2025 A04 · ASVS 5.0 V11, V12 · OWASP Cryptographic Storage CS, TLS CS.
- **Status:** ☐ · **Dowód:** ____

#### **SEC-011** · P1 · Security Misconfiguration (przegląd zbiorczy)
- [ ] **Wymaganie:** Konfiguracja produkcyjna zahardenowana: nagłówki bezpieczeństwa (HDR-), brak domyślnych kont i stron, wyłączone nieużywane metody HTTP (`TRACE`), brak listingu katalogów, minimalne uprawnienia kont usług, aktualne wersje komponentów, brak nagłówków ujawniających wersje (`X-Powered-By`, `Server: nginx/1.x.y`).
- **Test:** `curl -sI https://host`; `curl -X TRACE -i https://host` → `405`; Mozilla HTTP Observatory; przegląd konfiguracji serwera/hostingu vs. CIS Benchmark (jeśli własne serwery).
- **Oczekiwany wynik:** Wszystkie HDR- spełnione; brak ujawniania wersji; brak zbędnych usług.
- **Źródło:** OWASP Top 10:2025 A02 · ASVS 5.0 V13 · WSTG-CONF-* · CIS Benchmarks.
- **Status:** ☐ · **Dowód:** ____

### File upload — skrót (pełna lista w Części XV)

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEC-039** | P0 | `CONDITIONAL: upload` — pliki walidowane po stronie serwera (typ po magic bytes, rozmiar, rozszerzenie z allow-listy), zapisywane pod losową nazwą poza webrootem / w prywatnym buckecie, nigdy wykonywalne, serwowane z `Content-Disposition`/`X-Content-Type-Options: nosniff` lub z osobnej domeny. | Upload `shell.php`, `x.svg` z `<script>`, `x.jpg` będący HTML, plik 1 GB, nazwa `../../x` → odrzucone lub zneutralizowane. Szczegóły FILE-001…FILE-018. | ASVS 5.0 V5; WSTG-BUSL-08/09; OWASP File Upload CS | ☐ |

---

# CZĘŚĆ IV — Authentication & Authorization

`CONDITIONAL: projekt ma konta użytkowników, panel administracyjny lub dowolne zasoby niepubliczne.`

**Źródła:** OWASP ASVS 5.0 (V6 Authentication, V7 Session Management, V8 Authorization, V9 Self-contained Tokens, V10 OAuth and OIDC) · NIST SP 800-63B (Digital Identity Guidelines — Authentication) · OWASP Authentication, Session Management, Forgot Password, MFA, JWT for Java (zasady ogólne), OAuth2 Cheat Sheets · RFC 9700 (OAuth 2.0 Security Best Current Practice, 2025).

> **Uwierzytelnianie (AuthN)** — IV.1–IV.4. **Autoryzacja (AuthZ)** — IV.5–IV.6. Kontrole testuje się osobno: poprawne logowanie nie dowodzi poprawnej autoryzacji.

## IV.1 Rejestracja, logowanie, wylogowanie

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **AUTH-001** | P1 | Polityka haseł zgodna z NIST SP 800-63B: min. 8 znaków (zalecane ≥ 12 lub 15 dla haseł jako jedynego czynnika), max ≥ 64, dopuszczone wszystkie znaki Unicode i spacje, **brak** wymuszania złożoności i okresowej zmiany, sprawdzanie na liście haseł skompromitowanych/słownikowych. | Rejestracja z `abc`, z hasłem z listy wycieków, z 64-znakowym hasłem ze spacjami i emoji → odpowiednio: odrzucone, odrzucone, przyjęte. | NIST 800-63B; ASVS V6 | ☐ |
| **AUTH-002** | P1 | Weryfikacja adresu e-mail przed dostępem do funkcji wymagających zaufanego e-maila (np. zaproszenia, płatności, reset hasła na ten adres). Link jednorazowy, ważny krótko (np. ≤ 24 h), powiązany z kontem. | Użyj linku dwa razy, po czasie ważności, na innym koncie → odrzucone. | ASVS V6 | ☐ |
| **AUTH-003** | P0 | Komunikaty błędów logowania neutralne („Nieprawidłowy e-mail lub hasło”), bez rozróżnienia nieistniejącego konta, złego hasła, zablokowanego konta. Zob. SEC-023. | Porównanie odpowiedzi (treść/status/czas). | ASVS V6; WSTG-IDNT-04 | ☐ |
| **AUTH-004** | P0 | Ochrona logowania przed brute force — zob. SEC-021 (P0); uzupełniająco ochrona przed credential stuffing — SEC-022 (P1, oceniana osobno). | — | — | ☐ |
| **AUTH-005** | P1 | Wylogowanie unieważnia sesję **po stronie serwera** (usunięcie rekordu sesji / revokacja refresh tokenu), czyści cookies; opcja „wyloguj ze wszystkich urządzeń”. | Po wylogowaniu odtwórz skopiowane cookie / refresh token → `401`. | ASVS V7; WSTG-SESS-06 | ☐ |
| **AUTH-006** | P2 | Ponowne uwierzytelnienie (step-up) przed operacjami wrażliwymi: zmiana e-maila/hasła/MFA, usunięcie konta, eksport danych, operacje finansowe, nadanie uprawnień. | Z sesją starszą niż próg (np. 15 min) operacja wymaga hasła/MFA. | ASVS V6; zob. SEC-024 | ☐ |
| **AUTH-007** | P2 | Formularze logowania i rejestracji kompatybilne z menedżerami haseł (`autocomplete="username"`, `"current-password"`, `"new-password"`), wklejanie dozwolone. | Inspekcja HTML; test z menedżerem haseł. | NIST 800-63B; WCAG 3.3.8 | ☐ |
| **AUTH-008** | P2 | Powiadomienia o zdarzeniach bezpieczeństwa konta (nowe logowanie z nowego urządzenia, zmiana hasła/e-maila/MFA) wysyłane do użytkownika. | Wykonaj zdarzenie → e-mail dostarczony (na stary adres przy zmianie e-maila). | ASVS V6 | ☐ |

## IV.2 Reset i zmiana hasła, odzyskiwanie konta

#### **AUTH-010** · P0 · Bezpieczny reset hasła
- [ ] **Wymaganie:** Token resetu: losowy (CSPRNG, ≥ 128 bit), jednorazowy, ważny krótko (np. 15–60 min), przechowywany w bazie jako hash, unieważniany po użyciu i po zmianie hasła; link budowany z **konfiguracji** domeny, nie z nagłówka `Host` (ochrona przed host header poisoning); odpowiedź na żądanie resetu identyczna dla istniejących i nieistniejących kont; po resecie — unieważnienie wszystkich sesji.
- **Dlaczego:** Przejęcie konta przez przewidywalny/wielokrotny token lub przekierowanie linku na domenę atakującego.
- **Test:** (1) Poproś o reset z nagłówkiem `Host: evil.example` / `X-Forwarded-Host: evil.example` → link w e-mailu nadal wskazuje właściwą domenę. (2) Użyj tokenu dwa razy. (3) Użyj po czasie. (4) Poproś o dwa resety, użyj starszego tokenu. (5) Sprawdź, czy aktywne sesje zostały unieważnione. (6) Sprawdź, czy token nie wycieka w `Referer` do zasobów zewnętrznych na stronie resetu (`Referrer-Policy`).
- **Oczekiwany wynik:** Wszystkie próby nadużyć odrzucone; inne sesje wylogowane.
- **Źródło:** OWASP Forgot Password CS · ASVS 5.0 V6 · WSTG-ATHN-09.
- **Status:** ☐ · **Dowód:** ____

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **AUTH-011** | P1 | Zmiana hasła wymaga podania aktualnego hasła (lub świeżego step-up), unieważnia pozostałe sesje i wysyła powiadomienie. | Spróbuj zmienić bez starego hasła (bezpośrednie wywołanie API) → odrzucone. | ASVS V6 | ☐ |
| **AUTH-012** | P1 | Odzyskiwanie konta bez „pytań bezpieczeństwa” (wiedza łatwa do zdobycia); odzyskanie MFA przez kody zapasowe (jednorazowe, hashowane) lub zweryfikowany proces wsparcia z weryfikacją tożsamości. | Przegląd procesu; kody zapasowe działają jednorazowo. | NIST 800-63B; ASVS V6 | ☐ |

## IV.3 MFA, OAuth, OpenID Connect

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **AUTH-020** | P1 | MFA dostępne dla użytkowników i **wymagane** dla kont administracyjnych i kont z dostępem do danych wielu użytkowników. Preferowane: passkeys/WebAuthn, TOTP; SMS tylko jako opcja z ograniczonym zaufaniem. | Konto admina bez MFA nie ma dostępu do panelu; enrolment MFA wymaga potwierdzenia kodem. | ASVS V6; NIST 800-63B | ☐ |
| **AUTH-021** | P0 | MFA nie da się obejść: kolejne kroki logowania sprawdzają ukończenie poprzednich po stronie serwera (stan „częściowo zalogowany” nie daje dostępu do API), limit prób kodu, kod jednorazowy i krótkotrwały. | Po podaniu hasła wywołaj chronione API z tymczasowym tokenem/cookie przed krokiem MFA → `401`; ten sam kod TOTP dwa razy → drugi odrzucony. | ASVS V6; WSTG-ATHN-04 | ☐ |
| **AUTH-022** | P0 | `CONDITIONAL: OAuth/OIDC (logowanie Google/GitHub/Apple itp.)` — Authorization Code Flow **z PKCE** (także dla klientów poufnych), parametr `state` (CSRF) i `nonce` (OIDC) weryfikowane, `redirect_uri` dokładnie dopasowane (bez wildcardów), brak Implicit Flow, ID token weryfikowany (podpis, `iss`, `aud`, `exp`, `nonce`). | Zmień `state` w callbacku → odrzucone; podmień `redirect_uri` na inną ścieżkę/domenę → odrzucone u dostawcy; przegląd konfiguracji biblioteki (np. Auth.js, Supabase Auth, Firebase Auth). | RFC 9700; ASVS 5.0 V10; OWASP OAuth2 CS | ☐ |
| **AUTH-023** | P1 | `CONDITIONAL: OAuth` — powiązanie konta zewnętrznego z istniejącym kontem lokalnym tylko po weryfikacji (zalogowanie się do konta lokalnego lub zweryfikowany e-mail u dostawcy **i** w aplikacji). Brak automatycznego łączenia po samym adresie e-mail od dostawcy, który nie gwarantuje weryfikacji. | Utwórz konto lokalne `x@x.pl`, zaloguj się przez dostawcę z niezweryfikowanym `x@x.pl` → brak przejęcia. | ASVS V10; „pre-account takeover” research | ☐ |
| **AUTH-024** | P2 | `CONDITIONAL: OAuth` — zakresy (`scope`) minimalne; tokeny dostępowe dostawcy przechowywane zaszyfrowane, tylko jeśli potrzebne. | Przegląd żądanych scope'ów i miejsca przechowywania tokenów. | ASVS V10 | ☐ |

## IV.4 Sesje, tokeny, cookies

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SES-001** | P0 | Cookie sesyjne / z tokenem: `HttpOnly`, `Secure`, `SameSite=Lax` (lub `Strict`), `Path=/`, bez `Domain` szerszego niż potrzeba; preferowany prefiks `__Host-`. | DevTools → Application → Cookies lub `curl -sI` po logowaniu → wszystkie atrybuty obecne. | ASVS 5.0 V7; OWASP Session Mgmt CS | ☐ |
| **SES-002** | P1 | Tokeny dostępowe i refresh tokeny **nie** w `localStorage`/`sessionStorage` (dostępne dla XSS). Preferowane: sesja serwerowa lub tokeny w cookies `HttpOnly`; jeżeli SPA musi trzymać access token — tylko w pamięci, krótkotrwały. `CONDITIONAL: SDK BaaS (Supabase/Firebase) przechowujące sesję w storage — udokumentuj ryzyko i wzmocnij CSP`. | DevTools → Application → Local/Session Storage → brak tokenów (lub decyzja z kompensacją). | ASVS V3, V7 | ☐ |
| **SES-003** | P1 | Czas życia: idle timeout i absolutny timeout sesji dopasowane do ryzyka (np. admin: idle ≤ 30 min, absolutny ≤ 12 h; aplikacja konsumencka: dłużej, z refresh). Access token krótkotrwały (np. 5–15 min). | Pozostaw sesję bez aktywności dłużej niż limit → wymagane ponowne logowanie. | ASVS V7; NIST 800-63B | ☐ |
| **SES-004** | P1 | Rotacja refresh tokenów przy każdym użyciu z wykrywaniem ponownego użycia (reuse detection → unieważnienie całej rodziny tokenów). | Użyj refresh tokenu dwukrotnie → drugie użycie odrzucone **i** sesja unieważniona. | RFC 9700; ASVS V7 | ☐ |
| **SES-005** | P0 | `CONDITIONAL: JWT` — podpis weryfikowany zawsze; algorytm wymuszony po stronie serwera (odrzucenie `alg: none` i zamiany RS256→HS256); walidacja `exp`, `nbf`, `iss`, `aud`; sekret HMAC ≥ 256 bit losowy; brak danych wrażliwych w payloadzie (jest tylko zakodowany base64url). | Zmodyfikuj payload bez podpisu, ustaw `alg: none`, zmień `aud`, użyj wygasłego tokenu → wszystko `401`. Narzędzie: `jwt_tool` (staging). | ASVS 5.0 V9; OWASP JWT CS | ☐ |
| **SES-006** | P1 | `CONDITIONAL: JWT bezstanowe` — istnieje mechanizm unieważnienia (krótki TTL + lista revokacji / wersja sesji w bazie) na wypadek wylogowania, zmiany hasła, blokady konta. | Zablokuj konto / zmień hasło → istniejący token przestaje działać w czasie ≤ TTL i zgodnie z dokumentacją. | ASVS V9 | ☐ |
| **SES-007** | P1 | Ochrona przed session fixation i reuse: nowy identyfikator sesji po logowaniu, zmianie uprawnień, step-up. | Zob. SEC-010. | WSTG-SESS-03 | ☐ |
| **SES-008** | P0 | Ochrona CSRF dla sesji cookie — zob. SEC-005. | — | — | ☐ |

## IV.5 Autoryzacja: role, uprawnienia, zasady

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **AUTHZ-001** | P0 | Istnieje **macierz uprawnień** (role × zasoby × akcje) i jest egzekwowana w kodzie/bazie; testy automatyczne sprawdzają macierz (pozytywne i **negatywne** przypadki). | Dokument + testy; dla każdej roli co najmniej jeden test „nie może”. | ASVS V8; OWASP Authorization CS | ☐ |
| **AUTHZ-002** | P0 | Object-level authorization dla każdego zasobu — zob. SEC-003. | — | — | ☐ |
| **AUTHZ-003** | P0 | Function-level authorization — zob. SEC-007; deny by default — SEC-008. | — | — | ☐ |
| **AUTHZ-004** | P1 | RBAC: role przypisywane wyłącznie przez uprawnione podmioty; użytkownik nie może nadać sobie ani innym wyższej roli niż własna; zmiany ról audytowane. | Jako „manager” spróbuj nadać „admin” → odrzucone; wpis w audit logu. | ASVS V8 | ☐ |
| **AUTHZ-005** | P2 | `CONDITIONAL: reguły zależne od atrybutów (właściciel, dział, status, czas)` — ABAC/ReBAC zaimplementowane w jednym silniku polityk (np. CASL, Casbin, OPA, Cedar, RLS) zamiast rozproszonych `if`-ów. | Przegląd: reguły w jednym miejscu, testowane. | ASVS V8 | ☐ |
| **AUTHZ-006** | P1 | Zasada najmniejszych uprawnień: domyślna rola nowego użytkownika ma minimalny zakres; konta usług/integracji mają tylko potrzebne uprawnienia. | Przegląd domyślnych ról i kluczy API integracji. | ASVS V8; NIST CSF PR.AA | ☐ |
| **AUTHZ-007** | P1 | Uprawnienia sprawdzane przy **każdym** żądaniu na podstawie stanu serwera (nie tylko z claimów tokenu wydanego wcześniej) dla zmian krytycznych — odebranie roli działa w przewidywalnym czasie. | Odbierz rolę → kolejne żądanie (lub po TTL tokenu) odrzucone. | ASVS V8 | ☐ |

## IV.6 Panel administracyjny — `CONDITIONAL: panel admina / back-office`

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **ADM-001** | P0 | Dostęp do panelu wymaga uwierzytelnienia z MFA i roli administracyjnej sprawdzanej po stronie serwera dla **każdego** endpointu admina (nie tylko trasy UI). | Zob. SEC-007; wywołanie API admina tokenem użytkownika → `403`. | ASVS V8 | ☐ |
| **ADM-002** | P1 | Ograniczenie ekspozycji panelu: osobna subdomena/ścieżka z dodatkowymi kontrolami (IP allow-list, VPN, Zero Trust access, WAF rule) tam, gdzie to wykonalne; `noindex` i brak linków publicznych. | Dostęp z nieautoryzowanego IP → zablokowany (jeśli wdrożone); `X-Robots-Tag: noindex`. | ASVS V8; CIS | ☐ |
| **ADM-003** | P1 | Audit log wszystkich operacji admina (kto, co, kiedy, na czym, z jakiego IP, wynik) — niemodyfikowalny przez admina panelu. | Wykonaj operację → wpis w audit logu; admin aplikacji nie może go usunąć. | ASVS V16; LOG- | ☐ |
| **ADM-004** | P1 | Funkcje „impersonacji”/„zaloguj jako użytkownik” (jeśli istnieją) — wymagają uzasadnienia, są oznaczone w UI, logowane, czasowo ograniczone i nie pozwalają na zmianę danych logowania użytkownika. | Przegląd funkcji i logu. | ASVS V8 | ☐ |
| **ADM-005** | P1 | Operacje masowe i nieodwracalne (masowe usuwanie, eksport wszystkich danych, zmiana cen hurtowa) wymagają potwierdzenia, mają limity i są logowane. | Test w UI i API. | ASVS V2 | ☐ |
| **ADM-006** | P2 | Liczba kont administracyjnych minimalna; przegląd kont admin co kwartał (Część XXVI); konta imienne (bez współdzielonych). | Lista kont admin z właścicielami. | NIST CSF PR.AA | ☐ |

---

# CZĘŚĆ V — API Security

`CONDITIONAL: projekt udostępnia API (własne endpointy, Route Handlers, Server Actions, funkcje serverless, GraphQL, webhooki).`

**Źródła:** OWASP API Security Top 10 2023 · OWASP ASVS 5.0 V4 (API and Web Service) · OWASP REST Security CS · OWASP GraphQL CS · RFC 9110 (HTTP Semantics) · RFC 9457 (Problem Details for HTTP APIs).

> Pamiętaj: **Server Actions (Next.js), funkcje Firebase/Supabase Edge i RPC to też publiczne API** — atakujący wywołuje je bezpośrednio, z pominięciem UI.

## V.1 Inwentaryzacja i ekspozycja

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **API-001** | P1 | Aktualny inwentarz wszystkich endpointów (publiczne, prywatne, administracyjne, wewnętrzne, wersje starsze) — najlepiej kontrakt OpenAPI/GraphQL schema w repo. | Porównanie inwentarza z trasami z kodu i ruchem z proxy; brak „zapomnianych” wersji (`/v1` nadal aktywne bez wsparcia). | API Top 10 2023 API9 | ☐ |
| **API-002** | P0 | Każdy endpoint ma jawnie określony poziom dostępu (public / authenticated / role X / internal) i jest testowany negatywnie. Endpointy wewnętrzne (cron, health z danymi, metryki) nie są dostępne publicznie lub wymagają sekretu. | Zob. SEC-008; wywołanie endpointu cron bez sekretu → `401/404`. | ASVS V4, V8 | ☐ |
| **API-003** | P2 | Wersjonowanie API zdefiniowane (ścieżka/nagłówek), zmiany łamiące tylko w nowej wersji, polityka wygaszania starych wersji (deprecation header, termin). | Dokumentacja wersjonowania; stare wersje mają te same kontrole bezpieczeństwa co nowe. | API Top 10 API9 | ☐ |

## V.2 Walidacja żądań i odpowiedzi

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **API-010** | P0 | Walidacja schematem: path params, query, body, nagłówki (np. `Content-Type`), z odrzuceniem nieznanych pól (lub ich ignorowaniem bez przypisania — SEC-025). | Fuzz pól (typy, null, tablice zamiast skalarów, bardzo długie wartości, Unicode, liczby ujemne) → `400/422` z bezpiecznym komunikatem. Narzędzie: Schemathesis (dla OpenAPI) na stagingu. | ASVS V2, V4 | ☐ |
| **API-011** | P1 | `Content-Type` wymuszany: endpoint JSON odrzuca `text/plain`/`application/x-www-form-urlencoded` (ogranicza CSRF przez „simple requests”). | `curl -X POST -H "Content-Type: text/plain" -d '{...}'` → `415`. | ASVS V4 | ☐ |
| **API-012** | P1 | Limit rozmiaru żądania (body, nagłówki, liczba elementów tablic, głębokość JSON) i timeouty po stronie serwera. | Zob. SEC-030; body > limit → `413`. | API Top 10 API4 | ☐ |
| **API-013** | P1 | Paginacja obowiązkowa dla list, z maksymalnym `limit` po stronie serwera; filtrowanie i sortowanie tylko po polach z allow-listy (ochrona przed SQLi w `ORDER BY` i przed filtrowaniem po polach prywatnych, np. `?filter=passwordHash`). | `?limit=100000` → przycięte do max; `?sort=password` / `?sort=(select…)` → `400`; filtrowanie po polu niewidocznym w odpowiedzi → odrzucone. | API Top 10 API4; ASVS V2 | ☐ |
| **API-014** | P0 | Odpowiedzi minimalne (DTO) — zob. SEC-037. | — | — | ☐ |
| **API-015** | P2 | Spójny format błędów (np. RFC 9457 Problem Details), poprawne kody HTTP (`400/401/403/404/409/413/415/422/429/5xx`), brak `200 OK` z `{"error":…}`. | Przegląd odpowiedzi błędów. | RFC 9457; RFC 9110 | ☐ |

## V.3 Autoryzacja, nadużycia, cache

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **API-020** | P0 | Autoryzacja każdego zasobu i każdej właściwości (object + property level) — SEC-003, SEC-007, SEC-025, SEC-037. | — | API Top 10 API1, API3, API5 | ☐ |
| **API-021** | P1 | Rate limiting i kwoty per klient/klucz/użytkownik — SEC-020; dla kosztownych operacji (eksport, AI, SMS, e-mail) limity biznesowe (dziennie/miesięcznie) i alert przy przekroczeniu. | Skrypt przekraczający limit → `429`; alert w monitoringu. | API Top 10 API4, API6 | ☐ |
| **API-022** | P1 | Ochrona wrażliwych przepływów biznesowych przed automatyzacją (zakup limitowanych produktów, rejestracje masowe, scraping cen): CAPTCHA/Turnstile, limity per urządzenie, wykrywanie botów na poziomie CDN. | Próba zautomatyzowanego wykonania przepływu 100× → ograniczona. | API Top 10 API6 | ☐ |
| **API-023** | P1 | Cache: odpowiedzi API z danymi użytkownika — `Cache-Control: private, no-store`; publiczne odpowiedzi cachowane świadomie z `Vary` dla nagłówków wpływających na treść (`Authorization`, `Accept-Language`). | `curl -sI` endpointu prywatnego → `no-store`; brak `Age`/trafień CDN. Zob. SEC-028. | ASVS V14 | ☐ |
| **API-024** | P1 | CORS — SEC-019. Preflight nie zezwala na wszystkie nagłówki/metody. | — | — | ☐ |
| **API-025** | P1 | Logowanie żądań API: metoda, ścieżka (bez sekretów w query), status, czas, ID użytkownika/klienta, `requestId`; bez body z danymi wrażliwymi. | Przegląd logów. Zob. LOG-. | ASVS V16 | ☐ |
| **API-026** | P2 | Klucze API dla integracji B2B: per klient, z zakresem uprawnień, rotowalne, hashowane w bazie, z datą ostatniego użycia; nigdy w URL. | Przegląd modelu kluczy. | ASVS V4 | ☐ |

## V.4 GraphQL — `CONDITIONAL: GraphQL`

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **GQL-001** | P1 | Introspekcja wyłączona w produkcji (chyba że API jest świadomie publiczne); pole suggestions („Did you mean…”) wyłączone. | Zapytanie `{__schema{types{name}}}` → odrzucone; literówka w polu → brak podpowiedzi. | OWASP GraphQL CS | ☐ |
| **GQL-002** | P0 | Autoryzacja na poziomie resolverów/pól (nie tylko na wejściu do endpointu) — w tym `node(id:)`, relacje zagnieżdżone, mutacje. | Test SEC-003 na każdym typie i relacji (np. `user { orders { customer { email } } }`). | API Top 10 API1 | ☐ |
| **GQL-003** | P1 | Limity głębokości, złożoności/kosztu, liczby aliasów, rozmiaru batcha; timeout zapytania; persisted queries / allow-list zapytań dla klientów first-party, jeśli możliwe. | Zapytanie z 100 aliasami logowania (brute force przez batching), głębokość 20 → odrzucone. | OWASP GraphQL CS | ☐ |
| **GQL-004** | P2 | Błędy GraphQL bez stack trace i szczegółów wewnętrznych (masking errors). | Wymuś błąd resolvera → generyczny komunikat. | ASVS V16 | ☐ |
| **GQL-005** | P1 | CSRF: GraphQL nie akceptuje mutacji przez `GET` ani `application/x-www-form-urlencoded`/`multipart` bez ochrony. | `GET /graphql?query=mutation{…}` → odrzucone. | OWASP GraphQL CS | ☐ |

## V.5 Webhooki — `CONDITIONAL: przyjmowanie webhooków (płatności, Git, CMS, Shopify, Stripe itp.)`

#### **API-040** · P0 · Weryfikacja podpisu webhooka
- [ ] **Wymaganie:** Każdy przychodzący webhook weryfikowany kryptograficznie (HMAC/podpis dostawcy) na **surowym body** (przed parsowaniem JSON), porównaniem w stałym czasie (`crypto.timingSafeEqual`), z sekretem z menedżera sekretów. Żądania bez poprawnego podpisu odrzucane `401/400` i logowane.
- **Dlaczego:** Bez weryfikacji każdy może wysłać „płatność udana” i otrzymać towar/usługę.
- **Test:** Wyślij poprawny payload bez nagłówka podpisu, z błędnym podpisem, z podpisem dla innego body (zmieniona kwota) → odrzucone. Użyj narzędzi dostawcy (np. `stripe trigger`, „Send test webhook”) → przyjęte.
- **Oczekiwany wynik:** Tylko podpisane poprawnie zdarzenia zmieniają stan.
- **Źródło:** ASVS 5.0 V4 · dokumentacja dostawcy (Stripe/PayU/Przelewy24/Shopify webhooks) · OWASP API Top 10 API10.
- **Status:** ☐ · **Dowód:** ____

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **API-041** | P0 | Ochrona przed replay: weryfikacja znacznika czasu w podpisie (tolerancja np. ≤ 5 min) **i** deduplikacja po ID zdarzenia (tabela przetworzonych zdarzeń z unikalnym indeksem). | Wyślij to samo, poprawnie podpisane zdarzenie dwukrotnie → drugie nie zmienia stanu; zdarzenie ze starym timestampem → odrzucone. | ASVS V4 | ☐ |
| **API-042** | P1 | Idempotentne przetwarzanie: obsługa ponownych dostaw (dostawcy ponawiają przy timeout), zdarzeń w złej kolejności (np. `refunded` przed `paid`) i częściowych awarii — przez maszynę stanów i transakcje. | Symuluj ponowienia i odwróconą kolejność na stagingu → stan końcowy poprawny. | — | ☐ |
| **API-043** | P1 | Szybka odpowiedź `2xx` po zapisaniu zdarzenia; ciężkie przetwarzanie asynchronicznie (kolejka) — zapobiega timeoutom i lawinie ponowień. | Czas odpowiedzi endpointu webhooka < limitu dostawcy (zwykle kilka–kilkanaście sekund). | Dokumentacja dostawcy | ☐ |
| **API-044** | P1 | Krytyczne dane (status płatności, kwota) potwierdzane zapytaniem do API dostawcy, jeśli webhook nie jest jedynym źródłem prawdy lub dostawca to zaleca. | Przegląd kodu obsługi płatności. Zob. PAY-. | Dokumentacja dostawcy | ☐ |

## V.6 Idempotencja i ponawianie — operacje zapisu

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **API-050** | P1 | `CONDITIONAL: operacje finansowe / tworzenie zamówień / operacje nieodwracalne` — obsługa `Idempotency-Key` (klient generuje UUID, serwer zapamiętuje wynik na określony czas, ten sam klucz z innym body → `422`). | Wyślij to samo żądanie z tym samym kluczem 2× → jedno zamówienie, identyczna odpowiedź; podwójne kliknięcie w UI nie tworzy duplikatu. | IETF draft „Idempotency-Key HTTP header” (stan: draft — zweryfikuj); praktyka Stripe | ☐ |
| **API-051** | P2 | Metody HTTP zgodne z semantyką: GET/HEAD bez skutków ubocznych, PUT/DELETE idempotentne. | Przegląd tras. | RFC 9110 | ☐ |

## V.7 Zewnętrzne API (konsumowane przez projekt) — `CONDITIONAL: integracje z API zewnętrznymi`

**Źródło:** OWASP API Security Top 10 2023 **API10 — Unsafe Consumption of APIs**.

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **EXT-001** | P0 | Klucze do zewnętrznych API wyłącznie po stronie serwera (lub klucze publiczne przeznaczone do frontendu, z ograniczeniem domeny/referrera/zakresu po stronie dostawcy). | Przegląd bundla (SEC-033) i konfiguracji ograniczeń kluczy w konsoli dostawcy (np. Google Maps key restricted by HTTP referrer). | API Top 10 API10; ASVS V13 | ☐ |
| **EXT-002** | P1 | Odpowiedzi z zewnętrznych API traktowane jak niezaufane wejście: walidacja schematem, escaping przy renderowaniu, limity rozmiaru. | Mock zwracający złośliwe/zniekształcone dane (staging) → aplikacja odrzuca/neutralizuje. | API10 | ☐ |
| **EXT-003** | P1 | Timeouty (połączenie + odpowiedź), ograniczone ponowienia z backoffem i jitterem tylko dla operacji idempotentnych, circuit breaker / degradacja funkcji przy awarii dostawcy. | Symulacja awarii (mock z opóźnieniem 60 s / błędem 500) → aplikacja odpowiada w swoim SLA i pokazuje zdegradowaną funkcję. Zob. PERF-060. | — | ☐ |
| **EXT-004** | P1 | Komunikacja wyłącznie HTTPS z weryfikacją certyfikatu (brak `rejectUnauthorized: false`, `verify=False`). | `grep -rnE "rejectUnauthorized:\s*false\|NODE_TLS_REJECT_UNAUTHORIZED\|verify=False" .` → 0. | ASVS V12 | ☐ |
| **EXT-005** | P1 | Przekierowania od dostawców nie są ślepo śledzone (ryzyko SSRF i wycieku nagłówków autoryzacyjnych). | Przegląd konfiguracji klienta HTTP. | API10 | ☐ |
| **EXT-006** | P2 | Monitorowanie limitów i kosztów (quota, billing alerts) u dostawców; plan działania przy wyczerpaniu limitu. | Alerty skonfigurowane w konsoli dostawcy. | — | ☐ |
| **EXT-007** | P1 | Ocena dostawcy pod kątem przetwarzania danych osobowych (umowa powierzenia, lokalizacja danych) — zob. PRIV-040. | Lista dostawców w rejestrze. | RODO art. 28 | ☐ |

---

# CZĘŚĆ VI — Database Security

`CONDITIONAL: projekt korzysta z bazy danych (SQL, NoSQL, BaaS).`

**Źródła:** OWASP ASVS 5.0 V13, V14 · OWASP Database Security CS · OWASP SQL Injection Prevention CS · CIS Benchmarks dla PostgreSQL/MySQL/MongoDB · dokumentacja Supabase (RLS, API keys) · dokumentacja Firebase (Security Rules, App Check) · RODO art. 5, 17, 25, 32.

## VI.1 Wymagania ogólne (wszystkie bazy)

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **DB-001** | P0 | Baza niedostępna publicznie z internetu (prywatna sieć / allow-list IP / tylko przez pooler aplikacji). Wyjątek: BaaS z API zaprojektowanym do dostępu publicznego (Supabase PostgREST, Firestore) — wtedy obowiązuje VI.2/VI.3. | `nc -zv <host> 5432/3306/27017` z zewnątrz → brak połączenia; konfiguracja sieci u dostawcy. | CIS; ASVS V13 | ☐ |
| **DB-002** | P0 | Least privilege: aplikacja łączy się użytkownikiem bez uprawnień superuser/owner, z dostępem tylko do potrzebnych schematów/tabel; migracje wykonywane osobnym użytkownikiem; brak współdzielenia kont między środowiskami. | `\du` / `SHOW GRANTS` → użytkownik aplikacji bez `SUPERUSER`, `CREATEROLE`, `DROP`, `GRANT OPTION` (jeśli niepotrzebne). | CIS; ASVS V13 | ☐ |
| **DB-003** | P0 | SQL/NoSQL injection — SEC-001, SEC-002 (prepared statements, ORM bez raw). | — | — | ☐ |
| **DB-004** | P1 | Połączenia szyfrowane TLS z weryfikacją certyfikatu (`sslmode=verify-full` dla PostgreSQL tam, gdzie wspierane). | Connection string / konfiguracja klienta; `SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();` → `t`. | ASVS V12 | ☐ |
| **DB-005** | P1 | Szyfrowanie w spoczynku włączone (u dostawcy chmurowego zwykle domyślne — potwierdź w dokumentacji/konsoli); kolumny szczególnie wrażliwe (np. numery dokumentów, dane zdrowotne, tokeny dostawców) szyfrowane aplikacyjnie lub `pgcrypto`, klucz poza bazą. | Dokument dostawcy + przegląd schematu. | ASVS V14; RODO art. 32 | ☐ |
| **DB-006** | P0 | Connection stringi i hasła do bazy wyłącznie w menedżerze sekretów / zmiennych środowiskowych serwera; nie w repo, nie w bundlu klienta, nie w logach. | SEC-033, ARC-020. | ASVS V13 | ☐ |
| **DB-007** | P1 | Integralność: klucze obce, `NOT NULL`, `CHECK`, unikalne indeksy dla reguł biznesowych (np. jeden aktywny kupon na zamówienie, unikalny e-mail case-insensitive). | Przegląd schematu; próba zapisu niespójnych danych bezpośrednio w bazie testowej → odrzucona. | — | ☐ |
| **DB-008** | P2 | Indeksy dla zapytań krytycznych; brak full scanów na dużych tabelach w ścieżkach użytkownika. | `EXPLAIN ANALYZE` najczęstszych zapytań; `pg_stat_statements` / slow query log. Zob. PERF-040. | — | ☐ |
| **DB-009** | P1 | Migracje wersjonowane w repo, odtwarzalne, przetestowane na kopii danych zbliżonej do produkcji; plan rollbacku lub migracje kompatybilne wstecz (expand → migrate → contract). | Uruchomienie migracji od zera na pustej bazie + na kopii stagingowej → sukces. | REL- | ☐ |
| **DB-010** | P0 | Backupy automatyczne + **udany test odtworzenia** — Część XVII (BCK-). | — | — | ☐ |
| **DB-011** | P1 | Retencja i usuwanie: zdefiniowany czas przechowywania dla każdej kategorii danych osobowych; mechanizm usunięcia/anonimizacji (job cykliczny); usunięcie konta usuwa/anonimizuje dane we wszystkich tabelach i storage (i informuje o backupach). | Usuń konto testowe → brak danych osobowych w tabelach (zapytanie po e-mailu/ID); dokument retencji. | RODO art. 5(1)(e), 17 | ☐ |
| **DB-012** | P2 | Anonimizacja/pseudonimizacja danych używanych w stagingu, testach i analizach. | Staging nie zawiera realnych danych osobowych lub ma udokumentowaną podstawę i zabezpieczenia. | RODO art. 25, 32 | ☐ |
| **DB-013** | P2 | Audyt dostępu do danych: logowanie zapytań administracyjnych / dostępu do danych wrażliwych (np. `pgaudit`, logi dostawcy), przegląd uprawnień kont bazodanowych. | Konfiguracja logów; lista kont z dostępem. | ASVS V16 | ☐ |
| **DB-014** | P1 | Panele bazodanowe (phpMyAdmin, Adminer, pgAdmin, Mongo Express, Supabase Studio, konsola Firebase) niedostępne publicznie bez silnego uwierzytelnienia i MFA; konta imienne. | `curl` znanych ścieżek paneli (SEC-035); przegląd członków projektu u dostawcy z MFA. | CIS | ☐ |

## VI.2 Supabase — `CONDITIONAL: Supabase`

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SUPA-001** | P0 | **RLS włączone na każdej tabeli** w schematach eksponowanych przez API (domyślnie `public`) i polityki istnieją dla każdej operacji (SELECT/INSERT/UPDATE/DELETE). Tabela z RLS bez polityk = brak dostępu (dobrze), tabela **bez RLS** = pełny dostęp z kluczem `anon` (krytyczne). | `select schemaname, tablename, rowsecurity from pg_tables where schemaname in ('public') and not rowsecurity;` → 0 wierszy. Supabase Dashboard → Advisors (Security) → brak ostrzeżeń „RLS disabled”. | Supabase docs: Row Level Security; Database Advisors | ☐ |
| **SUPA-002** | P0 | Polityki RLS poprawne: używają `auth.uid()` (lub `(select auth.uid())` dla wydajności), sprawdzają własność/członkostwo; polityki UPDATE mają `USING` **i** `WITH CHECK` (bez `WITH CHECK` użytkownik może „przepisać” wiersz na inną osobę); brak polityk `using (true)` dla danych prywatnych. | Test z dwoma kontami przez REST (`curl` z JWT A na wiersze B) — SEC-003; próba `PATCH` zmieniająca `user_id` na cudzy → odrzucona. | Supabase RLS docs | ☐ |
| **SUPA-003** | P0 | Klucz `service_role` (lub nowy secret key) **nigdy** w kliencie, repo, logach; używany wyłącznie w zaufanym backendzie (Edge Functions/serwer). W frontendzie tylko klucz `anon`/publishable. | `gitleaks` + przeszukanie bundla po wartości klucza i ciągu `service_role` → 0. | Supabase docs: API keys | ☐ |
| **SUPA-004** | P1 | Eksponowane schematy minimalne (Settings → API → Exposed schemas); tabele wewnętrzne w schemacie nieeksponowanym (np. `private`). | Konfiguracja projektu; zapytanie REST do tabeli w schemacie prywatnym → `404`. | Supabase docs | ☐ |
| **SUPA-005** | P1 | Funkcje bazodanowe: `SECURITY DEFINER` tylko gdy konieczne, z ustawionym `search_path`, sprawdzaniem uprawnień wewnątrz i `REVOKE EXECUTE … FROM anon, authenticated` tam, gdzie nie mają być wywoływane przez RPC; widoki z `security_invoker = true` (PG15+), aby nie omijały RLS. | Advisors (Security); `select proname, prosecdef from pg_proc …`; RPC wywołane kluczem anon → odmowa dla funkcji wewnętrznych. | Supabase Advisors / Postgres docs | ☐ |
| **SUPA-006** | P1 | Granty: brak nadmiarowych `GRANT` dla ról `anon`/`authenticated` na tabelach, których API nie powinno dotykać. | `\dp` / `information_schema.role_table_grants` dla `anon`. | Supabase docs | ☐ |
| **SUPA-007** | P1 | Auth: potwierdzanie e-maila włączone, lista dozwolonych redirect URL zawężona (bez wildcardów obejmujących obce domeny), ochrona przed wyciekniętymi hasłami i CAPTCHA (jeśli dostępne w planie), rate limits auth skonfigurowane, MFA dla adminów. | Authentication → URL Configuration / Providers / Rate limits. | Supabase Auth docs | ☐ |
| **SUPA-008** | P0 | Storage: buckety prywatne dla danych użytkowników; polityki na `storage.objects` ograniczające dostęp po `auth.uid()` i ścieżce; pliki prywatne serwowane przez signed URLs z krótkim TTL. | Pobierz plik B jako A (bezpośredni URL, list, signed URL) → odmowa. Zob. FILE-. | Supabase Storage access control | ☐ |
| **SUPA-009** | P1 | Edge Functions: weryfikacja JWT włączona (domyślnie) poza funkcjami świadomie publicznymi (np. webhooki z własną weryfikacją podpisu); sekrety przez `supabase secrets`; CORS zawężony. | Wywołanie funkcji bez JWT → `401` (poza wyjątkami). | Supabase Edge Functions docs | ☐ |
| **SUPA-010** | P1 | Backupy i PITR zgodne z RPO (plany niższe mają ograniczoną retencję — zweryfikuj aktualną ofertę); dodatkowy, niezależny eksport (`pg_dump`) poza Supabase dla danych krytycznych. | Konsola → Database → Backups; test odtworzenia (BCK-). | Supabase docs | ☐ |
| **SUPA-011** | P2 | Migracje zarządzane w repo (`supabase/migrations`, `supabase db diff`/`db push`), brak zmian „ręcznie w Studio” na produkcji bez odzwierciedlenia w repo. | Porównanie schematu produkcji z migracjami (`supabase db diff --linked`). | Supabase CLI docs | ☐ |

## VI.3 Firebase — `CONDITIONAL: Firebase (Firestore / Realtime Database / Storage)`

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **FIRE-001** | P0 | Security Rules Firestore/RTDB/Storage **nie** w trybie testowym (`allow read, write: if true;` lub `if request.time < timestamp…`); reguły egzekwują uwierzytelnienie i własność (`request.auth.uid == resource.data.ownerId`). | Przegląd plików `firestore.rules`, `database.rules.json`, `storage.rules`; konsola nie pokazuje ostrzeżeń o regułach otwartych. | Firebase Security Rules docs | ☐ |
| **FIRE-002** | P0 | Reguły walidują dane zapisu (typy, dozwolone pola przez `request.resource.data.keys().hasOnly([...])`, niezmienność `ownerId`, `role`) — inaczej klient może zapisać dowolne pola (mass assignment). | Testy reguł w emulatorze (`@firebase/rules-unit-testing`) z przypadkami negatywnymi, uruchamiane w CI. | Firebase docs | ☐ |
| **FIRE-003** | P1 | Reguły testowane automatycznie w emulatorze (Firebase Emulator Suite) — pozytywne i negatywne przypadki dla każdej kolekcji. | `firebase emulators:exec "npm test"` w CI → zielone. | Firebase docs | ☐ |
| **FIRE-004** | P1 | App Check włączony i wymuszany (enforcement) dla Firestore/Storage/Functions/RTDB tam, gdzie to możliwe — ogranicza nadużycia z klientów spoza aplikacji (nie zastępuje Security Rules). | Konsola → App Check → Enforced; żądanie bez tokenu App Check → odrzucone. | Firebase App Check docs | ☐ |
| **FIRE-005** | P1 | Cloud Functions: wywoływalne (`onCall`) weryfikują `context.auth`/`request.auth` i uprawnienia; HTTP functions mają własną autoryzację; sekrety przez Secret Manager (`defineSecret`), nie w kodzie/`functions.config()` (przestarzałe — zweryfikuj aktualny status). | Wywołanie funkcji bez auth → odrzucone. | Firebase Functions docs | ☐ |
| **FIRE-006** | P1 | Firebase Auth: dozwolone domeny autoryzowane (Authorized domains) zawężone; włączona ochrona przed enumeracją e-maili (email enumeration protection, jeśli dostępna dla projektu); MFA dla adminów. | Konsola → Authentication → Settings. | Firebase Auth docs | ☐ |
| **FIRE-007** | P2 | Kwoty i budżety: alerty budżetowe w Google Cloud Billing, limity zapytań; indeksy Firestore wdrażane z repo (`firestore.indexes.json`). | Billing alerts skonfigurowane. | Firebase docs | ☐ |
| **FIRE-008** | P1 | Klucz konfiguracji Firebase w kliencie jest publiczny z założenia — bezpieczeństwo opiera się na Rules i App Check; **klucze Admin SDK / service account JSON** nigdy w kliencie ani repo. | `gitleaks`; wyszukaj `"type": "service_account"` → 0 w repo. | Firebase docs | ☐ |
| **FIRE-009** | P1 | Backup Firestore: zaplanowane eksporty / PITR (jeśli włączone) + test odtworzenia. | Konfiguracja + protokół (BCK-). | Firestore backup docs | ☐ |

## VI.4 Klasyczne bazy SQL — `CONDITIONAL: PostgreSQL / MySQL / MariaDB (self-hosted lub managed)`

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SQL-001** | P1 | Hardening wg CIS Benchmark dla danej wersji silnika: uwierzytelnianie (`scram-sha-256` w `pg_hba.conf`, bez `trust`), wyłączony dostęp zdalny dla `postgres`/`root`, usunięte bazy/konta testowe (MySQL `test`, anonimowi użytkownicy). | `grep -v "^#" pg_hba.conf`; MySQL: `SELECT user,host FROM mysql.user;`. | CIS PostgreSQL / MySQL Benchmark | ☐ |
| **SQL-002** | P1 | Aktualna, wspierana wersja silnika z poprawkami bezpieczeństwa. | `SELECT version();` vs. polityka wsparcia projektu PostgreSQL/MySQL. | — | ☐ |
| **SQL-003** | P2 | Row-Level Security PostgreSQL jako warstwa obrony w głąb dla systemów multi-tenant (opcjonalnie, jeśli aplikacja łączy się jednym kontem — wymaga `SET app.tenant_id` lub ról per tenant). | Przegląd polityk. | PostgreSQL docs | ☐ |
| **SQL-004** | P1 | Limity zasobów: `statement_timeout`, `idle_in_transaction_session_timeout`, limit połączeń + connection pooler (PgBouncer / pooler dostawcy) dla serverless. | `SHOW statement_timeout;`. | — | ☐ |
| **SQL-005** | P1 | MongoDB (`CONDITIONAL`): uwierzytelnianie włączone, `bindIp` ograniczone, TLS, role wbudowane z minimalnymi uprawnieniami, brak wystawienia na `0.0.0.0` bez firewalla. | Konfiguracja `mongod.conf` / Atlas Network Access. | CIS MongoDB Benchmark | ☐ |

---

# CZĘŚĆ VII — Infrastructure & Deployment

**Źródła:** NIST CSF 2.0 (PR.PS, PR.IR, DE.CM) · CIS Benchmarks / CIS Controls v8.1 · OWASP Secure Headers Project · Mozilla Server Side TLS & HTTP Observatory · OWASP TLS CS, HSTS CS, CSP CS · RFC 6797 (HSTS) · CA/Browser Forum (limity ważności certyfikatów).

## VII.0 Gdzie ustawiać zabezpieczenia

| Zabezpieczenie | Aplikacja | Serwer / reverse proxy | CDN / WAF | Dostawca hostingu / DNS |
|---|---|---|---|---|
| Walidacja, AuthN/AuthZ, CSRF, logika | **✔ jedyne właściwe miejsce** | — | — (WAF jedynie łagodzi) | — |
| Nagłówki bezpieczeństwa (CSP, HSTS…) | ✔ (gdy zależne od strony, np. nonce CSP) | ✔ (globalne) | ✔ (globalne, edge) | ✔ (np. `vercel.json`, `_headers`) |
| TLS, certyfikaty, przekierowanie HTTP→HTTPS | — | ✔ (self-hosted) | ✔ | ✔ (managed) |
| Rate limiting | ✔ (per konto/logika) | ✔ (per IP) | ✔ (per IP, boty) | — |
| Ochrona DDoS wolumetryczna | — | — | **✔** | ✔ |
| Firewall sieciowy, porty | — | ✔ | — | ✔ (security groups) |
| Sekrety | ✔ (odczyt) | — | — | ✔ (przechowywanie: secret manager / env) |
| DNS, CAA, DNSSEC | — | — | — | **✔** |

Zasada: **ustawiaj w jednym, udokumentowanym miejscu**; dublowanie nagłówków w kilku warstwach prowadzi do sprzecznych wartości (np. dwa nagłówki CSP są łączone restrykcyjnie, co może psuć stronę).

## VII.1 Domena, DNS, TLS

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **INF-001** | P0 | HTTPS na wszystkich hostach (w tym subdomenach, API, panelu, CDN); HTTP przekierowuje `301/308` na HTTPS; brak mixed content. | `curl -sI http://host` → `301/308` → `https://`; przeglądarka bez ostrzeżeń mixed content (konsola). | ASVS V12 | ☐ |
| **INF-002** | P0 | TLS 1.2 i 1.3 włączone; SSL 3.0/TLS 1.0/1.1 wyłączone; brak słabych szyfrów (RC4, 3DES, CBC z SHA1 w TLS1.2 — wg profilu Mozilla „Intermediate”); certyfikat ważny, z pełnym łańcuchem, pasujący do hosta. | `testssl.sh --severity MEDIUM https://host` lub SSL Labs → ocena A/A+, brak luk. | Mozilla Server Side TLS; OWASP TLS CS | ☐ |
| **INF-003** | P1 | HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains` (po upewnieniu się, że **wszystkie** subdomeny działają po HTTPS); `preload` tylko świadomie (trudne do wycofania). | `curl -sI https://host \| grep -i strict-transport`. | RFC 6797; OWASP HSTS CS | ☐ |
| **INF-004** | P1 | Automatyczne odnawianie certyfikatów + monitoring daty wygaśnięcia (alert ≥ 14 dni przed). Uwaga: CA/Browser Forum skraca maksymalną ważność certyfikatów etapami (od 2026 r.) — automatyzacja jest obowiązkowa w praktyce. | Monitoring certyfikatu (uptime tool) skonfigurowany. | CA/B Forum Baseline Requirements (SC-081 — zweryfikuj aktualny harmonogram) | ☐ |
| **INF-005** | P2 | DNS: rekord CAA ograniczający wystawców certyfikatów; DNSSEC jeśli wspierany przez rejestratora; MFA na koncie rejestratora/DNS; blokada transferu domeny; brak „wiszących” rekordów (subdomain takeover). | `dig CAA domena`; przegląd rekordów CNAME wskazujących na usunięte zasoby (np. stare buckety, aplikacje Heroku/Vercel). | NIST CSF; OWASP WSTG-CONF-10 | ☐ |
| **INF-006** | P2 | `CONDITIONAL: wysyłka e-maili z domeny` — SPF, DKIM, DMARC (`p=quarantine`/`reject` po okresie monitoringu) skonfigurowane. | `dig TXT domena`, `dig TXT _dmarc.domena`; test wysyłki → nagłówki `dkim=pass spf=pass dmarc=pass`. | RFC 7208/6376/7489 | ☐ |
| **INF-007** | P2 | Data wygaśnięcia domeny monitorowana, auto-odnawianie włączone. | Panel rejestratora. | — | ☐ |

## VII.2 Nagłówki HTTP

> **Nie kopiuj nagłówków bezrefleksyjnie.** CSP musi być zbudowana dla źródeł, z których korzysta konkretna aplikacja. Wdrażaj najpierw w trybie `Content-Security-Policy-Report-Only`, zbieraj raporty, potem egzekwuj.

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **HDR-001** | P1 | **Content-Security-Policy** egzekwowana: co najmniej `default-src 'self'`, `object-src 'none'`, `base-uri 'self'` (lub `'none'`), `frame-ancestors` (SEC-018), `form-action 'self'`; skrypty przez nonce/hash + `'strict-dynamic'` zamiast `'unsafe-inline'`; `'unsafe-eval'` tylko z uzasadnieniem. `upgrade-insecure-requests` opcjonalnie. Raportowanie (`report-to`/`report-uri`) skonfigurowane. | `curl -sI https://host \| grep -i content-security`; Google CSP Evaluator → brak ocen „high”; konsola przeglądarki bez naruszeń w normalnym użyciu. | OWASP CSP CS; W3C CSP Level 3 | ☐ |
| **HDR-002** | P1 | `X-Content-Type-Options: nosniff`. | `curl -sI`. | OWASP Secure Headers | ☐ |
| **HDR-003** | P1 | `Referrer-Policy: strict-origin-when-cross-origin` (lub bardziej restrykcyjna, np. `no-referrer` na stronach z tokenami w URL). | `curl -sI`. | OWASP Secure Headers | ☐ |
| **HDR-004** | P2 | `Permissions-Policy` wyłączająca nieużywane API (`camera=(), microphone=(), geolocation=(), payment=()` — dopasuj do funkcji aplikacji!). | `curl -sI`; funkcje używane przez aplikację nadal działają. | W3C Permissions Policy | ☐ |
| **HDR-005** | P1 | Ochrona przed clickjackingiem — SEC-018. | — | — | ☐ |
| **HDR-006** | P2 | Izolacja cross-origin (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy`), gdy kompatybilne z integracjami (popupy OAuth/płatności mogą wymagać `same-origin-allow-popups`). | Test flow OAuth/płatności po włączeniu. | OWASP Secure Headers | ☐ |
| **HDR-007** | P2 | Brak nagłówków ujawniających technologię i wersję (`X-Powered-By`, `Server` z wersją, `X-AspNet-Version`). | `curl -sI`. | WSTG-INFO-02 | ☐ |
| **HDR-008** | P3 | Przestarzały `X-XSS-Protection` — usunięty lub `0` (nie `1; mode=block`, które może wprowadzać podatności w starych przeglądarkach); ochrona przez CSP. | `curl -sI`. | OWASP Secure Headers | ☐ |
| **HDR-009** | P2 | Ocena zbiorcza nagłówków. | Mozilla HTTP Observatory (`https://developer.mozilla.org/en-US/observatory`) → wynik ≥ B+, docelowo A. | Mozilla | ☐ |

## VII.3 Cache, CDN, WAF, firewall

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **INF-010** | P1 | Polityka cache: zasoby statyczne z hashem w nazwie — `Cache-Control: public, max-age=31536000, immutable`; HTML — krótki cache lub `no-cache` z walidacją; odpowiedzi prywatne — `private, no-store` (SEC-028). | `curl -sI` na reprezentatywnych zasobach. | RFC 9111 | ☐ |
| **INF-011** | P2 | CDN przed aplikacją (dla stron publicznych) z ochroną DDoS; reguły WAF w trybie monitorowania → blokowania (managed rules OWASP CRS lub odpowiednik dostawcy). WAF to **warstwa dodatkowa**, nie zamiennik poprawek w kodzie. | Konfiguracja CDN/WAF; test ataku XSS/SQLi w URL na stagingu → zalogowany/zablokowany przez WAF. | NIST CSF PR.IR | ☐ |
| **INF-012** | P1 | `CONDITIONAL: własne serwery/VM` — firewall: tylko porty 80/443 publicznie; SSH tylko z VPN/allow-list/bastion; porty baz, Redis, paneli zamknięte. | `nmap -Pn --top-ports 1000 <ip>` (własna infrastruktura, za zgodą) → tylko oczekiwane porty. | CIS Controls 4, 12 | ☐ |
| **INF-013** | P1 | `CONDITIONAL: własne serwery` — SSH: logowanie kluczem, `PasswordAuthentication no`, `PermitRootLogin no`, aktualizacje automatyczne bezpieczeństwa, fail2ban lub odpowiednik; dostęp imienny. | `sshd -T \| grep -E "passwordauthentication\|permitrootlogin"`. | CIS Benchmark OS | ☐ |
| **INF-014** | P1 | Reverse proxy poprawnie przekazuje IP klienta (`X-Forwarded-For` ufany tylko od znanych proxy — `trust proxy` skonfigurowane), aby rate limiting i logi nie były oszukiwane. | Wyślij `X-Forwarded-For: 1.2.3.4` bezpośrednio → aplikacja nie używa go jako IP klienta (o ile nie przychodzi z zaufanego proxy). | OWASP | ☐ |
| **INF-015** | P1 | Endpointy techniczne (`/health`, `/metrics`, `/status`, `/admin`, `/_debug`, `/graphql` playground, `/api-docs`) — publiczne tylko minimalne health (bez wersji, sekretów, szczegółów infrastruktury); metryki i dokumentacja wewnętrzna chronione. | `curl` każdego endpointu bez uwierzytelnienia. Zob. SEC-035. | ASVS V13 | ☐ |

## VII.4 Środowiska, sekrety, CI/CD, wdrożenia

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **INF-020** | P0 | Sekrety produkcyjne w menedżerze sekretów / zmiennych środowiskowych platformy (Vercel/Netlify env, GitHub Actions Secrets, AWS Secrets Manager, GCP Secret Manager, Doppler, Vault) z dostępem ograniczonym do ról, które ich potrzebują. | Przegląd uprawnień do sekretów; lista osób z dostępem do produkcji. | ASVS V13; OWASP Secrets Mgmt CS | ☐ |
| **INF-021** | P1 | Procedura rotacji sekretów udokumentowana i przetestowana (w tym awaryjna po wycieku) — czas rotacji kluczowych sekretów znany. | Runbook + data ostatniej rotacji. | OWASP Secrets Mgmt CS | ☐ |
| **INF-022** | P1 | Staging odzwierciedla produkcję (wersje runtime, konfiguracja, nagłówki, infrastruktura) — różnice udokumentowane; staging chroniony przed indeksacją i dostępem publicznym (auth/IP). | Porównanie konfiguracji; `X-Robots-Tag: noindex` na stagingu; dostęp anonimowy zablokowany. | SSDF PO.5 | ☐ |
| **INF-023** | P0 | Wdrożenia na produkcję tylko przez pipeline CI/CD z repozytorium (brak ręcznego FTP/edycji na serwerze); każde wdrożenie identyfikowalne (commit SHA, autor, czas). | Historia wdrożeń w platformie powiązana z commitami. | SSDF PS.1; SLSA | ☐ |
| **INF-024** | P0 | Rollback: możliwość przywrócenia poprzedniej wersji w czasie < RTO, **przetestowana** (także gdy wdrożenie zawierało migrację bazy). | Protokół testu rollbacku na stagingu/produkcji (np. „Instant Rollback”/redeploy poprzedniego buildu). Zob. REL-. | — | ☐ |
| **INF-025** | P1 | Health checks (liveness/readiness) wykorzystywane przez platformę do decyzji o ruchu; wdrożenie z błędnym buildem nie przejmuje ruchu (zero-downtime / blue-green / canary jeśli dostępne). | Wdrożenie celowo zepsutej wersji na stagingu → platforma nie przełącza ruchu lub automatyczny rollback. | — | ☐ |
| **INF-026** | P1 | Konta administracyjne w chmurze/hostingu/DNS/rejestratorze/GitHub: imienne, z MFA (preferowane klucze sprzętowe/passkeys), minimalne role, brak współdzielonych haseł; konto root/owner z MFA i nieużywane na co dzień. | Przegląd członków organizacji i wymuszenia MFA (np. GitHub org „Require 2FA”). | CIS Controls 5, 6 | ☐ |
| **INF-027** | P1 | Monitoring i logi infrastruktury — Część XVI; backupy — Część XVII. | — | — | ☐ |
| **INF-028** | P2 | `CONDITIONAL: kontenery` — obrazy minimalne (distroless/alpine/slim), użytkownik nie-root, brak sekretów w warstwach, skan `trivy image` bez Critical/High mających zastosowanie, read-only filesystem gdzie możliwe. | `trivy image --severity HIGH,CRITICAL <obraz>`; `docker inspect` → `User` ≠ root. | CIS Docker Benchmark | ☐ |

---

# CZĘŚĆ VIII — Frontend Security

**Źródła:** OWASP ASVS 5.0 V3 (Web Frontend Security) · OWASP WSTG Client-side Testing (WSTG-CLNT) · OWASP HTML5 Security CS · OWASP Third Party JavaScript Management CS · W3C Subresource Integrity.

> Frontend jest **całkowicie kontrolowany przez użytkownika**. Każda kontrola w przeglądarce (walidacja, ukrycie przycisku, sprawdzenie roli) służy UX — bezpieczeństwo musi być powtórzone na serwerze.

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **FE-001** | P0 | Bezpieczne renderowanie: brak surowego HTML z danych (SEC-004); treści HTML od użytkownika (rich text, Markdown) sanitizowane biblioteką (DOMPurify) z allow-listą tagów, po stronie renderowania. | Przegląd `dangerouslySetInnerHTML`/Markdown rendererów (`rehype-raw` bez sanitizacji = FAIL). | ASVS V1, V3 | ☐ |
| **FE-002** | P1 | DOM-based XSS: źródła (`location.hash`, `location.search`, `postMessage`, `document.referrer`, `window.name`) nie trafiają do sinków (`innerHTML`, `eval`, `href`, `src`) bez walidacji; `postMessage` weryfikuje `event.origin`. | Przegląd kodu (`grep -rn "addEventListener(\"message\"" src`); test z `#<img src=x onerror=alert(1)>`. | WSTG-CLNT-01; DOM XSS Prevention CS | ☐ |
| **FE-003** | P1 | Storage przeglądarki: brak tokenów uwierzytelniających i danych wrażliwych w `localStorage`/`sessionStorage`/IndexedDB (SES-002); dane offline zaprojektowane świadomie (PWA-). Czyszczenie storage przy wylogowaniu. | DevTools → Application; wyloguj → storage danych użytkownika wyczyszczony. | ASVS V3, V14 | ☐ |
| **FE-004** | P0 | Publiczne zmienne środowiskowe — tylko wartości przeznaczone do publikacji (ARC-022). | — | — | ☐ |
| **FE-005** | P1 | Source maps — SEC-034. | — | — | ☐ |
| **FE-006** | P1 | Third-party scripts (analityka, czat, A/B testy, tag manager): inwentarz z właścicielem i celem; ładowane po zgodzie, gdy wymagają zgody (PRIV-); z zaufanych źródeł; CSP ogranicza domeny; Subresource Integrity (`integrity=`) dla skryptów z CDN o stałej wersji; minimalizacja liczby skryptów. | Lista skryptów (DevTools → Network → JS z obcych domen) porównana z inwentarzem; brak skryptów spoza listy. | OWASP Third Party JS Mgmt CS; W3C SRI | ☐ |
| **FE-007** | P1 | Google Tag Manager / podobne (`CONDITIONAL`): dostęp do kontenera ograniczony (MFA, minimalne role), publikacja z review, brak „Custom HTML” wstrzykujących nieznany kod; świadomość, że GTM = możliwość wykonania dowolnego JS na stronie. | Przegląd użytkowników i tagów w GTM. | OWASP Third Party JS Mgmt CS | ☐ |
| **FE-008** | P2 | Osadzenia (iframe, embedy YouTube/Maps/społecznościowe): atrybut `sandbox` z minimalnymi uprawnieniami tam, gdzie możliwe; `allow` ograniczone; `referrerpolicy`; ładowanie po zgodzie dla embedów śledzących (lub tryb „privacy-enhanced”). | Inspekcja HTML. | W3C HTML; PRIV- | ☐ |
| **FE-009** | P2 | Linki zewnętrzne z `target="_blank"` mają `rel="noopener"` (nowoczesne przeglądarki domyślnie traktują jak noopener — dodaj dla starszych i jawności) i `noreferrer` gdy nie chcemy ujawniać URL. | `grep -rn 'target="_blank"' src` → wszystkie z `rel`. | WSTG-CLNT (reverse tabnabbing) | ☐ |
| **FE-010** | P1 | Formularze: walidacja klienta dla UX + **ta sama** walidacja na serwerze (współdzielony schemat); ochrona przed wielokrotnym wysłaniem (disable + idempotencja); `autocomplete` poprawne; dane wrażliwe (`type="password"`, numery kart) bez zapisywania w historii/analityce. | Wyłącz JS / wyślij żądanie bezpośrednio z błędnymi danymi → serwer odrzuca. | ASVS V2 | ☐ |
| **FE-011** | P1 | Upload z frontendu — walidacja po stronie klienta tylko jako UX; FILE- obowiązuje na serwerze. Podgląd plików użytkownika bez renderowania HTML/SVG w kontekście aplikacji. | Zob. FILE-. | ASVS V5 | ☐ |
| **FE-012** | P1 | Dane wrażliwe nie wyciekają do: URL (query), tytułu strony, analityki (adresy e-mail w event params), logów konsoli, błędów raportowanych do Sentry (scrubbing). | Przegląd zdarzeń analityki i Sentry `beforeSend`; `grep -rn "console.log" src` w kodzie produkcyjnym. | ASVS V14 | ☐ |
| **FE-013** | P2 | Bezpieczne błędy UI: komunikaty dla użytkownika bez danych technicznych; Error Boundary zapobiega „białemu ekranowi” i nie wyświetla stack trace w produkcji. | Wymuś błąd komponentu → przyjazny ekran z możliwością powrotu. | ASVS V16 | ☐ |
| **FE-014** | P2 | Clipboard, drag & drop, `window.open` — dane z nich traktowane jak niezaufane wejście. | Przegląd kodu. | WSTG-CLNT | ☐ |
| **FE-015** | P2 | Zależności frontendowe — SEC-031; brak bibliotek z publicznie znanymi podatnościami w bundlu (np. stare jQuery). | `npm audit --omit=dev`; `retire --path dist` (Retire.js). | OWASP Top 10:2025 A03 | ☐ |

---

# CZĘŚĆ IX — Performance & Stability

**Źródła:** web.dev — Core Web Vitals (LCP, INP, CLS; INP zastąpił FID w marcu 2024) · Google Search Central — Page Experience · Lighthouse / Chrome UX Report (CrUX) docs · Grafana k6 docs.

## IX.0 Jak mierzyć i interpretować

| Pomiar | Typ | Narzędzie | Interpretacja |
|---|---|---|---|
| **Field (RUM)** — realni użytkownicy | Decydujący dla CWV | CrUX (PageSpeed Insights, Search Console), biblioteka `web-vitals` → własny RUM / Vercel Speed Insights / Sentry | Ocena na **75. percentylu** wizyt, osobno mobile/desktop. Wymaga ruchu — nowa strona nie ma danych CrUX. |
| **Lab** — symulacja | Diagnostyczny, regresje | Lighthouse (DevTools / CLI / CI), WebPageTest | Wynik zależy od maszyny i throttlingu; porównuj trendy w tych samych warunkach, nie absolutny „score”. INP nie jest mierzony w lab — używaj TBT jako proxy. |
| **Backend** | Latencja, przepustowość | APM (OpenTelemetry, Sentry Performance, Datadog), logi czasu odpowiedzi, `pg_stat_statements` | Patrz na **p95/p99**, nie średnią. |
| **Obciążenie** | Pojemność | k6, Artillery, Locust | Tylko staging/wydzielone środowisko lub za pisemną zgodą i w oknie serwisowym. |

**Progi Core Web Vitals („good” na p75):** LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1. Progi „poor”: LCP > 4 s · INP > 500 ms · CLS > 0,25. TTFB (metryka pomocnicza): ≤ 0,8 s jako „good” wg web.dev.

## IX.1 Core Web Vitals i ładowanie

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PERF-001** | P1 | LCP ≤ 2,5 s (p75, mobile) dla kluczowych typów stron (home, listing, produkt/artykuł, dashboard). | PSI/CrUX (field) lub Lighthouse mobile (lab, przed premierą) dla każdego typu strony. | web.dev CWV | ☐ |
| **PERF-002** | P1 | INP ≤ 200 ms (p75): brak długich zadań (> 50 ms) w odpowiedzi na interakcje; ciężkie obliczenia w Web Worker / odroczone; handlery zdarzeń lekkie. | RUM (`web-vitals` `onINP`), DevTools Performance → interakcje; lab: TBT < 200 ms. | web.dev INP | ☐ |
| **PERF-003** | P1 | CLS ≤ 0,1: wymiary obrazów/wideo/iframe (`width`/`height` lub `aspect-ratio`), rezerwacja miejsca na reklamy/embedy/banery cookies, fonty bez dużego przesunięcia (`size-adjust`/`font-display`). | Lighthouse + nagranie Performance (Layout Shifts). | web.dev CLS | ☐ |
| **PERF-004** | P2 | TTFB ≤ 0,8 s (p75): cache HTML/edge, SSG/ISR dla treści statycznych, brak blokujących zapytań przed pierwszym bajtem. | PSI (field TTFB), `curl -w "%{time_starttransfer}\n" -o /dev/null -s https://host`. | web.dev TTFB | ☐ |
| **PERF-005** | P1 | Obrazy: formaty AVIF/WebP z fallbackiem, responsywne `srcset`/`sizes`, kompresja, wymiary dopasowane do kontenera; obraz LCP **bez** lazy loadingu, z `fetchpriority="high"`; pozostałe poniżej zgięcia z `loading="lazy"`. | Lighthouse audits „Properly size images”, „Serve images in next-gen formats”, „LCP image was lazily loaded” → brak. | web.dev | ☐ |
| **PERF-006** | P2 | Fonty: subset, `woff2`, `font-display: swap/optional`, preload tylko krytycznych, self-hosting lub `preconnect` do dostawcy; ograniczona liczba wariantów. | Network → fonty < ~100 KB łącznie dla krytycznej ścieżki (wartość orientacyjna). | web.dev | ☐ |
| **PERF-007** | P2 | `preconnect`/`dns-prefetch` dla krytycznych domen zewnętrznych; `preload` tylko dla zasobów rzeczywiście potrzebnych od razu (nadmiar preloadów szkodzi). | Lighthouse „Preconnect to required origins”, brak ostrzeżeń „unused preload”. | web.dev | ☐ |
| **PERF-008** | P1 | Code splitting per trasa, lazy loading ciężkich komponentów (edytory, wykresy, mapy), tree shaking (importy nazwane, biblioteki ESM). | Analiza bundla (`npx vite-bundle-visualizer`, `@next/bundle-analyzer`, `source-map-explorer`); brak całych bibliotek importowanych dla jednej funkcji (np. `lodash`, `moment`). | — | ☐ |
| **PERF-009** | P2 | Budżet wydajności: zdefiniowany limit rozmiaru JS (np. initial JS ≤ 170–200 KB gzip na mobile — wartość orientacyjna, dopasuj) i sprawdzany w CI. | `size-limit` / Lighthouse CI budgets → build zawodzi przy przekroczeniu. | web.dev Performance budgets | ☐ |
| **PERF-010** | P1 | Kompresja Brotli/gzip dla tekstowych zasobów; HTTP/2 lub HTTP/3; cache statycznych zasobów (INF-010). | `curl -sI -H "Accept-Encoding: br" https://host/app.js \| grep -i content-encoding`. | — | ☐ |
| **PERF-011** | P2 | Third-party scripts nie blokują renderowania (`async`/`defer`, ładowanie po interakcji/idle, facades dla czatów/wideo). | Lighthouse „Reduce the impact of third-party code”. | web.dev | ☐ |

## IX.2 Renderowanie i framework

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PERF-020** | P2 | Świadomy wybór strategii renderowania per trasa: SSG/ISR dla treści publicznych, SSR/streaming dla personalizowanych, CSR dla aplikacji za logowaniem — udokumentowany. | Tabela tras ze strategią. | Docs frameworka | ☐ |
| **PERF-021** | P2 | `CONDITIONAL: SSR/hydration` — brak błędów hydration mismatch; komponenty interaktywne minimalne (Server Components / islands tam, gdzie możliwe); streaming z `Suspense` dla wolnych danych. | Konsola przeglądarki bez ostrzeżeń hydration; React DevTools Profiler. | React docs | ☐ |
| **PERF-022** | P2 | React: brak zbędnych re-renderów w listach/wydajnych widokach (stabilne klucze, memoizacja tam, gdzie zmierzono problem — nie „na zapas”), wirtualizacja długich list (> kilkaset elementów). | React Profiler na kluczowych widokach; brak zadań > 50 ms przy przewijaniu. | React docs | ☐ |
| **PERF-023** | P1 | Brak wycieków pamięci: sprzątanie listenerów, timerów, subskrypcji, abort fetchy przy odmontowaniu; stabilne zużycie pamięci przy dłuższym użyciu (SPA otwarte godzinami). | DevTools Memory → heap snapshot przed/po 20× nawigacji między widokami → brak liniowego wzrostu. Backend: monitoring RSS procesu. | — | ☐ |

## IX.3 Backend, baza, skalowanie

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PERF-040** | P1 | Latencja API: zdefiniowane SLO (np. p95 < 300 ms dla odczytów, < 1 s dla zapisów — dopasuj) i mierzone. Brak zapytań N+1, wolne zapytania zoptymalizowane (DB-008). | APM / logi z czasem odpowiedzi; `pg_stat_statements` top 10 po `total_exec_time`. | — | ☐ |
| **PERF-041** | P1 | Pula połączeń z bazą dopasowana do środowiska (serverless → pooler transakcyjny), brak wyczerpywania połączeń pod obciążeniem. | Test obciążeniowy (PERF-050) bez błędów „too many connections”. | — | ☐ |
| **PERF-042** | P2 | Cache danych (CDN, cache aplikacyjny, Redis) z jasną strategią unieważniania; brak serwowania danych prywatnych z cache współdzielonego (SEC-028). | Przegląd; test zmian danych → widoczne w oczekiwanym czasie. | — | ☐ |
| **PERF-043** | P2 | Skalowanie: wiadomo, który komponent jest wąskim gardłem i jakie są limity planu hostingu/BaaS (połączenia, wywołania funkcji, egress, quota). | Dokument pojemności. | — | ☐ |

## IX.4 Testy obciążeniowe i odporność

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PERF-050** | P1 | `CONDITIONAL: spodziewany ruch > kilkuset użytkowników jednocześnie lub kampania/premiera` — **load test**: oczekiwany szczytowy ruch × 1,5–2 przez ≥ 10–15 min, na stagingu o parametrach produkcji; SLO utrzymane, błędy < 1 %. | Skrypt k6 z progami (`thresholds: http_req_duration p(95)<…, http_req_failed rate<0.01`); raport. | k6 docs | ☐ |
| **PERF-051** | P2 | **Stress test** (rosnące obciążenie do awarii) — znany punkt załamania i sposób degradacji (błędy 503/429, nie utrata danych). | Raport k6/Artillery z punktem załamania. | — | ☐ |
| **PERF-052** | P2 | **Spike test** (nagły skok × 5–10) — autoskalowanie/kolejki obsługują skok, system wraca do normy bez interwencji. | Raport. | — | ☐ |
| **PERF-053** | P2 | **Soak test** (`CONDITIONAL: procesy długotrwałe`) — kilka godzin stałego obciążenia bez wzrostu pamięci/latencji. | Raport + wykres pamięci. | — | ☐ |
| **PERF-060** | P1 | Timeouty na każdym wywołaniu sieciowym (DB, API zewnętrzne, kolejki), retry z exponential backoff + jitter tylko dla operacji idempotentnych, circuit breaker / fallback dla usług niekrytycznych (EXT-003). | Przegląd konfiguracji klientów; symulacja awarii zależności (toxiproxy / mock) → aplikacja odpowiada w czasie SLO, funkcja zdegradowana, bez kaskady. | — | ☐ |
| **PERF-061** | P1 | Graceful degradation: awaria analityki, czatu, rekomendacji, mapy, CDN obrazów nie psuje krytycznego procesu (logowanie, zakup, zapis danych). | Zablokuj domeny third-party (DevTools → Network request blocking) → krytyczne procesy działają. | — | ☐ |
| **PERF-062** | P2 | Graceful shutdown backendu: obsługa `SIGTERM`, dokończenie żądań w toku, zamknięcie połączeń — wdrożenia bez zrywania żądań. | Wdrożenie podczas testu obciążeniowego → brak błędów 5xx z powodu restartu. | — | ☐ |

---

# CZĘŚĆ X — Testing & Quality Assurance

**Źródła:** NIST SSDF PW.7–PW.8 · OWASP WSTG · OWASP ASVS (jako lista wymagań do testów) · dokumentacje narzędzi.

> **Posiadanie testów ≠ pokrycie krytycznych scenariuszy.** Oceniaj testy przez pryzmat mapy „krytyczny proces → test”, a nie procentu pokrycia linii.

## X.1 Strategia i rodzaje testów

| ID | P | Wymaganie | Test / oczekiwany wynik | Narzędzia (przykłady) | Status |
|---|---|---|---|---|---|
| **QA-001** | P1 | Zdefiniowana strategia testów: co testujemy na którym poziomie (unit / integration / E2E / manual), kto i kiedy; lista krytycznych procesów biznesowych. | Dokument strategii w repo. | — | ☐ |
| **QA-002** | P1 | **Unit testy** dla logiki domenowej i walidacji (ceny, uprawnienia, transformacje danych, parsery). | `npm test` w CI; testy dla przypadków granicznych i błędnych. | Vitest, Jest, pytest | ☐ |
| **QA-003** | P1 | **Testy integracyjne** z prawdziwą bazą (kontener/branch DB) dla warstwy danych, polityk RLS/Rules, endpointów API. | Testy uruchamiane na izolowanej bazie (Testcontainers, Supabase local, Firebase Emulator). | Testcontainers, supertest, Firebase Emulator | ☐ |
| **QA-004** | P0 | **E2E** dla krytycznych ścieżek: rejestracja, logowanie (w tym MFA), reset hasła, główny proces biznesowy (np. zakup/zapis danych), płatność sandbox, wylogowanie. Uruchamiane w CI i jako smoke po wdrożeniu. | Raport Playwright z każdego runu CI; ścieżki zielone na stagingu. | Playwright, Cypress | ☐ |
| **QA-005** | P0 | **Testy uprawnień (negatywne)**: macierz ról × zasobów (AUTHZ-001), IDOR z dwoma kontami (SEC-003) jako testy regresyjne. | Testy automatyczne istnieją i przechodzą; usunięcie sprawdzenia uprawnień w kodzie powoduje FAIL testu. | Playwright API, Vitest + supertest | ☐ |
| **QA-006** | P1 | **Testy API** (kontraktowe i negatywne): statusy, schematy odpowiedzi, błędne wejścia. | Kolekcja uruchamiana w CI / property-based fuzzing schematu. | Bruno, Postman/Newman, Schemathesis | ☐ |
| **QA-007** | P1 | **Testy bezpieczeństwa automatyczne** w CI: SAST, SCA, sekrety; DAST baseline na stagingu. | Raporty z CI; brak nierozwiązanych Critical/High. Szczegóły: Playbook. | Semgrep, CodeQL, npm audit/osv-scanner, Gitleaks, Trivy, OWASP ZAP baseline | ☐ |
| **QA-008** | P1 | **Testy bezpieczeństwa manualne** dla logiki, autoryzacji i procesów krytycznych (skanery ich nie wykrywają) przed pierwszym release'em i po istotnych zmianach. | Raport z testów manualnych wg Playbooka. | Burp Suite, ZAP (manual explore) | ☐ |
| **QA-009** | P1 | **Regression** — każdy naprawiony błąd (zwłaszcza bezpieczeństwa) ma test, który by go wykrył. | Powiązanie issue ↔ test. | — | ☐ |
| **QA-010** | P0 | **Smoke testy** po każdym wdrożeniu na produkcję (automatyczne, nieinwazyjne: strona główna, logowanie kontem testowym, kluczowe API health). | Job po deployu + alert przy porażce. Zob. REL-020. | Playwright, curl | ☐ |
| **QA-011** | P2 | **Visual regression** dla kluczowych widoków i komponentów (szczególnie design system). | Zrzuty porównawcze w CI. | Playwright `toHaveScreenshot`, Chromatic, Percy | ☐ |
| **QA-012** | P1 | **Accessibility testing** — automatycznie (axe) + manualnie (klawiatura, czytnik ekranu). Szczegóły: Część XI. | Raport axe bez naruszeń „serious/critical”; protokół testu manualnego. | axe-core, @axe-core/playwright, Lighthouse, NVDA, VoiceOver | ☐ |
| **QA-013** | P1 | **Cross-browser**: najnowsze Chrome, Firefox, Safari (WebKit), Edge; mobile Safari iOS i Chrome Android — dla krytycznych ścieżek. | Projekty Playwright (chromium/firefox/webkit) + test na fizycznych urządzeniach lub BrowserStack/LambdaTest. | Playwright, BrowserStack | ☐ |
| **QA-014** | P1 | **Responsive**: 320 px, 375 px, 768 px, 1024 px, 1440 px+; orientacja pionowa/pozioma; brak poziomego przewijania przy 320 px (WCAG 1.4.10 Reflow). | Zrzuty/testy viewportów. | Playwright, DevTools device mode | ☐ |
| **QA-015** | P1 | **Testy wydajności** — Część IX (Lighthouse CI, k6). | — | Lighthouse CI, k6, Artillery | ☐ |
| **QA-016** | P1 | **Testy błędów i odporności**: brak sieci, wolna sieć, 500 z API, timeout, pusty stan, bardzo długie dane, znaki specjalne/emoji/RTL. | Scenariusze E2E z mockowaniem (`page.route`) lub DevTools throttling. | Playwright | ☐ |
| **QA-017** | P1 | **Testy formularzy**: wymagane pola, formaty, limity, komunikaty błędów (dostępne), podwójne wysłanie, wysłanie bez JS (jeśli wspierane). | E2E + testy manualne. | Playwright, Testing Library | ☐ |
| **QA-018** | P0 | `CONDITIONAL: płatności` — **testy płatności** w sandboxie: sukces, odmowa, 3-D Secure, anulowanie, timeout, zwrot, podwójny webhook, webhook przed powrotem użytkownika. | Protokół wszystkich scenariuszy (PAY-). | Sandbox operatora, `stripe-cli`, mock webhooków | ☐ |
| **QA-019** | P1 | **Testy logowania**: wszystkie metody (hasło, OAuth, magic link, MFA), błędne dane, blokady, wygaśnięcie sesji, równoległe sesje. | E2E + manual. | Playwright | ☐ |
| **QA-020** | P1 | `CONDITIONAL: upload` — **testy uploadu**: typy dozwolone/zabronione, limity rozmiaru, nazwy specjalne, przerwanie uploadu, upload wielu plików, dostęp do pliku innego użytkownika (FILE-). | E2E + manual. | Playwright, Burp | ☐ |
| **QA-021** | P1 | **Testy bazy danych**: migracje od zera i z poprzedniej wersji, polityki RLS/Rules, ograniczenia integralności, wydajność kluczowych zapytań. | CI z bazą testową. | pgTAP, Supabase test helpers, Firebase Emulator | ☐ |
| **QA-022** | P0 | **Test rollbacku** wdrożenia (INF-024) i **test odtworzenia backupu** (BCK-010). | Protokoły z datą, czasem trwania, wynikiem. | — | ☐ |
| **QA-023** | P2 | Testy stabilne (flaky tests < kilka % i śledzone); testy nie zależą od kolejności ani danych produkcyjnych. | Statystyki CI. | — | ☐ |

## X.2 Narzędzia — kiedy które (nie wszystkie są potrzebne)

| Narzędzie | Kategoria | Kiedy warto | Ograniczenia |
|---|---|---|---|
| **Vitest / Jest** | Unit/integration (JS/TS) | Zawsze dla logiki. Vitest — projekty Vite; Jest — istniejące projekty Jest/RN. | Nie testują przeglądarki realnie (jsdom ≠ przeglądarka). |
| **Testing Library** | Testy komponentów | Komponenty UI, zachowanie z perspektywy użytkownika. | Brak realnego layoutu/CSS. |
| **Playwright** | E2E, API, visual, a11y (z axe) | Krytyczne ścieżki, cross-browser, smoke po wdrożeniu. | Testy E2E są wolniejsze; wymagają stabilnych danych testowych. |
| **Postman / Bruno** | Testy API, kolekcje | Eksploracja i regresja API; Bruno — kolekcje jako pliki w git. | Nie zastępują testów autoryzacji wieloma kontami, jeśli nie są tak napisane. |
| **OWASP ZAP** | DAST (open source) | Baseline scan w CI na stagingu; manualny proxy. | Wykrywa głównie podatności techniczne; słabo — logikę i autoryzację. Active scan jest inwazyjny. |
| **Burp Suite** | Proxy, testy manualne | Testy autoryzacji, logiki, race conditions (Community wystarczy do manual; Pro — skaner). | Wymaga wiedzy; skaner Pro nie zastępuje testera. |
| **Lighthouse** | Wydajność, a11y, SEO, best practices | Każdy release (CI). | Wyniki lab; a11y wykrywa tylko część problemów (szacunkowo ok. 30–40 % kryteriów da się zautomatyzować). |
| **axe** | Dostępność | Testy automatyczne w CI/E2E. | Nie ocenia sensowności alt, kolejności czytania, użyteczności z czytnikiem. |
| **k6 / Artillery** | Obciążenie | Przed premierą/kampanią, po zmianach architektury. | Testy na produkcji tylko za zgodą; wynik zależy od realizmu scenariusza. |
| **npm audit / osv-scanner** | SCA | Zawsze (CI). | Zgłasza też podatności nieosiągalne w kodzie — wymaga triage. |
| **Snyk** | SCA/SAST/kontenery (komercyjny z planem darmowym) | Gdy potrzebny dashboard, PR fixy, monitoring. | Limity planu darmowego; wymaga wysłania manifestów do usługi. |
| **Trivy** | Skan kontenerów, IaC, FS, sekretów, SBOM | Projekty z Dockerem/IaC; generowanie SBOM. | Bazy podatności z opóźnieniem; konfiguracja wyjątków. |
| **Semgrep** | SAST | Zawsze (reguły `p/default`, `p/owasp-top-ten`, `p/secrets`, framework-specific). | Fałszywe pozytywy/negatywy; logika biznesowa poza zasięgiem. |
| **Gitleaks** | Sekrety w git | Zawsze (pre-commit + CI + historia). | Sekrety niestandardowe wymagają własnych reguł. |

---

# CZĘŚĆ XI — Accessibility

**Źródła:** W3C **WCAG 2.2** (Rekomendacja W3C z 5.10.2023; zaktualizowana 12.12.2024) · WAI-ARIA Authoring Practices Guide (APG) · Dyrektywa (UE) 2019/882 — **European Accessibility Act (EAA)**, stosowana od 28.06.2025 · Polska: **ustawa z 26.04.2024 r. o zapewnianiu spełniania wymagań dostępności niektórych produktów i usług przez podmioty gospodarcze** (tzw. Polski Akt o Dostępności, obowiązuje od 28.06.2025) · ustawa z 4.04.2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych · norma EN 301 549 (odwołuje się do WCAG).

## XI.0 Wymagania prawne vs. dobre praktyki

| Sytuacja | Status wymagań WCAG 2.x AA | Uwagi |
|---|---|---|
| Podmiot publiczny (PL) | **Wymóg prawny** (ustawa z 2019 r., EN 301 549 → WCAG 2.1 AA) | Wymagana też deklaracja dostępności. |
| Usługi objęte EAA / Polskim Aktem o Dostępności (m.in. **usługi handlu elektronicznego B2C**, bankowość konsumencka, e-booki, transport — zob. art. ustawy dot. zakresu) | **Wymóg prawny** (wymagania dostępności z ustawy; zharmonizowana norma EN 301 549) | Istnieją wyłączenia, m.in. dla **mikroprzedsiębiorców świadczących usługi** — zakres wyłączeń **zweryfikuj z prawnikiem**; obowiązek informacyjny o dostępności usługi. |
| Pozostałe serwisy komercyjne (B2B, portfolio, SaaS spoza zakresu) | **Dobra praktyka** (zalecany standard techniczny) | Ryzyko reputacyjne i biznesowe; często wymóg w przetargach/umowach. |

> **Uwaga:** Ten dokument nie rozstrzyga, czy dany projekt podlega przepisom. Ustalenie zakresu (rodzaj usługi, wielkość przedsiębiorstwa, wyłączenia „nieproporcjonalne obciążenie”) wymaga weryfikacji prawnej. Technicznie przyjmij **WCAG 2.2 AA** jako cel, bo obejmuje wymagania 2.1.

## XI.1 Checklista WCAG 2.2 AA (pogrupowana)

| ID | P | Wymaganie | Test / oczekiwany wynik | WCAG 2.2 | Status |
|---|---|---|---|---|---|
| **A11Y-001** | P1 | Semantyczny HTML: landmarki (`header`, `nav`, `main`, `footer`), jeden `h1`, logiczna hierarchia nagłówków, listy jako `ul/ol`, tabele danych z `th`/`scope`, przyciski jako `<button>`, linki jako `<a href>`. | axe + przegląd struktury (rozszerzenie HeadingsMap / czytnik ekranu — nawigacja nagłówkami). | 1.3.1, 2.4.6, 4.1.2 | ☐ |
| **A11Y-002** | P0 | Pełna obsługa klawiaturą: każdy element interaktywny osiągalny Tab/Shift+Tab, aktywowany Enter/Spacją, brak pułapek klawiatury, logiczna kolejność. | Przejdź wszystkie krytyczne ścieżki (logowanie, formularz, zakup) **bez myszy**. | 2.1.1, 2.1.2, 2.4.3 | ☐ |
| **A11Y-003** | P1 | Widoczny fokus o wystarczającym kontraście; fokus nie jest zasłonięty przez sticky header/banery/czat (**nowe w 2.2**). | Tabowanie — fokus zawsze widoczny i niezasłonięty. | 2.4.7, **2.4.11** (AA) | ☐ |
| **A11Y-004** | P1 | Zarządzanie fokusem: otwarcie modala przenosi fokus do środka i zatrzymuje go w nim; zamknięcie przywraca fokus do elementu wywołującego; zmiana trasy SPA przenosi fokus/ogłasza nowy widok. | Test klawiaturą + czytnikiem. | 2.4.3, 3.2.1 | ☐ |
| **A11Y-005** | P1 | Kontrast: tekst ≥ 4,5:1 (duży ≥ 3:1); komponenty UI i grafiki informacyjne ≥ 3:1 (obramowania pól, ikony, stany). W obu motywach (jasny/ciemny). | axe/Lighthouse + narzędzie kontrastu (np. WebAIM, DevTools) dla stanów hover/focus/disabled/placeholder. | 1.4.3, 1.4.11 | ☐ |
| **A11Y-006** | P1 | Tekst alternatywny: obrazy informacyjne z sensownym `alt`, dekoracyjne `alt=""`; ikony-przyciski z dostępną nazwą (`aria-label`); wykresy z opisem/tabelą danych. | Przegląd + czytnik ekranu. | 1.1.1 | ☐ |
| **A11Y-007** | P0 | Formularze: każde pole ma widoczną etykietę powiązaną programowo (`label for`/`aria-labelledby`), instrukcje i format; błędy walidacji opisane tekstem (nie tylko kolorem), powiązane z polem (`aria-describedby`, `aria-invalid`), z sugestią poprawy; fokus/ogłoszenie przy błędzie. | Wyślij pusty/błędny formularz z czytnikiem ekranu → błędy ogłoszone i zrozumiałe. | 1.3.1, 3.3.1, 3.3.2, 3.3.3, 4.1.2 | ☐ |
| **A11Y-008** | P1 | `autocomplete` dla pól danych osobowych (name, email, tel, address…). | Inspekcja HTML. | 1.3.5 | ☐ |
| **A11Y-009** | P1 | **Nowe w 2.2:** nie wymagaj ponownego wpisywania tych samych informacji w jednym procesie (Redundant Entry) — autouzupełnij lub pozwól wybrać. | Przejdź proces wieloetapowy (np. checkout: adres dostawy = rozliczeniowy). | **3.3.7** (A) | ☐ |
| **A11Y-010** | P1 | **Nowe w 2.2:** uwierzytelnianie bez testu funkcji poznawczych (zapamiętywanie, przepisywanie, łamigłówki) — dozwolone: wklejanie haseł, menedżery haseł, passkeys, link e-mail; CAPTCHA z alternatywą. | Wklej hasło/kod OTP → działa; CAPTCHA ma alternatywę. | **3.3.8** (AA) | ☐ |
| **A11Y-011** | P1 | **Nowe w 2.2:** cele dotykowe/klikalne ≥ 24×24 CSS px (lub odpowiedni odstęp); zalecane 44×44 dla mobile (dobra praktyka). | Inspekcja rozmiarów małych ikon/przycisków. | **2.5.8** (AA) | ☐ |
| **A11Y-012** | P1 | **Nowe w 2.2:** funkcje wymagające przeciągania (drag & drop, slidery) mają alternatywę jednym wskaźnikiem (kliknięcia/przyciski). | Wykonaj każdą operację drag bez przeciągania. | **2.5.7** (AA) | ☐ |
| **A11Y-013** | P2 | **Nowe w 2.2:** spójne położenie pomocy (kontakt, czat, FAQ) na wszystkich stronach. | Przegląd. | **3.2.6** (A) | ☐ |
| **A11Y-014** | P1 | ARIA: tylko gdy natywny HTML nie wystarcza; poprawne role, stany (`aria-expanded`, `aria-selected`, `aria-current`), właściwości; brak ARIA sprzecznej z semantyką. Wzorce wg APG. | axe + przegląd komponentów vs. APG. | 4.1.2 | ☐ |
| **A11Y-015** | P1 | Komponenty interaktywne (menu, zakładki, accordion, combobox, datepicker, karuzela, toast) zgodne z wzorcami APG (obsługa klawiatury, role, stany). | Test każdego komponentu klawiaturą + czytnikiem. | 2.1.1, 4.1.2 | ☐ |
| **A11Y-016** | P1 | Komunikaty dynamiczne (toasty, wyniki wyszukiwania, statusy zapisu, błędy) ogłaszane przez `role="status"`/`aria-live="polite"` (lub `alert` dla krytycznych) bez przenoszenia fokusu. | Czytnik ekranu ogłasza komunikat. | 4.1.3 | ☐ |
| **A11Y-017** | P1 | Responsywność i zoom: zoom 200 % bez utraty treści/funkcji; reflow przy 320 px szerokości bez przewijania w dwóch osiach; brak blokady zoomu (`user-scalable=no`, `maximum-scale=1` → FAIL); text spacing nie łamie układu. | Zoom 200 %/400 %; viewport 320 px; bookmarklet text spacing. | 1.4.4, 1.4.10, 1.4.12 | ☐ |
| **A11Y-018** | P2 | Reduced motion: animacje niebędące niezbędne wyłączane przy `prefers-reduced-motion: reduce`; brak treści migających > 3×/s; automatycznie przesuwane treści (karuzele) z pauzą. | Włącz „ogranicz ruch” w systemie → animacje ograniczone. | 2.2.2, 2.3.1, 2.3.3 (AAA — dobra praktyka) | ☐ |
| **A11Y-019** | P1 | Czytniki ekranu: krytyczne ścieżki przechodzą z NVDA+Firefox/Chrome (Windows) i VoiceOver+Safari (macOS/iOS); TalkBack (Android) dla aplikacji mobilnych/PWA. | Protokół testu manualnego. | całość | ☐ |
| **A11Y-020** | P2 | Język strony (`<html lang="pl">`) i fragmentów w innym języku (`lang` na elemencie); tytuły stron unikalne i opisowe; link „przejdź do treści”. | Inspekcja. | 3.1.1, 3.1.2, 2.4.2, 2.4.1 | ☐ |
| **A11Y-021** | P2 | Multimedia: napisy dla wideo z dźwiękiem, transkrypcje audio, brak autoodtwarzania dźwięku > 3 s bez kontroli. | Przegląd mediów. | 1.2.x, 1.4.2 | ☐ |
| **A11Y-022** | P2 | Limity czasu (sesja, formularz) — ostrzeżenie i możliwość przedłużenia; dane formularza nie giną po wygaśnięciu sesji (dobra praktyka). | Test wygasania sesji podczas wypełniania formularza. | 2.2.1 | ☐ |
| **A11Y-023** | P1 | `CONDITIONAL: usługa objęta przepisami` — informacja o dostępności usługi / deklaracja dostępności opublikowana zgodnie z wymaganiami (treść potwierdzona przez prawnika). | Strona z informacją istnieje i jest aktualna. | EAA / PL ustawa | ☐ |

---

# CZĘŚĆ XII — SEO & Technical SEO

`CONDITIONAL: strony publiczne, które mają być indeksowane. Aplikacje wyłącznie za logowaniem — sprawdź tylko SEO-001, SEO-002, SEO-005, SEO-030 (blokada indeksacji obszarów prywatnych i stagingu).`

**Źródła:** Google Search Central (dokumentacja indeksowania, robots, sitemap, canonical, JavaScript SEO, structured data) · schema.org · Open Graph protocol · RFC 9309 (Robots Exclusion Protocol) · sitemaps.org · Bing Webmaster Guidelines.

## XII.1 Indeksowanie i crawlability

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEO-001** | P0 | Produkcja **nie** ma przypadkowego `noindex` (meta lub `X-Robots-Tag`) ani `Disallow: /` w robots.txt (częsty błąd po przeniesieniu ze stagingu). | `curl -s https://host/robots.txt`; `curl -sI https://host \| grep -i x-robots`; `<meta name="robots">` w HTML. | Google Search Central | ☐ |
| **SEO-002** | P1 | Staging, preview deployments i obszary prywatne **są** wyłączone z indeksu (`X-Robots-Tag: noindex` + auth) — robots.txt nie jest mechanizmem ochrony danych. | `curl -sI https://staging…` → `noindex`; strona wymaga logowania. | Google Search Central | ☐ |
| **SEO-003** | P1 | `robots.txt` poprawny składniowo, nie blokuje zasobów potrzebnych do renderowania (JS/CSS), wskazuje sitemapę. | Search Console → robots.txt report. | RFC 9309 | ☐ |
| **SEO-004** | P1 | `sitemap.xml` (lub indeks sitemap): tylko kanoniczne, indeksowalne URL-e z kodem 200; `lastmod` prawdziwy; ≤ 50 000 URL / 50 MB na plik; zgłoszona w Search Console i Bing Webmaster Tools. | Walidacja XML; próbka URL-i → 200 i self-canonical. | sitemaps.org; Google | ☐ |
| **SEO-005** | P1 | Dyrektywy `noindex`/`nofollow` użyte świadomie (np. wyniki wyszukiwania wewnętrznego, koszyk, konto, strony filtrów bez wartości); brak `noindex` na stronach z canonical do innych. | Crawl (Screaming Frog / Sitebulb / `npx unlighthouse`) → raport dyrektyw. | Google | ☐ |
| **SEO-006** | P1 | Renderowanie JavaScript: kluczowa treść i linki obecne w HTML (SSR/SSG) lub poprawnie renderowane przez Google; linki jako `<a href>`, nie `onclick`. | Search Console → URL Inspection → „View crawled page”; `curl -s https://host/strona \| grep "<h1"`. | Google JavaScript SEO basics | ☐ |
| **SEO-007** | P2 | Linkowanie wewnętrzne: każda indeksowana strona osiągalna linkami (nie tylko sitemapą), brak stron osieroconych, breadcrumbs dla hierarchii. | Crawl → orphan pages = 0 (dla stron ważnych). | Google | ☐ |
| **SEO-008** | P2 | `CONDITIONAL: SPA z hash routingiem` — URL-e bez `#` dla treści indeksowanych (History API). | Inspekcja routingu. | Google | ☐ |

## XII.2 Metadane i social preview

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEO-010** | P1 | Unikalny, opisowy `<title>` (orientacyjnie do ~60 znaków) i `meta description` (orientacyjnie ~150–160 znaków) na każdej indeksowanej stronie. | Crawl → brak duplikatów i braków. | Google | ☐ |
| **SEO-011** | P1 | `rel="canonical"` (absolutny URL) na każdej stronie; spójny z sitemapą, przekierowaniami i `hreflang`; parametry śledzące/sortowanie kanonizowane. | Crawl; `curl -s url \| grep canonical`. | Google canonicalization | ☐ |
| **SEO-012** | P2 | Open Graph (`og:title`, `og:description`, `og:image` 1200×630, `og:url`, `og:type`) i Twitter/X Cards (`twitter:card="summary_large_image"`). | Debuggery: Facebook Sharing Debugger, LinkedIn Post Inspector, podgląd X. | ogp.me | ☐ |
| **SEO-013** | P2 | Favicon (`.ico` + SVG/PNG), `apple-touch-icon`, manifest (dla PWA); istnieją pod wskazanymi ścieżkami (brak 404). | `curl -sI` każdej ikony → 200. | Google favicon guidelines | ☐ |
| **SEO-014** | P2 | Dane strukturalne JSON-LD (schema.org) adekwatne do treści: `Organization`, `WebSite`, `BreadcrumbList`, `Product`/`Offer`, `Article`, `LocalBusiness`, `FAQPage` (pamiętaj o ograniczeniach wyświetlania przez Google) — zgodne z widoczną treścią. | Rich Results Test + Schema Markup Validator → brak błędów. | Google structured data; schema.org | ☐ |
| **SEO-015** | P2 | `CONDITIONAL: wiele języków/regionów` — `hreflang` dwukierunkowe, z `x-default`, zgodne z canonical. | Crawl hreflang. | Google localized versions | ☐ |
| **SEO-016** | P2 | Obrazy: opisowe nazwy plików i `alt`, wymiary, nowoczesne formaty, `image` w sitemapie (opcjonalnie). | Crawl + Lighthouse. | Google image SEO | ☐ |

## XII.3 Statusy HTTP, przekierowania, duplikaty

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEO-020** | P1 | Nieistniejące strony zwracają **404** (prawdziwy status, nie „soft 404” z 200); trwale usunięte — 404 lub **410**; własna strona 404 z nawigacją. | `curl -s -o /dev/null -w "%{http_code}" https://host/nie-istnieje-xyz` → 404. Uwaga SPA: fallback `index.html` zwraca 200 dla wszystkiego → wymaga rozwiązania (SSR/prerender lub `noindex` na stronie 404). | Google | ☐ |
| **SEO-021** | P1 | Przekierowania trwałe `301/308`, tymczasowe `302/307` świadomie; brak łańcuchów (> 1 skok) i pętli; stare URL-e po migracji przekierowane 1:1. | Crawl → raport przekierowań. | Google redirects | ☐ |
| **SEO-022** | P1 | Jedna wersja hosta i protokołu (https + www **albo** bez www), trailing slash konsekwentny — reszta 301 na wersję kanoniczną. | `curl -sI http://domena`, `https://www.domena`, z/bez `/` → jedna docelowa. | Google | ☐ |
| **SEO-023** | P2 | Duplicate content kontrolowany: parametry, sortowania, wersje do druku, paginacja — canonical / noindex / blokada w parametrach. | Crawl → raport duplikatów tytułów/treści. | Google | ☐ |
| **SEO-024** | P2 | Paginacja: każda strona indeksowalna z własnym canonical (nie canonical na stronę 1), linki `<a>` do kolejnych stron (Google nie używa `rel=next/prev`). | Inspekcja. | Google pagination best practices | ☐ |

## XII.4 Wydajność i narzędzia

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SEO-030** | P1 | Search Console (weryfikacja domeny przez DNS) i Bing Webmaster Tools skonfigurowane; sitemap zgłoszona; monitoring raportów indeksowania i bezpieczeństwa. | Dostęp i właściciele potwierdzeni. | Google, Bing | ☐ |
| **SEO-031** | P2 | Core Web Vitals — Część IX (sygnał page experience). | — | Google page experience | ☐ |
| **SEO-032** | P2 | Mobile-friendly (viewport, czytelność, cele dotykowe) — Google indeksuje wersję mobilną (mobile-first indexing). | Lighthouse mobile; treść mobile = desktop. | Google mobile-first indexing | ☐ |

---

# CZĘŚĆ XIII — Privacy, GDPR & Legal Compliance

**Źródła:** Rozporządzenie (UE) 2016/679 (**RODO / GDPR**) · Dyrektywa 2002/58/WE (**ePrivacy**) · Polska: **ustawa z 12.07.2024 r. — Prawo komunikacji elektronicznej (PKE)**, art. 399–400 (cookies i dostęp do urządzenia końcowego; obowiązuje od 10.11.2024, zastąpił art. 173 Prawa telekomunikacyjnego) · ustawa z 18.07.2002 r. o świadczeniu usług drogą elektroniczną · ustawa z 10.05.2018 r. o ochronie danych osobowych · wytyczne EROD/EDPB (m.in. 05/2020 w sprawie zgody, 03/2022 w sprawie dark patterns) · komunikaty i decyzje Prezesa UODO.

> ⚖️ **Nie jest to porada prawna.** Punkty oznaczone **[PRAWNIK/IOD]** wymagają potwierdzenia przez prawnika lub inspektora ochrony danych. Checklista weryfikuje **techniczne wdrożenie** obowiązków, nie ich treść prawną.

## XIII.1 Podstawy, informacja, dokumentacja

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PRIV-001** | P0 | Inwentarz danych osobowych: jakie dane, w jakim celu, na jakiej podstawie (art. 6, a dla danych szczególnych art. 9), gdzie przechowywane (systemy, dostawcy, kraje), jak długo. Obejmuje też logi (IP), analitykę, backupy, e-maile. **[PRAWNIK/IOD]** | Tabela przepływu danych zgodna z ARC-001 i listą dostawców. | RODO art. 5, 6, 9, 30 | ☐ |
| **PRIV-002** | P0 | Polityka prywatności (obowiązek informacyjny art. 13/14) dostępna z każdej strony i w miejscu zbierania danych; zawiera: administratora i kontakt (oraz IOD, jeśli powołany), cele i podstawy, odbiorców/kategorie odbiorców, transfery poza EOG, okresy przechowywania, prawa, prawo skargi do Prezesa UODO, informację o profilowaniu (jeśli jest), źródło danych (art. 14). Treść **zgodna z faktycznym działaniem systemu**. **[PRAWNIK/IOD]** | Porównanie treści polityki z PRIV-001 i z faktycznymi skryptami/dostawcami (FE-006). | RODO art. 12–14 | ☐ |
| **PRIV-003** | P1 | Rejestr czynności przetwarzania (art. 30) — prowadzony, jeżeli organizacja nie korzysta ze zwolnienia (zwolnienie dla < 250 pracowników **nie** ma zastosowania m.in. gdy przetwarzanie nie jest sporadyczne — w praktyce większość serwisów z kontami użytkowników prowadzi rejestr). **[PRAWNIK/IOD]** | Rejestr istnieje i obejmuje przetwarzanie w projekcie. | RODO art. 30 ust. 5 | ☐ |
| **PRIV-004** | P1 | DPIA (ocena skutków) przeprowadzona, gdy wymagana: m.in. przetwarzanie na dużą skalę danych szczególnych, systematyczne monitorowanie, profilowanie z istotnymi skutkami; sprawdź **wykaz rodzajów operacji wymagających DPIA** ogłoszony przez Prezesa UODO. **[PRAWNIK/IOD]** | Decyzja „DPIA tak/nie” udokumentowana z uzasadnieniem. | RODO art. 35 | ☐ |
| **PRIV-005** | P1 | Privacy by design & by default: zbieranie minimum danych (pola formularzy uzasadnione), domyślnie najbardziej prywatne ustawienia (profil niepubliczny, brak zgód marketingowych zaznaczonych domyślnie), pseudonimizacja tam, gdzie możliwe. | Przegląd formularzy i ustawień domyślnych; brak pól „na zapas”. | RODO art. 25 | ☐ |
| **PRIV-006** | P1 | Zgody (gdy podstawą jest zgoda): dobrowolne, konkretne, świadome, jednoznaczne — **osobne checkboxy niezaznaczone domyślnie** dla osobnych celów; zgoda nie jest warunkiem usługi, gdy nie jest do niej niezbędna; zapis dowodu zgody (kto, kiedy, jaka treść/wersja, jak); wycofanie równie łatwe jak wyrażenie. | Formularze: brak pre-checked; w bazie zapis zgody z wersją treści; wycofanie dostępne w ustawieniach konta/linkiem. | RODO art. 4(11), 7; EDPB 05/2020 | ☐ |

## XIII.2 Cookies, tracking, consent management

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PRIV-020** | P0 | **Brak cookies i technologii śledzących niebędących niezbędnymi przed zgodą** (analityka, marketing, piksele, fingerprinting, `localStorage` w celach śledzących). Niezbędne (sesja, koszyk, bezpieczeństwo, zapamiętanie wyboru zgody) — bez zgody, ale z informacją. | Wejdź w trybie incognito, **nie klikaj banera**: DevTools → Application → Cookies/Storage oraz Network → brak żądań do Google Analytics/`googletagmanager.com/collect`, Meta Pixel (`facebook.com/tr`), Hotjar, TikTok itd. | PKE art. 399; ePrivacy art. 5(3); RODO | ☐ |
| **PRIV-021** | P0 | Baner/CMP: przycisk „Odrzuć” (lub „Tylko niezbędne”) **na pierwszej warstwie**, równie widoczny jak „Akceptuj”; brak dark patterns (kolory, ukryte opcje, zgoda przez scroll/dalsze korzystanie); granularne kategorie; zgoda zapisywana z wersją i datą; możliwość zmiany decyzji w każdej chwili (link „Ustawienia cookies” w stopce). **[PRAWNIK/IOD]** | Test UX banera; po „Odrzuć” — PRIV-020 nadal spełnione; po zmianie decyzji skrypty wyłączają się (i cookies są usuwane, gdzie technicznie możliwe). | PKE art. 399–400; EDPB 03/2022; decyzje UODO | ☐ |
| **PRIV-022** | P1 | `CONDITIONAL: Google Analytics / Google Ads / GTM` — Google Consent Mode v2 skonfigurowany zgodnie z decyzją użytkownika (domyślnie `denied` dla `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`); świadomość, że w trybie „advanced” Google wysyła pingi bez cookies — oceń to z IOD; anonimizacja/ograniczenie danych; okres retencji ustawiony. **[PRAWNIK/IOD]** | Tag Assistant / Network → parametry `gcs`/`gcd` odpowiadają stanowi zgody. | Google Consent Mode docs; RODO | ☐ |
| **PRIV-023** | P1 | `CONDITIONAL: Meta Pixel / TikTok / LinkedIn Insight / inne piksele marketingowe` — ładowane wyłącznie po zgodzie marketingowej; Conversions API (server-side) również respektuje zgodę; brak wysyłania danych osobowych w niezahashowanej postaci; ujęcie w polityce prywatności i w zakresie współadministrowania (wyrok TSUE C-40/17 Fashion ID). **[PRAWNIK/IOD]** | Test sieci przed/po zgodzie; przegląd parametrów zdarzeń. | RODO art. 26; PKE | ☐ |
| **PRIV-024** | P2 | Polityka cookies (osobna lub sekcja polityki prywatności): lista cookies/technologii, dostawca, cel, czas życia, kategoria — zgodna z faktycznym stanem (skan). | Skan cookies (np. narzędzie CMP lub ręcznie) vs. lista w polityce. | PKE; RODO art. 13 | ☐ |
| **PRIV-025** | P2 | Rozważono alternatywy minimalizujące dane: analityka bez cookies / self-hosted (Matomo, Plausible, Umami) — nadal wymaga oceny podstawy prawnej i informacji. **[PRAWNIK/IOD]** | Decyzja udokumentowana. | RODO art. 25 | ☐ |

## XIII.3 Powierzenie i transfery

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PRIV-040** | P0 | Umowy powierzenia (DPA, art. 28) z każdym podmiotem przetwarzającym dane w imieniu administratora: hosting, baza/BaaS, e-mail, analityka, CRM, helpdesk, monitoring błędów (Sentry), płatności (o ile działa jako procesor), dostawcy AI. Zwykle akceptowane w panelu dostawcy — **zapisz dowód akceptacji**. **[PRAWNIK/IOD]** | Lista dostawców z linkiem/datą DPA. | RODO art. 28 | ☐ |
| **PRIV-041** | P1 | Transfery poza EOG: zidentyfikowane; podstawa transferu (decyzja stwierdzająca odpowiedni stopień ochrony — np. EU-US Data Privacy Framework dla certyfikowanych podmiotów, standardowe klauzule umowne SCC + ocena skutków transferu) udokumentowana; region przechowywania danych wybrany świadomie (np. region UE w Supabase/Firebase/Vercel). Stan DPF może się zmienić — **zweryfikuj aktualność**. **[PRAWNIK/IOD]** | Lista dostawców z lokalizacją danych i podstawą transferu. | RODO rozdz. V (art. 44–49) | ☐ |

## XIII.4 Prawa osób, retencja, usuwanie

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PRIV-050** | P1 | Procedura obsługi żądań (dostęp — art. 15, sprostowanie — 16, usunięcie — 17, ograniczenie — 18, przenoszenie — 20, sprzeciw — 21): kanał kontaktu, weryfikacja tożsamości wnioskodawcy, termin (co do zasady miesiąc), rejestr żądań. | Przeprowadź test: żądanie kopii danych dla konta testowego → odpowiedź kompletna (wszystkie systemy, w tym dostawcy) w terminie. | RODO art. 12, 15–22 | ☐ |
| **PRIV-051** | P1 | Eksport danych użytkownika (dostęp/przenoszenie) w formacie ustrukturyzowanym (JSON/CSV) — samoobsługowy lub w procedurze. | Wygeneruj eksport → zawiera dane z wszystkich modułów. | RODO art. 15, 20 | ☐ |
| **PRIV-052** | P1 | Usunięcie konta: samoobsługowe lub w procedurze; usuwa/anonimizuje dane we wszystkich tabelach, storage, systemach zewnętrznych (newsletter, CRM, analityka z user ID), z wyjątkiem danych, które trzeba zachować z mocy prawa (np. dokumenty księgowe) — z informacją dla użytkownika. Zob. DB-011. | Test usunięcia konta + weryfikacja w bazie i u dostawców. | RODO art. 17 | ☐ |
| **PRIV-053** | P1 | Retencja: każda kategoria danych ma okres przechowywania i mechanizm usunięcia (logi, nieaktywne konta, zamówienia, zgłoszenia, backupy — z uwzględnieniem cyklu rotacji kopii). | Dokument retencji + zadania automatyczne. | RODO art. 5(1)(e) | ☐ |
| **PRIV-054** | P2 | Sprzeciw / rezygnacja z marketingu działa natychmiast (link „wypisz się” w każdym e-mailu marketingowym; jedno kliknięcie). | Test wypisania. | RODO art. 21; PKE (marketing bezpośredni) | ☐ |

## XIII.5 Naruszenia ochrony danych

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PRIV-060** | P0 | Procedura naruszeń: wykrycie → ocena ryzyka → **zgłoszenie do Prezesa UODO w ciągu 72 h** od stwierdzenia (jeśli naruszenie powoduje ryzyko) → zawiadomienie osób (gdy wysokie ryzyko) → rejestr wszystkich naruszeń (także niezgłoszonych). Właściciel procesu i kontakt do IOD/prawnika znani. Zob. [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md). **[PRAWNIK/IOD]** | Plan istnieje, zawiera szablony zgłoszeń, przećwiczony (tabletop). | RODO art. 33, 34 | ☐ |
| **PRIV-061** | P1 | Umowy z procesorami zobowiązują ich do niezwłocznego powiadamiania o naruszeniach. | Przegląd DPA. | RODO art. 28(3)(f), 33(2) | ☐ |

## XIII.6 Formularze, newsletter, konta, regulamin, dane sprzedawcy

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PRIV-070** | P1 | Formularz kontaktowy: klauzula informacyjna (skrót + link do polityki), minimum pól, ochrona antyspamowa (honeypot/Turnstile), dane przechowywane zgodnie z retencją, wysyłka przez bezpieczny kanał. | Przegląd formularza i miejsca przechowywania zgłoszeń. | RODO art. 13 | ☐ |
| **PRIV-071** | P1 | `CONDITIONAL: newsletter` — double opt-in (potwierdzenie e-maila), zgoda na komunikację marketingową drogą elektroniczną odrębna od innych zgód, zapis dowodu zgody, łatwe wypisanie. **[PRAWNIK/IOD]** | Test zapisu i wypisu; rekord zgody u dostawcy. | PKE (art. 398 i nast. — zweryfikuj); RODO | ☐ |
| **PRIV-072** | P0 | `CONDITIONAL: świadczenie usług drogą elektroniczną (konta, SaaS, sklep)` — **regulamin** dostępny nieodpłatnie przed zawarciem umowy, w formie umożliwiającej pobranie/utrwalenie; akceptacja przy rejestracji/zamówieniu zapisana z wersją. Zawartość wg ustawy o świadczeniu usług drogą elektroniczną (art. 8) i — dla konsumentów — przepisów konsumenckich. **[PRAWNIK]** | Link w stopce i w formularzu rejestracji/zamówienia; wersjonowanie regulaminu. | UŚUDE art. 8; ustawa o prawach konsumenta | ☐ |
| **PRIV-073** | P0 | Dane identyfikujące usługodawcę/sprzedawcę łatwo dostępne: firma/imię i nazwisko, adres, NIP/KRS/CEIDG (jeśli dotyczy), adres e-mail, (dla sklepów — numer telefonu wg ustawy o prawach konsumenta). **[PRAWNIK]** | Strona „Kontakt”/„O nas”/stopka. | UŚUDE art. 5; ustawa o prawach konsumenta art. 12 | ☐ |
| **PRIV-074** | P2 | `CONDITIONAL: platforma z treściami użytkowników / marketplace` — oceniono obowiązki z Digital Services Act (Rozp. 2022/2065): punkt kontaktowy, mechanizm zgłaszania nielegalnych treści, przejrzystość moderacji, dodatkowe obowiązki dla platform/marketplace'ów (KYBC). **[PRAWNIK]** | Analiza prawna udokumentowana. | DSA | ☐ |
| **PRIV-075** | P2 | `CONDITIONAL: funkcje AI przetwarzające dane użytkowników` — informacja o użyciu AI, ocena dostawcy (DPA, brak trenowania na danych klienta), obowiązki przejrzystości z AI Act (Rozp. 2024/1689) w zakresie, w jakim mają zastosowanie (np. oznaczanie treści generowanych / interakcji z AI) — harmonogram stosowania etapowy, **zweryfikuj**. **[PRAWNIK]** | Analiza udokumentowana. | AI Act; RODO | ☐ |

---

# CZĘŚĆ XIV — E-commerce & Payments

`CONDITIONAL: projekt przyjmuje płatności lub sprzedaje produkty/usługi online.`

**Źródła:** **PCI DSS v4.0.1** (PCI SSC, czerwiec 2024; wymagania „future-dated” obowiązują od 31.03.2025) i właściwy **SAQ** · dokumentacja operatora płatności (Stripe, PayU, Przelewy24, Tpay, Adyen, PayPal) · Dyrektywa PSD2 / SCA (3-D Secure) · ustawa z 30.05.2014 r. o prawach konsumenta · Kodeks cywilny (rękojmia) · ustawa z 9.05.2014 r. o informowaniu o cenach towarów i usług (tzw. Omnibus — informacja o najniższej cenie z 30 dni przed obniżką) · przepisy VAT (w tym OSS, KSeF) · Rozp. (UE) 2023/988 (GPSR) · Dyrektywa (UE) 2023/2673 (funkcja odstąpienia od umowy w interfejsie online — stosowanie od 19.06.2026; **zweryfikuj implementację w prawie PL**).

> **PCI DSS — zasada nadrzędna:** nie dotykaj danych kart. Używaj **hostowanej strony płatności / przekierowania / iframe / elementów operatora**, aby dane karty nigdy nie przechodziły przez Twoje serwery. To zwykle kwalifikuje do najprostszego kwestionariusza (np. SAQ A), ale **kwalifikację potwierdza operator/acquirer lub QSA**. Wymagania dotyczące skryptów na stronie płatności (6.4.3, 11.6.1) i kryteria kwalifikacji SAQ A zostały zmienione przez PCI SSC w 2025 r. — **zweryfikuj aktualny SAQ**.

## XIV.1 Płatności

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PAY-001** | P0 | Dane kart (PAN, CVV) **nigdy** nie trafiają do aplikacji, logów, bazy, analityki — płatność przez komponenty/stronę operatora. | Przegląd przepływu; Network podczas płatności → dane karty wysyłane tylko do domeny operatora; `grep` logów po wzorcach PAN → 0. | PCI DSS 4.0.1 req. 3, 4 | ☐ |
| **PAY-002** | P0 | Kwota, waluta, produkty i rabaty liczone **na serwerze** z danych w bazie; klient przesyła tylko identyfikatory i ilości. Manipulacja ceną w żądaniu nie zmienia kwoty u operatora. | Zmień `price`/`amount`/`currency` w żądaniu utworzenia płatności (Burp) → kwota u operatora = kwota z serwera. | SEC-026; ASVS V2 | ☐ |
| **PAY-003** | P0 | Status zamówienia zmienia się na „opłacone” **wyłącznie** na podstawie zweryfikowanego webhooka (API-040/041) lub zapytania server-to-server do operatora — **nie** na podstawie przekierowania użytkownika na `/success`. | Wejdź bezpośrednio na `/payment/success?order=123` bez płatności → zamówienie nieopłacone. | Dokumentacja operatora | ☐ |
| **PAY-004** | P0 | Weryfikacja zgodności: kwota i waluta z webhooka = kwota zamówienia; ID transakcji przypisane do jednego zamówienia; ponowne webhooki idempotentne (API-041/042). | Test z podmienioną kwotą w sandboxie (jeśli możliwe) / przegląd kodu. | — | ☐ |
| **PAY-005** | P1 | Idempotencja tworzenia płatności i zamówienia (API-050) — podwójne kliknięcie „Zapłać” nie tworzy dwóch obciążeń. | Podwójne/równoległe wysłanie → jedna płatność. | — | ☐ |
| **PAY-006** | P1 | Obsługa wszystkich stanów: oczekująca, udana, odrzucona, anulowana, wygasła, częściowo zwrócona, zwrócona, chargeback/dispute; zamówienia porzucone zwalniają rezerwacje magazynu po czasie. | QA-018 — protokół scenariuszy w sandboxie. | — | ☐ |
| **PAY-007** | P1 | Klucze operatora: testowe tylko w dev/staging, produkcyjne tylko w produkcji (ARC-023); klucze o minimalnych uprawnieniach (restricted keys, jeśli dostępne); sekret webhooka per środowisko. | Przegląd konfiguracji. | — | ☐ |
| **PAY-008** | P1 | `CONDITIONAL: SAQ A / strona płatności z elementami operatora` — inwentarz skryptów na stronach płatności, ich autoryzacja i ochrona integralności (CSP, SRI) oraz wykrywanie nieautoryzowanych zmian — w zakresie wymaganym przez właściwy SAQ (zob. uwaga powyżej). | Lista skryptów strony checkout + mechanizm wykrywania zmian; potwierdzenie wymagań SAQ. | PCI DSS 4.0.1 6.4.3, 11.6.1 (zweryfikuj zastosowanie) | ☐ |
| **PAY-009** | P1 | Coroczny kwestionariusz SAQ / walidacja PCI DSS zgodnie z wymaganiami acquirera — złożony. **[QSA/operator]** | Dokument SAQ + AOC. | PCI DSS | ☐ |
| **PAY-010** | P1 | Testy sandbox kompletne przed przełączeniem na live; pierwsza realna transakcja niskokwotowa + zwrot (smoke live) po wdrożeniu. | Protokół. | — | ☐ |

## XIV.2 Koszyk, zamówienia, rabaty

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **ECOM-001** | P0 | Koszyk/zamówienie odporne na: ujemne ilości, ilości ułamkowe (dla produktów sztukowych), ogromne ilości, produkty niedostępne/ukryte, zmianę ceny między dodaniem a zapłatą (cena potwierdzana przed płatnością), produkty z innego sklepu/tenanta. | SEC-026 dla koszyka. | WSTG-BUSL | ☐ |
| **ECOM-002** | P0 | Kody rabatowe: walidacja po stronie serwera (ważność, limit użyć globalny i per klient, minimalna wartość, wykluczenia), atomowe zużycie (SEC-027), brak kumulacji niezgodnej z regułami, brak enumeracji kodów (rate limit). | Użycie kodu 2× równolegle, na dwóch kontach, po wygaśnięciu, łączenie kodów → zgodnie z regułami. | — | ☐ |
| **ECOM-003** | P1 | Stany magazynowe rezerwowane atomowo; brak sprzedaży powyżej stanu przy równoległych zakupach. | Race test na ostatniej sztuce. | SEC-027 | ☐ |
| **ECOM-004** | P1 | Dostęp do zamówień i danych klientów tylko dla właściciela i uprawnionych ról (SEC-003); linki do zamówień dla gości — z losowym tokenem, nie sekwencyjnym numerem. | IDOR test na zamówieniach, fakturach, etykietach wysyłkowych. | SEC-003 | ☐ |
| **ECOM-005** | P1 | Panel sklepu (admin): MFA, role (obsługa zamówień ≠ zmiana cen ≠ eksport klientów), audit log (ADM-). | ADM-. | — | ☐ |

## XIV.3 Zgodność procesu zakupowego (PL/UE) — **[PRAWNIK]**

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **ECOM-010** | P0 | Przed złożeniem zamówienia konsument otrzymuje wymagane informacje (cechy produktu, cena łączna z podatkami, koszty dostawy, sposób płatności, termin dostawy, prawo odstąpienia i jego wyjątki, dane sprzedawcy, rękojmia). | Przejdź checkout i porównaj z listą wymagań. | Ustawa o prawach konsumenta art. 12 | ☐ |
| **ECOM-011** | P0 | Przycisk składania zamówienia jednoznacznie wskazuje obowiązek zapłaty (np. „Zamawiam i płacę” / „Zamówienie z obowiązkiem zapłaty”). | Inspekcja przycisku. | Ustawa o prawach konsumenta art. 17 | ☐ |
| **ECOM-012** | P0 | Potwierdzenie zawarcia umowy na trwałym nośniku (e-mail z treścią zamówienia, regulaminem lub linkiem do jego wersji, informacją o odstąpieniu i wzorem formularza odstąpienia). | Złóż zamówienie testowe → e-mail kompletny. | Ustawa o prawach konsumenta art. 21 | ☐ |
| **ECOM-013** | P1 | Prawo odstąpienia (co do zasady 14 dni) obsłużone procesowo; formularz odstąpienia; zwrot płatności w terminie. Od **19.06.2026** — wymóg łatwo dostępnej **funkcji odstąpienia** w interfejsie online (Dyrektywa 2023/2673) — **zweryfikuj przepisy krajowe i termin**. | Proces zwrotu przetestowany; przycisk/funkcja odstąpienia (jeśli wymagana). | Ustawa o prawach konsumenta art. 27 i nast.; Dyr. 2023/2673 | ☐ |
| **ECOM-014** | P1 | Reklamacje (rękojmia/niezgodność towaru z umową): proces, termin odpowiedzi, informacja w regulaminie. | Proces opisany i przetestowany. | Ustawa o prawach konsumenta rozdz. 5a | ☐ |
| **ECOM-015** | P1 | Informowanie o obniżkach cen: przy każdej informacji o obniżce — najniższa cena z 30 dni przed obniżką. | Wyświetl produkt w promocji → cena referencyjna widoczna i poprawnie liczona (historia cen w bazie). | Ustawa o informowaniu o cenach art. 4 | ☐ |
| **ECOM-016** | P1 | Faktury/paragony: wystawianie zgodne z przepisami VAT; od 2026 r. obowiązkowy **KSeF** dla faktur ustrukturyzowanych w PL — harmonogram etapowy i wyjątki **zweryfikuj z księgowością**; sprzedaż B2C do innych krajów UE — rozliczenie VAT (OSS), stawki kraju konsumenta po przekroczeniu progu. | Potwierdzenie księgowe. | Ustawa o VAT | ☐ |
| **ECOM-017** | P2 | `CONDITIONAL: sprzedaż produktów konsumenckich` — informacje wymagane przez GPSR (producent/podmiot odpowiedzialny, identyfikacja produktu, ostrzeżenia) w ofercie online. | Przegląd kart produktów. | Rozp. 2023/988 art. 19 | ☐ |
| **ECOM-018** | P2 | Dostawa: opcje, koszty i terminy prezentowane przed zamówieniem; integracje kurierskie zabezpieczone (klucze API po stronie serwera — EXT-001). | Przegląd. | — | ☐ |
| **ECOM-019** | P1 | Dostępność procesu zakupowego (usługi handlu elektronicznego B2C objęte Polskim Aktem o Dostępności — XI.0). | A11Y- dla checkoutu. | PL ustawa o dostępności | ☐ |

---

# CZĘŚĆ XV — File Upload & Storage

`CONDITIONAL: użytkownicy przesyłają pliki lub aplikacja przechowuje pliki.`

**Źródła:** OWASP File Upload Cheat Sheet · OWASP ASVS 5.0 V5 (File Handling) · WSTG-BUSL-08, WSTG-BUSL-09 · dokumentacja storage dostawcy (S3, GCS, Supabase Storage, Firebase Storage, Cloudflare R2).

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **FILE-001** | P0 | Allow-lista typów plików wynikająca z potrzeb biznesowych (np. `jpg, png, webp, pdf`) — wszystko inne odrzucone. | Upload `.html`, `.svg`, `.php`, `.exe`, `.js`, `.htaccess`, `.phar` → odrzucone (jeśli poza allow-listą). | OWASP File Upload CS | ☐ |
| **FILE-002** | P0 | Walidacja **na serwerze** po zawartości (magic bytes / sygnatura, np. biblioteka `file-type`) **i** rozszerzeniu; nagłówek `Content-Type` od klienta nie jest wiarygodny. | Plik HTML przemianowany na `.jpg` z `Content-Type: image/jpeg` → odrzucony. | ASVS V5 | ☐ |
| **FILE-003** | P0 | Limit rozmiaru pliku i liczby plików egzekwowany przed pełnym wczytaniem (streaming), także na poziomie proxy/platformy; limit rozdzielczości obrazów (ochrona przed decompression bomb / „pixel flood”). | Plik > limit → `413` bez zużycia pamięci; obraz 30 000×30 000 px o małym rozmiarze → odrzucony. | ASVS V5 | ☐ |
| **FILE-004** | P0 | Nazwy przechowywanych plików **generowane przez serwer** (UUID); oryginalna nazwa tylko jako metadana (oczyszczona) do wyświetlenia. | Upload `../../etc/passwd.jpg`, `<script>.jpg`, nazwa 500 znaków, Unicode RTL override → zapisany pod UUID; nazwa wyświetlana bezpiecznie. | ASVS V5; SEC-014 | ☐ |
| **FILE-005** | P0 | Pliki przechowywane **poza webrootem** aplikacji / w object storage; serwer nigdy ich nie wykonuje ani nie interpretuje. | Próba wywołania wgranego pliku jako skryptu → brak wykonania. | OWASP File Upload CS | ☐ |
| **FILE-006** | P0 | Pliki prywatne w prywatnych bucketach; dostęp przez **signed URLs** z krótkim TTL (np. minuty) generowane po sprawdzeniu uprawnień; pliki publiczne w osobnym, świadomie publicznym buckecie. | Lista obiektów bucketu bez uwierzytelnienia → odmowa; bezpośredni URL obiektu prywatnego → `403`; signed URL po TTL → wygasły. Supabase: SUPA-008; Firebase: FIRE-001. | Docs dostawcy | ☐ |
| **FILE-007** | P0 | Autoryzacja dostępu do plików per obiekt (SEC-003): użytkownik B nie pobierze pliku A (także przez zgadnięcie ścieżki, listing, miniatury). | Test IDOR na plikach i miniaturach. | SEC-003 | ☐ |
| **FILE-008** | P1 | Pliki serwowane z nagłówkami: `X-Content-Type-Options: nosniff`, poprawny `Content-Type`, `Content-Disposition: attachment` dla typów, które nie muszą być wyświetlane inline; najlepiej z **osobnej domeny** (sandbox domain, np. `usercontent.example.com`), aby XSS w pliku nie działał w originie aplikacji. | `curl -sI <url pliku>`. | OWASP File Upload CS | ☐ |
| **FILE-009** | P1 | **SVG**: traktowane jak potencjalny skrypt — odrzucone lub sanitizowane (DOMPurify z profilem SVG / konwersja do PNG), serwowane z CSP `script-src 'none'` / jako `attachment`. | Upload SVG z `<script>` i `onload` → nie wykonuje się przy otwarciu. | OWASP File Upload CS | ☐ |
| **FILE-010** | P1 | **Obrazy**: przetworzenie przez bibliotekę (re-encoding np. `sharp`) usuwające metadane EXIF (GPS!) i polyglot payloady. | Upload JPG z GPS EXIF → pobrany plik bez EXIF (`exiftool`). | RODO (minimalizacja); OWASP | ☐ |
| **FILE-011** | P1 | **PDF / dokumenty Office**: nie renderowane w originie aplikacji; podgląd przez bezpieczny viewer lub konwersję; świadomość aktywnej zawartości (JavaScript w PDF, makra). | Upload PDF z JS → brak wykonania w kontekście aplikacji. | OWASP | ☐ |
| **FILE-012** | P1 | `CONDITIONAL: pliki od niezaufanych użytkowników udostępniane innym użytkownikom / przetwarzane przez personel` — skanowanie antywirusowe (ClamAV, usługa dostawcy chmury) przed udostępnieniem; plik w kwarantannie do czasu wyniku. | Upload pliku testowego EICAR → wykryty i zablokowany. | OWASP File Upload CS | ☐ |
| **FILE-013** | P1 | Archiwa (ZIP) `CONDITIONAL`: ochrona przed zip bomb (limit rozmiaru po rozpakowaniu i liczby plików) i zip slip (ścieżki `../` w archiwum). | Archiwum testowe → odrzucone/bezpieczne. | OWASP | ☐ |
| **FILE-014** | P1 | Upload bezpośrednio do storage (presigned POST/PUT): podpis ogranicza typ, rozmiar (`content-length-range`), klucz obiektu i czas; po uploadzie serwer weryfikuje plik przed oznaczeniem jako dostępny. | Próba wgrania większego pliku / innego typu z presigned URL → odrzucona. | AWS S3 / dostawca docs | ☐ |
| **FILE-015** | P2 | Upload wieloczęściowy / wznawiany: limity łącznego rozmiaru, porzucone fragmenty sprzątane (lifecycle rules). | Konfiguracja lifecycle. | Dostawca docs | ☐ |
| **FILE-016** | P1 | Retencja i usuwanie: pliki usuwane razem z rekordem/kontem (PRIV-052); brak „sierot” w storage; wersjonowanie bucketu skonfigurowane świadomie (wersje też zawierają dane osobowe). | Usuń konto → pliki usunięte (także wersje, wg polityki). | RODO art. 17 | ☐ |
| **FILE-017** | P2 | Uprawnienia kont usług do storage minimalne (zapis tylko do prefiksu uploadów, brak `DeleteBucket`, brak publicznego ACL). | Przegląd polityk IAM / bucket policies. | CIS | ☐ |
| **FILE-018** | P2 | Logowanie operacji na plikach (upload, pobranie plików wrażliwych, usunięcie) w audit logu. | LOG-. | ASVS V16 | ☐ |

---

# CZĘŚĆ XVI — Logging, Monitoring & Incident Response

**Źródła:** OWASP Top 10:2025 A09 (Security Logging and Alerting Failures) · OWASP ASVS 5.0 V16 · OWASP Logging CS, Logging Vocabulary CS · NIST CSF 2.0 (funkcje DETECT, RESPOND, RECOVER) · NIST SP 800-61r3 (Incident Response Recommendations, 2025) · OpenTelemetry docs.

**Przykładowe narzędzia (wybierz adekwatne do skali):** error tracking — Sentry, Bugsnag, Rollbar · logi — Better Stack (Logtail), Grafana Loki, Datadog, Elastic, logi platformy (Vercel/Netlify/Cloud Logging) · metryki/APM — OpenTelemetry + Grafana/Prometheus, Datadog, New Relic, Sentry Performance · uptime — Better Stack Uptime, UptimeRobot, Checkly, Grafana Synthetic Monitoring · alerty — PagerDuty, Opsgenie, Better Stack, Slack/Teams/e-mail/SMS.

## XVI.1 Logi

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **LOG-001** | P1 | Logi aplikacyjne strukturalne (JSON) ze znacznikiem czasu UTC, poziomem, `requestId`/trace ID, usługą, wersją (commit), bez danych wrażliwych. | Przykładowy wpis logu spełnia format. | ASVS V16 | ☐ |
| **LOG-002** | P0 | **Logi bezpieczeństwa** rejestrują: logowania udane/nieudane, wylogowania, blokady, reset/zmianę hasła i MFA, zmiany ról/uprawnień, odmowy dostępu (401/403 w nietypowej liczbie), błędy walidacji podpisów webhooków, operacje admina, eksporty danych. | Wykonaj zdarzenia z listy → każde w logach z kontekstem (kto, co, kiedy, skąd, wynik). | OWASP Top 10:2025 A09; ASVS V16; OWASP Logging Vocabulary | ☐ |
| **LOG-003** | P1 | **Audit log** dla operacji na danych krytycznych i administracyjnych: niezmienialny dla administratorów aplikacji (append-only, osobne uprawnienia/storage), z retencją zgodną z wymaganiami. | ADM-003; próba usunięcia wpisu przez admina aplikacji → niemożliwa. | ASVS V16 | ☐ |
| **LOG-004** | P0 | Redakcja: logi nie zawierają haseł, tokenów, cookies sesyjnych, kluczy API, pełnych numerów kart, CVV, treści dokumentów; dane osobowe ograniczone do niezbędnych (np. ID użytkownika zamiast e-maila) lub pseudonimizowane. Dotyczy też error trackera (Sentry `beforeSend`, `sendDefaultPii: false`) i logów CI. | Przegląd próbki logów i zdarzeń Sentry z testu logowania/płatności. | ASVS V16; RODO art. 5, 32 | ☐ |
| **LOG-005** | P1 | Ochrona przed log injection (escapowanie CRLF, logowanie strukturalne) — SEC-038. | — | — | ☐ |
| **LOG-006** | P1 | Retencja logów zdefiniowana (bezpieczeństwo vs. minimalizacja danych): np. logi aplikacyjne 30–90 dni, bezpieczeństwa/audytowe dłużej — **dopasuj do wymagań prawnych i umów**; logi chronione przed nieuprawnionym dostępem i modyfikacją. | Konfiguracja retencji u dostawcy; lista osób z dostępem. | ASVS V16; RODO | ☐ |
| **LOG-007** | P2 | Synchronizacja czasu (NTP) na wszystkich komponentach; spójna strefa (UTC) w logach. | Porównanie znaczników czasu z różnych usług dla jednego żądania. | NIST CSF | ☐ |

## XVI.2 Monitoring i alerting

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **LOG-010** | P0 | **Error tracking** w produkcji (frontend i backend) z powiązaniem z release'em (wersja/commit, source mapy przesłane do narzędzia, nie publicznie — SEC-034) i alertem dla nowych błędów. | Wywołaj błąd testowy w produkcji (np. ukryta trasa testowa lub przycisk w panelu) → zdarzenie w trackerze z czytelnym stack trace; alert dotarł. | NIST CSF DE.CM | ☐ |
| **LOG-011** | P0 | **Uptime monitoring** z zewnątrz: strona główna, logowanie/health API, krytyczne endpointy; sprawdzanie z kilku lokalizacji; alert do osoby dyżurnej (nie tylko e-mail, który nikt nie czyta). | Wyłącz/zablokuj endpoint testowy na stagingu → alert w ciągu ustalonego czasu (np. ≤ 5 min). | NIST CSF DE.CM | ☐ |
| **LOG-012** | P1 | **Monitoring wydajności** (APM/RUM): latencja p95/p99, odsetek błędów 5xx, Core Web Vitals z pola, z alertami progowymi. | Dashboard + reguły alertów. | — | ☐ |
| **LOG-013** | P1 | **Alerty bezpieczeństwa**: skok nieudanych logowań, wiele 403 z jednego źródła, odrzucone podpisy webhooków, nietypowe eksporty danych, nowe konto admina, zmiana uprawnień, użycie klucza `service_role` spoza oczekiwanych źródeł (jeśli mierzalne). | Symulacja na stagingu → alert. | OWASP Top 10:2025 A09 | ☐ |
| **LOG-014** | P1 | Monitoring API i bazy: odsetek błędów per endpoint, wolne zapytania, wykorzystanie połączeń, miejsce na dysku, replikacja/backup status. | Dashboard; alert dla krytycznych progów (np. dysk > 80 %). | — | ☐ |
| **LOG-015** | P1 | `CONDITIONAL: płatności` — monitoring płatności: odsetek nieudanych płatności, brak webhooków przez X minut przy ruchu, rozbieżności zamówień opłaconych vs. raport operatora (rekoncyliacja dzienna). | Alerty + raport rekoncyliacji. | — | ☐ |
| **LOG-016** | P1 | Monitoring deployów: każdy deploy oznaczony w narzędziach (release marker), porównanie błędów przed/po; automatyczny alert przy wzroście błędów po wdrożeniu. | Marker deployu widoczny w trackerze/APM. | REL- | ☐ |
| **LOG-017** | P2 | Monitoring certyfikatów, domen, kosztów i limitów usług (INF-004, INF-007, EXT-006, FIRE-007). | Alerty skonfigurowane. | — | ☐ |
| **LOG-018** | P2 | Alerty mają właściciela, priorytet i runbook; przegląd „szumu” (alert fatigue) co miesiąc. | Lista reguł z właścicielami. | — | ☐ |

## XVI.3 Incident response (skrót — pełny plan: [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md))

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **LOG-020** | P0 | Istnieje plan reagowania na incydenty: poziomy SEV, właściciel incydentu (Incident Commander), kanały komunikacji, kontakty (hosting, operator płatności, IOD, prawnik), procedura rollbacku i rotacji sekretów, obowiązki zgłoszeniowe (RODO 72 h — PRIV-060). | Plan w repo/wiki, znany zespołowi. | NIST SP 800-61r3; NIST CSF RS | ☐ |
| **LOG-021** | P1 | Plan przećwiczony (tabletop) przed premierą i co najmniej raz w roku. | Protokół ćwiczenia z wnioskami. | NIST CSF | ☐ |
| **LOG-022** | P1 | Postmortem (blameless) po każdym incydencie SEV1/SEV2 z działaniami naprawczymi wpisanymi do Risk Register/backlogu. | Szablon postmortem; przykładowy wypełniony (z ćwiczenia). | — | ☐ |
| **LOG-023** | P1 | Strona statusu / szablony komunikatów dla użytkowników na wypadek awarii lub naruszenia. | Szablony istnieją. | — | ☐ |
| **LOG-024** | P2 | `security.txt` (`/.well-known/security.txt`) z kontaktem do zgłaszania podatności i polityką ujawniania. | `curl -s https://host/.well-known/security.txt` → poprawny plik (pola `Contact`, `Expires`). | RFC 9116 | ☐ |

---

# CZĘŚĆ XVII — Backup & Disaster Recovery

**Źródła:** NIST CSF 2.0 (PR.DS-11 — kopie zapasowe tworzone, chronione, utrzymywane i testowane; RC — Recover) · NIST SP 800-34 Rev. 1 (Contingency Planning) · CIS Controls v8.1 Control 11 (Data Recovery) · RODO art. 32 ust. 1 lit. c (zdolność do szybkiego przywrócenia dostępności danych).

> ⚠️ **Wykonanie backupu nie jest równoznaczne z możliwością odtworzenia danych.** Backup uznaje się za skuteczny dopiero po **udanym, udokumentowanym teście odtworzenia** w czasie mieszczącym się w RTO i z danymi zgodnymi z RPO.

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **BCK-001** | P0 | Zdefiniowane **RPO i RTO** dla każdego systemu z danymi krytycznymi, zaakceptowane przez właściciela biznesowego (np. RPO 24 h / RTO 4 h dla małego SaaS; RPO 5 min z PITR dla systemu transakcyjnego). | Dokument z wartościami i akceptacją. | NIST SP 800-34 | ☐ |
| **BCK-002** | P0 | Automatyczne backupy bazy danych zgodne z RPO (snapshoty dzienne i/lub PITR). | Konfiguracja u dostawcy + lista ostatnich backupów z datami. | CIS Control 11 | ☐ |
| **BCK-003** | P1 | Backup plików/storage (object storage: wersjonowanie + replikacja / kopie do innego bucketu/konta) — jeśli pliki są danymi krytycznymi. | Konfiguracja. | CIS Control 11 | ☐ |
| **BCK-004** | P1 | Backup konfiguracji: infrastruktura jako kod (IaC) w repo, eksport ustawień platform (DNS, reguły WAF, konfiguracja BaaS, Security Rules, polityki RLS w migracjach), konfiguracja CI/CD. | Możliwość odtworzenia środowiska z repo + dokumentacji. | SSDF; CIS | ☐ |
| **BCK-005** | P1 | Sekrety: kopia w menedżerze sekretów z kontrolą dostępu / procedura ponownego wygenerowania każdego sekretu (lista sekretów z miejscem wydania i właścicielem) — **nie** w zwykłym backupie plików. | Lista sekretów + procedura. | OWASP Secrets Mgmt CS | ☐ |
| **BCK-006** | P0 | Kopie **niezależne od środowiska produkcyjnego**: przynajmniej jedna kopia poza kontem/projektem produkcyjnym (inne konto chmury, inny dostawca lub off-site), aby kompromitacja/usunięcie konta lub błąd dostawcy nie niszczył wszystkich kopii (zasada 3-2-1 / immutable backups). | Lokalizacje kopii udokumentowane; kopia off-account istnieje. | CIS Control 11; NIST CSF | ☐ |
| **BCK-007** | P1 | Kopie **szyfrowane** (w spoczynku i w transferze), klucze przechowywane oddzielnie od kopii; dostęp do kopii ograniczony i logowany. | Konfiguracja szyfrowania; lista osób z dostępem. | RODO art. 32 | ☐ |
| **BCK-008** | P1 | Ochrona przed usunięciem/ransomware: niezmienialność (object lock / immutable / retention lock) lub co najmniej osobne poświadczenia tylko do zapisu. | Konfiguracja. | CIS Control 11 | ☐ |
| **BCK-009** | P1 | Retencja kopii zdefiniowana (np. dzienne 7–30 dni, miesięczne 3–12 mies.) i spójna z polityką retencji danych osobowych (usunięte dane znikają z kopii po cyklu rotacji — informacja w polityce prywatności). | Dokument retencji. | RODO art. 5, 17 | ☐ |
| **BCK-010** | P0 | **Test odtworzenia** przed premierą i cyklicznie (np. kwartalnie): odtworzenie do izolowanego środowiska, weryfikacja integralności (liczba rekordów, sumy kontrolne, logowanie testowe, uruchomienie aplikacji na odtworzonych danych), pomiar czasu vs. RTO, ocena utraty danych vs. RPO. | **Protokół** z datą, osobami, krokami, czasem, wynikiem. | NIST CSF PR.DS-11 | ☐ |
| **BCK-011** | P1 | Monitoring backupów: alert przy nieudanym/niewykonanym backupie. | Alert skonfigurowany i przetestowany. | — | ☐ |
| **BCK-012** | P1 | **Disaster Recovery Plan**: scenariusze (usunięcie bazy, kompromitacja konta chmury, awaria regionu/dostawcy, utrata domeny, wyciek sekretów), kroki, kolejność odtwarzania usług, kontakty, decyzje. | Dokument DRP; przećwiczony co najmniej jeden scenariusz. | NIST SP 800-34 | ☐ |
| **BCK-013** | P2 | Business continuity: zależności krytyczne (dostawcy, osoby) zidentyfikowane; brak „single point of knowledge” (więcej niż jedna osoba z dostępem i wiedzą do odtworzenia; konta break-glass zabezpieczone). | Lista zależności i zastępstw. | NIST CSF GV | ☐ |

---

# CZĘŚĆ XVIII — Third-party Dependencies & Supply Chain

**Źródła:** OWASP Top 10:2025 **A03 Software Supply Chain Failures** · NIST SSDF (SP 800-218 v1.1; rewizja 1 / wersja 1.2 opublikowana jako projekt w grudniu 2025 — **zweryfikuj status finalny**) · **SLSA** (slsa.dev — wersja 1.1 opublikowana, dostępna nowsza 1.2 — zweryfikuj aktualną) · **OpenSSF Scorecard** · CycloneDX / SPDX (SBOM) · GitHub Docs: security hardening for GitHub Actions · npm docs (provenance, `npm audit signatures`).

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **SCM-001** | P0 | Lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` / `poetry.lock` itd.) w repo; instalacja w CI w trybie frozen (`npm ci`). | Przegląd CI; zmiana zależności bez aktualizacji lockfile → CI failuje. | SSDF PW.4 | ☐ |
| **SCM-002** | P0 | Skan podatności zależności w CI blokujący merge dla Critical/High mających zastosowanie (SEC-031) + monitoring ciągły (Dependabot alerts / Snyk / OSV). | Job CI + alerty repozytorium włączone. | OWASP A03 | ☐ |
| **SCM-003** | P1 | Polityka aktualizacji: automatyczne PR-y (Dependabot / Renovate) z grupowaniem; poprawki bezpieczeństwa wdrażane w ustalonym SLA (np. Critical ≤ 7 dni, High ≤ 30 dni); przegląd changelogów dla major. | Konfiguracja `.github/dependabot.yml` / `renovate.json`; historia PR. | SSDF RV.2 | ☐ |
| **SCM-004** | P1 | Ocena nowej zależności przed dodaniem: popularność/utrzymanie (ostatnie wydanie, liczba maintainerów), licencja, OpenSSF Scorecard, rozmiar, uprawnienia (skrypty instalacyjne), brak typosquattingu (dokładna nazwa!). | Checklista w PR template; `npx @socketsecurity/cli` / Socket.dev lub ręczny przegląd na npmjs.com + deps.dev. | OpenSSF | ☐ |
| **SCM-005** | P1 | Porzucone pakiety (brak aktualizacji > 2 lata, archiwalne repo, deprecated) zidentyfikowane i zaplanowana wymiana. | `npm outdated`; `npm ls --all \| grep -i deprecated` (lub ostrzeżenia `npm install`); deps.dev. | OWASP A03 | ☐ |
| **SCM-006** | P1 | Skrypty instalacyjne (`preinstall`/`postinstall`) ograniczone: w CI `npm ci --ignore-scripts` tam, gdzie możliwe, albo allow-lista pakietów, które ich potrzebują (pnpm `onlyBuiltDependencies`); świadomość ataków przez skrypty (np. kampanie typu „Shai-Hulud” na npm w 2025 r.). | Konfiguracja menedżera pakietów. | OWASP A03 | ☐ |
| **SCM-007** | P2 | Weryfikacja integralności i proweniencji: `npm audit signatures` (podpisy rejestru i atestacje provenance); preferowanie pakietów publikowanych z provenance; własne pakiety publikowane z `--provenance`. | `npm audit signatures` → brak błędów weryfikacji. | npm docs; SLSA | ☐ |
| **SCM-008** | P2 | **SBOM** generowany dla każdego release'u (CycloneDX lub SPDX) i przechowywany jako artefakt. | `npx @cyclonedx/cyclonedx-npm --output-file sbom.json` / `syft . -o cyclonedx-json` / `trivy fs --format cyclonedx .` → plik w artefaktach release'u. | NIST SSDF PS.3; CISA SBOM | ☐ |
| **SCM-009** | P1 | **GitHub Actions** (lub inny CI): akcje zewnętrzne pinowane do **pełnego SHA** commita (nie tagu), `permissions:` minimalne na poziomie workflow/joba (domyślnie `contents: read`), brak `pull_request_target` z checkoutem kodu z forka, brak interpolacji niezaufanych danych (`${{ github.event.issue.title }}`) w `run:` (script injection). | Przegląd `.github/workflows/*`; `zizmor` / `actionlint` → brak krytycznych znalezisk; OpenSSF Scorecard (Pinned-Dependencies, Token-Permissions, Dangerous-Workflow). | GitHub Docs security hardening; OpenSSF Scorecard | ☐ |
| **SCM-010** | P1 | Sekrety CI (GitHub Secrets/Environments): tylko w jobach, które ich potrzebują; środowisko `production` z wymaganą akceptacją (required reviewers) dla wdrożeń; OIDC do chmury zamiast długotrwałych kluczy, gdzie możliwe; sekrety nie są dostępne dla PR z forków. | Przegląd ustawień Environments i workflow. | GitHub Docs | ☐ |
| **SCM-011** | P1 | Ochrona repozytorium: branch protection/rulesets na gałęzi produkcyjnej (ARC-030), wymagane status checks, zakaz force-push, 2FA wymagane w organizacji, minimalna liczba adminów, przegląd dostępu współpracowników i aplikacji/integracji (GitHub Apps, deploy keys, PAT). | Ustawienia repo/organizacji. | OpenSSF Scorecard (Branch-Protection) | ☐ |
| **SCM-012** | P2 | Secret scanning i push protection włączone w repozytorium (GitHub Advanced Security / dostępne dla repo publicznych) + Gitleaks w pre-commit/CI. | Ustawienia repo; próba pushu testowego sekretu → zablokowana. | GitHub Docs | ☐ |
| **SCM-013** | P2 | **OpenSSF Scorecard** uruchamiany cyklicznie (GitHub Action) — wynik przejrzany, istotne ryzyka zaadresowane. | `scorecard --repo=github.com/<org>/<repo>` lub akcja `ossf/scorecard-action`. | OpenSSF | ☐ |
| **SCM-014** | P2 | Poziom **SLSA Build** określony i dążenie do co najmniej L2 (build w hostowanej platformie z podpisaną proweniencją) dla artefaktów dystrybuowanych (pakiety, obrazy). Dla zwykłej aplikacji webowej wdrażanej przez platformę — udokumentuj identyfikowalność build ← commit (INF-023). | Atestacja proweniencji (np. `actions/attest-build-provenance`) lub uzasadnienie N/A. | SLSA | ☐ |
| **SCM-015** | P2 | Skrypty i zasoby z zewnętrznych CDN przypięte do wersji + SRI (FE-006) lub self-hostowane; brak ładowania kodu z domen bez kontroli. | Inspekcja HTML. | OWASP A08 | ☐ |
| **SCM-016** | P1 | `CONDITIONAL: obrazy kontenerów` — obrazy bazowe z zaufanych źródeł, przypięte do digestu, skanowane (INF-028), podpisywane (cosign) dla dystrybucji. | `trivy image`; `cosign verify` (jeśli wdrożone). | SLSA; CIS Docker | ☐ |

---

# CZĘŚĆ XIX — PWA & Mobile Web

`CONDITIONAL: PWA (manifest + service worker), funkcje offline, push lub aplikacja intensywnie używana na mobile. Punkty PWA-030…PWA-034 dotyczą każdej strony responsywnej.`

**Źródła:** W3C Web App Manifest · W3C Service Workers · W3C Push API / Notifications API · web.dev (PWA, Workbox) · MDN · OWASP ASVS V3/V14 (dane po stronie klienta).

| ID | P | Wymaganie | Test / oczekiwany wynik | Źródło | Status |
|---|---|---|---|---|---|
| **PWA-001** | P1 | Manifest poprawny: `name`, `short_name`, `start_url`, `scope`, `display`, `icons` (min. 192 i 512 px, w tym `maskable`), `theme_color`, `background_color`, `id`; serwowany z poprawnym `Content-Type`. | DevTools → Application → Manifest → brak błędów; instalowalność potwierdzona. | W3C Manifest; web.dev | ☐ |
| **PWA-002** | P0 | Service worker serwowany tylko po HTTPS, z właściwym zakresem (`scope`), bez cachowania odpowiedzi zawierających dane prywatne innego użytkownika ani odpowiedzi z nagłówkami `no-store`; plik SW sam nie jest długo cachowany (`Cache-Control: no-cache` dla `sw.js`). | `curl -sI https://host/sw.js` → brak długiego `max-age`; przegląd strategii cache (Workbox `runtimeCaching`). | W3C SW; web.dev | ☐ |
| **PWA-003** | P0 | Wylogowanie i zmiana konta czyszczą cache SW i dane offline powiązane z użytkownikiem (Cache Storage, IndexedDB) — na współdzielonym urządzeniu kolejny użytkownik nie widzi danych poprzedniego. | Zaloguj A → przeglądaj offline → wyloguj → zaloguj B / tryb offline → brak danych A. | ASVS V14 | ☐ |
| **PWA-004** | P1 | Strategia aktualizacji: nowa wersja SW wykrywana, użytkownik informowany (lub kontrolowane `skipWaiting`), brak sytuacji „stara wersja na zawsze” i brak niespodziewanego przeładowania z utratą wprowadzanych danych; `cleanupOutdatedCaches`. | Wdróż nową wersję na staging → aplikacja otwarta wykrywa aktualizację zgodnie z założeniami. | web.dev / Workbox | ☐ |
| **PWA-005** | P1 | Tryb offline: strona offline/fallback dla nawigacji; jasna informacja o braku połączenia; operacje zapisu offline kolejkowane z rozwiązaniem konfliktów (Background Sync gdzie wspierane) lub blokowane z komunikatem. | DevTools → Network → Offline → kluczowe widoki działają lub pokazują komunikat; zapis po powrocie online jest kompletny i bez duplikatów. | web.dev | ☐ |
| **PWA-006** | P1 | Dane przechowywane offline: tylko niezbędne; brak sekretów; świadomość, że storage przeglądarki nie jest szyfrowany przez aplikację i może zostać wyczyszczony przez system (persistent storage request tylko gdy uzasadnione). | Przegląd IndexedDB/Cache Storage. | ASVS V14 | ☐ |
| **PWA-007** | P1 | `CONDITIONAL: powiadomienia push / Notifications` — prośba o zgodę po akcji użytkownika (nie przy wejściu na stronę), z wyjaśnieniem wartości; obsługa odmowy; treść powiadomień bez danych wrażliwych (widoczne na ekranie blokady); klucze VAPID prywatne tylko na serwerze; subskrypcje powiązane z kontem i usuwane po wylogowaniu/wygaśnięciu (`410 Gone`). | Test zgody/odmowy; wylogowanie → brak powiadomień dla konta. | W3C Push API; web.dev | ☐ |
| **PWA-008** | P2 | `CONDITIONAL: iOS` — świadomość ograniczeń Safari/iOS (push tylko dla PWA dodanej do ekranu głównego, ograniczenia działania w tle, limity storage) — udokumentowane w wymaganiach i komunikacji do użytkownika. | Test na iOS (fizyczne urządzenie). | WebKit docs | ☐ |
| **PWA-009** | P2 | Synchronizacja i praca w tle (Background Sync / Periodic Background Sync) traktowana jako „best effort” — funkcje krytyczne (np. przypomnienia) mają mechanizm awaryjny i nie obiecują więcej niż platforma gwarantuje. | Przegląd + test przy zamkniętej aplikacji. | web.dev | ☐ |
| **PWA-010** | P2 | Obsługa utraty połączenia w trakcie operacji (wysyłanie formularza, płatność): brak podwójnych operacji po powrocie (idempotencja — API-050), czytelny stan. | Przerwij sieć w trakcie wysyłania → stan spójny. | — | ☐ |
| **PWA-030** | P1 | Viewport: `<meta name="viewport" content="width=device-width, initial-scale=1">` **bez** blokady zoomu (A11Y-017). | Inspekcja. | WCAG 1.4.4 | ☐ |
| **PWA-031** | P1 | Layout responsywny bez poziomego przewijania od 320 px; uwzględnione safe areas (`env(safe-area-inset-*)`) i klawiatura ekranowa (pola nie są zasłaniane). | QA-014; test na urządzeniu z notchem. | — | ☐ |
| **PWA-032** | P1 | Cele dotykowe ≥ 24×24 px (WCAG 2.5.8), zalecane 44×44 px; odstępy między nimi. | A11Y-011. | WCAG 2.2 | ☐ |
| **PWA-033** | P2 | Pola formularzy z właściwym `inputmode`/`type` (email, tel, numeric) i `autocomplete`; rozmiar fontu pól ≥ 16 px (iOS nie powiększa wtedy strony). | Test na mobile. | — | ☐ |
| **PWA-034** | P1 | Testy na realnych urządzeniach: co najmniej jeden iPhone (Safari) i jeden Android (Chrome), w tym słabszy model i wolna sieć (4G/3G throttling). | Protokół testu. | QA-013 | ☐ |

---

# CZĘŚĆ XX — Technology-specific Checklists

Każda sekcja jest **CONDITIONAL**. Format: wymagania + **typowe błędy** + **konkretne testy**. Wersje frameworków zmieniają się szybko — przed audytem sprawdź oficjalną dokumentację dla wersji używanej w projekcie (`package.json`).

## XX.1 Next.js (App Router) — `CONDITIONAL: Next.js`

**Źródła:** nextjs.org/docs (App Router: Data Security, Server Actions, Route Handlers, Caching, Content Security Policy, Environment Variables, Proxy/Middleware) · React docs (Server Components, `taint` API — experimental).

> **Wersja:** od Next.js 16 plik `middleware.ts` został przemianowany na **`proxy.ts`** (eksport `proxy`, domyślnie runtime Node.js); `middleware.ts` jest przestarzały (deprecated). Stosuj nazewnictwo zgodne z wersją projektu (zweryfikowano 2026-11-06).

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **NEXT-001** | P0 | **Server Actions to publiczne endpointy POST**: każda akcja waliduje wejście (schemat) i sprawdza uwierzytelnienie **oraz** autoryzację wewnątrz akcji — nie polega na tym, że formularz jest widoczny tylko dla uprawnionych. | Wywołaj akcję bezpośrednio (skopiuj żądanie z DevTools, zmień argumenty/ID, usuń cookie) → odrzucona. Przegląd: każdy plik `"use server"` zaczyna się od `auth()` + walidacji. | ☐ |
| **NEXT-002** | P0 | **Route Handlers** (`app/**/route.ts`) — te same zasady co API (Część V): auth, authz, walidacja, rate limit. | Testy jak dla API. | ☐ |
| **NEXT-003** | P0 | **Proxy/Middleware nie jest jedyną warstwą autoryzacji** — sprawdzenie sesji w proxy to optymalizacja/przekierowanie; właściwa kontrola w warstwie dostępu do danych (Data Access Layer) / akcji / handlerze. Aktualizuj Next.js — znane były podatności obejścia middleware (np. CVE-2025-29927 z nagłówkiem `x-middleware-subrequest`). | Wyślij żądanie do chronionej strony z nagłówkiem `x-middleware-subrequest` (staging) → nadal chroniona; wersja Next.js bez znanych CVE (`npm audit`). | ☐ |
| **NEXT-004** | P0 | Kod i sekrety serwerowe nie trafiają do klienta: moduły z sekretami oznaczone `import "server-only"`; Server Components nie przekazują do Client Components całych obiektów z polami wrażliwymi (props są serializowane do HTML/RSC payload!). | Przeszukaj HTML i payload RSC (`view-source:`, odpowiedzi z `?_rsc=`) pod kątem pól typu `passwordHash`, e-maili innych użytkowników, tokenów → brak. | ☐ |
| **NEXT-005** | P0 | Zmienne `NEXT_PUBLIC_*` nie zawierają sekretów (ARC-022); sekrety odczytywane tylko w kodzie serwerowym. | `grep -rn "NEXT_PUBLIC_" .env* src` → przegląd każdej. | ☐ |
| **NEXT-006** | P1 | **Cache i dane personalizowane**: strony/fetch z danymi użytkownika nie są cachowane statycznie ani współdzielone (dynamiczne renderowanie dla tras zależnych od cookies/nagłówków; ostrożnie z `unstable_cache`/`"use cache"` — klucz cache musi uwzględniać użytkownika lub dane nie mogą być prywatne). | Zaloguj A → odwiedź stronę → zaloguj B (inna przeglądarka) → B nie widzi danych A; nagłówki `Cache-Control` dla stron prywatnych `private, no-store`. | ☐ |
| **NEXT-007** | P1 | Rewalidacja (`revalidatePath`/`revalidateTag`, ISR) wywoływana tylko przez uprawnione akcje; endpoint rewalidacji on-demand chroniony sekretem. | Wywołaj endpoint rewalidacji bez sekretu → `401`. | ☐ |
| **NEXT-008** | P1 | Nagłówki bezpieczeństwa i CSP: `headers()` w `next.config` lub w proxy; CSP z nonce generowanym w proxy dla stron dynamicznych (zgodnie z dokumentacją „Content Security Policy” Next.js) — uwaga: nonce wymusza renderowanie dynamiczne. | `curl -sI` (HDR-). | ☐ |
| **NEXT-009** | P1 | `next/image`: `images.remotePatterns` zawężone do konkretnych hostów (bez `**` i dowolnych domen — ryzyko nadużycia optymalizatora i SSRF-like), `dangerouslyAllowSVG` wyłączone lub z `contentSecurityPolicy` i `contentDispositionType: 'attachment'`. | Przegląd `next.config`; żądanie `/_next/image?url=https://obca-domena/x.png` → `400`. | ☐ |
| **NEXT-010** | P1 | Przekierowania (`redirect()`, `redirects` w config, parametry `callbackUrl`) — ochrona przed open redirect (SEC-017). | Test `?callbackUrl=https://evil.example`. | ☐ |
| **NEXT-011** | P2 | Metadata API: `generateMetadata` z poprawnym `title`, `description`, `alternates.canonical`, Open Graph; `robots.ts`/`sitemap.ts` generują poprawne pliki; staging z `noindex` (SEO-). | `curl` `/robots.txt`, `/sitemap.xml`; inspekcja `<head>`. | ☐ |
| **NEXT-012** | P2 | `error.tsx`, `global-error.tsx`, `not-found.tsx` zaimplementowane; błędy produkcyjne nie ujawniają szczegółów (Next maskuje komunikaty błędów serwera w produkcji — nie przekazuj ich ręcznie do klienta). `notFound()` zwraca prawdziwy status 404. | Wymuś błąd i nieistniejącą stronę → przyjazny ekran, status 404/500, brak stack trace. | ☐ |
| **NEXT-013** | P2 | Source mapy przeglądarkowe wyłączone (`productionBrowserSourceMaps: false` — domyślnie) lub przesyłane tylko do Sentry. | SEC-034. | ☐ |
| **NEXT-014** | P2 | `CONDITIONAL: self-hosting (next start / standalone)` — reverse proxy przed Next, limity rozmiaru body Server Actions (`serverActions.bodySizeLimit`), `allowedOrigins` dla Server Actions za proxy, aktualizacje bezpieczeństwa Node.js. | Konfiguracja. | ☐ |

**Typowe błędy Next.js:** autoryzacja tylko w middleware/proxy; sekrety w `NEXT_PUBLIC_`; przekazywanie pełnego rekordu użytkownika do Client Component; statyczne cachowanie strony z danymi użytkownika; Server Action bez sprawdzania właściciela obiektu; `remotePatterns: [{ hostname: '**' }]`.

## XX.2 React + Vite (SPA) — `CONDITIONAL: React SPA budowana Vite`

**Źródła:** vite.dev/guide (Env Variables and Modes, Build, Static Deploy, Server options) · react.dev.

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **VITE-001** | P0 | Wszystko w bundlu jest publiczne: zmienne `VITE_*` to **konfiguracja publiczna**, nigdy sekrety; logika wymagająca sekretu → backend/funkcja serverless. | `grep -rn "VITE_" .env*`; skan `dist/` (SEC-033). | ☐ |
| **VITE-002** | P1 | Routing klienta: chronione trasy w UI to tylko UX — dane chronione przez API (AuthZ na serwerze). | Wejdź na `/admin` bez uprawnień — nawet jeśli UI się wyświetli, API zwraca `403`. | ☐ |
| **VITE-003** | P1 | SPA fallback (`rewrites` → `index.html`) skonfigurowany na hostingu; nie przechwytuje ścieżek API, plików statycznych ani `/.well-known/`; nieistniejące trasy — strona 404 z `noindex` (SEO-020). | `curl -sI https://host/dowolna/trasa` → 200 + aplikacja; `curl -sI https://host/assets/nie-istnieje.js` → **404** (a nie `index.html` z 200 — inaczej błędy ładowania chunków po wdrożeniu są maskowane). | ☐ |
| **VITE-004** | P1 | Lazy loading tras (`React.lazy` + `Suspense`), obsługa błędu ładowania chunka po nowym wdrożeniu (np. przeładowanie przy `ChunkLoadError` / zdarzeniu `vite:preloadError`). | Wdróż nową wersję, w otwartej starej karcie przejdź na nieodwiedzoną trasę → aplikacja się odzyskuje, nie „biały ekran”. | ☐ |
| **VITE-005** | P1 | `build.sourcemap` wyłączone w produkcji lub `hidden` + upload do error trackera (SEC-034). | `ls dist/assets/*.map` / sprawdzenie dostępności publicznie. | ☐ |
| **VITE-006** | P2 | Chunking: `manualChunks` lub domyślny podział — brak jednego ogromnego chunka; budżet (PERF-009). | `npx vite-bundle-visualizer`. | ☐ |
| **VITE-007** | P1 | Dev server **nie** wystawiony publicznie (`server.host` tylko gdy potrzebne, nigdy jako „hosting produkcyjny”); w Vite znane były podatności `server.fs.deny` bypass — aktualizuj Vite. Proxy deweloperskie (`server.proxy`) nie zastępuje produkcyjnej konfiguracji CORS/API. | Produkcja serwuje `dist/` przez hosting/CDN; wersja Vite bez znanych CVE. | ☐ |
| **VITE-008** | P1 | Error Boundary na poziomie aplikacji i kluczowych sekcji, raportowanie do error trackera (FE-013, LOG-010). | Wymuś błąd komponentu. | ☐ |
| **VITE-009** | P1 | Bezpieczeństwo klienta: FE-001…FE-015; tokeny poza `localStorage` (SES-002) — w SPA preferuj backend-for-frontend (BFF) z cookies `HttpOnly`. | Część VIII. | ☐ |
| **VITE-010** | P2 | `CONDITIONAL: vite-plugin-pwa` — PWA- (strategia aktualizacji, `navigateFallbackDenylist` dla API, brak cachowania odpowiedzi prywatnych). | Część XIX. | ☐ |

**Typowe błędy React+Vite:** klucz API płatnego dostawcy (OpenAI, Maps bez restrykcji) w `VITE_*`; SPA fallback zwracający `index.html` dla brakujących plików JS; autoryzacja tylko przez ukrywanie tras; publiczne source mapy; `dangerouslySetInnerHTML` z Markdown bez sanitizacji.

## XX.3 Node.js / TypeScript (backend) — `CONDITIONAL: własny backend Node.js`

**Źródła:** nodejs.org (Security Best Practices) · OWASP NodeJS Security CS · Express/Fastify security docs.

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **NODE-001** | P1 | Wspierana wersja LTS Node.js (nie End-of-Life) z aktualnymi poprawkami bezpieczeństwa. | `node -v` vs. harmonogram nodejs.org/en/about/previous-releases. | ☐ |
| **NODE-002** | P1 | Framework z middleware bezpieczeństwa (np. `helmet` dla Express / `@fastify/helmet`), limitami body (`express.json({ limit })`), `trust proxy` ustawionym poprawnie (INF-014), wyłączonym `x-powered-by`. | Przegląd konfiguracji; `curl -sI`. | ☐ |
| **NODE-003** | P1 | Obsługa `unhandledRejection`/`uncaughtException` — logowanie i kontrolowany restart (nie kontynuowanie w niespójnym stanie); graceful shutdown (PERF-062). | Przegląd kodu startowego. | ☐ |
| **NODE-004** | P1 | Brak blokowania event loop (synchroniczne operacje kryptograficzne/plikowe/regex na dużych danych w ścieżce żądania). | Profilowanie (`clinic doctor`, `--cpu-prof`) pod obciążeniem. | ☐ |
| **NODE-005** | P2 | Proces uruchamiany jako użytkownik nie-root; `NODE_ENV=production`; brak `--inspect` w produkcji. | Konfiguracja runtime. | ☐ |
| **NODE-006** | P2 | `CONDITIONAL: Node ≥ 20` — rozważony Permission Model (`--permission`) dla procesów przetwarzających niezaufane pliki (status stabilności zależny od wersji — zweryfikuj). | Decyzja udokumentowana. | ☐ |

## XX.4 Supabase — `CONDITIONAL: Supabase` (uzupełnienie VI.2)

Pełna lista: **SUPA-001…SUPA-011**. Dodatkowo:

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **SUPA-020** | P0 | Test „anonimowego atakującego”: z samym kluczem `anon` i URL projektu (oba publiczne!) spróbuj odczytać/zapisać każdą tabelę i bucket. | `curl "$SUPABASE_URL/rest/v1/<tabela>?select=*" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"` dla każdej tabeli → `[]`/`401` dla danych niepublicznych. Zob. Playbook PB-SUPA. | ☐ |
| **SUPA-021** | P1 | Realtime: kanały/`postgres_changes` respektują RLS (wymaga włączonego RLS); kanały broadcast/presence z autoryzacją (Realtime Authorization), jeśli przenoszą dane prywatne. | Subskrybuj zmiany tabeli jako B → brak zdarzeń z wierszy A. | ☐ |
| **SUPA-022** | P1 | Security Advisor i Performance Advisor w Dashboardzie bez nierozwiązanych ostrzeżeń krytycznych przed release'em. | Zrzut/raport z Advisors. | ☐ |

**Typowe błędy Supabase:** tabela utworzona SQL-em bez `enable row level security`; polityka `UPDATE` bez `WITH CHECK`; `service_role` w kliencie lub w funkcji wywoływanej z przeglądarki; widok omijający RLS (`security_definer` domyślnie dla widoków w starszych PG); bucket publiczny z prywatnymi plikami; redirect URLs z wildcardem `https://*.vercel.app/**` pozwalające przechwycić tokeny przez dowolny deploy preview.

## XX.5 Firebase — `CONDITIONAL: Firebase` (uzupełnienie VI.3)

Pełna lista: **FIRE-001…FIRE-009**. Dodatkowo:

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **FIRE-020** | P0 | Test „anonimowego atakującego”: z publiczną konfiguracją Firebase (z bundla) spróbuj odczytać kolekcje i pliki bez logowania oraz jako inny użytkownik. | Skrypt z Firebase JS SDK / REST (`https://firestore.googleapis.com/v1/projects/<id>/databases/(default)/documents/<kolekcja>`) → odmowa dla danych prywatnych. | ☐ |
| **FIRE-021** | P1 | Zapytania listujące (`list`) ograniczone w regułach (np. wymuszony filtr `where("ownerId","==",uid)` — reguły nie są filtrami, zapytanie musi być zgodne z regułą). | Zapytanie bez filtra → odrzucone. | ☐ |
| **FIRE-022** | P1 | Hosting Firebase: nagłówki bezpieczeństwa w `firebase.json` (`headers`), rewrites dla SPA nie przechwytują plików statycznych (VITE-003). | `curl -sI`. | ☐ |

**Typowe błędy Firebase:** reguły z trybu testowego z datą wygaśnięcia przedłużaną „na chwilę”; `allow read: if request.auth != null` (każdy zalogowany widzi wszystko); brak walidacji pól w `create/update`; Admin SDK credentials w repo; brak App Check przy publicznym endpointcie kosztownej funkcji.

## XX.6 Shopify — `CONDITIONAL: sklep Shopify / aplikacja Shopify`

**Źródła:** shopify.dev (App security, Webhooks — HMAC verification, Customer privacy / GDPR mandatory webhooks, Checkout extensibility, Theme development) · Shopify Help Center (staff permissions, 2FA).

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **SHOP-001** | P0 | Konta personelu imienne, z **2FA**, z minimalnymi uprawnieniami (staff permissions); właściciel sklepu z 2FA; przegląd kont współpracowników (collaborator accounts) i ich zakresu. | Admin → Settings → Users and permissions. | ☐ |
| **SHOP-002** | P1 | Aplikacje zewnętrzne: tylko niezbędne, od zaufanych dostawców; przegląd żądanych zakresów dostępu (access scopes, zwłaszcza do danych klientów i zamówień); usunięcie nieużywanych (usunięcie aplikacji nie zawsze usuwa jej snippet z motywu — sprawdź kod motywu). | Lista aplikacji z właścicielem i uzasadnieniem; przegląd motywu po odinstalowaniu. | ☐ |
| **SHOP-003** | P0 | `CONDITIONAL: własna aplikacja Shopify` — weryfikacja HMAC webhooków (`X-Shopify-Hmac-Sha256`) na surowym body (API-040), weryfikacja sesji/OAuth zgodnie z dokumentacją (session tokens dla embedded apps), obsługa **obowiązkowych webhooków prywatności** (`customers/data_request`, `customers/redact`, `shop/redact`), minimalne scopes. | Test webhooka z błędnym HMAC → `401`; endpointy compliance webhooks istnieją i działają. | ☐ |
| **SHOP-004** | P1 | Motyw (Liquid): dane wyjściowe escapowane (filtr `escape` dla danych od klienta/metafields w kontekstach HTML/JS — w JS używaj `json`), brak wstawiania parametrów URL do HTML bez escapingu, brak sekretów (kluczy prywatnych API) w motywie — motyw jest publiczny. | Przegląd plików `.liquid` (`grep -rn "{{ .*request\|{{ .*params"`), test XSS przez parametry wyszukiwania i formularze. | ☐ |
| **SHOP-005** | P1 | Skrypty niestandardowe (custom pixels, Additional scripts, snippety w `theme.liquid`): inwentarz, uzasadnienie, ładowanie zgodne ze zgodą (Customer Privacy API / Shopify consent banner — PRIV-020); proces checkout modyfikowany wyłącznie przez Checkout Extensibility (dawne `checkout.liquid` i Additional scripts na stronie statusu zamówienia zostały wygaszone — **zweryfikuj aktualny status dla planu sklepu**). | Lista pixeli i skryptów; test sieci przed zgodą. | ☐ |
| **SHOP-006** | P1 | Ustawienia prywatności klientów: banner zgody (lub zewnętrzny CMP zintegrowany z Customer Privacy API), polityki (prywatność, zwroty, regulamin, wysyłka) uzupełnione **[PRAWNIK]**, obsługa żądań danych klientów. | Settings → Customer privacy; Settings → Policies. | ☐ |
| **SHOP-007** | P1 | Checkout i ceny: rabaty/kody — konfiguracja limitów użycia; brak „ukrytych” produktów dostępnych przez URL/handle, jeśli nie powinny być sprzedawane; produkty testowe usunięte. | Próba zakupu ukrytego produktu przez bezpośredni URL / dodanie do koszyka przez `/cart/add.js` z ID wariantu. | ☐ |
| **SHOP-008** | P2 | Storefront API / headless (`CONDITIONAL`): tylko publiczny Storefront access token w kliencie; Admin API token wyłącznie po stronie serwera. | Skan bundla. | ☐ |
| **SHOP-009** | P2 | Domeny i e-mail: SSL aktywny dla wszystkich domen sklepu, przekierowanie na domenę główną, SPF/DKIM dla domeny nadawcy e-maili sklepu (INF-006). | Settings → Domains. | ☐ |

**Typowe błędy Shopify:** wiele osób na jednym koncie właściciela; stare aplikacje z dostępem do danych klientów; snippet porzuconej aplikacji ładujący skrypt z wygasłej domeny (ryzyko przejęcia domeny i wstrzyknięcia kodu); piksele marketingowe przed zgodą; prywatny token Admin API w motywie.

## XX.7 WordPress — `CONDITIONAL: WordPress`

**Źródła:** developer.wordpress.org (Hardening WordPress, Plugin Security) · WPScan/Wordfence/Patchstack vulnerability databases.

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **WP-001** | P0 | Rdzeń, motywy i wtyczki aktualne; tylko wtyczki aktywnie utrzymywane i niezbędne; usunięte (nie tylko wyłączone) nieużywane wtyczki/motywy; auto-update dla poprawek bezpieczeństwa. | `wp core version`, `wp plugin list --update=available`; `wpscan --url https://host --enumerate vp` (**za zgodą**, z tokenem API). | ☐ |
| **WP-002** | P0 | Konta admin: imienne, silne hasła, **2FA**, brak loginu `admin`; ograniczenie prób logowania; ochrona `wp-login.php`/`xmlrpc.php` (wyłączone XML-RPC, jeśli nieużywane). | `curl -s -X POST https://host/xmlrpc.php` → zablokowane/405 (jeśli nieużywane); test limitu logowań. | ☐ |
| **WP-003** | P1 | `wp-config.php`: `DISALLOW_FILE_EDIT` = true, `WP_DEBUG` = false w produkcji, unikalne klucze/sole, prefiks tabel, uprawnienia plików (644/640, katalogi 755), plik poza webrootem jeśli możliwe. | Przegląd konfiguracji; `/wp-content/debug.log` niedostępny publicznie. | ☐ |
| **WP-004** | P1 | Enumeracja użytkowników ograniczona (`/?author=1`, `/wp-json/wp/v2/users`) — jeśli nazwy użytkowników nie mają być publiczne. | `curl -s https://host/wp-json/wp/v2/users` → brak listy loginów. | ☐ |
| **WP-005** | P1 | Listing katalogów wyłączony; `readme.html`, `license.txt`, pliki backupów wtyczek (`.zip`, `.sql`) niedostępne publicznie; upload katalog bez wykonywania PHP. | `curl -sI https://host/wp-content/uploads/` → 403; `curl https://host/wp-content/uploads/test.php` → brak wykonania. | ☐ |
| **WP-006** | P1 | Backup plików i bazy poza serwerem + test odtworzenia (BCK-); WAF (wtyczka lub na poziomie hostingu/CDN). | Protokół. | ☐ |
| **WP-007** | P2 | Własny kod (motyw/wtyczka): nonce dla akcji (`wp_verify_nonce`), `current_user_can()` dla uprawnień, escaping wyjścia (`esc_html`, `esc_attr`, `esc_url`), `$wpdb->prepare()` dla SQL, sanitizacja wejścia. | Przegląd kodu; `phpcs` z WordPress-Coding-Standards (reguły Security). | ☐ |

---

# CZĘŚĆ XXI — Release Management

**Źródła:** NIST SSDF (PS.2, PS.3, PW.9) · Semantic Versioning 2.0.0 · Keep a Changelog · Google SRE Book (release engineering, canarying).

| ID | P | Wymaganie | Test / oczekiwany wynik | Status |
|---|---|---|---|---|
| **REL-001** | P1 | Release checklist (ta część + [PRODUCTION-RELEASE-GO-NO-GO.md](PRODUCTION-RELEASE-GO-NO-GO.md)) wypełniana dla każdego release'u produkcyjnego (pełna wersja przy pierwszym wydaniu i dużych zmianach, skrócona przy drobnych). | Wypełniony formularz dla release'u. | ☐ |
| **REL-002** | P2 | Wersjonowanie (SemVer lub CalVer) — wersja widoczna w aplikacji/health endpoint (bez szczegółów infrastruktury) i w error trackerze. | `curl https://host/api/version` / stopka / Sentry release. | ☐ |
| **REL-003** | P2 | Changelog prowadzony (dla użytkowników i zespołu), zawiera zmiany bezpieczeństwa w sposób niepomagający atakującemu przed wdrożeniem poprawki. | `CHANGELOG.md` / release notes. | ☐ |
| **REL-004** | P0 | Walidacja środowiska przed wdrożeniem: wszystkie wymagane zmienne ustawione (ARC-021), właściwe klucze (live vs test — PAY-007), migracje gotowe, feature flagi w zamierzonym stanie, domena/TLS działa. | Skrypt pre-deploy / checklista; deploy na staging z identyczną konfiguracją przeszedł. | ☐ |
| **REL-005** | P0 | Migracje bazy: przetestowane na kopii stagingowej, kompatybilne wstecz z poprzednią wersją aplikacji (expand/contract), backup tuż przed migracją produkcyjną, plan rollbacku migracji (lub świadoma decyzja „forward-fix only” z uzasadnieniem). | Protokół migracji. | ☐ |
| **REL-006** | P2 | Feature flags dla ryzykownych funkcji (możliwość wyłączenia bez deployu); flagi z właścicielem i datą usunięcia; flagi nie są mechanizmem bezpieczeństwa (serwer i tak sprawdza uprawnienia). | Lista flag. | ☐ |
| **REL-007** | P0 | Rollback: procedura i czas znane, przetestowane (INF-024). Kryteria wyzwalające rollback zdefiniowane (np. wzrost 5xx > X %, krytyczny proces nie działa). | Runbook + test. | ☐ |
| **REL-008** | P2 | Wdrożenie stopniowe (canary / % ruchu / region) `CONDITIONAL: duży ruch lub ryzykowna zmiana`. | Konfiguracja platformy. | ☐ |
| **REL-020** | P0 | **Post-deployment verification**: smoke testy automatyczne (QA-010) + ręczne sprawdzenie krytycznej ścieżki; monitoring błędów, latencji i biznesowych KPI (zamówienia, logowania) przez ustalony czas (np. 30–60 min) z osobą dyżurną. | Log weryfikacji z godziną i wynikami. | ☐ |
| **REL-021** | P1 | Ownership: dla każdego release'u wyznaczony właściciel wdrożenia (decyzje rollback) i osoba dostępna po wdrożeniu. | Wpis w formularzu release'u. | ☐ |
| **REL-022** | P1 | Proces akceptacji: release produkcyjny zatwierdza osoba uprawniona (Product Owner / Tech Lead) po decyzji Go/No-Go; w CI — wymagana akceptacja środowiska `production` (SCM-010). | Historia akceptacji. | ☐ |
| **REL-023** | P2 | Release freeze: okresy bez wdrożeń (np. szczyt sprzedaży, święta, piątek po południu — wg polityki zespołu) z procedurą wyjątków. | Polityka. | ☐ |
| **REL-024** | P1 | Hotfix process: szybka ścieżka dla poprawek krytycznych (zwłaszcza bezpieczeństwa) z minimalnym zestawem obowiązkowych kontroli (testy, review drugiej osoby, smoke), retestem podatności i późniejszym uzupełnieniem dokumentacji. | Procedura opisana; przykład z historii lub ćwiczenia. | ☐ |
| **REL-025** | P1 | Po release: aktualizacja statusów checklisty, Risk Register i dokumentacji; retesty punktów, których dotyczyła zmiana (Część XXVI). | Zaktualizowane dokumenty. | ☐ |

---

# CZĘŚĆ XXII — Production Go / No-Go

Pełna procedura, formularz decyzji i wzór akceptacji ryzyka: **[PRODUCTION-RELEASE-GO-NO-GO.md](PRODUCTION-RELEASE-GO-NO-GO.md)**. Poniżej reguły wiążące.

## XXII.1 Twarde kryteria NO-GO (bez możliwości akceptacji ryzyka)

Projekt **nie może** otrzymać statusu READY ani READY WITH ACCEPTED RISKS, jeżeli występuje którekolwiek z poniższych:

| # | Kryterium blokujące | Powiązane punkty |
|---|---|---|
| NG-1 | Nierozwiązana luka **P0** (status `FAIL`) lub P0 mający zastosowanie ze statusem `NOT TESTED`. | wszystkie P0 |
| NG-2 | Krytyczny problem z **autoryzacją** (IDOR/BOLA, BFLA, eskalacja uprawnień, brak RLS/Rules na danych prywatnych). | SEC-003, SEC-007, SEC-008, SUPA-001, FIRE-001 |
| NG-3 | **Ujawnione sekrety** (w repo, bundlu, logach, publicznym storage) — niezrotowane. | ARC-020, SEC-033, SUPA-003 |
| NG-4 | Dane użytkowników dostępne **bez odpowiednich uprawnień** (w tym przez API, cache, storage, publiczne buckety). | SEC-037, SEC-028, FILE-006 |
| NG-5 | HTTPS / TLS nieprawidłowe (brak HTTPS, nieważny certyfikat, słaby TLS na produkcji). | INF-001, INF-002 |
| NG-6 | **Nie działa krytyczny proces biznesowy** (logowanie, zakup, zapis danych — wg listy QA-001). | QA-004, PAY- |
| NG-7 | Brak **zweryfikowanej** strategii backupu dla danych krytycznych (brak backupu lub brak udanego testu odtworzenia). | BCK-002, BCK-010 |
| NG-8 | Poważne ryzyko **utraty danych** (np. migracja bez backupu, brak integralności zapisu płatności). | REL-005, PAY-003 |
| NG-9 | Niespełnione **obowiązki prawne** o charakterze blokującym, wskazane przez prawnika/IOD (np. tracking przed zgodą, brak regulaminu przy sprzedaży konsumenckiej, brak podstawy przetwarzania). | PRIV-020, PRIV-002, PRIV-072, ECOM-010 |

## XXII.2 Tabela decyzyjna

| Decyzja | Warunki | Kto podejmuje | Co dalej |
|---|---|---|---|
| **READY** | Bramki G1–G5 spełnione (I.4); 0 × FAIL P0/P1; wszystkie P0/P1 z dowodami. | Product Owner na podstawie rekomendacji audytora | Wdrożenie wg Części XXI. |
| **READY WITH ACCEPTED RISKS** | Brak NG-1…NG-9; istnieją FAIL **P1** (lub P2 krytyczne biznesowo) z formalną akceptacją: opis, uzasadnienie, środek kompensujący, właściciel, termin naprawy (P1 ≤ 30 dni), podpis. | Właściciel ryzyka (Product Owner / osoba z budżetem i odpowiedzialnością za produkt); dla ryzyk prawnych — po konsultacji z prawnikiem/IOD; dla bezpieczeństwa — po opinii security | Wdrożenie + monitoring ryzyk + termin w Risk Register. |
| **NOT READY** | Występuje którekolwiek NG-1…NG-9 **lub** FAIL P1 bez akceptacji. | Audytor / Tech Lead (rekomendacja), PO (decyzja) | Naprawy → retest → ponowna decyzja. |
| **BLOCKED** | Nie można ocenić gotowości: kluczowe testy `BLOCKED`/`NOT TESTED` z przyczyn zewnętrznych (brak dostępu do środowiska, brak zgody na test, brak informacji prawnej). | Audytor | Usunięcie blokady → dokończenie audytu. |

## XXII.3 Akceptacja ryzyka — zasady

1. Akceptację wyraża **osoba odpowiedzialna biznesowo**, nie autor zmiany (four-eyes, I.8).
2. Akceptacja jest **pisemna** (formularz w GO/NO-GO, PR, ticket z podpisem/zatwierdzeniem) i ma **datę wygaśnięcia**.
3. Każde zaakceptowane ryzyko ma wpis w Risk Register (`RISK-…`) ze środkiem kompensującym (np. WAF rule, feature flag wyłączający funkcję, dodatkowy monitoring).
4. **P0 nie podlega akceptacji** — jedyną drogą jest naprawa lub wyłączenie funkcji/obszaru z release'u (wtedy punkt zmienia się na `N/A` z uzasadnieniem „funkcja niewdrożona”).
5. Po terminie akceptacji ryzyko wraca do statusu blokującego przy kolejnym release.

---

# CZĘŚĆ XXIII — Praktyczny plan audytu

Polecenia CLI, payloady i kolejność narzędzi: **[SECURITY-TESTING-PLAYBOOK.md](SECURITY-TESTING-PLAYBOOK.md)** (identyfikatory `PB-…`).

> 🛑 **Zasady bezpieczeństwa audytu:** (1) Testy aktywne (skanery aktywne, fuzzing, brute force, testy obciążeniowe, race conditions) **tylko na stagingu** lub za **pisemną zgodą** właściciela systemu na produkcji, w uzgodnionym oknie czasowym. (2) Nie testuj infrastruktury dostawców (Vercel, Supabase, Shopify itd.) poza zakresem dozwolonym ich polityką testów penetracyjnych. (3) Używaj kont testowych, nie danych realnych użytkowników. (4) Zatrzymaj test i eskaluj natychmiast przy wykryciu realnego wycieku danych.

| Krok | Cel | Działania | Wynik (artefakt) | Punkty |
|---|---|---|---|---|
| **1. Rozpoznanie projektu** | Zrozumieć cel, użytkowników, dane, krytyczne procesy | Wywiad z PO/zespołem; lista procesów krytycznych; profil projektu (I.9); zakres i wyłączenia; zgoda na testy. | Karta audytu: zakres, profil, kontakty, okna testowe. | I.2, I.9 |
| **2. Identyfikacja technologii** | Aktywować punkty CONDITIONAL | `package.json`, lockfile, konfiguracje (`next.config`, `vite.config`, `supabase/`, `firebase.json`, `vercel.json`), Dockerfile, IaC, nagłówki odpowiedzi, Wappalyzer. | Lista technologii i wersji; mapa punktów XX. | PB-RECON-01 |
| **3. Analiza architektury** | Granice zaufania, przepływy danych | Diagram (ARC-001), threat model (ARC-002), lista usług zewnętrznych i miejsc przechowywania danych. | Diagram + threat model. | ARC-001/002, PRIV-001 |
| **4. Przegląd kodu** | Wady projektowe i implementacyjne | SAST (Semgrep/CodeQL) + manualny przegląd: auth, authz, walidacja, zapytania, upload, płatności, Server Actions/handlery. | Lista znalezisk SAST po triage + notatki manualne. | Część II, III; PB-SAST |
| **5. Analiza zależności** | Podatności i ryzyka supply chain | `npm audit`/`osv-scanner`, SBOM, OpenSSF Scorecard, przegląd CI. | Raport SCA, SBOM. | Część XVIII; PB-SCA |
| **6. Analiza konfiguracji** | Sekrety, środowiska, hosting | Gitleaks (historia), `.env*`, konfiguracja hostingu, nagłówki, CORS, cookies, uprawnienia kont. | Raport sekretów + konfiguracji. | ARC-02x, Część VII; PB-SECRETS, PB-HDR |
| **7. Audyt bezpieczeństwa (dynamiczny)** | Weryfikacja podatności w działającej aplikacji | ZAP baseline → manual (Burp): AuthN, sesje, AuthZ z 2–3 kontami, IDOR, CSRF, XSS, SSRF, mass assignment, logika, race conditions. | Raport z PoC (bez danych realnych). | Część III, IV; PB-AUTHZ, PB-DAST |
| **8. Testy funkcjonalne** | Procesy krytyczne działają | E2E + testy manualne ścieżek krytycznych, formularzy, błędów, cross-browser, responsive. | Raport Playwright + protokół. | Część X |
| **9. Testy API** | Kontrakt, walidacja, autoryzacja | Kolekcje Bruno/Postman, Schemathesis (staging), macierz ról. | Raport. | Część V; PB-API |
| **10. Testy bazy** | RLS/Rules, uprawnienia, migracje | Zapytania kontrolne (RLS), testy reguł w emulatorze, migracje od zera, test „anonimowego atakującego”. | Raport + wyniki zapytań. | Część VI; PB-SUPA, PB-FIRE |
| **11. Testy wydajności** | CWV, latencja, pojemność | Lighthouse (mobile) dla typów stron, PSI/CrUX, k6 na stagingu. | Raporty Lighthouse/k6. | Część IX; PB-PERF |
| **12. Testy dostępności** | WCAG 2.2 AA | axe/Lighthouse + manual: klawiatura, czytnik ekranu, zoom, kontrast. | Raport axe + protokół manualny. | Część XI; PB-A11Y |
| **13. Testy SEO** | Indeksowalność i metadane | robots, sitemap, canonical, statusy, crawl, Rich Results Test. | Raport crawl. | Część XII; PB-SEO |
| **14. Audyt privacy** | Zgodność techniczna z RODO/PKE | Test cookies przed zgodą, polityki vs. rzeczywistość, DPA, transfery, procedury praw osób; konsultacja z IOD/prawnikiem. | Raport + lista pytań prawnych. | Część XIII; PB-PRIV |
| **15. Audyt infrastruktury** | TLS, DNS, hosting, CI/CD, dostęp | testssl.sh, DNS (CAA, SPF/DKIM/DMARC), konta i MFA, CI/CD, monitoring. | Raport. | Część VII, XVI; PB-TLS |
| **16. Weryfikacja backupów** | Odtwarzalność danych | Test odtworzenia do izolowanego środowiska, pomiar RTO/RPO. | Protokół odtworzenia. | Część XVII |
| **17. Analiza wyników** | Priorytetyzacja | Triage (usunięcie fałszywych pozytywów), ocena ryzyka (I.7), wpisy do Risk Register, policzenie statusów. | Risk Register + statystyki. | Część XXV |
| **18. Naprawa błędów** | Usunięcie ryzyk | Zespół naprawia wg priorytetów; każda poprawka z testem regresji (QA-009). | PR-y z linkami do RISK-ID. | — |
| **19. Retesty** | Potwierdzenie napraw | Ponowne wykonanie **tej samej** procedury testowej + test obejścia poprawki; nowy dowód; status FAIL → PASS dopiero po reteście. Retest także punktów powiązanych (np. po zmianie middleware auth — wszystkie AUTHZ-). | Zaktualizowana checklista z nowymi dowodami. | wszystkie |
| **20. Decyzja GO/NO-GO** | Formalna decyzja | Bramki G1–G5, NG-1…NG-9, akceptacje ryzyk, raport końcowy. | Formularz decyzji + raport audytu. | Część XXII, XXIV |

### Procedura retestu po naprawie

1. Developer oznacza naprawę w Risk Register (`Status: Fixed — awaiting retest`) z linkiem do PR i opisem zmiany.
2. Audytor (inna osoba niż autor poprawki) powtarza **oryginalną procedurę testową** i dodatkowo próbuje **obejść poprawkę** (warianty payloadu, inne endpointy z tym samym wzorcem, inne role).
3. Audytor sprawdza **regresję** w obszarze (powiązane punkty kontrolne).
4. Wynik: `PASS` (z nowym dowodem, datą i wersją/commitem) albo powrót do `FAIL` z komentarzem.
5. Dla P0/P1 retest wykonywany na środowisku zbliżonym do produkcji, a po wdrożeniu — potwierdzenie nieinwazyjne na produkcji, jeśli możliwe.

---

# CZĘŚĆ XXIV — Audit Report Template

Gotowy szablon raportu do skopiowania: **[AUDIT-REPORT-TEMPLATE.md](AUDIT-REPORT-TEMPLATE.md)**. Raport musi zawierać: nazwę projektu, wersję/commit, datę, audytora, stack, środowisko, zakres i wyłączenia, liczby PASS/FAIL/N/A/NOT TESTED/BLOCKED, liczby znalezisk P0–P3, najważniejsze ryzyka, rekomendacje, decyzję GO/NO-GO, podpisy/akceptacje. Raport bez listy wyłączeń i bez dowodów dla P0/P1 jest niekompletny.

---

# CZĘŚĆ XXV — Risk Register

Szablon z instrukcją i przykładami: **[RISK-REGISTER-TEMPLATE.md](RISK-REGISTER-TEMPLATE.md)**. Kolumny: ID · opis · komponent · prawdopodobieństwo · wpływ · poziom ryzyka · priorytet · sposób wykrycia · sposób naprawy · właściciel · termin · status · dowód rozwiązania (+ powiązany punkt kontrolny i akceptacja). Każdy `FAIL` z checklisty **musi** mieć wpis; ryzyka zaakceptowane mają datę wygaśnięcia akceptacji.

---

# CZĘŚĆ XXVI — Maintenance after Release

Kalendarz obowiązków z częstotliwościami, właścicielami i dowodami: **[PRODUCTION-MAINTENANCE-CALENDAR.md](PRODUCTION-MAINTENANCE-CALENDAR.md)**.

Zasady:

- Gotowość produkcyjna **wygasa** — checklista jest żywym dokumentem. Po każdej istotnej zmianie (nowa funkcja z danymi, zmiana auth, nowy dostawca, migracja infrastruktury) wykonaj **retest dotkniętych punktów** przed wdrożeniem.
- Pełny przegląd checklisty: **co najmniej raz w roku** oraz przed dużymi kampaniami/premierami.
- Podatności w zależnościach i alerty bezpieczeństwa mają SLA (SCM-003) — ich przekroczenie jest ryzykiem P1 w Risk Register.

---

# KNOWN LIMITATIONS & AUDIT BOUNDARIES

Ten dokument **samodzielnie nie gwarantuje**, że system jest bezpieczny, zgodny z prawem ani wolny od błędów. W szczególności:

1. **Nie zastępuje profesjonalnego testu penetracyjnego.** Checklista prowadzi przez znane klasy podatności; doświadczony pentester łączy słabości w łańcuchy ataku i znajduje błędy specyficzne dla logiki biznesowej, których żadna lista nie przewidzi.
2. **Nie zastępuje audytu prawnego ani opinii IOD.** Punkty prawne weryfikują techniczne wdrożenie obowiązków; o tym, *jakie* obowiązki dotyczą projektu (np. zakres Polskiego Aktu o Dostępności, DPIA, DSA, KSeF, PCI DSS SAQ), decyduje prawnik/IOD/QSA. Przepisy i ich interpretacje zmieniają się (decyzje UODO, orzecznictwo TSUE, wytyczne EROD).
3. **Nie zastępuje audytu infrastruktury i chmury** (hardening OS, sieci, IAM chmury na poziomie CIS Benchmarks dla AWS/GCP/Azure, bezpieczeństwo fizyczne) — część VII obejmuje tylko elementy bezpośrednio związane z aplikacją.
4. **Wynik automatycznego skanera nie jest audytem.** Skanery SAST/DAST/SCA mają fałszywe pozytywy i negatywy; nie wykrywają większości błędów autoryzacji i logiki biznesowej.
5. **Odpowiedzialność współdzielona z dostawcami.** W hostingu zarządzanym (Vercel, Netlify, Supabase, Firebase, Shopify) część zabezpieczeń należy do dostawcy — checklista weryfikuje konfigurację po stronie klienta, a nie implementację dostawcy.
6. **Stan na dzień audytu.** Wynik dotyczy konkretnej wersji (commit) i konfiguracji w dniu testu. Nowe podatności (CVE), zmiany zależności i konfiguracji mogą go unieważnić.
7. **Testy niedestrukcyjne.** Domyślnie dokument nie obejmuje testów DoS, socjotechniki, testów fizycznych ani testów na danych produkcyjnych — chyba że zostały osobno zlecone i zaakceptowane.
8. **Wersje standardów.** Wersje i nazwy zweryfikowano 2026-11-06 (zob. [STANDARDS-AND-REFERENCES.md](STANDARDS-AND-REFERENCES.md)); elementy oznaczone „zweryfikuj” wymagały potwierdzenia, którego nie udało się uzyskać ze źródła pierwotnego w dniu tworzenia dokumentu. Numeracja sekcji standardów (np. rozdziały ASVS 5.0) jest podana na poziomie rozdziałów — przed formalnym raportem zgodności przypisz dokładne identyfikatory wymagań z oficjalnego wydania.
9. **Priorytety są domyślne.** Kontekst (branża, skala, dane szczególne) może wymagać ich podniesienia.

---

# Quality Review dokumentu

<!-- QR-START -->
Przegląd wykonany 2026-11-06 po utworzeniu wszystkich dokumentów (automatyczne sprawdzenia skryptem + przegląd manualny).

**Liczby (główna checklista):**

| Miara | Wartość |
|---|---|
| Punkty kontrolne z unikalnym ID | **526** |
| w tym wiersze-odsyłacze (punkt kontrolowany w innym miejscu, np. `AUTHZ-002 → SEC-003`) | 13 |
| Unikalne kontrole merytoryczne | **513** |
| P0 / P1 / P2 / P3 (wszystkie ID) | **126 / 278 / 118 / 4** |
| P0 / P1 / P2 / P3 (bez odsyłaczy) | 118 / 273 / 118 / 4 |
| Pełne karty (Wymaganie · Dlaczego · Procedura · Oczekiwany wynik · Narzędzia · Źródło · Status · Dowód) | 17 (najbardziej krytyczne obszary); pozostałe w formie tabelarycznej z tymi samymi informacjami w skrócie |

**Wyniki kontroli:**

| Pytanie kontrolne | Wynik |
|---|---|
| Czy wszystkie 26 części zostały utworzone? | ✅ Tak — Części I–XXVI w tym pliku; XXII–XXVI rozwinięte w plikach pomocniczych bez powielania treści. |
| Czy każda sekcja zawiera praktyczne kryteria? | ✅ Każdy punkt ma test/oczekiwany wynik; części XXIV–XXVI odsyłają do gotowych szablonów. |
| Czy punkty mają identyfikatory? | ✅ 526 unikalnych ID, 0 duplikatów (sprawdzone skryptem). |
| Czy odwołania między punktami są poprawne? | ✅ 0 odwołań do nieistniejących ID; wszystkie odwołania `PB-…` istnieją w Playbooku; 0 zepsutych linków między plikami. |
| Czy priorytety są spójne? | ✅ po poprawce — wykryto i poprawiono 2 niespójności w odsyłaczach (SES-008 podniesiony do P0 zgodnie z SEC-005; doprecyzowano AUTH-004). Rozkład jest celowo „ciężki” na P0/P1, bo dokument jest bramką publikacji; P2/P3 obejmują hardening i optymalizacje. |
| Czy nie ma sprzecznych zaleceń? | ✅ Nie znaleziono. Świadome napięcia opisano wprost: blokada konta vs. DoS kont (SEC-021 — preferowane opóźnienia), HSTS `preload` (tylko świadomie), `localStorage` w SDK BaaS (SES-002 — dopuszczone z kompensacją), source mapy publiczne (SEC-034 — dopuszczone jako świadoma decyzja). |
| Czy wymagania warunkowe są oznaczone? | ✅ Oznaczenie `CONDITIONAL` na poziomie części/sekcji lub punktu (81 wystąpień); profil projektu (I.9) mapuje cechy na prefiksy ID. |
| Czy linki prowadzą do oficjalnych dokumentacji? | ✅ Linki w STANDARDS-AND-REFERENCES wskazują strony organizacji wydających standardy (OWASP, NIST, W3C, IETF, EUR-Lex, ISAP, PCI SSC, dostawcy technologii). Linki nie były automatycznie sprawdzane pod kątem dostępności (HTTP 200) — zob. ograniczenia. |
| Czy nie ma zmyślonych wersji standardów? | ✅ Wersje kluczowych standardów potwierdzone wyszukiwaniem 2026-11-06 (OWASP Top 10:2025, ASVS 5.0.0, WSTG 4.2, SSDF 1.1 + projekt Rev. 1, SLSA 1.1/1.2, PKE art. 399, Polski Akt o Dostępności, Next.js 16 `proxy.ts`). Pozostałe oznaczone 🔶/⚠️ jako wymagające weryfikacji. |
| Czy wszystkie krytyczne obszary bezpieczeństwa zostały pokryte? | ✅ 38 obszarów z Części III + AuthN/AuthZ, API (REST/GraphQL/webhooki/zewnętrzne), bazy (SQL/NoSQL/Supabase/Firebase), infrastruktura, frontend, upload, supply chain, logowanie/IR, backup/DR, PWA. |
| Czy dokument jest zrozumiały dla developera? | ✅ Każdy punkt opisuje konkretną czynność i oczekiwany wynik; Playbook zawiera gotowe polecenia i przykładowe testy (Playwright, k6). |
| Czy dokument można wykorzystać w prawdziwym audycie? | ✅ Statusy, dowody, konwencja nazw dowodów, Risk Register, raport, formularz Go/No-Go, procedura retestu. |
| Czy decyzja GO/NO-GO ma jasne kryteria? | ✅ Bramki G1–G5, kryteria blokujące NG-1…NG-9, tabela decyzyjna, zasady akceptacji ryzyka (P0 nieakceptowalne). |
| Czy istnieje procedura ponownego testowania po naprawie? | ✅ Część XXIII („Procedura retestu po naprawie”) + statusy w Risk Register (`Fixed — awaiting retest`). |

**Ograniczenia wymagające ręcznej weryfikacji:** dokładne identyfikatory wymagań ASVS 5.0 (dokument podaje rozdziały, nie numery wymagań); nazwy rozdziałów ASVS V6–V14; aktualna treść SAQ A (PCI DSS 4.0.1 po zmianach z 2025 r.); zakres wyłączeń Polskiego Aktu o Dostępności; organ egzekwujący art. 399 PKE; status finalny NIST SP 800-218 Rev. 1 i SP 800-63-4; harmonogram KSeF i implementacja Dyrektywy 2023/2673 w PL; status EU-US DPF; składnia poleceń CLI narzędzi w wersjach używanych w projekcie (np. osv-scanner v1 vs v2); dostępność linków (nie sprawdzano automatycznie).
<!-- QR-END -->
