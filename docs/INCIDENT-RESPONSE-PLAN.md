# INCIDENT RESPONSE PLAN

> Plan reagowania na incydenty bezpieczeństwa i awarie produkcyjne. Realizuje punkty LOG-020…LOG-024 i PRIV-060 z [PRODUCTION-READINESS-MASTER-CHECKLIST.md](PRODUCTION-READINESS-MASTER-CHECKLIST.md).
>
> | Pole | Wartość |
> |---|---|
> | Wersja szablonu | 1.0.0 (2026-11-06) |
> | Oparty na | NIST SP 800-61 Rev. 3 (2025) — reagowanie na incydenty w ujęciu NIST CSF 2.0; RODO art. 33–34; Google SRE — Incident Management |
> | Wypełnij przed premierą | sekcje 2 (kontakty), 3 (role), 9 (runbooki) |

> ⚖️ Elementy prawne (zgłoszenia naruszeń, komunikacja do osób, obowiązki sektorowe np. NIS2 / krajowy system cyberbezpieczeństwa) wymagają potwierdzenia przez prawnika/IOD dla konkretnej organizacji.

## Spis treści

- [1. Zakres i definicje](#1-zakres-i-definicje)
- [2. Kontakty](#2-kontakty)
- [3. Role](#3-role)
- [4. Poziomy ważności (SEV)](#4-poziomy-ważności-sev)
- [5. Cykl obsługi incydentu](#5-cykl-obsługi-incydentu)
- [6. Naruszenie ochrony danych osobowych (RODO)](#6-naruszenie-ochrony-danych-osobowych-rodo)
- [7. Komunikacja](#7-komunikacja)
- [8. Rollback i odtwarzanie](#8-rollback-i-odtwarzanie)
- [9. Runbooki scenariuszy](#9-runbooki-scenariuszy)
- [10. Postmortem](#10-postmortem)
- [11. Ćwiczenia i utrzymanie planu](#11-ćwiczenia-i-utrzymanie-planu)

---

## 1. Zakres i definicje

| Termin | Definicja |
|---|---|
| **Zdarzenie** | Każda obserwowalna anomalia (alert, zgłoszenie użytkownika, nietypowy log). |
| **Incydent** | Zdarzenie, które narusza lub realnie zagraża poufności, integralności lub dostępności systemu/danych albo uniemożliwia działanie krytycznego procesu. |
| **Naruszenie ochrony danych osobowych** | Naruszenie bezpieczeństwa prowadzące do przypadkowego lub niezgodnego z prawem zniszczenia, utracenia, zmodyfikowania, nieuprawnionego ujawnienia lub dostępu do danych osobowych (RODO art. 4 pkt 12). Obejmuje też utratę dostępności (np. ransomware, usunięcie bazy bez kopii). |
| **Incident Commander (IC)** | Osoba kierująca obsługą incydentu; podejmuje decyzje operacyjne. |

Plan obejmuje: awarie (niedostępność, degradacja, utrata danych), incydenty bezpieczeństwa (włamanie, wyciek, przejęcie kont, nadużycia, złośliwe zależności), naruszenia danych osobowych, incydenty u dostawców wpływające na system.

## 2. Kontakty

> Uzupełnij przed premierą. Przechowuj kopię **poza** systemem, którego dotyczy plan (np. wydruk / menedżer haseł zespołu), bo podczas incydentu może on być niedostępny.

| Rola / podmiot | Osoba / kanał | Telefon | E-mail / link | Zastępca |
|---|---|---|---|---|
| Incident Commander (domyślny) | | | | |
| Tech Lead / właściciel systemu | | | | |
| DevOps / dostęp do infrastruktury | | | | |
| Product Owner (decyzje biznesowe) | | | | |
| IOD / osoba ds. ochrony danych | | | | |
| Prawnik | | | | |
| Hosting (np. Vercel/Netlify) — support | | | status page: | |
| Baza / BaaS (np. Supabase/Firebase) — support | | | status page: | |
| Operator płatności — support / fraud | | | | |
| Rejestrator domeny / DNS | | | | |
| CERT Polska (zgłaszanie incydentów) | — | — | incydent.cert.pl | — |
| Prezes UODO (zgłoszenie naruszenia) | — | — | uodo.gov.pl (formularz zgłoszenia naruszenia) | — |

## 3. Role

| Rola | Odpowiedzialność |
|---|---|
| **Incident Commander (IC)** | Ogłasza SEV, koordynuje, deleguje zadania, podejmuje decyzje (rollback, wyłączenie funkcji), pilnuje osi czasu. Nie musi sam naprawiać. |
| **Ops / Tech lead** | Diagnoza, mitygacja, naprawa, rollback, zabezpieczenie dowodów. |
| **Komunikacja (Comms)** | Strona statusu, komunikaty do użytkowników, klientów, supportu; uzgadnia treści z IC i prawnikiem. |
| **Scribe** | Prowadzi oś czasu (kto, co, kiedy) — podstawa postmortem i ewentualnego zgłoszenia do UODO. |
| **IOD / prawnik** | Ocena, czy doszło do naruszenia danych osobowych, obowiązki zgłoszeniowe, treść zawiadomień. |

W małym zespole jedna osoba może pełnić kilka ról, ale **IC i Scribe** powinny być wyznaczone jawnie na początku incydentu.

## 4. Poziomy ważności (SEV)

| SEV | Kryteria (dowolne spełnione) | Przykłady | Czas reakcji (cel) | Eskalacja |
|---|---|---|---|---|
| **SEV1 — krytyczny** | Wyciek lub realne zagrożenie wycieku danych; przejęcie kont/systemu; całkowita niedostępność; utrata danych; błędne płatności na dużą skalę. | Publiczny bucket z dokumentami klientów; sekret `service_role` w bundlu; baza usunięta; złośliwa zależność w produkcji. | ≤ 15 min, praca ciągła do mitygacji | IC + Tech Lead + PO + IOD natychmiast |
| **SEV2 — wysoki** | Istotna degradacja krytycznego procesu; podatność wysokiego ryzyka potwierdzona w produkcji (bez dowodu wykorzystania); awaria części użytkowników. | Logowanie nie działa dla części użytkowników; IDOR wykryty w audycie produkcji. | ≤ 1 h (godziny pracy) / ≤ 4 h | IC + Tech Lead + PO |
| **SEV3 — średni** | Ograniczona degradacja, obejście dostępne; podatność średniego ryzyka. | Wolne ładowanie raportów; błąd w module pobocznym. | ≤ 1 dzień roboczy | Właściciel komponentu |
| **SEV4 — niski** | Kosmetyczne, bez wpływu na dane i krytyczne procesy. | Błąd tłumaczenia; drobny błąd UI. | Backlog | — |

Zasada: **w razie wątpliwości przyjmij wyższy SEV**; obniżenie jest łatwe, opóźniona eskalacja — kosztowna.

## 5. Cykl obsługi incydentu

| Faza | Działania | Artefakty |
|---|---|---|
| **1. Wykrycie i zgłoszenie** | Źródła: alerty (LOG-010…LOG-015), zgłoszenia użytkowników, `security.txt` (LOG-024), dostawcy, badacze. Każdy może zgłosić incydent kanałem z sekcji 2. | Ticket incydentu z godziną wykrycia. |
| **2. Triage i ogłoszenie** | IC ocenia SEV, otwiera kanał incydentu (np. `#inc-YYYYMMDD-krótki-opis`), wyznacza role, rozpoczyna oś czasu. | SEV, lista ról, oś czasu. |
| **3. Zabezpieczenie dowodów** | Przed zmianami (jeśli nie opóźnia to istotnie mitygacji): eksport logów, zrzut konfiguracji, snapshot bazy, lista wdrożeń, kopie podejrzanych plików. Nie usuwaj logów. | Archiwum dowodów z sumami kontrolnymi. |
| **4. Ograniczenie (containment)** | Np. wyłączenie funkcji (feature flag), blokada endpointu/IP w WAF, unieważnienie sesji, **rotacja sekretów**, odcięcie kompromitowanego konta, przejście w tryb read-only, zmiana bucketu na prywatny. | Lista działań z godzinami. |
| **5. Usunięcie przyczyny (eradication)** | Poprawka kodu/konfiguracji, usunięcie złośliwej zależności, aktualizacja, zamknięcie luki — z code review (hotfix REL-024). | PR / commit. |
| **6. Przywrócenie (recovery)** | Wdrożenie poprawki lub rollback, odtworzenie danych z backupu (BCK-010), weryfikacja integralności, wzmożony monitoring. | Potwierdzenie przywrócenia + metryki. |
| **7. Obowiązki zewnętrzne** | Ocena naruszenia RODO (sekcja 6), powiadomienia dostawców/operatora płatności, ewentualne obowiązki sektorowe. | Decyzja IOD + kopie zgłoszeń. |
| **8. Zamknięcie i postmortem** | Zamknięcie incydentu, postmortem (sekcja 10), działania naprawcze w Risk Register. | Dokument postmortem. |

## 6. Naruszenie ochrony danych osobowych (RODO)

```text
T0 = moment STWIERDZENIA naruszenia przez administratora (wystarczający stopień pewności)
│
├─ niezwłocznie: zawiadom IOD / osobę odpowiedzialną; zabezpiecz dowody; ogranicz skutki
├─ ocena ryzyka dla praw i wolności osób (kategorie danych, liczba osób, możliwość identyfikacji,
│  skutki: kradzież tożsamości, szkoda finansowa, dyskryminacja, utrata poufności tajemnicy)
│
├─ jeśli naruszenie "nie skutkuje ryzykiem" → wpis do wewnętrznego rejestru naruszeń (art. 33 ust. 5) z uzasadnieniem
├─ jeśli RYZYKO → zgłoszenie do Prezesa UODO bez zbędnej zwłoki, w miarę możliwości ≤ 72 h od T0 (art. 33)
│     (po 72 h — zgłoszenie z wyjaśnieniem przyczyn opóźnienia; informacje można przekazywać etapami)
└─ jeśli WYSOKIE RYZYKO → dodatkowo zawiadomienie osób, których dane dotyczą, bez zbędnej zwłoki (art. 34),
      jasnym językiem: charakter naruszenia, kontakt do IOD, możliwe konsekwencje, podjęte środki, zalecenia
```

**Minimalna treść zgłoszenia (art. 33 ust. 3):** charakter naruszenia (kategorie i przybliżona liczba osób oraz wpisów danych), dane kontaktowe IOD lub innego punktu kontaktowego, możliwe konsekwencje, środki zastosowane lub proponowane.

**Procesor** (np. dostawca hostingu/BaaS) zgłasza naruszenie administratorowi bez zbędnej zwłoki (art. 33 ust. 2) — sprawdź, czy DPA tego wymaga (PRIV-061), i monitoruj komunikaty bezpieczeństwa dostawców.

**Rejestr naruszeń** (wszystkie, także niezgłoszone): data stwierdzenia, opis, kategorie danych i osób, ocena ryzyka, decyzja o zgłoszeniu z uzasadnieniem, podjęte działania.

## 7. Komunikacja

| Odbiorca | Kiedy | Kto | Kanał |
|---|---|---|---|
| Zespół wewnętrzny | od ogłoszenia SEV1/SEV2 | IC | kanał incydentu |
| Użytkownicy (awaria) | SEV1/SEV2 widoczne dla użytkowników — w ciągu ~30 min, potem regularne aktualizacje (np. co 30–60 min) | Comms | strona statusu, baner w aplikacji, social |
| Użytkownicy (naruszenie danych) | wg decyzji IOD (sekcja 6) | Comms + IOD + prawnik | e-mail, komunikat w aplikacji |
| Klienci B2B | wg umów (SLA, klauzule o incydentach) | PO | e-mail / account manager |
| Dostawcy | gdy incydent dotyczy ich usługi lub wymaga ich działania | Ops | ticket supportu |

**Szablon komunikatu o awarii:**

```text
[<godzina>] Wykryliśmy problem z <funkcja/usługa>. Część użytkowników może <objaw>.
Pracujemy nad rozwiązaniem. Twoje dane są bezpieczne / Sprawdzamy wpływ na dane. <— tylko jeśli potwierdzone!
Kolejna aktualizacja: <godzina>.
```

Zasady: nie spekuluj o przyczynach; nie przekazuj szczegółów technicznych ułatwiających atak przed usunięciem luki; nie zapewniaj o bezpieczeństwie danych bez potwierdzenia.

## 8. Rollback i odtwarzanie

| Sytuacja | Działanie | Odwołanie |
|---|---|---|
| Błędne wdrożenie aplikacji | Rollback do poprzedniego builda (np. „Instant Rollback” / redeploy poprzedniego commita); potwierdź smoke testami. | REL-007, INF-024 |
| Wdrożenie z migracją bazy | Jeśli migracja kompatybilna wstecz — rollback aplikacji; jeśli nie — forward-fix lub odtworzenie bazy z backupu sprzed migracji (decyzja IC + PO, świadomość utraty danych od T_backup). | REL-005 |
| Utrata/uszkodzenie danych | Odtworzenie z PITR/backupu do **izolowanego** środowiska → weryfikacja → przełączenie / selektywne przywrócenie rekordów. | BCK-010, BCK-012 |
| Wyciek sekretu | Rotacja natychmiast (nie czekaj na analizę), unieważnienie sesji/tokenów zależnych, przegląd logów użycia klucza. | INF-021 |
| Kompromitacja konta (hosting/GitHub/DNS) | Odebranie dostępu, reset poświadczeń i MFA, przegląd zmian i wdrożeń z okresu kompromitacji, rotacja wszystkich sekretów dostępnych z konta. | INF-026, SCM-011 |

## 9. Runbooki scenariuszy

> Uzupełnij konkretne komendy/ścieżki dla projektu. Każdy runbook: **objawy → natychmiastowe kroki → weryfikacja → kontakt**.

| ID | Scenariusz | Natychmiastowe kroki (skrót) |
|---|---|---|
| **RB-01** | Sekret w repo / bundlu / logach | Rotuj sekret u dostawcy → wdroż nową wartość → unieważnij stare tokeny → sprawdź logi użycia klucza od daty wycieku → usuń z artefaktów i (opcjonalnie) z historii → oceń naruszenie danych. |
| **RB-02** | Publiczny dostęp do danych (RLS/Rules/bucket/IDOR) | Zablokuj dostęp (polityka/bucket prywatny/feature flag/WAF) → zabezpiecz logi dostępu → ustal zakres (które rekordy, przez kogo, od kiedy) → IOD (sekcja 6) → poprawka + test regresji (QA-005). |
| **RB-03** | Przejęcie konta użytkownika / admina | Zablokuj konto, unieważnij sesje, zresetuj MFA → przegląd działań z audit logu → przywrócenie zmian → analiza wektora (credential stuffing? reset hasła?) → wzmocnienie (SEC-021/022). |
| **RB-04** | Awaria całkowita (5xx / brak dostępności) | Sprawdź status dostawców → ostatnie wdrożenie? → rollback → skalowanie/limity → komunikat na stronie statusu. |
| **RB-05** | Złośliwa / skompromitowana zależność | Zidentyfikuj wersje i czas obecności w buildach → wycofaj wersję (lockfile) i przebuduj → rotuj sekrety dostępne w CI i runtime w okresie ekspozycji → przegląd logów CI i ruchu wychodzącego. |
| **RB-06** | Płatności: rozbieżności / podejrzenie fraudu | Wstrzymaj automatyczną realizację zamówień (feature flag) → rekoncyliacja z panelem operatora → kontakt z operatorem → weryfikacja webhooków (API-040/041) i logiki cen (PAY-002). |
| **RB-07** | Usunięcie / uszkodzenie bazy | Zatrzymaj zapisy (read-only/maintenance) → odtwarzanie wg BCK-012 → weryfikacja integralności → komunikacja. |
| **RB-08** | DDoS / nadużycie API | Włącz/zaostrz reguły CDN/WAF (rate limit, challenge), zablokuj źródła, tymczasowe limity w aplikacji, monitoring kosztów usług zależnych. |

## 10. Postmortem

Wymagany dla SEV1 i SEV2 (zalecany dla powtarzających się SEV3), w ciągu ~5 dni roboczych, w formule **blameless** (skupienie na systemie i procesie, nie na winnych).

```markdown
# Postmortem — <tytuł> (<data>, SEV<n>)

## Podsumowanie
Co się stało, wpływ (użytkownicy, dane, pieniądze, czas trwania), stan obecny.

## Oś czasu (UTC)
| Czas | Zdarzenie |
|---|---|
| | wykrycie / ogłoszenie / mitygacja / rozwiązanie |

## Przyczyna źródłowa (root cause) i czynniki sprzyjające
## Wykrycie — jak i jak szybko? Co mogło wykryć wcześniej?
## Co zadziałało dobrze / co nie
## Działania naprawcze
| Działanie | Typ (zapobieganie / wykrywanie / mitygacja) | Właściciel | Termin | RISK-ID / ticket |
|---|---|---|---|---|

## Obowiązki zewnętrzne
Zgłoszenie UODO: tak/nie (uzasadnienie, data) · zawiadomienie osób: tak/nie · inne.
```

## 11. Ćwiczenia i utrzymanie planu

| Działanie | Częstotliwość | Punkt checklisty |
|---|---|---|
| Ćwiczenie tabletop (np. scenariusz RB-01 lub RB-02) | przed premierą, potem min. raz w roku | LOG-021 |
| Test odtworzenia backupu jako część ćwiczenia DR | kwartalnie | BCK-010 |
| Przegląd kontaktów i ról | kwartalnie / przy zmianie składu zespołu | — |
| Aktualizacja planu po każdym SEV1/SEV2 | po postmortem | LOG-022 |
