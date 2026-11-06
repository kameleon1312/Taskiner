# PRODUCTION MAINTENANCE CALENDAR

> Obowiązki po publikacji — realizacja [Części XXVI](PRODUCTION-READINESS-MASTER-CHECKLIST.md#część-xxvi--maintenance-after-release) checklisty. Gotowość produkcyjna wygasa: bez tych działań wynik audytu traci aktualność.
>
> Wersja szablonu: 1.0.0 · 2026-11-06

## Spis treści

- [1. Jak używać](#1-jak-używać)
- [2. Codziennie / ciągle (automatycznie)](#2-codziennie--ciągle-automatycznie)
- [3. Co tydzień](#3-co-tydzień)
- [4. Co miesiąc](#4-co-miesiąc)
- [5. Co kwartał](#5-co-kwartał)
- [6. Co pół roku i co rok](#6-co-pół-roku-i-co-rok)
- [7. Zdarzeniowo (po zmianach)](#7-zdarzeniowo-po-zmianach)
- [8. SLA reakcji](#8-sla-reakcji)
- [9. Rejestr wykonania](#9-rejestr-wykonania)

---

## 1. Jak używać

- Każdemu zadaniu przypisz **właściciela** (kolumna *Kto* to rola domyślna) i utwórz cykliczne zadanie w kalendarzu/systemie ticketowym.
- Po wykonaniu zapisz **dowód** w rejestrze (sekcja 9). Zadanie bez dowodu traktuj jako niewykonane.
- Częstotliwości są **minimalne** dla typowej aplikacji z danymi użytkowników; dla systemów o wysokim ryzyku (płatności, dane szczególne) skróć je.
- Znaleziska z przeglądów → [RISK-REGISTER-TEMPLATE.md](RISK-REGISTER-TEMPLATE.md).

## 2. Codziennie / ciągle (automatycznie)

| Zadanie | Kto | Narzędzie / sposób | Dowód | Punkty |
|---|---|---|---|---|
| Alerty błędów, uptime, wydajności — reakcja wg SEV | Dyżurny | Sentry / uptime / APM | Historia alertów | LOG-010…LOG-012 |
| Alerty bezpieczeństwa (logowania, 403, webhooki) | Dyżurny / Security | Logi + reguły alertów | Historia alertów | LOG-013 |
| Status backupów (alert przy niepowodzeniu) | DevOps | Monitoring backupów | Log backupów | BCK-011 |
| Alerty podatności zależności (Dependabot/Snyk/OSV) — triage | Tech Lead | GitHub alerts | Status alertów | SCM-002 |
| `CONDITIONAL: płatności` — rekoncyliacja zamówień z operatorem | Operacje / dev | Raport | Raport dzienny | LOG-015 |

## 3. Co tydzień

| Zadanie | Kto | Sposób | Dowód | Punkty |
|---|---|---|---|---|
| Przegląd nowych błędów w error trackerze (top 10, regresje po release) | Tech Lead | Sentry | Notatka / tickety | LOG-010 |
| Merge PR-ów z aktualizacjami zależności (patch/minor) po przejściu CI | Dev | Dependabot / Renovate | Historia PR | SCM-003 |
| Przegląd logów bezpieczeństwa pod kątem anomalii (nieudane logowania, nowe konta admin, odrzucone webhooki) | Security / Tech Lead | Logi | Notatka | LOG-002, LOG-013 |
| Kontrola kosztów i limitów usług (BaaS, hosting, API zewnętrzne, e-mail/SMS) | DevOps / PO | Panele dostawców | Zrzut / notatka | EXT-006, FIRE-007 |
| Przegląd Risk Register — terminy | Tech Lead | Rejestr | Zaktualizowany rejestr | XXV |

## 4. Co miesiąc

| Zadanie | Kto | Sposób | Dowód | Punkty |
|---|---|---|---|---|
| Pełny skan: `npm audit --omit=dev`, `osv-scanner`, Gitleaks (repo), Semgrep | Tech Lead | PB-SCA, PB-SECRETS, PB-SAST | Raporty | SEC-031, ARC-020 |
| Monitoring wydajności: CrUX/PSI dla kluczowych stron, p95 API, wolne zapytania | Dev | PB-PERF-02, APM, `pg_stat_statements` | Raport / wykres | PERF-001…004, PERF-040 |
| Przegląd nagłówków i TLS (pasywnie) | DevOps | PB-HDR-01, PB-TLS-01 | Wynik Observatory / testssl | HDR-, INF-002 |
| Przegląd reguł alertów (szum, brakujące alerty) | Tech Lead | — | Notatka | LOG-018 |
| Przegląd Search Console / Bing (błędy indeksowania, bezpieczeństwo, CWV) | PO / Dev | GSC | Zrzut | SEO-030 |
| Weryfikacja zgodności skryptów zewnętrznych z inwentarzem i zgodami (nowe tagi w GTM?) | Dev / Marketing | PB-PRIV-01 | Wynik testu | FE-006, PRIV-020 |
| Przegląd żądań osób (RODO) — terminy dotrzymane | IOD / PO | Rejestr żądań | Rejestr | PRIV-050 |

## 5. Co kwartał

| Zadanie | Kto | Sposób | Dowód | Punkty |
|---|---|---|---|---|
| **Test odtworzenia backupu** (izolowane środowisko, pomiar RTO/RPO) | DevOps | BCK-010 | Protokół | BCK-010 |
| **Przegląd uprawnień**: konta admin w aplikacji, członkowie hostingu/BaaS/DNS/GitHub/GTM/operatora płatności, klucze API, deploy keys, tokeny PAT; usunięcie zbędnych; MFA wymuszone | Tech Lead + PO | Panele | Lista z datą przeglądu | ADM-006, INF-026, SCM-011 |
| Aktualizacje major zależności i runtime (Node.js LTS, framework) — plan i wykonanie | Tech Lead | Changelogi, testy | PR | SCM-003, NODE-001 |
| Retest kluczowych kontroli bezpieczeństwa: IDOR na głównych zasobach, nagłówki, CORS, RLS/Rules, endpointy techniczne | Security | PB-AUTHZ, PB-SUPA/PB-FIRE, PB-RECON-03 | Raport | SEC-003, SUPA-001, SEC-035 |
| Testy regresji dostępności (axe + szybki test klawiaturą ścieżek krytycznych) | Dev / QA | PB-A11Y | Raport | A11Y- |
| OpenSSF Scorecard / przegląd workflow CI | Tech Lead | PB-SCA-06/07 | Wynik | SCM-009, SCM-013 |
| Przegląd retencji danych i logów (czy joby usuwające działają) | Dev + IOD | Zapytania kontrolne | Notatka | DB-011, PRIV-053, LOG-006 |
| Przegląd kontaktów i ról w planie IR | Tech Lead | — | Zaktualizowany plan | LOG-020 |

## 6. Co pół roku i co rok

| Zadanie | Częstotliwość | Kto | Dowód | Punkty |
|---|---|---|---|---|
| Przegląd polityki prywatności, polityki cookies, regulaminu vs. stan faktyczny (nowi dostawcy, nowe cele) **[PRAWNIK/IOD]** | co 6 mies. i przy zmianach | IOD / PO | Wersja dokumentów z datą | PRIV-002, PRIV-024, PRIV-072 |
| Przegląd DPA i lokalizacji danych u dostawców, aktualność podstaw transferu (np. status EU-US DPF) **[PRAWNIK/IOD]** | co 12 mies. | IOD | Lista dostawców | PRIV-040, PRIV-041 |
| Ćwiczenie incident response (tabletop) + ćwiczenie DR | co 12 mies. | IC / DevOps | Protokół | LOG-021, BCK-012 |
| **Pełny audyt wg checklisty** (lub przed dużą kampanią/premierą) | co 12 mies. | Audytor | Raport audytu | całość |
| Test penetracyjny zewnętrzny `CONDITIONAL: dane wrażliwe / płatności / wymóg klienta` | co 12 mies. lub po dużych zmianach | Zewnętrzny pentester | Raport | — |
| Walidacja PCI DSS (SAQ) `CONDITIONAL: płatności kartowe` | co 12 mies. | PO + operator/QSA | SAQ + AOC | PAY-009 |
| Przegląd threat modelu i diagramu architektury | co 12 mies. lub po zmianie architektury | Architekt | Zaktualizowany dokument | ARC-001, ARC-002 |
| Przegląd RPO/RTO z biznesem | co 12 mies. | PO + DevOps | Zatwierdzone wartości | BCK-001 |
| Przegląd wersji standardów w [STANDARDS-AND-REFERENCES.md](STANDARDS-AND-REFERENCES.md) i aktualizacja checklisty | co 12 mies. | Właściciel standardu | Nowa wersja dokumentu | — |
| Odnowienie domen (auto-renew aktywny), przegląd rekordów DNS (wiszące CNAME) | co 12 mies. | DevOps | Zrzut | INF-005, INF-007 |
| Certyfikaty TLS — weryfikacja automatyzacji odnawiania (cykle ważności skracają się) | co 6 mies. | DevOps | Data ostatniego odnowienia | INF-004 |

## 7. Zdarzeniowo (po zmianach)

| Zdarzenie | Wymagane działanie |
|---|---|
| Nowa funkcja przetwarzająca dane osobowe | Aktualizacja PRIV-001, polityki prywatności; ocena DPIA (PRIV-004); testy AuthZ (SEC-003) dla nowych zasobów. |
| Zmiana uwierzytelniania / autoryzacji / middleware | Retest całej Części IV i SEC-003/007/008. |
| Nowy dostawca / integracja | EXT-, PRIV-040/041, inwentarz skryptów (FE-006). |
| Nowa tabela / kolekcja / bucket | SUPA-001/002 lub FIRE-001/002, FILE-006; testy anonimowego atakującego. |
| Migracja infrastruktury / hostingu | Część VII w całości, BCK-, REL-. |
| Krytyczna podatność w zależności lub frameworku (np. ogłoszenie CVE) | Ocena osiągalności w ≤ 24 h, poprawka w SLA (sekcja 8), retest. |
| Incydent SEV1/SEV2 | Postmortem, aktualizacja planu IR i Risk Register. |
| Zmiana przepisów / wytycznych (UODO, EROD, EAA, PCI SSC) | Ocena z prawnikiem/IOD; aktualizacja checklisty. |

## 8. SLA reakcji

| Kategoria | Termin (domyślny — dostosuj) |
|---|---|
| Podatność Critical osiągalna w produkcji / aktywnie wykorzystywana | mitygacja ≤ 24 h, poprawka ≤ 7 dni |
| Podatność High | ≤ 30 dni |
| Podatność Medium | ≤ 90 dni |
| Podatność Low | przegląd kwartalny |
| Sekret ujawniony | rotacja natychmiast (≤ 1 h od wykrycia) |
| Certyfikat wygasa | odnowienie ≥ 14 dni przed |
| Nieudany backup | naprawa ≤ 1 dzień roboczy |

## 9. Rejestr wykonania

| Data | Zadanie | Wykonał | Wynik (OK / problemy) | Dowód (link) | RISK-ID (jeśli powstał) |
|---|---|---|---|---|---|
| | | | | | |
