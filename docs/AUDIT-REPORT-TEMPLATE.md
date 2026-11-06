# AUDIT REPORT — TEMPLATE

> Szablon raportu z audytu gotowości produkcyjnej wg [PRODUCTION-READINESS-MASTER-CHECKLIST.md](PRODUCTION-READINESS-MASTER-CHECKLIST.md). Skopiuj do `docs/audit/<RRRR-MM-DD>/AUDIT-REPORT.md` i wypełnij. Sekcje oznaczone *(obowiązkowe)* muszą być wypełnione, aby raport był kompletny.
>
> Wersja szablonu: 1.0.0 · 2026-11-06

---

# Raport z audytu gotowości produkcyjnej — <Nazwa projektu>

## 1. Metryka *(obowiązkowe)*

| Pole | Wartość |
|---|---|
| Nazwa projektu | |
| Wersja / tag / commit SHA | |
| Data audytu (od–do) | |
| Audytor(zy) (imię, rola, niezależność od zespołu) | |
| Zleceniodawca / Product Owner | |
| Stack technologiczny | np. Next.js 16 (App Router), TypeScript, Supabase (Postgres + Auth + Storage), Vercel, Stripe |
| Środowisko testów | np. staging `https://staging.example.com` (commit …); testy pasywne na produkcji `https://example.com` |
| Profil projektu (I.9) | zaznaczone cechy: konta ☐ admin ☐ API ☐ webhooks ☐ upload ☐ płatności ☐ PWA ☐ … |
| Wersja checklisty | PRODUCTION-READINESS-MASTER-CHECKLIST 1.0.0 |
| Zgoda na testy (link / data / zakres) | |

## 2. Zakres i wyłączenia *(obowiązkowe)*

**W zakresie:** …

**Wyłączenia** (każde z uzasadnieniem i wpływem na wiarygodność oceny):

| Obszar wyłączony | Powód | Wpływ / rekomendacja |
|---|---|---|
| np. Testy obciążeniowe | Brak środowiska o parametrach produkcji | Ryzyko wydajności nieocenione — PERF-050 = BLOCKED |
| np. Formalna ocena PCI DSS | Poza kompetencją audytu technicznego | Wymagany SAQ z operatorem |

**Ograniczenia metodyczne:** (np. brak dostępu do kodu infrastruktury, testy tylko kontami roli „user” i „admin”, brak testów na iOS) …

## 3. Podsumowanie dla kierownictwa *(obowiązkowe)*

- **Decyzja rekomendowana:** ☐ READY ☐ READY WITH ACCEPTED RISKS ☐ NOT READY ☐ BLOCKED
- **Najważniejsze wnioski (3–5 zdań, język nietechniczny):** …
- **Kryteria blokujące NG-1…NG-9 obecne:** ☐ nie ☐ tak — które: …

## 4. Statystyki *(obowiązkowe)*

### 4.1 Statusy punktów kontrolnych (mających zastosowanie + N/A)

| Priorytet | PASS | FAIL | N/A | NOT TESTED | BLOCKED | Razem | Readiness % = PASS/(PASS+FAIL+NOT TESTED) |
|---|---|---|---|---|---|---|---|
| P0 | | | | | | | |
| P1 | | | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |
| **Suma** | | | | | | | |

### 4.2 Znaleziska (Risk Register) wg priorytetu

| Priorytet | Otwarte | Naprawione i zretestowane | Zaakceptowane | Razem |
|---|---|---|---|---|
| P0 | | | — (niedozwolone) | |
| P1 | | | | |
| P2 | | | | |
| P3 | | | | |

### 4.3 Wyniki per obszar

| Część checklisty | PASS | FAIL | N/A | NOT TESTED | BLOCKED | Uwagi |
|---|---|---|---|---|---|---|
| II Architektura i kod | | | | | | |
| III Application Security | | | | | | |
| IV AuthN/AuthZ | | | | | | |
| V API | | | | | | |
| VI Bazy danych | | | | | | |
| VII Infrastruktura | | | | | | |
| VIII Frontend | | | | | | |
| IX Wydajność | | | | | | |
| X Testy/QA | | | | | | |
| XI Dostępność | | | | | | |
| XII SEO | | | | | | |
| XIII Prywatność/prawo | | | | | | |
| XIV E-commerce/płatności | | | | | | |
| XV Upload/storage | | | | | | |
| XVI Logi/monitoring/IR | | | | | | |
| XVII Backup/DR | | | | | | |
| XVIII Supply chain | | | | | | |
| XIX PWA/mobile | | | | | | |
| XX Technologie | | | | | | |
| XXI Release | | | | | | |

## 5. Najważniejsze ryzyka *(obowiązkowe)*

| # | RISK-ID | Punkt | Priorytet | Opis (skrót) | Wpływ biznesowy | Status |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

## 6. Szczegóły znalezisk

> Jeden blok na znalezisko P0/P1 (P2/P3 — wystarczy wpis w Risk Register).

```markdown
### <RISK-ID> — <tytuł>
- Punkt kontrolny: SEC-…        Priorytet: P…     Poziom ryzyka: P×W = …
- Komponent / lokalizacja: endpoint, plik, konfiguracja
- Opis: co jest nie tak
- Kroki reprodukcji: 1… 2… 3… (konta testowe, środowisko)
- Dowód: link (zamaskowane tokeny i dane osobowe)
- Wpływ: co może zrobić atakujący / co się stanie przy awarii
- Rekomendacja: konkretna poprawka + test regresji
- Odniesienia: OWASP ASVS / WSTG / CWE
- Retest: data, wynik, dowód
```

## 7. Rekomendacje *(obowiązkowe)*

| Horyzont | Rekomendacja | Powiązane punkty |
|---|---|---|
| Przed publikacją | | |
| ≤ 30 dni | | |
| ≤ 90 dni | | |
| Strategiczne (proces, narzędzia, szkolenia) | | |

## 8. Dowody i artefakty

| Artefakt | Lokalizacja | Wersja narzędzia / komenda |
|---|---|---|
| Raport SCA | | |
| Raport SAST (SARIF) | | |
| Skan sekretów | | |
| ZAP baseline | | |
| Lighthouse / axe | | |
| testssl.sh | | |
| SBOM | | |
| Protokół testu odtworzenia backupu | | |
| Protokół testu rollbacku | | |
| Wypełniona checklista | | |

## 9. Decyzja GO/NO-GO *(obowiązkowe)*

Formularz decyzji: [PRODUCTION-RELEASE-GO-NO-GO.md](PRODUCTION-RELEASE-GO-NO-GO.md) — link do wypełnionego egzemplarza: …

| Decyzja | ☐ READY ☐ READY WITH ACCEPTED RISKS ☐ NOT READY ☐ BLOCKED |
|---|---|
| Uzasadnienie | |
| Zaakceptowane ryzyka (RISK-ID, terminy) | |
| Warunki (np. naprawa RISK-00X do daty) | |
| Termin kolejnego audytu / retestu | |

## 10. Podpisy / akceptacja *(obowiązkowe)*

| Rola | Imię i nazwisko | Data | Podpis / zatwierdzenie |
|---|---|---|---|
| Audytor | | | |
| Tech Lead | | | |
| Product Owner (decyzja) | | | |
| IOD / prawnik (jeśli oceniał część prawną) | | | |

---

*Raport dotyczy wyłącznie wskazanej wersji i konfiguracji w dniu audytu. Nie stanowi porady prawnej ani nie zastępuje testu penetracyjnego — zob. „Known Limitations & Audit Boundaries” w checkliście.*
