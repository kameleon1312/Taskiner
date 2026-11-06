# SECURITY TESTING PLAYBOOK

> Praktyczne procedury i polecenia CLI do audytu wg [PRODUCTION-READINESS-MASTER-CHECKLIST.md](PRODUCTION-READINESS-MASTER-CHECKLIST.md). Identyfikatory `PB-…` są przywoływane w checkliście.
>
> | Pole | Wartość |
> |---|---|
> | Wersja | 1.0.0 |
> | Data weryfikacji | 2026-11-06 |
> | Zastosowanie | Self-assessment zespołu, audyt wewnętrzny, przygotowanie do pentestu |

## Spis treści

- [0. Zasady bezpiecznego testowania](#0-zasady-bezpiecznego-testowania)
- [1. Przygotowanie środowiska audytu](#1-przygotowanie-środowiska-audytu)
- [2. Kolejność narzędzi](#2-kolejność-narzędzi)
- [PB-RECON — Rozpoznanie](#pb-recon--rozpoznanie)
- [PB-QUALITY — Lint, typecheck, testy, build](#pb-quality--lint-typecheck-testy-build)
- [PB-SECRETS — Skanowanie sekretów](#pb-secrets--skanowanie-sekretów)
- [PB-SCA — Zależności i SBOM](#pb-sca--zależności-i-sbom)
- [PB-SAST — Statyczna analiza kodu](#pb-sast--statyczna-analiza-kodu)
- [PB-HDR — Nagłówki HTTP, cookies, CORS](#pb-hdr--nagłówki-http-cookies-cors)
- [PB-TLS — SSL/TLS i DNS](#pb-tls--ssltls-i-dns)
- [PB-API — Testowanie endpointów](#pb-api--testowanie-endpointów)
- [PB-AUTHZ — Autoryzacja (IDOR/BOLA/BFLA)](#pb-authz--autoryzacja-idorbolabfla)
- [PB-INJ — Payloady injection i logika](#pb-inj--payloady-injection-i-logika)
- [PB-DAST — Skanowanie dynamiczne](#pb-dast--skanowanie-dynamiczne)
- [PB-SUPA — Supabase](#pb-supa--supabase)
- [PB-FIRE — Firebase](#pb-fire--firebase)
- [PB-CONT — Kontenery i IaC](#pb-cont--kontenery-i-iac)
- [PB-PERF — Wydajność](#pb-perf--wydajność)
- [PB-A11Y — Dostępność](#pb-a11y--dostępność)
- [PB-SEO — SEO techniczne](#pb-seo--seo-techniczne)
- [PB-PRIV — Prywatność i cookies](#pb-priv--prywatność-i-cookies)
- [3. Przykładowy pipeline CI](#3-przykładowy-pipeline-ci)
- [4. Ograniczenia narzędzi — podsumowanie](#4-ograniczenia-narzędzi--podsumowanie)

---

## 0. Zasady bezpiecznego testowania

| Zasada | Szczegóły |
|---|---|
| **Zgoda** | Testy aktywne wymagają pisemnej zgody właściciela systemu (zakres, środowisko, okno czasowe, kontakt awaryjny). Testy infrastruktury dostawców (Vercel, Supabase, Firebase, Shopify, Cloudflare) — tylko w granicach ich polityk testów bezpieczeństwa. |
| **Środowisko** | Testy aktywne, fuzzing, obciążeniowe, race conditions, brute force → **staging** o konfiguracji zbliżonej do produkcji. Na produkcji: tylko pasywne/nienaruszające (nagłówki, TLS, publiczne pliki, odczyty z kont testowych). |
| **Dane** | Konta testowe (min. 2 na rolę + konto w innym tenancie). Nie używaj danych realnych użytkowników. Nie pobieraj więcej danych niż potrzeba do udowodnienia problemu. |
| **Stop rule** | Wykrycie realnego wycieku danych / możliwości przejęcia systemu → natychmiastowe przerwanie testu i eskalacja wg [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md). |
| **Dowody** | Zapisuj komendę, wersję narzędzia, datę, środowisko, wynik. Maskuj tokeny i dane osobowe (konwencja nazw — checklista I.10). |
| **Oznaczenia w tym dokumencie** | 🟢 pasywne / bezpieczne · 🟡 aktywne, nieinwazyjne (staging zalecany) · 🔴 inwazyjne — **tylko staging lub pisemna zgoda** |

---

## 1. Przygotowanie środowiska audytu

```bash
# Zmienne używane w przykładach (ustaw w powłoce audytora, nie commituj)
export TARGET="https://staging.example.com"     # host aplikacji
export API="https://staging.example.com/api"    # baza API
export TOKEN_A="..."   # token/sesja użytkownika A (rola: user)
export TOKEN_B="..."   # token/sesja użytkownika B (rola: user, inny właściciel)
export TOKEN_ADMIN="..."
mkdir -p audit/$(date +%F)/evidence
```

Narzędzia (instaluj tylko potrzebne): Node.js LTS + npm, `curl`, `jq`, Docker (dla ZAP/Trivy), `gitleaks`, `semgrep`, `osv-scanner`, `testssl.sh`, Burp Suite Community/Pro lub OWASP ZAP desktop, `k6`. Preferuj uruchamianie przez Docker/`npx` zamiast instalacji globalnych.

---

## 2. Kolejność narzędzi

| Etap | Narzędzia | Dlaczego w tej kolejności |
|---|---|---|
| 1 | PB-RECON (git, pliki konfiguracyjne, `curl -I`) | Profil projektu decyduje, które testy mają sens. |
| 2 | PB-QUALITY (lint, typecheck, testy, build) | Działający build jest warunkiem dalszych testów; błędy typów często wskazują błędy logiki. |
| 3 | PB-SECRETS | Wyciek sekretu to P0 — wykryj zanim cokolwiek innego. |
| 4 | PB-SCA + SBOM | Szybkie, deterministyczne; znane CVE. |
| 5 | PB-SAST | Wskazuje miejsca do manualnego przeglądu. |
| 6 | PB-HDR, PB-TLS | Pasywne, szybkie, bezpieczne także na produkcji. |
| 7 | PB-API, PB-AUTHZ (manual z 2–3 kontami) | Najczęstsze krytyczne podatności — wymagają człowieka. |
| 8 | PB-INJ (manual) + PB-DAST (ZAP baseline → active na stagingu) | Uzupełnienie manualnych testów wejścia. |
| 9 | PB-SUPA / PB-FIRE / PB-CONT | Warunkowo, wg stosu. |
| 10 | PB-PERF, PB-A11Y, PB-SEO, PB-PRIV | Jakość, zgodność. |

---

## PB-RECON — Rozpoznanie

### PB-RECON-01 · Identyfikacja stosu 🟢

- **Cel:** Ustalenie technologii i wersji (aktywuje sekcje CONDITIONAL).
- **Narzędzie:** `git`, `jq`, `curl`
- **Uruchomienie:**

  ```bash
  cat package.json | jq '{deps: .dependencies, dev: .devDependencies, engines: .engines}'
  ls -a | grep -E "next.config|vite.config|supabase|firebase.json|vercel.json|netlify.toml|Dockerfile|docker-compose|\.github"
  curl -sI "$TARGET" | grep -iE "server|x-powered-by|x-vercel|cf-ray|x-nextjs"
  ```

- **Interpretacja:** Lista frameworków i usług → zaznacz profil projektu (checklista I.9). Nagłówki ujawniające wersje → HDR-007.
- **Ograniczenia:** Monorepo: powtórz dla każdego pakietu. Nagłówki mogą być zmienione przez CDN.


### PB-RECON-02 · Inwentaryzacja tras i endpointów 🟢

- **Cel:** Pełna lista tras (do testów AuthZ — SEC-008, API-001).
- **Uruchomienie:**

  ```bash
  # Next.js App Router
  find app src/app -name "route.ts" -o -name "route.js" -o -name "page.tsx" 2>/dev/null
  grep -rln '"use server"' app src 2>/dev/null       # Server Actions
  # Express/Fastify
  grep -rnE "\.(get|post|put|patch|delete)\(['\"]/" src
  # Endpointy widoczne w bundlu (po buildzie)
  grep -rhoE "/api/[a-zA-Z0-9_/\-]+" dist .next/static 2>/dev/null | sort -u
  ```

- **Interpretacja:** Porównaj z dokumentacją/OpenAPI; każda trasa bez jawnego poziomu dostępu → do testu PB-AUTHZ.
- **Ograniczenia:** Trasy dynamiczne i generowane w runtime mogą nie być widoczne statycznie — uzupełnij ruchem z proxy (Burp „Site map”).


### PB-RECON-03 · Pliki i ścieżki, które nie powinny być publiczne 🟡

- **Cel:** SEC-035, SEC-034, INF-015 — wykrycie ekspozycji debug/konfiguracji.
- **Uruchomienie:**

  ```bash
  for p in /.env /.env.local /.env.production /.git/config /.git/HEAD /config.json /phpinfo.php \
    /server-status /actuator /actuator/env /debug /api/debug /graphql /graphiql /api-docs /swagger.json \
    /openapi.json /.well-known/security.txt /robots.txt /sitemap.xml /backup.zip /db.sql /.DS_Store \
    /wp-config.php.bak /storybook /_next/static/development; do
    printf "%-35s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$TARGET$p")"
  done
  ```

- **Interpretacja:** Oczekiwane `404/403` dla wszystkiego poza świadomie publicznymi (`robots.txt`, `sitemap.xml`, `security.txt`). `200` dla `/.env` lub `/.git/config` = **P0**. Uwaga na SPA fallback — `200` z HTML aplikacji to nie wyciek; sprawdź treść (`curl -s "$TARGET/.env" \| head`).
- **Ograniczenia:** Lista nie jest wyczerpująca; dla szerszego pokrycia (za zgodą): `nuclei -u "$TARGET" -tags exposure,config -rl 10`.


---

## PB-QUALITY — Lint, typecheck, testy, build

| ID | Cel | Narzędzie / uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-QUALITY-01** 🟢 | Lint (ARC-032) | `npm run lint` lub `npx eslint . --max-warnings=0` / `npx @biomejs/biome check .` | Exit 0 = PASS. Ostrzeżenia reguł bezpieczeństwa (`no-eval`, `react/no-danger`) → przegląd każdego. | Jakość zależy od konfiguracji reguł; wyłączenia `eslint-disable` wymagają przeglądu (`grep -rn "eslint-disable" src`). |
| **PB-QUALITY-02** 🟢 | Typecheck (ARC-014) | `npx tsc --noEmit -p .` ; liczenie obejść: `grep -rnE "@ts-ignore\|@ts-expect-error\|: any\b\|as any" src \| wc -l` | Exit 0 = PASS; liczba obejść jako wskaźnik ryzyka. | `strict: false` ukrywa wiele błędów — sprawdź `tsconfig.json`. |
| **PB-QUALITY-03** 🟢 | Testy (ARC-033, QA-) | `npm test -- --run` (Vitest) / `npx jest --ci` / `npx playwright test` ; pokrycie: `npx vitest run --coverage` | Wszystkie zielone; mapa krytyczny proces → test. | Coverage nie mierzy jakości asercji ani testów negatywnych. |
| **PB-QUALITY-04** 🟢 | Build produkcyjny | `npm ci && npm run build` | Build bez błędów i ostrzeżeń krytycznych; artefakt do dalszych skanów (PB-SECRETS-03). | Build lokalny może różnić się od platformowego (zmienne środowiskowe) — porównaj z logiem CI. |
| **PB-QUALITY-05** 🟢 | Martwy kod, duplikacja, cykle (ARC-016/017/006) | `npx knip` · `npx jscpd src --min-lines 10` · `npx madge --circular --extensions ts,tsx src` | Przegląd wyników; usunięcie nieużywanych zależności zmniejsza powierzchnię ataku. | Fałszywe pozytywy dla dynamicznych importów i plików konfiguracyjnych. |

---

## PB-SECRETS — Skanowanie sekretów

### PB-SECRETS-01 · Historia repozytorium 🟢

- **Cel:** ARC-020 — sekrety w całej historii git.
- **Narzędzie:** Gitleaks (v8.x) lub TruffleHog
- **Uruchomienie:**

  ```bash
  docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest git /repo --redact -v \\
    --report-format sarif --report-path /repo/audit/gitleaks.sarif
  # alternatywa (weryfikuje aktywność kluczy u dostawców):
  docker run --rm -v "$PWD:/repo" trufflesecurity/trufflehog:latest git file:///repo --only-verified
  ```

- **Interpretacja:** Każde trafienie: (1) potwierdź, czy to realny sekret; (2) jeśli tak — **zrotuj** u dostawcy (P0), dopiero potem rozważ czyszczenie historii (`git filter-repo`) — sam rewrite nie unieważnia sekretu, który mógł zostać skopiowany.
- **Ograniczenia:** Wzorce nie wykrywają wszystkich formatów (własne tokeny, hasła w zwykłym tekście) — dodaj reguły (`.gitleaks.toml`). `--only-verified` w TruffleHog pomija nieaktywne, ale wciąż wrażliwe dane. W Dockerze użyj przypiętej wersji obrazu zamiast `latest` w CI.


### PB-SECRETS-02 · Pliki `.env` i konfiguracja 🟢

```bash
git ls-files | grep -E "(^|/)\.env" | grep -v "\.example$"     # oczekiwane: brak wyników
grep -rnE "(SECRET|PRIVATE|SERVICE_ROLE|API_KEY|TOKEN|PASSWORD)\s*[:=]" --include=*.{ts,tsx,js,mjs,json,yml,yaml} . \
  --exclude-dir={node_modules,dist,.next} | grep -v "process.env\|import.meta.env"
grep -rnE "(NEXT_PUBLIC_|VITE_|PUBLIC_)[A-Z_]*(SECRET|PRIVATE|SERVICE|TOKEN|PASSWORD)" .env* src 2>/dev/null
```

**Interpretacja:** trzecie polecenie wskazuje zmienne publiczne o nazwach sugerujących sekret — każde trafienie = do weryfikacji (ARC-022). **Ograniczenia:** heurystyka nazw; sekret może mieć niewinną nazwę.

### PB-SECRETS-03 · Artefakty buildu i obrazy 🟢

```bash
npm run build
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest dir /repo/dist --redact -v      # Vite
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest dir /repo/.next/static --redact -v  # Next.js
grep -rlE "sk_live_|service_role|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY" dist .next/static 2>/dev/null
# kontenery:
docker run --rm aquasec/trivy:latest image --scanners secret <obraz:tag>
```

**Interpretacja:** każde trafienie w bundlu klienta = sekret publiczny → P0 (SEC-033). **Ograniczenia:** zminifikowany kod może dzielić stringi; sprawdź też odpowiedzi API i logi CI.

---

## PB-SCA — Zależności i SBOM

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-SCA-01** 🟢 | Podatności zależności produkcyjnych (SEC-031) | `npm audit --omit=dev --audit-level=high` · `pnpm audit --prod` · `yarn npm audit --environment production` | Exit ≠ 0 przy High/Critical. Każde znalezisko: osiągalne w kodzie? istnieje poprawka? → update / override / wpis w Risk Register z uzasadnieniem. | Raportuje podatności także nieosiągalne; brak kontekstu użycia. |
| **PB-SCA-02** 🟢 | Wieloekosystemowy skan (OSV) | `osv-scanner scan source -r .` (v2; w v1: `osv-scanner -r .`) | Lista CVE/GHSA z wersjami naprawionymi. | Bazy podatności mają opóźnienia; składnia CLI zmienia się między wersjami — sprawdź `--help`. |
| **PB-SCA-03** 🟢 | Podpisy i proweniencja (SCM-007) | `npm audit signatures` | „verified registry signatures” i atestacje bez błędów. | Nie wszystkie pakiety publikują provenance — brak ≠ złośliwość. |
| **PB-SCA-04** 🟢 | Przestarzałe i porzucone (SCM-005) | `npm outdated` · ręcznie: deps.dev / npmjs.com (data ostatniego wydania) | Major-y za aktualną wersją i pakiety bez wydań > 2 lata → plan. | Brak wydań nie zawsze = porzucenie (pakiety „ukończone”). |
| **PB-SCA-05** 🟢 | SBOM (SCM-008) | `npx @cyclonedx/cyclonedx-npm --omit dev --output-file sbom.cdx.json` · `syft . -o cyclonedx-json=sbom.cdx.json` · `trivy fs --format cyclonedx --output sbom.cdx.json .` | Plik SBOM w artefaktach release'u; można go potem skanować: `trivy sbom sbom.cdx.json` / `osv-scanner scan --sbom=sbom.cdx.json` (składnia wg wersji). | SBOM z lockfile nie obejmuje zasobów ładowanych z CDN w runtime. |
| **PB-SCA-06** 🟢 | Ocena repozytorium (SCM-013) | `docker run -e GITHUB_AUTH_TOKEN=<token read-only> gcr.io/openssf/scorecard:stable --repo=github.com/<org>/<repo>` | Niskie wyniki w `Token-Permissions`, `Pinned-Dependencies`, `Dangerous-Workflow`, `Branch-Protection` → SCM-009/011. | Część checków dotyczy procesów projektów open-source (np. fuzzing) — nie każdy niski wynik jest ryzykiem. |
| **PB-SCA-07** 🟢 | Workflows GitHub Actions (SCM-009) | `pipx run zizmor .github/workflows` · `docker run --rm -v "$PWD:/repo" rhysd/actionlint:latest -color` (w katalogu repo) | Script injection, `pull_request_target`, nadmiarowe `permissions`, niepinowane akcje → do naprawy. | Analiza statyczna — nie widzi ustawień repozytorium/organizacji. |

---

## PB-SAST — Statyczna analiza kodu

### PB-SAST-01 · Semgrep 🟢

- **Cel:** Wzorce podatności (Część III), w tym framework-specific.
- **Uruchomienie:**

  ```bash
  docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep scan \\
    --config p/default --config p/owasp-top-ten --config p/secrets \\
    --config p/typescript --config p/react --config p/nextjs \\
    --sarif --output /src/audit/semgrep.sarif --metrics=off
  ```

- **Interpretacja:** Triage każdego ERROR/WARNING: prawdziwy problem → Risk Register; fałszywy → `// nosemgrep: <rule-id>` z uzasadnieniem. Szczególna uwaga: SQL z template stringów, `dangerouslySetInnerHTML`, `child_process`, SSRF (`fetch(userUrl)`), open redirect.
- **Ograniczenia:** Analiza głównie wewnątrz plików (wersja OSS); nie rozumie logiki biznesowej ani modelu uprawnień; dostępność rulesetów (`p/nextjs`) zależy od rejestru — sprawdź na semgrep.dev/r.


### PB-SAST-02 · CodeQL 🟢

- **Cel:** Analiza przepływu danych (taint) — głębsza niż wzorce.
- **Uruchomienie:** GitHub: Settings → Code security → Code scanning → *Default setup* (repo publiczne lub z GitHub Advanced Security). Lokalnie: `codeql database create db --language=javascript-typescript && codeql database analyze db --format=sarif-latest --output=codeql.sarif codeql/javascript-queries`
- **Interpretacja:** Alerty z kategorii `js/sql-injection`, `js/xss`, `js/request-forgery`, `js/path-injection`, `js/server-side-unvalidated-url-redirection` — priorytet.
- **Ograniczenia:** Wymaga licencji dla repozytoriów prywatnych poza GitHub (GHAS); dłuższy czas analizy.


### PB-SAST-03 · Szybkie grep-y kontrolne (manualny przegląd) 🟢

```bash
grep -rnE "dangerouslySetInnerHTML|innerHTML\s*=|v-html|eval\(|new Function\(" src            # XSS (SEC-004)
grep -rnE "\\\$queryRawUnsafe|\\\$executeRawUnsafe|whereRaw|\.raw\(|sequelize\.query\(|knex\.raw" src  # SQLi (SEC-001)
grep -rnE "child_process|exec\(|execSync|spawn\(" src                                          # CMDi (SEC-015)
grep -rnE "fetch\(|axios\.(get|post)\(|got\(" src | grep -vE "fetch\(['\"]/"                   # SSRF kandydaci (SEC-006)
grep -rnE "redirect\(|res\.redirect|location\.href\s*=" src                                    # open redirect (SEC-017)
grep -rnE "Math\.random\(" src                                                                 # słaba losowość (SEC-012)
grep -rnE "rejectUnauthorized:\s*false|NODE_TLS_REJECT_UNAUTHORIZED" .                         # TLS (EXT-004)
grep -rn '"use server"' src app 2>/dev/null                                                    # Server Actions (NEXT-001)
grep -rnE "localStorage\.(setItem|getItem)\(['\"][^'\"]*(token|jwt|session)" -i src            # tokeny w storage (SES-002)
```

**Interpretacja:** każde trafienie to **kandydat** do przeglądu, nie automatycznie podatność. **Ograniczenia:** brak zrozumienia kontekstu.

---

## PB-HDR — Nagłówki HTTP, cookies, CORS

### PB-HDR-01 · Nagłówki bezpieczeństwa 🟢

- **Cel:** HDR-001…HDR-009, SEC-018, INF-003.
- **Uruchomienie:**

  ```bash
  curl -sI "$TARGET" | grep -iE "content-security-policy|strict-transport-security|x-content-type-options|\\
  referrer-policy|permissions-policy|x-frame-options|cross-origin-|server|x-powered-by"
  # Ocena zbiorcza (pasywna): https://developer.mozilla.org/en-US/observatory
  # Ocena CSP: https://csp-evaluator.withgoogle.com/
  ```

- **Interpretacja:** Brak CSP/HSTS/nosniff na produkcji → P1. CSP z `'unsafe-inline'` w `script-src` bez nonce/hash, `*` w `script-src`, brak `object-src 'none'` → osłabienie. Sprawdź nagłówki także na stronach błędów (404) i w API.
- **Ograniczenia:** `curl -I` wysyła `HEAD` — niektóre serwery zwracają inne nagłówki dla `GET`; w razie wątpliwości: `curl -s -D - -o /dev/null "$TARGET"`.


### PB-HDR-02 · Cookies 🟢

```bash
curl -s -D - -o /dev/null -X POST "$TARGET/api/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"..."}' | grep -i "set-cookie"
```

**Interpretacja:** cookie sesji z `HttpOnly; Secure; SameSite=Lax|Strict` (SES-001); preferowany prefiks `__Host-`. **Ograniczenia:** ścieżka logowania zależy od aplikacji (OAuth/BaaS — sprawdź w DevTools → Application → Cookies).

### PB-HDR-03 · CORS 🟡

```bash
curl -s -D - -o /dev/null "$API/me" -H "Origin: https://evil.example" -H "Authorization: Bearer $TOKEN_A" | grep -i "access-control"
curl -s -D - -o /dev/null "$API/me" -H "Origin: null" | grep -i "access-control"
curl -s -D - -o /dev/null -X OPTIONS "$API/me" -H "Origin: https://evil.example" \
  -H "Access-Control-Request-Method: DELETE" | grep -i "access-control"
```

**Interpretacja:** `Access-Control-Allow-Origin: https://evil.example` lub `null` + `Allow-Credentials: true` → **P0/P1** (SEC-019). **Ograniczenia:** CORS chroni tylko przed odczytem przez przeglądarkę — nie zastępuje autoryzacji.

### PB-HDR-04 · Cache prywatnych odpowiedzi 🟢

```bash
curl -s -D - -o /dev/null "$API/me" -H "Authorization: Bearer $TOKEN_A" | grep -iE "cache-control|age|x-cache|cf-cache-status|x-vercel-cache"
```

**Interpretacja:** oczekiwane `private, no-store`; `HIT` w nagłówkach cache dla danych użytkownika → P0 (SEC-028/NG-4).

---

## PB-TLS — SSL/TLS i DNS

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-TLS-01** 🟢 | Konfiguracja TLS (INF-002) | `docker run --rm -ti drwetter/testssl.sh --severity MEDIUM --quiet https://example.com` · alternatywa web: SSL Labs (ssllabs.com/ssltest) | Brak protokołów < TLS1.2, brak słabych szyfrów, łańcuch kompletny, ocena A/A+. | Skan aktywny (wiele połączeń) — na produkcji akceptowalny, ale uzgodnij; za CDN testujesz CDN, nie origin (origin też powinien być niedostępny publicznie lub poprawnie skonfigurowany). |
| **PB-TLS-02** 🟢 | Przekierowanie HTTP→HTTPS, HSTS (INF-001/003) | `curl -sI http://example.com \| head -5` · `curl -sI https://example.com \| grep -i strict` | `301/308` na https; HSTS z `max-age ≥ 31536000`. | — |
| **PB-TLS-03** 🟢 | Ważność certyfikatu (INF-004) | `echo \| openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \| openssl x509 -noout -dates -issuer -subject` | `notAfter` > 14 dni; automatyczne odnawianie potwierdzone. | — |
| **PB-TLS-04** 🟢 | DNS: CAA, poczta (INF-005/006) | `dig +short CAA example.com` · `dig +short TXT example.com` · `dig +short TXT _dmarc.example.com` · `dig +short TXT <selektor>._domainkey.example.com` | CAA obecny; SPF bez `+all`; DMARC `p=quarantine/reject` (docelowo). | Selektor DKIM zależy od dostawcy poczty. |
| **PB-TLS-05** 🟡 | Subdomain takeover (INF-005) | Lista subdomen z DNS/strefy → dla każdego CNAME: `dig +short CNAME sub.example.com` + `curl -sI https://sub.example.com` | CNAME na nieistniejący zasób dostawcy (komunikaty typu „NoSuchBucket”, „There isn't a GitHub Pages site here”, „DEPLOYMENT_NOT_FOUND”) → P1. | Wymaga pełnej listy subdomen (najlepiej z panelu DNS, nie z enumeracji). |

---

## PB-API — Testowanie endpointów

### PB-API-01 · Szablon żądań curl 🟡

```bash
# Bez uwierzytelnienia → oczekiwane 401
curl -s -o /dev/null -w "%{http_code}\n" "$API/orders"
# Użytkownik A
curl -s "$API/orders" -H "Authorization: Bearer $TOKEN_A" | jq '.[0] | keys'   # przegląd pól (SEC-037)
# Walidacja (API-010): złe typy, nadmiarowe pola (SEC-025), ogromne wartości
curl -s -X POST "$API/profile" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"name":["array"],"age":-1,"role":"admin","isAdmin":true,"ownerId":1}' -w "\n%{http_code}\n"
# Content-Type (API-011)
curl -s -X POST "$API/profile" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: text/plain" -d '{"name":"x"}' -w "\n%{http_code}\n"
# Paginacja (API-013)
curl -s "$API/orders?limit=1000000" -H "Authorization: Bearer $TOKEN_A" | jq 'length'
# Duże body (API-012) — staging
head -c 20000000 /dev/zero | tr '\0' 'a' | curl -s -X POST "$API/profile" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" --data-binary @- -o /dev/null -w "%{http_code}\n"
```

**Interpretacja:** oczekiwane kolejno: `401`; tylko niezbędne pola; `400/422` i brak zmiany `role`; `415`; liczba ≤ max limit; `413`. **Ograniczenia:** dopasuj ścieżki do API; uwierzytelnienie cookie → `-b "session=..."`.

### PB-API-02 · Kontrakt i fuzzing schematu (OpenAPI) 🔴

```bash
# tylko staging; ograniczona liczba przykładów
docker run --rm schemathesis/schemathesis:stable run https://staging.example.com/openapi.json \
  --header "Authorization: Bearer $TOKEN_A" --max-examples 50
```

**Interpretacja:** błędy 5xx, odpowiedzi niezgodne ze schematem → do naprawy (API-010, ARC-011). **Ograniczenia:** generuje wiele żądań (także zapisów) — używaj kont i danych testowych; składnia CLI zależy od wersji (`st run` / opcje `--checks`).

### PB-API-03 · GraphQL 🟡

```bash
curl -s "$API/graphql" -H "Content-Type: application/json" -d '{"query":"{__schema{types{name}}}"}' | head -c 300   # GQL-001
curl -s "$API/graphql" -H "Content-Type: application/json" -d '{"query":"{ usr { id } }"}'                     # podpowiedzi
curl -s "$API/graphql?query=mutation%7Bx%7D" -o /dev/null -w "%{http_code}\n"                                   # GQL-005
```

**Interpretacja:** introspekcja i „Did you mean” wyłączone w produkcji; mutacje przez GET odrzucone. Batching/aliasy (GQL-003) — wygeneruj zapytanie ze 100 aliasami tej samej operacji. **Ograniczenia:** InQL / GraphQL Voyager (Burp/ZAP) ułatwiają mapowanie, gdy introspekcja jest dostępna na stagingu.

### PB-API-04 · Webhooki (API-040/041) 🟡

```bash
BODY='{"id":"evt_test_1","type":"payment.succeeded","data":{"orderId":"123","amount":100}}'
# 1) bez podpisu
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$TARGET/api/webhooks/payments" -H "Content-Type: application/json" -d "$BODY"
# 2) z błędnym podpisem (nazwa nagłówka wg dostawcy)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$TARGET/api/webhooks/payments" -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1,v1=deadbeef" -d "$BODY"
# 3) replay: wyślij to samo POPRAWNIE podpisane zdarzenie 2× (narzędzie dostawcy, np. `stripe events resend evt_...`)
```

**Interpretacja:** 1–2 → `400/401` i brak zmiany stanu; 3 → drugie bez efektu. **Ograniczenia:** poprawne podpisy generuj narzędziami dostawcy w trybie test/sandbox.

---

## PB-AUTHZ — Autoryzacja (IDOR/BOLA/BFLA)

### PB-AUTHZ-01 · Macierz kont i zasobów 🟡

1. Przygotuj konta: `A` (user, tenant 1), `B` (user, tenant 1), `C` (user, tenant 2), `ADMIN`.
2. Jako `A` utwórz po jednym zasobie każdego typu (zamówienie, plik, komentarz, projekt…). Zapisz ID.
3. Dla **każdego** endpointu i metody wykonaj żądanie z ID zasobu `A` używając tokenów: brak, `B`, `C`.
4. Dla endpointów admina — tokeny `A`, `C`.

```bash
ID_A=123
for T in "" "$TOKEN_B" "$TOKEN_C"; do
  for M in GET PATCH DELETE; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -X $M "$API/orders/$ID_A" \
      ${T:+-H "Authorization: Bearer $T"} -H "Content-Type: application/json" -d '{"note":"x"}')
    echo "$M token=${T:0:8}… → $code"
  done
done
```

**Oczekiwany wynik:** `401` (brak tokenu), `403/404` (B, C); po teście — stan zasobu A niezmieniony (sprawdź jako A). **Narzędzia:** Burp + **Autorize** (automatycznie powtarza każde żądanie z tokenem innego użytkownika i porównuje odpowiedzi) / AuthMatrix. **Ograniczenia:** podmiana ID w body, nagłówkach, zagnieżdżonych obiektach i GraphQL `node(id:)` wymaga ręcznej pracy; UUID nie zwalnia z testu (ID wyciekają w URL-ach, e-mailach, logach).

### PB-AUTHZ-02 · Eskalacja i mass assignment 🟡

Dodaj do żądań aktualizacji profilu/rejestracji/zaproszeń pola: `role`, `roles`, `isAdmin`, `is_admin`, `admin`, `permissions`, `plan`, `tenantId`, `orgId`, `ownerId`, `emailVerified`, `balance`, `credits`, `price`. Następnie odczytaj obiekt. **Oczekiwane:** brak zmiany (SEC-025, AUTHZ-004).

### PB-AUTHZ-03 · Regresja automatyczna (przykład Playwright) 🟢

```ts
// tests/security/idor.spec.ts — uruchamiane na stagingu z kontami testowymi
import { test, expect, request } from "@playwright/test";

test("user B cannot read or modify user A's order", async () => {
  const a = await request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${process.env.TOKEN_A}` } });
  const b = await request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${process.env.TOKEN_B}` } });
  const created = await (await a.post("/api/orders", { data: { productId: "p1", qty: 1 } })).json();

  expect([403, 404]).toContain((await b.get(`/api/orders/${created.id}`)).status());
  expect([403, 404]).toContain((await b.patch(`/api/orders/${created.id}`, { data: { qty: 99 } })).status());
  expect((await (await a.get(`/api/orders/${created.id}`)).json()).qty).toBe(1);
});
```

**Ograniczenia:** test pokrywa tylko zasoby, dla których go napisano — utrzymuj listę typów zasobów (AUTHZ-001).

---

## PB-INJ — Payloady injection i logika

> 🟡/🔴 — używaj na stagingu. Payloady są **sondami** do wykrycia problemu, nie do eksploatacji.

| Klasa | Przykładowe sondy | Gdzie | Oczekiwany wynik | Punkt |
|---|---|---|---|---|
| SQLi | `'` · `"` · `1 OR 1=1` · `1' AND SLEEP(3)-- -` · `1; SELECT pg_sleep(3)--` · `(SELECT 1)` w `sort` | parametry filtrów, sort, wyszukiwarka, ID | brak błędów SQL, brak różnic czasowych | SEC-001 |
| NoSQLi | `{"$ne":null}` · `{"$gt":""}` · `?id[$ne]=x` · `{"$regex":".*"}` | JSON body, query | `400/422` | SEC-002 |
| XSS | `"><svg onload=alert(document.domain)>` · `javascript:alert(1)` · `<img src=x onerror=alert(1)>` · `{{constructor.constructor('alert(1)')()}}` | pola zapisywane i wyświetlane, URL, `#fragment`, nazwy plików | wyświetlone jako tekst | SEC-004 |
| SSTI | `{{7*7}}` · `${7*7}` · `<%= 7*7 %>` · `#{7*7}` | szablony e-mail/PDF | dosłownie, nie `49` | SEC-040 |
| Path traversal | `../../../../etc/passwd` · `..%2f..%2f` · `....//....//` · `%2e%2e%2f` | parametry plików | `400/404` | SEC-014 |
| CMDi | `; id` · `&& whoami` · `` `id` `` · `$(sleep 3)` | parametry przekazywane do procesów | brak wykonania/opóźnienia | SEC-015 |
| SSRF | `http://127.0.0.1:22` · `http://169.254.169.254/latest/meta-data/` · `http://[::1]/` · `http://0x7f000001/` · URL z 302 na adres wewnętrzny · `file:///etc/passwd` | pola URL (import, webhook out, podgląd) | odrzucone | SEC-006 |
| Open redirect | `//evil.example` · `https://evil.example` · `/\evil.example` · `https:evil.example` | `next`, `returnUrl`, `redirect`, `callbackUrl` | tylko trasy wewnętrzne | SEC-017 |
| CRLF | `%0d%0aSet-Cookie:%20x=1` | parametry trafiające do nagłówków | brak nowego nagłówka | SEC-041 |
| Prototype pollution | `{"__proto__":{"polluted":true}}` · `{"constructor":{"prototype":{"x":1}}}` | JSON body | brak efektu | SEC-044 |
| Logika | ilości `-1`, `0`, `0.5`, `1e9`; kupon 2×; kroki w złej kolejności; zmiana waluty | koszyk, checkout, limity | odrzucone | SEC-026 |

### PB-INJ-RACE · Race conditions 🔴

Burp Suite (Repeater → zaznacz kilkanaście kopii żądania → *Create tab group* → *Send group in parallel (single-packet attack)*) lub:

```bash
# 30 równoległych prób użycia tego samego kuponu (staging!)
seq 30 | xargs -P 30 -I{} curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/cart/coupon" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" -d '{"code":"ONCE10"}' | sort | uniq -c
```

**Oczekiwane:** dokładnie jeden sukces (SEC-027). **Ograniczenia:** `xargs`/`curl` nie zapewniają równoczesności na poziomie pakietu — wynik negatywny nie dowodzi braku podatności; preferuj single-packet attack w Burp.

---

## PB-DAST — Skanowanie dynamiczne

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-DAST-01** 🟢/🟡 | ZAP **baseline** (pasywny + spider) | `docker run --rm -v "$PWD:/zap/wrk" -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t "$TARGET" -r zap-baseline.html -J zap-baseline.json` | Ostrzeżenia FAIL/WARN: brakujące nagłówki, cookies bez flag, ujawnianie informacji → przypisz do HDR-/SES-/SEC-035. Plik reguł `-c` do oznaczania znanych wyjątków. | Pasywny — nie wykrywa injection ani autoryzacji. Spider słabo radzi sobie z SPA (użyj `-j` AJAX spider). |
| **PB-DAST-02** 🔴 | ZAP **full scan** (aktywny) | `docker run --rm -v "$PWD:/zap/wrk" -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t "$TARGET" -r zap-full.html` | Alerty High/Medium → weryfikacja manualna (fałszywe pozytywy). | **Tylko staging** — wysyła ataki, może tworzyć/usuwać dane; bez uwierzytelnienia testuje tylko część publiczną (skonfiguruj kontekst z logowaniem). |
| **PB-DAST-03** 🟡 | ZAP **API scan** | `docker run --rm -v "$PWD:/zap/wrk" -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py -t https://staging.example.com/openapi.json -f openapi -r zap-api.html` | Jak wyżej dla API. | Wymaga definicji OpenAPI/GraphQL; uwierzytelnienie przez `-z` (konfiguracja replacer). |
| **PB-DAST-04** 🟡 | Nuclei (szablony) | `nuclei -u "$TARGET" -tags exposure,misconfig,cve -severity medium,high,critical -rl 10` | Trafienia → weryfikacja manualna. | Za zgodą; rate limit (`-rl`); szablony społeczności mają różną jakość. |

---

## PB-SUPA — Supabase

```bash
export SUPABASE_URL="https://<ref>.supabase.co"
export ANON="<anon/publishable key — publiczny z bundla>"
```

| ID | Cel | Uruchomienie | Interpretacja |
|---|---|---|---|
| **PB-SUPA-01** 🟢 | Tabele bez RLS (SUPA-001) | W SQL Editor (lub `psql` z rolą read-only): `select schemaname, tablename from pg_tables where schemaname = 'public' and rowsecurity = false;` | Oczekiwane: 0 wierszy. Każda tabela = P0. |
| **PB-SUPA-02** 🟡 | „Anonimowy atakujący” (SUPA-020) | `for t in $(...lista tabel...); do echo "$t: $(curl -s "$SUPABASE_URL/rest/v1/$t?select=*&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON")"; done` | Dla danych prywatnych: `[]` lub błąd uprawnień. Zwrócone dane = P0. |
| **PB-SUPA-03** 🟡 | Izolacja użytkowników (SUPA-002) | Zaloguj A i B (`/auth/v1/token?grant_type=password`), pobierz JWT; jako B: `curl "$SUPABASE_URL/rest/v1/<tabela>?id=eq.<id_A>" -H "apikey: $ANON" -H "Authorization: Bearer $JWT_B"`; `PATCH` z `{"user_id":"<id_B>"}` na wierszu B (próba przepisania — WITH CHECK) | Brak danych A; PATCH zmieniający właściciela odrzucony. |
| **PB-SUPA-04** 🟡 | Storage (SUPA-008) | `curl "$SUPABASE_URL/storage/v1/object/list/<bucket>" -X POST -H "apikey: $ANON" -H "Authorization: Bearer $JWT_B" -H "Content-Type: application/json" -d '{"prefix":"<folder_A>"}'` · `curl -I "$SUPABASE_URL/storage/v1/object/public/<bucket>/<plik_A>"` | Brak listingu/dostępu do plików A; prywatne buckety nie odpowiadają na ścieżkę `/public/`. |
| **PB-SUPA-05** 🟡 | RPC / funkcje (SUPA-005) | `curl -X POST "$SUPABASE_URL/rest/v1/rpc/<funkcja>" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'` | Funkcje wewnętrzne niedostępne dla `anon`. |
| **PB-SUPA-06** 🟢 | Advisors (SUPA-022) | Dashboard → Advisors → Security / Performance (lub `supabase db lint` / inspekcje CLI — zgodnie z wersją CLI) | Brak ostrzeżeń ERROR. |

**Ograniczenia:** testy wykonuj na projekcie stagingowym lub z kontami testowymi; nie nadużywaj limitów API projektu produkcyjnego.

---

## PB-FIRE — Firebase

| ID | Cel | Uruchomienie | Interpretacja |
|---|---|---|---|
| **PB-FIRE-01** 🟢 | Testy reguł w emulatorze (FIRE-002/003) | `npm i -D @firebase/rules-unit-testing` + testy (`assertFails(getDoc(doc(unauthDb,"orders/123")))`); `firebase emulators:exec --only firestore,storage "npm test"` | Wszystkie przypadki negatywne kończą się `assertFails`. |
| **PB-FIRE-02** 🟡 | „Anonimowy atakujący” (FIRE-020) | `curl -s "https://firestore.googleapis.com/v1/projects/<projectId>/databases/(default)/documents/<kolekcja>?pageSize=1"` (bez tokenu) oraz z ID tokenem użytkownika B (`-H "Authorization: Bearer <idToken_B>"`) | Odmowa (`PERMISSION_DENIED`) dla danych prywatnych. |
| **PB-FIRE-03** 🟡 | RTDB (jeśli używane) | `curl -s "https://<db>.firebaseio.com/.json?shallow=true"` | `Permission denied`. |
| **PB-FIRE-04** 🟡 | Storage | `curl -s "https://firebasestorage.googleapis.com/v0/b/<bucket>/o?maxResults=1"` | Odmowa listingu bez uprawnień. |

**Ograniczenia:** App Check może blokować żądania REST bez tokenu App Check — to dobrze, ale reguły muszą być poprawne niezależnie od App Check.

---

## PB-CONT — Kontenery i IaC

`CONDITIONAL: Docker / Kubernetes / Terraform`

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-CONT-01** 🟢 | Podatności obrazu (INF-028) | `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL --ignore-unfixed <obraz:tag>` | Brak High/Critical z dostępną poprawką. | `--ignore-unfixed` ukrywa podatności bez poprawki — przejrzyj je osobno. |
| **PB-CONT-02** 🟢 | Konfiguracja Dockerfile/IaC | `trivy config .` · `docker run --rm -v "$PWD:/src" bridgecrew/checkov -d /src` · `hadolint Dockerfile` | Uruchamianie jako root, brak `HEALTHCHECK`, sekrety w `ENV`, publiczne buckety w Terraform → do naprawy. | Reguły generyczne — dopasuj do kontekstu. |
| **PB-CONT-03** 🟢 | Użytkownik i rozmiar | `docker inspect <obraz> --format '{{.Config.User}}'` · `docker image ls <obraz>` | `User` ≠ pusty/`root`. | — |

---

## PB-PERF — Wydajność

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-PERF-01** 🟢 | Lighthouse (lab) | `npx lighthouse "$TARGET" --preset=perf --form-factor=mobile --output=json --output=html --output-path=./audit/lh-home --chrome-flags="--headless=new"` (desktop: `--preset=desktop`) | LCP/CLS/TBT vs. progi (IX.0); diagnostyki: obraz LCP, render-blocking, nieużywany JS. Uruchom 3–5× i weź medianę. | Wynik zależy od maszyny i sieci; INP nie jest mierzony (TBT jako proxy). |
| **PB-PERF-02** 🟢 | Dane z pola (CrUX) | PageSpeed Insights (pagespeed.web.dev) lub API: `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$TARGET&strategy=mobile&category=performance"` | Sekcja „field data” (p75 z 28 dni) — decydująca dla CWV. | Brak danych dla stron z małym ruchem. |
| **PB-PERF-03** 🟢 | Lighthouse CI (regresje) | `npx @lhci/cli autorun --collect.url="$TARGET" --assert.preset=lighthouse:recommended` (konfiguracja w `lighthouserc.json` z budżetami) | Build failuje przy przekroczeniu budżetów (PERF-009). | Wymaga stabilnego środowiska testowego. |
| **PB-PERF-04** 🟢 | Analiza bundla (PERF-008) | Vite: `npx vite-bundle-visualizer` · Next: `ANALYZE=true npm run build` z `@next/bundle-analyzer` · ogólnie: `npx source-map-explorer 'dist/assets/*.js'` (wymaga map lokalnie) | Największe moduły, duplikaty bibliotek, biblioteki ładowane na każdej stronie. | — |
| **PB-PERF-05** 🔴 | Test obciążeniowy k6 (PERF-050) | Skrypt poniżej · `k6 run load.js` | Progi `thresholds` spełnione → PASS. | Tylko staging/za zgodą; generator obciążenia nie może być wąskim gardłem (monitoruj CPU maszyny testującej). |
| **PB-PERF-06** 🟢 | TTFB (PERF-004) | `for i in 1 2 3 4 5; do curl -s -o /dev/null -w "%{time_starttransfer}\n" "$TARGET"; done` | Mediana ≤ 0,8 s z lokalizacji użytkowników. | Pomiar z jednej lokalizacji; CDN/cache zmienia wynik między pierwszym a kolejnymi żądaniami. |

```js
// load.js — przykład k6 (staging!)
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 50 },   // rozgrzewka
    { duration: "10m", target: 200 }, // oczekiwany szczyt × ~1,5 — dopasuj
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
  },
};

export default function () {
  const res = http.get(`${__ENV.TARGET}/`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);
}
```

---

## PB-A11Y — Dostępność

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-A11Y-01** 🟢 | axe CLI | `npx @axe-core/cli "$TARGET" --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa --exit` | Brak naruszeń; każde „serious/critical” → A11Y-. | Wykrywa tylko część problemów; strony za logowaniem → użyj integracji z Playwright. |
| **PB-A11Y-02** 🟢 | axe w Playwright (strony za logowaniem, stany UI) | Poniżej | Test w CI dla kluczowych widoków i stanów (otwarty modal, błędy formularza). | Jak wyżej. |
| **PB-A11Y-03** 🟢 | Lighthouse a11y | `npx lighthouse "$TARGET" --only-categories=accessibility --output=html --output-path=./audit/lh-a11y` | Wynik informacyjny; 100 ≠ zgodność z WCAG. | — |
| **PB-A11Y-04** 🟢 | Test manualny | Protokół: (1) cała ścieżka krytyczna tylko klawiaturą; (2) NVDA+Firefox / VoiceOver+Safari: nagłówki, landmarki, formularze z błędami, modale, komunikaty; (3) zoom 200 % i 400 %, szerokość 320 px; (4) `prefers-reduced-motion`; (5) kontrast w obu motywach. | Każdy problem → punkt A11Y- z kryterium WCAG. | Wymaga przeszkolonej osoby; najlepiej uzupełnić testami z użytkownikami. |

```ts
// tests/a11y.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard has no detectable WCAG A/AA violations", async ({ page }) => {
  await page.goto("/dashboard");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

---

## PB-SEO — SEO techniczne

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-SEO-01** 🟢 | Indeksowalność (SEO-001/002) | `curl -s https://example.com/robots.txt` · `curl -sI https://example.com \| grep -i x-robots` · `curl -s https://example.com \| grep -io '<meta name="robots"[^>]*>'` · to samo dla stagingu | Produkcja: brak `noindex`/`Disallow: /`; staging: `noindex` + auth. | — |
| **PB-SEO-02** 🟢 | Statusy i przekierowania (SEO-020…022) | `curl -s -o /dev/null -w "%{http_code}\n" https://example.com/nie-istnieje-$(date +%s)` · `curl -sIL http://www.example.com \| grep -iE "^HTTP\|^location"` | 404 dla nieistniejących; jeden skok do wersji kanonicznej. | — |
| **PB-SEO-03** 🟢 | Sitemap (SEO-004) | `curl -s https://example.com/sitemap.xml \| grep -oE "<loc>[^<]+" \| sed 's/<loc>//' \| head -50 \| while read u; do echo "$(curl -s -o /dev/null -w '%{http_code}' "$u") $u"; done` | Wszystkie 200. | Próbka; pełny crawl — Screaming Frog / Sitebulb. |
| **PB-SEO-04** 🟢 | Metadane i canonical (SEO-010/011) | `curl -s <url> \| grep -ioE '<title>[^<]*\|<meta name="description"[^>]*>\|<link rel="canonical"[^>]*>\|<meta property="og:[^>]*>'` | Obecne, unikalne, canonical absolutny. | SPA bez SSR: metadane mogą pojawiać się dopiero po JS — sprawdź w Search Console URL Inspection. |
| **PB-SEO-05** 🟢 | Dane strukturalne (SEO-014) | Rich Results Test (search.google.com/test/rich-results) · Schema Markup Validator (validator.schema.org) | Brak błędów. | — |

---

## PB-PRIV — Prywatność i cookies

| ID | Cel | Uruchomienie | Interpretacja | Ograniczenia |
|---|---|---|---|---|
| **PB-PRIV-01** 🟢 | Tracking przed zgodą (PRIV-020) | Skrypt Playwright poniżej (nowy kontekst = brak zgody) | Lista domen zewnętrznych i cookies **przed** interakcją z banerem — oczekiwane tylko niezbędne. | Niektóre skrypty ładują się po scrollu/czasie — odczekaj kilka sekund i przewiń. |
| **PB-PRIV-02** 🟢 | Po „Odrzuć” (PRIV-021) | Jak wyżej + kliknięcie „Odrzuć” + nawigacja po 2–3 stronach | Brak żądań do analityki/marketingu. | Selektor przycisku zależy od CMP. |
| **PB-PRIV-03** 🟢 | Consent Mode (PRIV-022) | DevTools → Network → filtr `collect` / `gtag` → parametry `gcs`, `gcd` | Odpowiadają stanowi zgody (`G100` = brak zgody na ad/analytics). | Interpretacja parametrów wg dokumentacji Google (może się zmieniać). |

```ts
// tests/privacy/consent.spec.ts
import { test, expect } from "@playwright/test";

const TRACKERS = /google-analytics\.com|googletagmanager\.com\/(gtag|collect)|analytics\.google\.com|facebook\.com\/tr|connect\.facebook\.net|hotjar\.com|clarity\.ms|tiktok\.com|doubleclick\.net/;

test("no tracking requests or tracking cookies before consent", async ({ page, context }) => {
  const hits: string[] = [];
  page.on("request", (r) => { if (TRACKERS.test(r.url())) hits.push(r.url()); });
  await page.goto("/");
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(4000);
  const cookies = (await context.cookies()).map((c) => c.name);
  expect(hits, `tracking before consent: ${hits.join(", ")}`).toEqual([]);
  expect(cookies.filter((n) => /^(_ga|_gid|_fbp|_gcl|_hj|_clck|_tt)/.test(n))).toEqual([]);
});
```

---

## 3. Przykładowy pipeline CI

> Szablon do adaptacji — **nie kopiuj bezrefleksyjnie**: dopasuj menedżer pakietów, ścieżki i wersje. Pinuj akcje do pełnego SHA (SCM-009) — poniżej użyto tagów wyłącznie dla czytelności; zamień je na SHA przed użyciem.

```yaml
# .github/workflows/quality-security.yml
name: quality-and-security
on: [pull_request, push]
permissions:
  contents: read
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # → pin do SHA
        with: { fetch-depth: 0 }         # pełna historia dla gitleaks
      - uses: actions/setup-node@v4      # → pin do SHA
        with: { node-version: 22, cache: npm }
      - run: npm ci --ignore-scripts     # jeśli projekt nie wymaga skryptów instalacyjnych
      - run: npm run lint --if-present
      - run: npx tsc --noEmit -p .
      - run: npm test --if-present
      - run: npm run build
      - run: npm audit --omit=dev --audit-level=high
      - name: Gitleaks
        run: docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:<PINNED_VERSION> git /repo --redact -v   # przypnij konkretną, zweryfikowaną wersję
      - name: Semgrep
        run: docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep scan --config p/default --config p/owasp-top-ten --error --metrics=off
```

DAST (ZAP baseline) i Lighthouse CI uruchamiaj w osobnym jobie **po wdrożeniu na staging** (na adres stagingu), nie na produkcję.

---

## 4. Ograniczenia narzędzi — podsumowanie

| Kategoria | Co wykrywa dobrze | Czego **nie** wykrywa |
|---|---|---|
| SCA (`npm audit`, OSV, Snyk, Trivy) | Znane CVE w wersjach pakietów | 0-day, złośliwe pakiety bez zgłoszenia, osiągalność podatności, błędy we własnym kodzie |
| Sekrety (Gitleaks, TruffleHog) | Sekrety o znanych formatach | Sekrety o niestandardowym formacie, sekrety już skopiowane przez atakującego (wymagana rotacja) |
| SAST (Semgrep, CodeQL) | Niebezpieczne wzorce, przepływ danych do sinków | Błędy autoryzacji, logika biznesowa, błędy konfiguracji runtime |
| DAST (ZAP, Nuclei) | Nagłówki, ujawnianie informacji, część injection/XSS w dostępnych formularzach | IDOR/BOLA, logika, race conditions, ścieżki wymagające złożonych stanów, SPA bez skonfigurowanego crawla |
| Lighthouse / axe | Mierzalne problemy wydajności i ~część kryteriów WCAG | Rzeczywiste doświadczenie użytkowników (field data), użyteczność z czytnikiem, sensowność treści |
| Testy manualne | Logika, autoryzacja, łańcuchy ataków | Skala — zależą od czasu i wiedzy testera; wymagają powtarzalnej dokumentacji |
