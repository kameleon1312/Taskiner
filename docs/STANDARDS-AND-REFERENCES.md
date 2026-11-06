# STANDARDS AND REFERENCES

> Źródła, na których opiera się [PRODUCTION-READINESS-MASTER-CHECKLIST.md](PRODUCTION-READINESS-MASTER-CHECKLIST.md) i dokumenty powiązane.
>
> **Data weryfikacji:** 2026-11-06.
>
> **Legenda statusu weryfikacji:**
> - ✅ **Zweryfikowano** — wersja/status potwierdzone wyszukiwaniem w dniu weryfikacji (oficjalna strona organizacji lub zgodne źródła wtórne wskazujące stronę oficjalną).
> - 🔶 **Z wiedzy — zweryfikuj** — informacja zgodna z wiedzą autora, ale nie potwierdzona w źródle pierwotnym w dniu weryfikacji; przed formalnym raportem sprawdź link.
> - ⚠️ **Status zmienny** — dokument w toku zmian (projekt, etapowe stosowanie); sprawdź przed każdym audytem.
>
> Zasada: linkuj do **wersjonowanych** adresów tam, gdzie organizacja je udostępnia (np. WSTG v4.2), bo adresy „latest/stable” zmieniają treść w czasie.

## Spis treści

- [1. Bezpieczeństwo aplikacji (OWASP)](#1-bezpieczeństwo-aplikacji-owasp)
- [2. Ramy i standardy NIST / CIS](#2-ramy-i-standardy-nist--cis)
- [3. Supply chain](#3-supply-chain)
- [4. Protokoły i nagłówki (IETF, W3C, Mozilla)](#4-protokoły-i-nagłówki-ietf-w3c-mozilla)
- [5. Dostępność](#5-dostępność)
- [6. SEO i wydajność](#6-seo-i-wydajność)
- [7. Prywatność i prawo (UE, PL)](#7-prywatność-i-prawo-ue-pl)
- [8. Płatności i e-commerce](#8-płatności-i-e-commerce)
- [9. Dokumentacja technologii](#9-dokumentacja-technologii)
- [10. Narzędzia](#10-narzędzia)
- [11. Rejestr zmian standardów istotnych dla dokumentu](#11-rejestr-zmian-standardów-istotnych-dla-dokumentu)

---

## 1. Bezpieczeństwo aplikacji (OWASP)

| Źródło | Wersja / data | Status | Link oficjalny | Dlaczego istotne | Używane w |
|---|---|---|---|---|---|
| **OWASP Top 10** | **2025** (A01 Broken Access Control · A02 Security Misconfiguration · A03 Software Supply Chain Failures · A04 Cryptographic Failures · A05 Injection · A06 Insecure Design · A07 Authentication Failures · A08 Software or Data Integrity Failures · A09 Security Logging and Alerting Failures · A10 Mishandling of Exceptional Conditions). SSRF włączony do A01. Ogłoszony XI 2025; źródła wtórne różnią się co do daty finalizacji. | ✅ (nazwy kategorii); 🔶 dokładna data wydania finalnego | https://owasp.org/Top10/2025/ | Najczęściej przywoływana lista ryzyk aplikacji webowych — mapa priorytetów. Nie jest standardem weryfikacji (do tego służy ASVS). | III.0, III |
| **OWASP ASVS** | **5.0.0** (maj 2025; 17 rozdziałów V1–V17, m.in. V1 Encoding and Sanitization, V2 Validation and Business Logic, V3 Web Frontend Security, V4 API and Web Service, V5 File Handling, V15 Secure Coding and Architecture, V16 Security Logging and Error Handling, V17 WebRTC). | ✅ wersja i data; 🔶 pełne nazwy rozdziałów V6–V14 (użyte w dokumencie: V6 Authentication, V7 Session Management, V8 Authorization, V9 Self-contained Tokens, V10 OAuth and OIDC, V11 Cryptography, V12 Secure Communication, V13 Configuration, V14 Data Protection) | https://owasp.org/www-project-application-security-verification-standard/ · https://github.com/OWASP/ASVS | Sprawdzalne wymagania bezpieczeństwa; podstawa „Źródło” w kartach. Przed raportem zgodności przypisz identyfikatory wymagań (`V8.2.1` itd.) z oficjalnego wydania. | II–VIII, XV, XVI |
| **OWASP WSTG** | **v4.2** (stabilna, 2020-12-03); v5.0 w rozwoju | ✅ | https://owasp.org/www-project-web-security-testing-guide/ · wersjonowana: https://owasp.org/www-project-web-security-testing-guide/v42/ | Metodyka testów; identyfikatory `WSTG-…` w kartach. | III, IV, Playbook |
| **OWASP API Security Top 10** | **2023** (API1 BOLA … API10 Unsafe Consumption of APIs) | 🔶 (brak nowszej edycji znanej autorowi — zweryfikuj) | https://owasp.org/API-Security/editions/2023/en/0x11-t10/ | Ryzyka specyficzne dla API. | V |
| **OWASP Cheat Sheet Series** | ciągle aktualizowana | ✅ (projekt aktywny) | https://cheatsheetseries.owasp.org/ | Praktyczne wzorce implementacji (CSRF, XSS, SSRF, Password Storage, Session Management, File Upload, Logging, Secrets Management, GraphQL, JWT, OAuth2, CSP, Third Party JS, Threat Modeling). | cały dokument |
| **OWASP Secure Headers Project** | ciągle aktualizowany | 🔶 | https://owasp.org/www-project-secure-headers/ | Zalecane wartości nagłówków HTTP. | VII.2 |
| **OWASP Proactive Controls** | 2024 | 🔶 | https://top10proactive.owasp.org/ | Kontrole dla developerów. | II |

## 2. Ramy i standardy NIST / CIS

| Źródło | Wersja / data | Status | Link oficjalny | Dlaczego istotne | Używane w |
|---|---|---|---|---|---|
| **NIST Cybersecurity Framework** | **2.0** (NIST CSWP 29, 26.02.2024) — funkcje GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER | 🔶 | https://www.nist.gov/cyberframework | Ramy zarządzania ryzykiem i operacjami bezpieczeństwa. | VII, XVI, XVII |
| **NIST SP 800-218 — SSDF** | **v1.1** (finalna, 3.02.2022). **SP 800-218 Rev. 1 (SSDF v1.2)** — Initial Public Draft z 17.12.2025 | ✅ v1.1 finalna, Rev. 1 jako projekt; ⚠️ status finalny Rev. 1 niepotwierdzony | https://csrc.nist.gov/projects/ssdf · https://csrc.nist.gov/pubs/sp/800/218/final · projekt: https://csrc.nist.gov/pubs/sp/800/218/r1/ipd | Praktyki bezpiecznego wytwarzania (PO, PS, PW, RV). | II, XVIII, XXI |
| **NIST SP 800-63B** (Digital Identity — Authentication) | Rev. 4 (seria 800-63-4) | 🔶 zweryfikuj status finalny i numerację | https://pages.nist.gov/800-63-4/ | Polityka haseł, MFA, sesje. | IV |
| **NIST SP 800-61 Rev. 3** (Incident Response Recommendations) | 2025 | 🔶 | https://csrc.nist.gov/pubs/sp/800/61/r3/final | Model reagowania na incydenty powiązany z CSF 2.0. | XVI, IR Plan |
| **NIST SP 800-34 Rev. 1** (Contingency Planning) | 2010 (z aktualizacjami) | 🔶 | https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final | Planowanie ciągłości i DR. | XVII |
| **CIS Benchmarks** | per produkt (OS, PostgreSQL, MySQL, MongoDB, Docker, Kubernetes, chmury) | 🔶 | https://www.cisecurity.org/cis-benchmarks | Hardening konfiguracji. Pobieraj wersję zgodną z wersją produktu. | VI.4, VII |
| **CIS Controls** | v8.1 | 🔶 | https://www.cisecurity.org/controls | Priorytetyzowane kontrole organizacyjne (m.in. Control 11 Data Recovery). | VII, XVII |

## 3. Supply chain

| Źródło | Wersja / data | Status | Link oficjalny | Dlaczego istotne | Używane w |
|---|---|---|---|---|---|
| **SLSA** | v1.1 opublikowana (zastąpiła v1.0); strony projektu wskazują **v1.2** jako aktualną | ✅ v1.1; 🔶 v1.2 — potwierdź na slsa.dev | https://slsa.dev/spec/ | Poziomy integralności buildów i proweniencji. | XVIII |
| **OpenSSF Scorecard** | narzędzie, wersje ciągłe | 🔶 | https://scorecard.dev/ · https://github.com/ossf/scorecard | Automatyczna ocena praktyk bezpieczeństwa repozytorium. | XVIII, Playbook |
| **CycloneDX** | specyfikacja 1.x (sprawdź aktualną) | 🔶 | https://cyclonedx.org/specification/overview/ | Format SBOM. | XVIII |
| **SPDX** | 2.3 / 3.0 | 🔶 | https://spdx.dev/ | Format SBOM (ISO/IEC 5962). | XVIII |
| **GitHub Docs — Security hardening for GitHub Actions** | ciągła | 🔶 | https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions | Pinowanie akcji, uprawnienia tokenów, script injection. | XVIII |
| **npm — provenance i podpisy** | ciągła | 🔶 | https://docs.npmjs.com/generating-provenance-statements · https://docs.npmjs.com/cli/commands/npm-audit | Weryfikacja pochodzenia pakietów. | XVIII |

## 4. Protokoły i nagłówki (IETF, W3C, Mozilla)

| Źródło | Wersja | Status | Link | Używane w |
|---|---|---|---|---|
| RFC 9110 HTTP Semantics / RFC 9111 HTTP Caching | 2022 | 🔶 | https://www.rfc-editor.org/rfc/rfc9110 · https://www.rfc-editor.org/rfc/rfc9111 | V, VII |
| RFC 6797 HSTS | 2012 | 🔶 | https://www.rfc-editor.org/rfc/rfc6797 | VII |
| RFC 9457 Problem Details for HTTP APIs | 2023 | 🔶 | https://www.rfc-editor.org/rfc/rfc9457 | V |
| RFC 9700 OAuth 2.0 Security Best Current Practice | 2025 | 🔶 | https://www.rfc-editor.org/rfc/rfc9700 | IV |
| RFC 9116 security.txt | 2022 | 🔶 | https://www.rfc-editor.org/rfc/rfc9116 | XVI |
| RFC 9309 Robots Exclusion Protocol | 2022 | 🔶 | https://www.rfc-editor.org/rfc/rfc9309 | XII |
| RFC 7208 SPF / RFC 6376 DKIM / RFC 7489 DMARC | — | 🔶 | https://www.rfc-editor.org/ | VII |
| IETF „The Idempotency-Key HTTP Header Field” | Internet-Draft (nie RFC) | ⚠️ | https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/ | V |
| W3C Content Security Policy Level 3 | Working Draft | ⚠️ | https://www.w3.org/TR/CSP3/ | VII, VIII |
| W3C Permissions Policy | Working Draft | ⚠️ | https://www.w3.org/TR/permissions-policy/ | VII |
| W3C Subresource Integrity | Recommendation | 🔶 | https://www.w3.org/TR/SRI/ | VIII |
| W3C Web Application Manifest / Service Workers / Push API | — | ⚠️ | https://www.w3.org/TR/appmanifest/ · https://www.w3.org/TR/service-workers/ · https://www.w3.org/TR/push-api/ | XIX |
| Mozilla Server Side TLS + SSL Configuration Generator | profile Modern / Intermediate | 🔶 | https://wiki.mozilla.org/Security/Server_Side_TLS · https://ssl-config.mozilla.org/ | VII |
| Mozilla HTTP Observatory | — | 🔶 | https://developer.mozilla.org/en-US/observatory | VII, Playbook |
| CA/Browser Forum Baseline Requirements (skracanie ważności certyfikatów, etapowo od 2026) | — | ⚠️ zweryfikuj harmonogram | https://cabforum.org/working-groups/server/baseline-requirements/ | VII |

## 5. Dostępność

| Źródło | Wersja / data | Status | Link oficjalny | Dlaczego istotne | Używane w |
|---|---|---|---|---|---|
| **WCAG** | **2.2** — Rekomendacja W3C (5.10.2023, aktualizacja 12.12.2024); nowe kryteria m.in. 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8 | 🔶 | https://www.w3.org/TR/WCAG22/ | Techniczny standard dostępności; cel AA. | XI |
| **WAI-ARIA Authoring Practices Guide** | ciągła | 🔶 | https://www.w3.org/WAI/ARIA/apg/ | Wzorce komponentów. | XI |
| **European Accessibility Act** — Dyrektywa (UE) 2019/882 | stosowanie od 28.06.2025 | ✅ (data stosowania) | https://eur-lex.europa.eu/eli/dir/2019/882/oj | Wymagania dostępności m.in. dla usług handlu elektronicznego. | XI, XIV |
| **Ustawa z 26.04.2024 r. o zapewnianiu spełniania wymagań dostępności niektórych produktów i usług przez podmioty gospodarcze** (Polski Akt o Dostępności) | obowiązuje od 28.06.2025; zakres podmiotowy art. 2, przedmiotowy art. 3; wyłączenia (m.in. mikroprzedsiębiorcy świadczący usługi) | ✅ data; ⚠️ zakres wyłączeń — **weryfikacja prawna** | ISAP: https://isap.sejm.gov.pl/ (wyszukaj tytuł ustawy) · https://www.gov.pl/web/dostepnosc-cyfrowa/polski-akt-o-dostepnosci--uslugi-handlu-elektronicznego | Implementacja EAA w PL. | XI, XIV |
| **Ustawa z 4.04.2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych** | — | 🔶 | https://isap.sejm.gov.pl/ | Sektor publiczny. | XI |
| **EN 301 549** | V3.2.1 (2021) — sprawdź nowszą wersję zharmonizowaną z EAA | ⚠️ | https://www.etsi.org/ | Norma zharmonizowana (odwołuje się do WCAG). | XI |

## 6. SEO i wydajność

| Źródło | Status | Link oficjalny | Używane w |
|---|---|---|---|
| Google Search Central — dokumentacja (indeksowanie, robots, sitemap, canonical, JavaScript SEO, structured data, page experience, mobile-first indexing) | 🔶 | https://developers.google.com/search/docs | XII |
| web.dev — Core Web Vitals (progi LCP 2,5 s / INP 200 ms / CLS 0,1 na p75; INP zastąpił FID w marcu 2024) | 🔶 | https://web.dev/articles/vitals · https://web.dev/articles/inp | IX |
| Chrome UX Report (CrUX) / PageSpeed Insights | 🔶 | https://developer.chrome.com/docs/crux · https://pagespeed.web.dev/ | IX |
| Lighthouse | 🔶 | https://developer.chrome.com/docs/lighthouse | IX, X |
| schema.org / Rich Results Test | 🔶 | https://schema.org/ · https://search.google.com/test/rich-results | XII |
| Open Graph protocol | 🔶 | https://ogp.me/ | XII |
| sitemaps.org | 🔶 | https://www.sitemaps.org/protocol.html | XII |
| Bing Webmaster Guidelines | 🔶 | https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a | XII |

## 7. Prywatność i prawo (UE, PL)

> ⚖️ Dokument nie stanowi porady prawnej. Tabela wskazuje źródła do weryfikacji przez prawnika/IOD.

| Źródło | Wersja / stan | Status | Link oficjalny | Używane w |
|---|---|---|---|---|
| **RODO / GDPR** — Rozporządzenie (UE) 2016/679 | stosowane od 25.05.2018 | ✅ | https://eur-lex.europa.eu/eli/reg/2016/679/oj | XIII, XVI, XVII, IR |
| **Dyrektywa ePrivacy** 2002/58/WE (zm. 2009/136/WE) | — | 🔶 | https://eur-lex.europa.eu/eli/dir/2002/58/oj | XIII |
| **Prawo komunikacji elektronicznej** (ustawa z 12.07.2024, Dz.U. 2024 poz. 1221) — art. 399–400 (przechowywanie informacji / dostęp do urządzenia końcowego; zgoda w standardzie RODO) | obowiązuje od 10.11.2024; zastąpił art. 173 Prawa telekomunikacyjnego | ✅ (wejście w życie i numer artykułu); ⚠️ organ właściwy do egzekwowania (UKE/UODO) — źródła niejednoznaczne | https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240001221 | XIII |
| **Ustawa o świadczeniu usług drogą elektroniczną** (18.07.2002) | — | 🔶 | https://isap.sejm.gov.pl/ | XIII |
| **Ustawa o ochronie danych osobowych** (10.05.2018) | — | 🔶 | https://isap.sejm.gov.pl/ | XIII |
| **UODO** — wykaz operacji wymagających DPIA, formularz zgłoszenia naruszenia, decyzje | ciągłe | 🔶 | https://uodo.gov.pl/ | XIII, IR |
| **EROD/EDPB** — m.in. Wytyczne 05/2020 (zgoda), 03/2022 (deceptive design patterns), 9/2022 (zgłaszanie naruszeń) | — | 🔶 | https://www.edpb.europa.eu/our-work-tools/general-guidance/guidelines-recommendations-best-practices_en | XIII |
| **EU-US Data Privacy Framework** (decyzja KE z 10.07.2023) | ⚠️ podlega przeglądom/skargom — sprawdź aktualny status | ⚠️ | https://www.dataprivacyframework.gov/ · https://commission.europa.eu/ | XIII |
| **Digital Services Act** — Rozp. (UE) 2022/2065 | stosowane w pełni od 17.02.2024 | 🔶 | https://eur-lex.europa.eu/eli/reg/2022/2065/oj | XIII |
| **AI Act** — Rozp. (UE) 2024/1689 | stosowanie etapowe (2025–2027) | ⚠️ | https://eur-lex.europa.eu/eli/reg/2024/1689/oj | XIII |
| **NIS2** — Dyrektywa (UE) 2022/2555 i implementacja krajowa (KSC) | ⚠️ zakres podmiotowy — weryfikacja prawna | ⚠️ | https://eur-lex.europa.eu/eli/dir/2022/2555/oj | IR (obowiązki sektorowe) |
| **CERT Polska** — zgłaszanie incydentów | — | 🔶 | https://incydent.cert.pl/ | IR |

## 8. Płatności i e-commerce

| Źródło | Wersja / stan | Status | Link oficjalny | Używane w |
|---|---|---|---|---|
| **PCI DSS** | **v4.0.1** (czerwiec 2024); wymagania „future-dated” obowiązujące od 31.03.2025; zmiany kryteriów SAQ A (2025) | 🔶 wersja; ⚠️ aktualna treść SAQ A | https://www.pcisecuritystandards.org/document_library/ | XIV |
| **Ustawa o prawach konsumenta** (30.05.2014) | — | 🔶 | https://isap.sejm.gov.pl/ | XIII, XIV |
| **Ustawa o informowaniu o cenach towarów i usług** (9.05.2014, zm. Omnibus) | — | 🔶 | https://isap.sejm.gov.pl/ | XIV |
| **Dyrektywa (UE) 2023/2673** (m.in. funkcja odstąpienia od umowy w interfejsie online) | stosowanie od 19.06.2026 | ⚠️ zweryfikuj implementację w PL | https://eur-lex.europa.eu/eli/dir/2023/2673/oj | XIV |
| **GPSR** — Rozp. (UE) 2023/988 (ogólne bezpieczeństwo produktów) | stosowane od 13.12.2024 | 🔶 | https://eur-lex.europa.eu/eli/reg/2023/988/oj | XIV |
| **KSeF** (Krajowy System e-Faktur) | obowiązek etapowy od 2026 | ⚠️ harmonogram i wyjątki — weryfikacja księgowa | https://ksef.podatki.gov.pl/ | XIV |
| **PSD2 / SCA** | — | 🔶 | https://eur-lex.europa.eu/eli/dir/2015/2366/oj | XIV |
| Dokumentacja operatorów (webhooki, podpisy, sandbox): Stripe, PayU, Przelewy24, Tpay, Adyen, PayPal | ciągła | 🔶 | strony deweloperskie operatorów | V, XIV |

## 9. Dokumentacja technologii

| Technologia | Kluczowe strony | Status | Uwagi zweryfikowane |
|---|---|---|---|
| **Next.js** | https://nextjs.org/docs/app/guides/data-security · https://nextjs.org/docs/app/guides/content-security-policy · https://nextjs.org/docs/app/api-reference/file-conventions/proxy | ✅ (zmiana nazwy) | Od Next.js 16 `middleware.ts` → `proxy.ts` (eksport `proxy`, domyślnie runtime Node.js); `middleware.ts` przestarzały. Codemod migracyjny dostępny w `@next/codemod`. |
| **React** | https://react.dev/ | 🔶 | — |
| **Vite** | https://vite.dev/guide/env-and-mode · https://vite.dev/guide/static-deploy | 🔶 | — |
| **Node.js** | https://nodejs.org/en/learn/getting-started/security-best-practices · https://nodejs.org/en/about/previous-releases | 🔶 | Sprawdzaj status LTS/EOL. |
| **TypeScript** | https://www.typescriptlang.org/tsconfig/#strict | 🔶 | — |
| **Supabase** | https://supabase.com/docs/guides/database/postgres/row-level-security · https://supabase.com/docs/guides/api/api-keys · https://supabase.com/docs/guides/storage/security/access-control · https://supabase.com/docs/guides/database/database-advisors | 🔶 | Nazewnictwo kluczy (anon/service_role vs publishable/secret) zmienia się — sprawdź w projekcie. |
| **Firebase** | https://firebase.google.com/docs/rules · https://firebase.google.com/docs/app-check · https://firebase.google.com/docs/rules/unit-tests | 🔶 | — |
| **PostgreSQL** | https://www.postgresql.org/docs/current/ddl-rowsecurity.html · https://www.postgresql.org/support/versioning/ | 🔶 | — |
| **MongoDB** | https://www.mongodb.com/docs/manual/administration/security-checklist/ | 🔶 | — |
| **Shopify** | https://shopify.dev/docs/apps/build/webhooks · https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance · https://shopify.dev/docs/apps/build/checkout | 🔶 | Wygaszanie `checkout.liquid` / Additional scripts — sprawdź aktualny status dla planu sklepu. |
| **WordPress** | https://developer.wordpress.org/advanced-administration/security/hardening/ · https://developer.wordpress.org/apis/security/ | 🔶 | — |
| **GraphQL** | https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html | 🔶 | — |

## 10. Narzędzia

| Narzędzie | Link | Licencja / model |
|---|---|---|
| OWASP ZAP | https://www.zaproxy.org/ | Open source |
| Burp Suite | https://portswigger.net/burp | Community (bezpł.) / Pro (komercyjna) |
| Semgrep | https://semgrep.dev/ | OSS + komercyjna platforma |
| CodeQL | https://codeql.github.com/ | Bezpłatny dla OSS / GHAS |
| Gitleaks | https://github.com/gitleaks/gitleaks | Open source |
| TruffleHog | https://github.com/trufflesecurity/trufflehog | Open source |
| OSV-Scanner | https://google.github.io/osv-scanner/ | Open source |
| Trivy | https://trivy.dev/ | Open source |
| Snyk | https://snyk.io/ | Komercyjny z planem bezpłatnym |
| Syft / CycloneDX npm | https://github.com/anchore/syft · https://github.com/CycloneDX/cyclonedx-node-npm | Open source |
| zizmor / actionlint | https://github.com/zizmorcore/zizmor · https://github.com/rhysd/actionlint | Open source |
| testssl.sh / SSL Labs | https://testssl.sh/ · https://www.ssllabs.com/ssltest/ | Open source / bezpłatna usługa |
| Nuclei | https://github.com/projectdiscovery/nuclei | Open source |
| Schemathesis | https://schemathesis.readthedocs.io/ | Open source |
| Playwright / Vitest / Jest / Testing Library | https://playwright.dev/ · https://vitest.dev/ · https://jestjs.io/ · https://testing-library.com/ | Open source |
| Postman / Bruno | https://www.postman.com/ · https://www.usebruno.com/ | Komercyjny / open source |
| axe-core | https://github.com/dequelabs/axe-core | Open source |
| k6 / Artillery | https://grafana.com/docs/k6/ · https://www.artillery.io/docs | Open source (+ chmura komercyjna) |
| Sentry / OpenTelemetry / Grafana / Prometheus / Better Stack / Datadog | https://docs.sentry.io/ · https://opentelemetry.io/ · https://grafana.com/ · https://prometheus.io/ · https://betterstack.com/ · https://www.datadoghq.com/ | Różne |

## 11. Rejestr zmian standardów istotnych dla dokumentu

| Data zmiany | Standard | Zmiana | Wpływ na checklistę |
|---|---|---|---|
| 03.2024 | Core Web Vitals | INP zastąpił FID | IX (PERF-002) |
| 06.2024 | PCI DSS | v4.0.1 | XIV |
| 10.11.2024 | PKE (PL) | Nowa podstawa prawna cookies (art. 399) w miejsce art. 173 Pr. tel. | XIII |
| 12.2024 | WCAG 2.2 | Aktualizacja rekomendacji | XI |
| 05.2025 | OWASP ASVS | 5.0.0 — nowa struktura rozdziałów | wszystkie odwołania „ASVS 5.0 Vx” |
| 28.06.2025 | EAA / Polski Akt o Dostępności | Początek stosowania | XI, XIV |
| 11.2025 | OWASP Top 10 | Edycja 2025 (nowe A03, A10; SSRF w A01) | III.0 |
| 12.2025 | NIST SSDF | Projekt SP 800-218 Rev. 1 (v1.2) | XVIII — sprawdź wersję finalną |
| 2025/2026 | Next.js 16 | `middleware.ts` → `proxy.ts` | XX.1 |
| 19.06.2026 | Dyr. 2023/2673 | Funkcja odstąpienia online (stosowanie) | XIV (ECOM-013) |

**Procedura aktualizacji:** co 12 miesięcy (oraz po ogłoszeniu nowej wersji kluczowego standardu) właściciel dokumentu weryfikuje tabelę, aktualizuje statusy ✅/🔶/⚠️, wprowadza zmiany do checklisty i podnosi jej wersję (SemVer: zmiana wymagań P0/P1 → MINOR, przebudowa struktury → MAJOR).
