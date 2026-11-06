# PRODUCTION RELEASE — GO / NO-GO

> Formularz i procedura decyzji o publikacji. Reguły wiążące (kryteria NG-1…NG-9, bramki G1–G5, priorytety) są zdefiniowane w [PRODUCTION-READINESS-MASTER-CHECKLIST.md — Część XXII](PRODUCTION-READINESS-MASTER-CHECKLIST.md#część-xxii--production-go--no-go) i [Części I.4](PRODUCTION-READINESS-MASTER-CHECKLIST.md#i4-model-oceny-gotowości-produkcyjnej). Ten plik ich nie powiela — służy do **wypełnienia** dla konkretnego release'u.
>
> Wersja szablonu: 1.0.0 · 2026-11-06

## Spis treści

- [1. Kiedy wypełniać](#1-kiedy-wypełniać)
- [2. Przebieg spotkania / decyzji](#2-przebieg-spotkania--decyzji)
- [3. Formularz decyzji](#3-formularz-decyzji)
- [4. Formularz akceptacji ryzyka](#4-formularz-akceptacji-ryzyka)
- [5. Skrócona bramka dla małych zmian](#5-skrócona-bramka-dla-małych-zmian)
- [6. Po decyzji](#6-po-decyzji)

---

## 1. Kiedy wypełniać

| Typ release'u | Zakres oceny |
|---|---|
| **Pierwsze wydanie produkcyjne** | Pełna checklista + pełny formularz (sekcja 3). |
| **Duża zmiana** (nowy moduł z danymi, zmiana auth/płatności/infrastruktury, nowy dostawca przetwarzający dane, migracja bazy z utratą kompatybilności) | Retest dotkniętych części checklisty + pełny formularz. |
| **Mała zmiana** (UI, treści, poprawki bez zmian w auth/danych/zależnościach krytycznych) | Skrócona bramka (sekcja 5). |
| **Hotfix bezpieczeństwa** | Procedura REL-024 + skrócona bramka + retest podatności; formularz uzupełniany po wdrożeniu (≤ 2 dni robocze). |

## 2. Przebieg spotkania / decyzji

1. **Audytor / Tech Lead** przedstawia statystyki statusów i znaleziska (z [AUDIT-REPORT-TEMPLATE.md](AUDIT-REPORT-TEMPLATE.md)).
2. Sprawdzenie **kryteriów NG-1…NG-9** — jeśli którekolwiek spełnione → decyzja **NOT READY** (lub BLOCKED), koniec.
3. Przegląd każdego **FAIL P1**: naprawa przed release'em czy akceptacja ryzyka (sekcja 4)?
4. Sprawdzenie **bramek G1–G5**.
5. Potwierdzenie gotowości operacyjnej: rollback, monitoring, dyżur, komunikacja.
6. **Decyzja** i podpisy. Zapis w repozytorium (`docs/audit/<data>/GO-NO-GO.md`) lub w systemie ticketowym z linkiem.

## 3. Formularz decyzji

```markdown
# Go/No-Go — <Nazwa projektu> <wersja>

| Pole | Wartość |
|---|---|
| Projekt | |
| Wersja / tag / commit SHA | |
| Środowisko docelowe | production |
| Planowana data i okno wdrożenia | |
| Właściciel release'u (REL-021) | |
| Osoba dyżurna po wdrożeniu | |
| Raport audytu (link) | |

## A. Statystyki checklisty (punkty mające zastosowanie)

| Priorytet | PASS | FAIL | N/A | NOT TESTED | BLOCKED |
|---|---|---|---|---|---|
| P0 | | | | | |
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |

## B. Kryteria blokujące (zaznacz, jeśli WYSTĘPUJE)

- [ ] NG-1 Nierozwiązany / nieprzetestowany P0
- [ ] NG-2 Krytyczny problem z autoryzacją
- [ ] NG-3 Ujawnione, niezrotowane sekrety
- [ ] NG-4 Dane użytkowników dostępne bez uprawnień
- [ ] NG-5 Nieprawidłowy HTTPS/TLS
- [ ] NG-6 Niedziałający krytyczny proces biznesowy
- [ ] NG-7 Brak zweryfikowanego backupu danych krytycznych
- [ ] NG-8 Poważne ryzyko utraty danych
- [ ] NG-9 Niespełnione blokujące obowiązki prawne

> Jeśli zaznaczono którekolwiek pole → decyzja: NOT READY lub BLOCKED.

## C. Bramki

| Bramka | Spełniona? | Komentarz |
|---|---|---|
| G1 Brak blokerów (P0) | ☐ tak ☐ nie | |
| G2 Ryzyka P1 naprawione lub zaakceptowane | ☐ tak ☐ nie | |
| G3 Pokrycie P1 ≥ 90 % (PASS/N/A z uzasadnieniem) | ☐ tak ☐ nie | |
| G4 Dowody dla P0/P1 | ☐ tak ☐ nie | |
| G5 Operacyjność (monitoring, alerty, backup z testem, rollback) | ☐ tak ☐ nie | |

## D. Gotowość operacyjna (potwierdź)

- [ ] Rollback przetestowany; czas rollbacku: ____ min (REL-007, INF-024)
- [ ] Backup wykonany tuż przed wdrożeniem / przed migracją (REL-005)
- [ ] Smoke testy po wdrożeniu przygotowane (QA-010, REL-020)
- [ ] Monitoring i alerty aktywne, osoba dyżurna dostępna (LOG-010…LOG-016)
- [ ] Zmienne środowiskowe i klucze produkcyjne zweryfikowane (REL-004, PAY-007)
- [ ] Komunikacja do użytkowników / supportu przygotowana (jeśli potrzebna)
- [ ] Plan reakcji na incydent znany zespołowi (LOG-020)

## E. Ryzyka zaakceptowane (lista RISK-ID z formularzami z sekcji 4)

| RISK-ID | Punkt kontrolny | Priorytet | Termin naprawy | Akceptujący |
|---|---|---|---|---|
| | | | | |

## F. Decyzja

☐ **READY** ☐ **READY WITH ACCEPTED RISKS** ☐ **NOT READY** ☐ **BLOCKED**

Uzasadnienie: ...

| Rola | Imię i nazwisko | Decyzja / opinia | Data | Podpis / zatwierdzenie (link) |
|---|---|---|---|---|
| Product Owner (decyzja) | | | | |
| Tech Lead | | | | |
| Audytor / Security | | | | |
| IOD / prawnik (jeśli dotyczy) | | | | |
```

## 4. Formularz akceptacji ryzyka

> Dopuszczalny **wyłącznie** dla ryzyk bez kryteriów NG (zwykle FAIL P1 lub P2). P0 nie podlega akceptacji.

```markdown
# Akceptacja ryzyka — RISK-<NNN>

| Pole | Wartość |
|---|---|
| Punkt kontrolny | np. SEC-020 |
| Opis niezgodności | |
| Scenariusz ataku / awarii | kto, jak, z jakim skutkiem |
| Ocena ryzyka (P × W) | np. 3 × 4 = 12 (High) |
| Dlaczego nie naprawiamy przed release'em | |
| Środki kompensujące (wdrożone przed release'em) | np. reguła WAF, limit w CDN, feature flag, dodatkowy alert |
| Monitoring ryzyka | jaki alert/metryka wykryje materializację |
| Plan naprawy i termin | data (P1: ≤ 30 dni) |
| Data wygaśnięcia akceptacji | |
| Właściciel ryzyka (akceptujący) | imię, rola |
| Opinia security / IOD (jeśli dotyczy) | |

Oświadczam, że rozumiem opisane ryzyko i akceptuję je do daty wygaśnięcia akceptacji.
Podpis / zatwierdzenie: ____________________  Data: __________
```

Zasady: akceptujący ≠ autor zmiany; po dacie wygaśnięcia ryzyko staje się blokujące przy kolejnym release'ie; każda akceptacja ma wpis w [RISK-REGISTER-TEMPLATE.md](RISK-REGISTER-TEMPLATE.md).

## 5. Skrócona bramka dla małych zmian

Wszystkie odpowiedzi muszą brzmieć „tak” albo „nie dotyczy” — w przeciwnym razie użyj pełnego formularza.

- [ ] Zmiana nie dotyka uwierzytelniania, autoryzacji, płatności, uploadu, danych osobowych ani schematu bazy.
- [ ] Brak nowych zależności lub nowe zależności przeszły ocenę (SCM-004) i skan (SCM-002).
- [ ] CI zielone: lint, typecheck, testy, build, skan zależności i sekretów (ARC-031).
- [ ] Code review wykonane przez drugą osobę (ARC-030).
- [ ] Brak nowych skryptów zewnętrznych / trackerów (FE-006, PRIV-020) — lub przeszły zgodę.
- [ ] Smoke testy po wdrożeniu (QA-010) i możliwość rollbacku (REL-007).
- [ ] Brak otwartych ryzyk P0 i przeterminowanych akceptacji ryzyka w Risk Register.

Decyzja: ☐ GO ☐ NO-GO — zatwierdził: __________ data: __________

## 6. Po decyzji

| Decyzja | Następne kroki |
|---|---|
| READY / READY WITH ACCEPTED RISKS | Wdrożenie wg Części XXI → post-deployment verification (REL-020) → aktualizacja statusów i Risk Register (REL-025) → monitorowanie terminów naprawy ryzyk. |
| NOT READY | Naprawy wg priorytetów → retest (procedura w Części XXIII) → ponowna decyzja. |
| BLOCKED | Usunięcie przyczyny blokady (dostęp, zgoda, informacja prawna) → dokończenie testów → ponowna decyzja. |
