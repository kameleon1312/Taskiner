# RISK REGISTER — TEMPLATE

> Rejestr ryzyk projektu. Każdy `FAIL` z [PRODUCTION-READINESS-MASTER-CHECKLIST.md](PRODUCTION-READINESS-MASTER-CHECKLIST.md) **musi** mieć wpis. Metodyka oceny (skala 1–5, macierz, mapowanie na P0–P3): [Część I.7](PRODUCTION-READINESS-MASTER-CHECKLIST.md#i7-zasady-oceny-ryzyka). Akceptacja ryzyka: [PRODUCTION-RELEASE-GO-NO-GO.md — sekcja 4](PRODUCTION-RELEASE-GO-NO-GO.md#4-formularz-akceptacji-ryzyka).
>
> Wersja szablonu: 1.0.0 · 2026-11-06

## Spis treści

- [1. Instrukcja](#1-instrukcja)
- [2. Słowniki pól](#2-słowniki-pól)
- [3. Rejestr](#3-rejestr)
- [4. Przykładowe wpisy](#4-przykładowe-wpisy)
- [5. Przegląd rejestru](#5-przegląd-rejestru)

---

## 1. Instrukcja

1. Skopiuj sekcję **3. Rejestr** do `docs/audit/RISK-REGISTER.md` w projekcie (lub prowadź jako arkusz / tablicę w systemie ticketowym z tymi samymi kolumnami).
2. ID: `RISK-NNN`, nadawane kolejno, nigdy nie używane ponownie.
3. **Poziom ryzyka** = Prawdopodobieństwo × Wpływ (1–25) → Critical / High / Medium / Low → domyślny priorytet P0 / P1 / P2 / P3. Priorytet może zostać podniesiony z uzasadnieniem w kolumnie *Opis*.
4. **Status** zmienia się na `Closed` **tylko** po reteście z nowym dowodem (procedura retestu: checklista, Część XXIII).
5. Nie wpisuj sekretów ani danych osobowych — opisuj ryzyko, linkuj do dowodów w bezpiecznym miejscu.
6. Rejestr jest dokumentem wewnętrznym — szczegóły niezałatanych podatności nie powinny trafiać do publicznego repozytorium (użyj prywatnego repo / Security Advisories / systemu ticketowego z ograniczonym dostępem).

## 2. Słowniki pól

| Pole | Dopuszczalne wartości / format |
|---|---|
| **Komponent** | np. `API /orders`, `Supabase RLS: orders`, `Frontend: checkout`, `CI/CD`, `DNS`, `Proces: reset hasła` |
| **Prawdopodobieństwo (P)** | 1 rzadkie · 2 mało prawdopodobne · 3 możliwe · 4 prawdopodobne · 5 prawie pewne |
| **Wpływ (W)** | 1 pomijalny · 2 niski · 3 średni · 4 wysoki · 5 krytyczny (najwyższy z: poufność, integralność, dostępność, zgodność prawna) |
| **Poziom** | `P×W` + klasa: Critical (16–25) · High (10–15) · Medium (5–9) · Low (1–4) |
| **Priorytet** | P0 · P1 · P2 · P3 |
| **Sposób wykrycia** | Audyt manualny · SAST · DAST · SCA · Skan sekretów · Pentest · Zgłoszenie użytkownika · Incydent · Monitoring · Review |
| **Status** | `Open` · `In progress` · `Fixed — awaiting retest` · `Closed` · `Accepted (do RRRR-MM-DD)` · `Won't fix (uzasadnienie)` · `Duplicate (RISK-…)` |
| **Termin** | data; domyślnie P0: przed release'em · P1: ≤ 30 dni · P2: ≤ 90 dni · P3: przegląd kwartalny |

## 3. Rejestr

| ID | Opis | Komponent | Punkt kontrolny | P | W | Poziom | Priorytet | Sposób wykrycia | Sposób naprawy | Właściciel | Termin | Status | Dowód rozwiązania | Akceptacja (kto / do kiedy) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RISK-001 | | | | | | | | | | | | Open | | — |
| RISK-002 | | | | | | | | | | | | Open | | — |
| RISK-003 | | | | | | | | | | | | Open | | — |

## 4. Przykładowe wpisy

> Przykłady ilustracyjne (fikcyjny projekt) — pokazują oczekiwany poziom szczegółowości.

| ID | Opis | Komponent | Punkt kontrolny | P | W | Poziom | Priorytet | Sposób wykrycia | Sposób naprawy | Właściciel | Termin | Status | Dowód rozwiązania | Akceptacja |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RISK-001 | Użytkownik B może pobrać zamówienie użytkownika A przez `GET /api/orders/{id}` (brak filtra po `owner_id`). Ujawnia adres i telefon. | API /orders | SEC-003 | 5 | 4 | 20 Critical | P0 | Audyt manualny (Burp Autorize) | Filtr `WHERE id=$1 AND owner_id=$session.user` + test regresji QA-005 | J. Kowalska | przed release | Closed | PR #142, test `idor.spec.ts`, retest 2026-11-10 (plik `SEC-003_2026-11-10_staging_retest.har`) | — |
| RISK-002 | Brak rate limitingu na `/api/auth/reset-password` — możliwy spam e-mailowy i koszty wysyłki. | Auth | SEC-020 | 4 | 3 | 12 High | P1 | Audyt manualny | Limit 5/h per e-mail i 20/h per IP + reguła CDN | A. Nowak | 2026-12-05 | Accepted (do 2026-12-05) | — | PO: M. Wiśniewski, 2026-11-06; kompensacja: reguła rate limit w CDN (60/min/IP), alert na wolumen e-maili |
| RISK-003 | `lodash@4.17.x` z podatnością prototype pollution w zależności przechodniej; funkcja podatna nieużywana z danymi wejściowymi. | Zależności | SEC-031 | 2 | 3 | 6 Medium | P2 | SCA (`npm audit`) | Aktualizacja zależności nadrzędnej / `overrides` | A. Nowak | 2027-01-31 | In progress | — | — |

## 5. Przegląd rejestru

| Kiedy | Kto | Co |
|---|---|---|
| Przed każdą decyzją Go/No-Go | Audytor + PO | Brak otwartych P0; P1 naprawione lub zaakceptowane z ważną datą. |
| Co tydzień (w okresie przed premierą) / co miesiąc (po premierze) | Tech Lead | Terminy, przeterminowane pozycje → eskalacja; aktualizacja statusów. |
| Po incydencie | IC / Tech Lead | Dodanie działań naprawczych z postmortem. |
| Przy wygaśnięciu akceptacji | Właściciel ryzyka | Naprawa albo nowa, uzasadniona akceptacja (nie automatyczne przedłużenie). |
