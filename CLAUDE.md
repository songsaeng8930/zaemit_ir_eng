# WEVEN IR 프로젝트 - AI 작업 지침

## 필독 문서 (작업 전 반드시 읽을 것)

1. **[docs/project-overview.md](docs/project-overview.md)** - 프로젝트 전체 구조
2. **[docs/ir-print-compatibility.md](docs/ir-print-compatibility.md)** - 프린트 미리보기 호환성 규칙 (**새 IR 생성 시 필수!**)
3. **[docs/ir-style-guide.md](docs/ir-style-guide.md)** - 다크 테마 스타일 가이드
4. **[docs/ir-style-guide-light.md](docs/ir-style-guide-light.md)** - 라이트 테마 스타일 가이드
5. **[docs/ir-style-guide-zaemit.md](docs/ir-style-guide-zaemit.md)** - **Zaemit 컨셉** 스타일 가이드 (제3의 디자인 — 파스텔 메쉬 · 미니멀 에디토리얼)
6. **[docs/ir-i18n-guide.md](docs/ir-i18n-guide.md)** - 다국어(KO/EN/JA) 대응 가이드
7. **[docs/ir-copy-style-guide.md](docs/ir-copy-style-guide.md)** - **IR 카피 말투 지침** (모든 슬라이드 텍스트 작성·수정 시 필수! AI 슬롭 금지 패턴 + 대표 화법 기준)

---

## 핵심 원칙

### ⚠️ 0. 단위 체계와 폰트 크기 — 절대 규칙 (가장 중요!)

#### 0-A. 반드시 vw 단위 사용 — px 사용 금지

> **슬라이드 CSS/인라인 스타일의 모든 크기값(font-size, padding, margin, gap, width, height, border-radius 등)은 반드시 `vw` 단위를 사용한다. 고정 `px` 단위 사용 금지.**

- 뷰포트가 `width=1280`으로 고정이므로, `1vw = 12.8px`이다.
- 변환 공식: **px값 ÷ 1280 × 100 = vw값**
- `padding:40px 100px` ❌ → `padding:3.125vw 7.8125vw` ✅
- `font-size:20px` ❌ → `font-size:1.5625vw` ✅
- `gap:24px` ❌ → `gap:1.875vw` ✅
- `border-radius:16px` ❌ → `border-radius:1.25vw` ✅

**px 허용 예외:**
- `border: 1px solid ...` — 1px 보더선은 px 유지
- `max(18px, Xvw)` 안의 `18px` — 최소값 보장용
- SVG 내부 속성 — SVG 좌표계

**자주 쓰는 변환 테이블:**
| px | vw | px | vw | px | vw |
|----|----|----|----|----|-----|
| 4 | 0.3125 | 18 | 1.40625 | 48 | 3.75 |
| 6 | 0.46875 | 20 | 1.5625 | 54 | 4.21875 |
| 8 | 0.625 | 24 | 1.875 | 60 | 4.6875 |
| 10 | 0.78125 | 28 | 2.1875 | 72 | 5.625 |
| 12 | 0.9375 | 32 | 2.5 | 100 | 7.8125 |
| 14 | 1.09375 | 36 | 2.8125 | 160 | 12.5 |
| 16 | 1.25 | 40 | 3.125 | 320 | 25 |

#### 0-B. 폰트 최소 크기 18px — max() 래핑 필수

> **슬라이드 콘텐츠 영역의 모든 텍스트 CSS font-size는 반드시 18px(1.40625vw) 이상이어야 한다.**

- **1.40625vw 미만의 모든 font-size에는 반드시 `max(18px, Xvw)` 적용** 필수.
- `font-size:1.09375vw` ❌ → `font-size:max(18px,1.09375vw)` ✅
- `font-size:0.9375vw` ❌ → `font-size:max(18px,0.9375vw)` ✅
- `font-size:13px` ❌ → `font-size:max(18px,1.015625vw)` ✅ (px가 아닌 vw+max 사용)
- 1.40625vw(=18px) 이상은 이미 18px 이상이므로 `max()` 불필요.

#### 0-C. 프레젠테이션 기준 크기 체계 (Reference Scale)

> **슬라이드는 웹사이트가 아닌 프레젠테이션이다. 아래 크기 체계를 기준으로 디자인한다.**

| 요소 | vw값 | px환산 | 설명 |
|------|-------|--------|------|
| **body 기본** | `max(18px,1.25vw)` | 18px | 전체 기본 폰트, 반드시 body에 선언 |
| **hero h1** | `4.6875vw` | 60px | 표지 대제목 |
| **section-title** | `2.8125vw` | 36px | 슬라이드 제목 |
| **section-desc** | `1.40625vw` | 18px | 슬라이드 부제 |
| **section-label** | `max(18px,1.171875vw)` | 18px | 섹션 라벨 (UPPERCASE) |
| **카드 제목** | `1.875vw` | 24px | 카드/박스 내 헤딩 |
| **본문 텍스트** | `max(18px,1.09375vw)` | 18px | 카드 설명, 표 셀, 리스트 |
| **통계 수치** | `2.34375vw~2.8125vw` | 30~36px | 큰 숫자 강조 |
| **배지/라벨** | `max(18px,1.09375vw)` | 18px | 태그, 배지 텍스트 |

**적용 대상 (반드시 18px 이상):**
- CSS `<style>` 블록의 모든 font-size 선언 (뷰어 UI 제외)
- HTML 인라인 `style="font-size:..."` — **가장 빈번한 위반 지점!**
- section-label, section-title, section-desc 등 슬라이드 헤더
- 카드 내부 텍스트, 표 셀 텍스트, 배지 라벨, 리스트 항목
- 차트 축 라벨, 범례 텍스트 (SVG 좌표계 제외)

**예외 (18px 미만 허용):**
- SVG 내부 `font-size` 속성: SVG 좌표계이므로 제외
- viewer UI 요소: sidebar, menu-header, page-indicator, powered-badge 등 (viewer가 관리)

**콘텐츠 오버플로 주의**: 18px 최소값 적용 시 콘텐츠가 슬라이드 높이를 넘을 수 있음.
  → 패딩/마진 축소, 줄바꿈 방지(`white-space:nowrap`), 간격 압축으로 대응.
  → **콘텐츠 항목 수를 줄이는 것이 최우선**. 한 슬라이드에 너무 많은 정보를 넣지 않는다.
  → **절대 font-size를 18px 미만으로 줄이지 않는다.**

#### 0-D. 반응형 미디어 쿼리 사용 금지

> **`@media` 쿼리를 슬라이드 CSS에 사용하지 않는다.**

- 뷰포트가 `width=1280` 고정이므로 반응형 브레이크포인트가 불필요하다.
- 미디어 쿼리는 웹사이트스러운 동작의 원인이 된다.
- viewer가 CSS `zoom`으로 스케일링하므로 vw 단위만으로 모든 해상도에 대응한다.

**새 슬라이드 생성/수정 시 체크리스트:**
1. CSS `<style>` 블록의 모든 font-size 선언 확인 — **vw 단위 + max(18px,...) 패턴**
2. HTML 인라인 `style="font-size:..."` 전수 검사 — **px 단위가 있으면 vw로 변환**
3. 모든 spacing(padding, margin, gap, border-radius) — **vw 단위 확인**
4. SVG 내부 속성은 SVG 좌표계이므로 제외
5. `@media` 쿼리가 없는지 확인
6. 완성 후 검증: `grep -n "font-size:[0-9]*px" index.html | grep -v "max(\|<svg\|<text\|viewBox"` 로 vw 미적용 px 위반 확인

### 0-1. 16:9 디자인 원칙과 자동 zoom

#### 16:9 디자인 가이드라인

> **슬라이드 콘텐츠는 16:9 비율(1280 × 720)을 기준으로 디자인하되, viewer가 제공하는 실제 뷰포트(최대 1280 × 960)를 활용한다.**

- 16:9는 **디자인 기준**이다. JS에서 높이를 하드코딩으로 제한하지 않는다.
- viewer가 iframe 크기를 관리하므로, 슬라이드는 실제 `slide.clientHeight`를 기준으로 콘텐츠를 배치한다.
- 슬라이드 패딩이 상하좌우 안전 영역을 확보:
  - **상단**: `4.6875vw` (60px) — 섹션 라벨/타이틀 여유
  - **하단**: `7vw` (89.6px) — viewer footer (페이지 인디케이터, Powered 배지) 예약
  - **좌우**: `7.8125vw` (100px) — 좌우 여백

#### 자동 zoom (`fitSlideContent`)

> **콘텐츠가 safe area를 넘으면 `slide-inner`에 CSS `zoom`을 적용하여 자동 축소한다.**

- 폰트 사이즈를 개별적으로 줄이지 않는다. 전체 `zoom`으로 비율을 유지하며 축소.
- JS `fitSlideContent(slide)` 함수가 각 슬라이드의 `slide-inner`에 대해:
  1. `zoom`을 리셋하고 자연 크기(`scrollHeight`, `scrollWidth`)를 측정
  2. 사용 가능 높이 = `slide.clientHeight - paddingTop - max(paddingBottom, 7vw)`
  3. 사용 가능 너비 = `slide.clientWidth - paddingLeft - paddingRight`
  4. `zoom = min(availH / naturalH, availW / naturalW)` — **너비와 높이 모두 체크**
  5. zoom 범위: **0.5 ~ 1.0** (확대 안 함, 0.5 미만 축소 안 함)
- 적용 시점: 페이지 로드(`document.fonts.ready`), 슬라이드 전환(`goTo` — 활성화 전 pre-fit), 윈도우 리사이즈, 언어 변경(`setLang`)
- **zoom이 0.75 미만이면 콘텐츠가 너무 많다는 신호** → 항목 수를 줄이거나 슬라이드를 분할할 것
- **새 슬라이드 추가 시**: 콘텐츠 양이 많아도 자동 zoom이 처리하지만, zoom이 과하면 가독성이 떨어지므로 콘텐츠 양을 조절하는 것이 우선

### 0-E. 슬라이드 레이아웃 — 절대 규칙

#### 수직 가운데 정렬 필수

> **모든 슬라이드의 `slide-inner`는 `display:flex;flex-direction:column;justify-content:center`로 콘텐츠를 수직 가운데 정렬한다.**

- 타이틀(section-label, section-title, section-desc)과 콘텐츠 사이에 자연스러운 간격이 유지되어야 한다.
- 콘텐츠가 상단에 붙거나, 타이틀과 콘텐츠가 밀착되면 안 된다.
- `fitSlideContent` zoom 적용 후에도 수직 가운데 정렬이 유지되어야 한다.

#### 보더(border) 디자인 최소화 — 강력 권고

> **카드, 박스, 컨테이너에 border를 사용하지 않는다. 배경색(background)과 그림자(box-shadow)로 영역을 구분한다.**

- `border: 1px solid ...` 스타일의 카드/박스 외곽선 사용 금지.
- **다크 테마**: `background: rgba(17,22,51,0.6)` 또는 `rgba(255,255,255,0.03~0.06)` 배경색으로 영역 구분.
- **라이트 테마**: `box-shadow` + 밝은 배경색으로 영역 구분.
- **허용 예외**: 테이블 구분선(`border-bottom: 1px solid ...`), 프로그레스바, 구분자(divider) 등 구조적으로 필요한 선만 허용.
- `border-top`, `border-left` 등 accent border (강조 보더) 절대 사용 금지.

#### 아이콘은 반드시 Lucide 인라인 SVG만 사용

> **이모지, Font Awesome, Material Icons 등 다른 아이콘 시스템을 절대 사용하지 않는다.**

- 이모지(📊🔽🚀💡✅ 등)를 아이콘 대용으로 사용 금지.
- 모든 아이콘은 **Lucide** 인라인 SVG로 작성한다.
- 형식: `<svg width="N" height="N" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">...</svg>`
- 참고: https://lucide.dev/icons
- SVG의 `width`, `height` 속성은 vw 단위로 변환하지 않아도 됨 (SVG 좌표계 예외).

#### 프레젠테이션 폰트 크기 — 웹사이트 크기 금지

> **슬라이드는 프레젠테이션이다. 웹사이트용 작은 폰트(12px, 13px, 14px 등)를 절대 사용하지 않는다.**

- 모든 텍스트는 최소 18px(1.40625vw) 이상.
- 카드 설명, 표 셀, 배지 라벨 등 모든 텍스트에 `max(18px, Xvw)` 패턴 적용.
- 프레젠테이션에서 관객이 읽을 수 있는 크기여야 한다.
- `fitSlideContent` zoom이 자동 축소하므로, 개별 폰트를 줄이지 않는다.

### 1. IR 페이지에 viewer 중복 UI 금지

> **IR 페이지(ir/XXXXXX/index.html)에는 viewer가 제공하는 UI를 넣지 않는다.**

viewer(`app/viewer.html`)가 이미 제공하는 요소들:
- 사이드바 / TOC (목차)
- 페이지 인디케이터 (번호, 프로그레스바)
- 언어 전환 토글 (KO/EN/JA)
- 메뉴 헤더 (타이틀바)
- Powered by 배지

IR 페이지는 **슬라이드 콘텐츠 + 네비게이션 JS + viewer 연동 훅**만 포함:
- `window.setLang` — viewer가 호출
- `window.goToSlide` — viewer가 호출
- `window.irSlideInfo` — viewer가 읽음
- 키보드/휠/터치 핸들러 — iframe 포커스 시 동작
- `body.no-motion` 토글 지원 — CSS만 (UI 버튼 불필요)

### 2. CSS 오버라이드 금지
print-preview.css에서 원본 레이아웃을 변경하는 CSS를 추가하지 않는다.
wrapper만 씌우고, 원본 스타일은 그대로 유지한다.

### 3. 버전별 차이 인지
- **2601**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `lang-visible` 언어 시스템
- **2602**: 라이트 테마, `.cover` 클래스, ir-common.js 사용, `body.ko/en` 언어 시스템
- **260202**: 라이트 테마, `.cover` 클래스, 인라인 스크립트, `body.ko/en` 언어 시스템
- **260302**: 다크 테마, 인라인 스크립트, **한국어(KO) 전용** — 영문/일문 불필요, `data-lang` 속성 사용하지 않음, vw 단위 전면 적용
- **260303**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `body.ko/en/ja` 언어 시스템, **3개 국어(KO/EN/JA)**, vw 단위 전면 적용, 16:9 콘텐츠 프레임, `fitSlideContent` 자동 zoom
- **260814_introduce**: **Zaemit 컨셉** (제3의 디자인 테마 — docs/ir-style-guide-zaemit.md 필독), 인라인 스크립트, **한국어(KO) 전용**, vw 단위 전면 적용, `fitSlideContent` 자동 zoom, 파스텔 메쉬 배경(`.mesh` + 슬라이드별 변주), 시그니처 카드(1px 헤어라인 보더 허용 예외), `data-appendix` 부록 슬라이드
- **260203**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `body.ko/en/ja` 언어 시스템, **3개 국어(KO/EN/JA)** 지원, 뷰포트 `width=1280` 고정

### 4. 언어 시스템 (버전별 다름!)
- **2601**: `lang-visible` 클래스 시스템 (JS가 클래스 추가)
- **260202/2602/260203**: `body.ko`/`body.en`/`body.ja` 클래스 시스템 (CSS 규칙 적용)
- inline style로 display를 설정하지 않는다.

### 5. 전역 함수 노출
IR 페이지에서 `window.setLang`, `window.goToSlide` 함수를 전역으로 노출해야 한다.

### 6. 아이콘은 Lucide SVG만 사용 (0-E 참조, 절대 규칙)
- 이모지(📊🔽🚀💡✅ 등)를 아이콘으로 **절대** 사용하지 않는다.
- Font Awesome, Material Icons 등 다른 아이콘 라이브러리도 사용하지 않는다.
- 모든 아이콘은 **Lucide** 인라인 SVG를 사용한다.
- 형식: `<svg width="N" height="N" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">...</svg>`
- 참고: https://lucide.dev/icons

### 7. 다국어 콘텐츠 필수 (260203)
- **모든 텍스트 요소**에 `data-lang="ko"`, `data-lang="en"`, `data-lang="ja"` 3벌 작성
- SVG 내 `<text>` 요소도 반드시 3개 국어 제공
- 일본어 텍스트가 긴 경우 SVG pill/rect 너비 확장 또는 폰트 크기 축소
- 자세한 내용: [docs/ir-i18n-guide.md](docs/ir-i18n-guide.md)

---

## 자주 발생하는 실수

| 실수 | 해결 |
|-----|-----|
| **visibility: visible 누락** | **프린트 미리보기 빈화면** - `.slide-clone.slide`에 `visibility: visible !important` 필수 |
| **260202/2602/260203 언어 규칙 충돌** | print-preview의 언어 숨김에서 `:not(.ir-260202):not(.ir-2602):not(.ir-260203)` 제외 |
| display: block으로 오버라이드 | flex 요소 깨짐 - display: none만 사용 |
| Cover만 처리하고 Hero 누락 | .cover와 .hero 둘 다 처리 |
| justify-content: center를 slide-inner에 적용 | 타이틀도 움직임 - content-wrapper에만 적용 |
| width: 100%를 모든 자식에 적용 | Cover/Hero 가로 레이아웃 깨짐 - 제외 처리 |
| setLang 함수 미노출 | viewer에서 언어 전환 안됨 |
| **⚠️ border 사용** | **카드/박스에 border 사용 금지!** 배경색(background)과 그림자(box-shadow)로 영역 구분. accent border도 금지 |
| **⚠️ 이모지 아이콘 사용** | **이모지/Font Awesome 등 금지!** 반드시 Lucide 인라인 SVG만 사용 |
| **⚠️ 콘텐츠 상단 붙음** | `slide-inner`에 `display:flex;flex-direction:column;justify-content:center` 필수 — 수직 가운데 정렬 |
| **⚠️ 웹사이트용 작은 폰트** | 12px, 13px, 14px 등 프레젠테이션에 부적합한 작은 폰트 금지. 최소 18px 이상 |
| **일본어 번역 누락** | SVG `<text>`, 차트 라벨, 연도 축 등에서 `data-lang="ja"` 빠짐 — 반드시 3개 국어 확인 |
| **일본어 텍스트 overflow** | SVG pill/rect 너비 부족으로 텍스트 넘침 — 너비 확장 또는 폰트 축소, `white-space:nowrap` 활용 |
| **⚠️ font-size에 px 단위 사용** | **가장 흔한 실수!** 모든 font-size는 vw 단위 + `max(18px, Xvw)` 패턴 필수. **인라인 style이 자주 누락됨** |
| **⚠️ spacing에 px 단위 사용** | padding, margin, gap, border-radius 모두 vw 단위 필수. px 사용 시 웹사이트스러운 느낌 |
| **⚠️ @media 쿼리 사용** | 뷰포트 1280 고정이므로 반응형 불필요. 미디어 쿼리는 웹사이트 동작의 원인 |
| **⚠️ IR 페이지에 viewer UI 중복** | sidebar, 페이지번호, 언어토글, 메뉴헤더, powered badge 등 viewer가 제공하는 UI를 IR 페이지에 넣지 않는다 |
| **⚠️ body에 font-size 미선언** | `body`에 반드시 `font-size:max(18px,1.25vw)` 선언. 없으면 브라우저 기본 16px 적용됨 |
| **zoom이 0.7 미만으로 과도 축소** | 콘텐츠가 너무 많아 가독성 저하 — 항목 수를 줄이거나 슬라이드 분할로 대응 |
| **콘텐츠 넘침 시 폰트 개별 축소** | 폰트를 개별적으로 줄이지 않는다 — `fitSlideContent()` 자동 zoom이 전체를 균일 축소하므로 콘텐츠만 작성하면 됨 |
| **⚠️ AI 슬롭 말투** | "X가 아니라 Y" 대구 반복, 은유 동사(시동·점화·정조준·올라타다), 자문자답, 근거 없는 최상급 금지 — [docs/ir-copy-style-guide.md](docs/ir-copy-style-guide.md) 필독 |

---

## 작업 시작 전 확인사항

- [ ] docs/project-overview.md 읽음
- [ ] docs/ir-print-compatibility.md 읽음
- [ ] 2601과 2602와 260202와 260203의 차이점 인지
- [ ] print-preview.css의 CSS 오버라이드 최소화 원칙 이해
- [ ] 다국어(KO/EN/JA) 3벌 작성 원칙 이해

---

## 새 IR 버전 생성 시 필수 확인 (print-preview 호환성)

**반드시 docs/ir-print-compatibility.md 참조!**

1. **print-preview.css에 visibility: visible 있는지 확인**
   ```css
   .slide-clone.slide {
     opacity: 1 !important;
     visibility: visible !important;  /* 필수! */
   }
   ```

2. **언어 시스템 확인** - 새 IR이 어떤 방식 사용하는지:
   - `lang-visible` 클래스 시스템 (2601 방식)
   - `body.ko/en/ja` 클래스 시스템 (260202/2602/260203 방식)

3. **언어 규칙 충돌 방지** - 다른 시스템이면 제외 처리:
   ```css
   .slide-clone:not(.ir-NEW):not(.ir-2602):not(.ir-260203) [data-lang]:not(.lang-visible) { ... }
   ```

4. **테마 클래스 추가** - print-preview.js에서:
   ```javascript
   const isLightTheme = irVersion === '2602' || irVersion === '260202' || versionConfig?.theme === 'light';
   ```

---

## 앱 구조 (app/)

### conf.json
```json
{
  "defaultIR": "260203",
  "versions": [{ "id": "260203", "theme": "dark", "default": true }, ...]
}
```

### 라우팅
- `app/` → `index.html`이 `conf.json`의 `defaultIR`로 자동 리다이렉트
- `app/viewer.html?ir=260203` → IR 뷰어 (iframe 기반)
- `app/viewer.html?ir=260203&lang=ja&page=3` → 특정 페이지/언어로 직접 이동
- URL 파라미터: `ir`, `lang`, `page` (query string 또는 hash 모두 지원)

### viewer.html 주요 기능
- iframe 기반 IR 로드 (ir-frame)
- 사이드바 TOC (슬라이드 제목 자동 수집)
- KO/EN/JA 언어 전환
- 키보드/휠/터치 네비게이션 (모바일: 좌/우 탭 + 좌/우 스와이프)
- 페이지 인디케이터 (프로그레스바 + 번호)

### viewer.html 스케일링 (`fitFrame()`)
- **BASE_W=1280, BASE_H=960** (IR 콘텐츠 기준 해상도)
- **PC**: CSS `zoom` 기반 스케일링, 콘텐츠 높이 최대 85%, iframe이 뷰포트 전체 커버
- **모바일 세로**: 뷰포트 `width=1280` 고정, iframe 풀 뷰포트 + CSS 주입으로 슬라이드 패딩 조정 (콘텐츠 960px, 배경 풀 커버)
- **모바일 가로**: zoom 스케일링 (높이 기준)
- **핵심**: `transform:scale()` 대신 CSS `zoom` 사용 (비디오 flickering 방지)
- **모바일 CSS 주입**: `body.mobile-portrait` 클래스 토글 + `padding-top/bottom: calc(50vh - 440px)` 주입하여 콘텐츠 영역 제한

### viewer.html 수정 시 주의사항
- `fitFrame()` 수정 시 PC/모바일 세로/모바일 가로 3가지 경우 모두 테스트
- 모바일에서 `100vh`는 iframe 뷰포트 높이 (세로 ~2770px) — 슬라이드가 늘어나지 않도록 주의
- 터치 오버레이(#touchOverlay)는 iframe 위에 위치하여 터치 이벤트 캡처
- 비디오 요소에 `transform:translateZ(0);backface-visibility:hidden` (GPU 레이어 프로모션)

---

## 개발 서버

```bash
node server.js        # 권장 — 정적 서빙 + 인쇄 미리보기 "원본 저장" API (POST /api/save-ir)
npx http-server -p 8080 -c-1 --cors   # 대안 (저장 API 없음 — 원본 저장 시 파일 선택 방식으로 폴백)
```

- 인쇄 미리보기의 "텍스트 편집" → "원본 저장"은 `node server.js`로 띄웠을 때 `ir/<버전>/index.html`에 바로 저장됨 (덮어쓰기 전 `index.html.bak` 자동 백업)

- Viewer: http://127.0.0.1:8080/app/viewer.html?ir=260203
- 일본어: http://127.0.0.1:8080/app/viewer.html?ir=260203&lang=ja
- Print Preview: http://127.0.0.1:8080/app/print-preview.html?ir=260203
- 자동 리다이렉트: http://127.0.0.1:8080/app/

# Zaemit Visual Editor - AI Tool Instructions

## MCP Tool Priority

This project uses the **Zaemit Visual HTML/CSS Editor** VS Code extension.

**IMPORTANT**: When the user asks about editing elements, styles, selections, outlines, colors, or anything related to a visual editor / HTML / CSS / web page, ALWAYS use `zaemit_*` tools FIRST — NOT Pencil tools.

### When to use Zaemit tools
- User mentions: "재밋", "zaemit", "에디터", "비주얼 에디터", "HTML", "엘리먼트", "선택한", "외곽선", "스타일", "페이지"
- Any request about editing/viewing/selecting HTML elements
- Any request about CSS styles, outlines, borders, colors, layouts

### When to use Pencil tools
- ONLY when the user explicitly mentions ".pen files" or "pencil"

### Available Zaemit tools
- `zaemit_get_editor_state` - Editor connection status
- `zaemit_get_selection` - Selected HTML element details
- `zaemit_get_page_html` - Full page HTML
- `zaemit_get_element_tree` - DOM tree
- `zaemit_update_element` - Update styles/attributes/text
- `zaemit_replace_element_html` - Replace outerHTML
- `zaemit_insert_element` - Insert new HTML
- `zaemit_delete_element` - Delete element
