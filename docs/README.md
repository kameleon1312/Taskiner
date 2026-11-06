# Production Readiness & Security — zestaw audytowy

Uniwersalny standard sprawdzania, czy aplikacja webowa jest gotowa do publikacji: bezpieczeństwo, jakość, wydajność, dostępność, SEO, prywatność, backup i utrzymanie. Zestaw jest niezależny od technologii — punkty specyficzne dla stosu są oznaczone `CONDITIONAL`.

## Zawartość

| Plik | Do czego służy |
|---|---|
| [PRODUCTION-READINESS-MASTER-CHECKLIST.md](PRODUCTION-READINESS-MASTER-CHECKLIST.md) | **Główna checklista** — 26 części, punkty kontrolne z ID, priorytety P0–P3, statusy i dowody. Zacznij tutaj. |
| [SECURITY-TESTING-PLAYBOOK.md](SECURITY-TESTING-PLAYBOOK.md) | Procedury testów i polecenia CLI (`PB-…`), przykładowe testy i pipeline CI. |
| [PRODUCTION-RELEASE-GO-NO-GO.md](PRODUCTION-RELEASE-GO-NO-GO.md) | Formularz decyzji o publikacji i akceptacji ryzyka. |
| [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md) | Plan reagowania na incydenty (w tym naruszenia RODO). |
| [RISK-REGISTER-TEMPLATE.md](RISK-REGISTER-TEMPLATE.md) | Szablon rejestru ryzyk. |
| [AUDIT-REPORT-TEMPLATE.md](AUDIT-REPORT-TEMPLATE.md) | Szablon raportu z audytu. |
| [PRODUCTION-MAINTENANCE-CALENDAR.md](PRODUCTION-MAINTENANCE-CALENDAR.md) | Obowiązki po publikacji (tydzień / miesiąc / kwartał / rok). |
| [STANDARDS-AND-REFERENCES.md](STANDARDS-AND-REFERENCES.md) | Wersje standardów, oficjalne linki, status weryfikacji. |

## Jak użyć w nowym projekcie

1. **Skopiuj** cały katalog `docs/` (te 9 plików) do repozytorium nowego projektu — do jego katalogu `docs/`.
   Jeżeli projekt ma już inną dokumentację w `docs/`, użyj podkatalogu, np. `docs/production-readiness/` (linki między plikami są względne, więc działają w dowolnym katalogu).
2. **Nie edytuj szablonów** — wypełniane egzemplarze trzymaj osobno, per audyt:

   ```text
   docs/
   ├── README.md, *.md                   ← szablony standardu (bez zmian)
   └── audit/
       ├── RISK-REGISTER.md              ← żywy rejestr ryzyk projektu
       └── 2026-11-06/                   ← jeden katalog na audyt
           ├── CHECKLIST.md              ← kopia głównej checklisty z wypełnionymi statusami
           ├── AUDIT-REPORT.md
           ├── GO-NO-GO.md
           └── evidence/                 ← raporty narzędzi, zrzuty, protokoły (bez sekretów!)
   ```

3. **Zaznacz profil projektu** (checklista, sekcja I.9) — punkty `CONDITIONAL` dla nieobecnych technologii oznacz `N/A` z uzasadnieniem.
4. Przejdź **plan audytu** (Część XXIII), zapisuj dowody, każdy `FAIL` wpisz do rejestru ryzyk.
5. Podejmij decyzję wg **GO-NO-GO** i wypełnij raport.
6. Po publikacji realizuj **kalendarz utrzymania**.

> 🔒 Wypełnione audyty mogą opisywać niezałatane podatności. W repozytoriach **publicznych** nie commituj katalogu `docs/audit/` — trzymaj go w prywatnym repo, w GitHub Security Advisories lub w systemie ticketowym.

## Aktualizacje standardu

Ten zestaw ma wersję (nagłówek głównej checklisty) i datę weryfikacji standardów. Przy kopiowaniu do kolejnych projektów zawsze bierz **najnowszą wersję** z repozytorium źródłowego; przegląd i aktualizacja — co najmniej raz w roku (procedura w STANDARDS-AND-REFERENCES, sekcja 11).

Dokument nie stanowi porady prawnej i nie zastępuje testu penetracyjnego — zob. „Known Limitations & Audit Boundaries” w głównej checkliście.
