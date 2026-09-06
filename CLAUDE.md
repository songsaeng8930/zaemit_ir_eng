# WEVEN IR 프로젝트 - AI 작업 지침

## 필독 문서 (작업 전 반드시 읽을 것)

1. **[docs/project-overview.md](docs/project-overview.md)** - 프로젝트 전체 구조
2. **[docs/ir-print-compatibility.md](docs/ir-print-compatibility.md)** - 프린트 미리보기 호환성 규칙 (**새 IR 생성 시 필수!**)
3. **[docs/ir-style-guide.md](docs/ir-style-guide.md)** - 다크 테마 스타일 가이드
4. **[docs/ir-style-guide-light.md](docs/ir-style-guide-light.md)** - 라이트 테마 스타일 가이드
5. **[docs/ir-style-guide-zaemit.md](docs/ir-style-guide-zaemit.md)** - **Zaemit 컨셉** 스타일 가이드 (제3의 디자인 — 파스텔 메쉬 · 미니멀 에디토리얼)
6. **[docs/ir-i18n-guide.md](docs/ir-i18n-guide.md)** - 다국어(KO/EN/JA) 대응 가이드
7. **[docs/ir-copy-style-guide.md](docs/ir-copy-style-guide.md)** - **IR 카피 말투 지침** (모든 슬라이드 텍스트 작성·수정 시 필수! AI 슬롭 금지 패턴 + 대표 화법 기준)
8. **[docs/ir-sentence-style-guide.md](docs/ir-sentence-style-guide.md)** - **IR 문장체 표준** (⚠️ 최우선 — 대표 지시: 모든 문서의 문장체는 WEVEN_Zaemit_IR_2026-02-02.pdf 기준. 헤드라인·서브·카드·불릿·숫자·이력 표기 구조)
9. **[docs/blog-copy-style-guide.md](docs/blog-copy-style-guide.md)** - 블로그 카피 말투 지침 (blog/ 롱폼 글 필수 — 격식 존댓말 + 블로그 전용 슬롭 패턴)
10. **[docs/korean-content-writing-rules.md](docs/korean-content-writing-rules.md)** - **한국어 콘텐츠 작성 규칙** (⚠️ 2026-09-05 대표 지시: IR·프레젠테이션의 모든 텍스트에 적용. 문장 구조·어휘·수치 인용·결론·목록·표·이미지 글자·시각 요소 규칙. 슬라이드 적용법은 §0-I)

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

#### 박스 안에 박스 금지 (대표 지시 2026-08-30, 절대 규칙)

> **배경·보더·그림자를 가진 영역 안에, 다시 배경·보더·그림자를 가진 영역을 넣지 않는다.**
> 대표 피드백 원문: "계속해서 박스에 박스를 쓰고있자나. 박스에 박스를 너무 쓰지 마!"

- 카드 안의 칩, 프레임 안의 스크린샷, 밴드 안의 카드가 모두 해당한다.
- **이미 시각적 경계를 가진 콘텐츠(스크린샷·사진·목업·차트)는 그 자체가 박스다.** 흰 프레임으로 감싸지 않는다. `border-radius`와 `box-shadow`는 이미지에 직접 준다.
- 칩·배지·태그를 나열할 때 바깥 카드를 두르지 않는다. 배경(메쉬) 위에 직접 놓는다. 260902 덱의 `.lin.open`이 이 목적의 변형이다.
- **잘림의 가장 흔한 원인이다.** 중첩 한 겹마다 패딩이 2~4vw씩 쌓여 콘텐츠가 슬라이드 밖으로 밀린다. 콘텐츠를 줄이기 전에 박스 겹을 먼저 벗긴다.
- 자가 점검: 임의의 요소에서 부모를 거슬러 올라갈 때 `background`/`border`/`box-shadow`를 가진 조상이 **2개 이상이면 위반**이다.

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

### 0-F. 프레젠테이션 모드 — 정리정돈 금지 (대표 지시 2026-08-29, 절대 규칙)

> **이 저장소의 모든 슬라이드는 '프레젠테이션'이다. 목적은 정보의 정리정돈이 아니라 청중 설득과 전달이다.**
> 대표 피드백 원문: "디자인이 모든 페이지 박스밖에 없고 창의적이지도 않고 설명력이 충분하지 않다. 정리정돈을 원하는 게 아니라 독자에게 나의 생각을 효과적으로 전달하기 위한 프레젠테이션 자료를 만들고 있다."

- **한 장표 = 한 메시지.** 콘텐츠를 쓰기 전에 "이 장표가 증명할 한 문장"을 정하고, 그 문장을 가장 잘 **보여주는** 시각 구조를 먼저 고른다. 카드 나열은 최후의 수단이다.
- **카드 그리드(2·3열 gcard류) 연속 2장 금지.** 덱 전체에서 카드 그리드 비중 1/3 이하.
- **레이아웃 카탈로그** (Zaemit 컨셉 문법 안에서 선택 — 새 덱은 최소 6종 이상 혼용):
  | 메시지 유형 | 시각 구조 |
  |---|---|
  | 감정·기대의 변화 | 곡선 차트 + 주석 핀 (기대 곡선) |
  | 갈림길·선택 | 분기(fork) 다이어그램 — SVG 커넥터 |
  | 걸러짐·조건 | 퍼널/필터 게이트 플로우 |
  | 전/후 대비 | 좌우 스플릿 + 중앙 화살표 (어제/오늘) |
  | 힘·규모 차이 | 크기 대비 다이어그램 (작은 원 vs 큰 원) |
  | 단계적 발전 | 상승 계단 (roadmap .lv 문법) |
  | 순환 구조 | 루프 다이어그램 (원형 화살표) |
  | 층위·기반 | 계층 스택 (foundation) |
  | 가격·배수 비교 | 가로 바 차트 (길이가 곧 주장) |
  | 시간 서사 | 타임라인 (가로 노드 / 세로 레일) |
  | 정밀 근거 | 표 (추산·비교) |
  | 실물 증거 | 실사 이미지·브라우저 목업·사진 밴드 |
- 다이어그램 선·글로우·칩 문법은 [docs/ir-style-guide-zaemit.md](docs/ir-style-guide-zaemit.md) §7~8을 따른다. SVG 커넥터는 이중 스트로크(글로우+본선) + `m-draw`.
- 자가 검증: 덱을 넘기며 "연속 두 장이 같은 골격인가?"를 확인한다. 같으면 하나를 다른 구조로 바꾼다.

### 0-G. "재밋 스타일" = Zaemit 컨셉 (대표 상시 지시, 절대 규칙)

> **대표가 "재밋 스타일로 만들어줘"라고 하면, 기준은 [docs/ir-style-guide-zaemit.md](docs/ir-style-guide-zaemit.md) 의 Zaemit 컨셉이고, 구현 정답지는 [ir/260814_introduce/index.html](ir/260814_introduce/index.html) 이다.**
> 대표 지시 원문(2026-09-04): "재밋 스타일 위 경로를 참고해서 이 스타일을 매우 잘 반영해야 돼. 어설프게 반영하지 말고, 너무 박스로 디자인 하지 말고 프레젠테이션에 적합하게 다양한 디자인과 레이아웃을 활용하도록 해. 이 내용은 늘 내가 요청할 것 같으니까 지침에 강력하게 넣어놔."
> 대표 교정(2026-09-04): 다크 테마로 만들어 갔더니 **"내가 분명 디자인 스타일을 지정한 것 같은데 왜 하나도 참조하지 않았지? Zaemit 스타일로 만들라고 한 것 같은데 지금 검정색 계열이잖아!"**

#### ⚠️ 폴더명에 속지 말 것

`ir/260811_zaemit_26_st`는 **이름만 zaemit이고 실제로는 다크 네이비 덱**이다. 이 경로를 받더라도 "재밋 스타일"의 기준으로 삼지 않는다. Zaemit 컨셉은 **화이트 베이스(#FDFDFF) + 파스텔 메쉬 + 블루 1계열**이다. 결과물이 검정·네이비 계열이면 그 시점에 이미 틀린 것이다.

#### ① 반드시 가져오는 것 (변형 금지)

- 토큰: `--z-ink:#111` / `--z-note:#a6afc0` / `--z-accent:#3B82F6` / `--z-accent-light:#74ACFF` / `--z-accent-deep:#2C63D9` / `--z-bg:#FDFDFF` / 파스텔 5색(`--z-pa-lav/sky/pink/mint/peach`) / `--z-card-line:#DCE5F4` / `--z-shadow` / `--z-glow`
- 폰트: Pretendard(본문) + **Fugaz One**(`.za`, Zaemit 워드마크) + **Russo One**(`.zw`, WEVEN 워드마크), 둘 다 `font-synthesis:none`
- 골격: `.slide{padding:3.125vw 3.515625vw 7vw}` · `.mesh` 2층 · `.head`(centered) + `.section-label`(좌측 absolute, `"N. 파트명 - 01"`) + `.section-title`(3.4375vw / 2줄이면 `.h3s` 3.125vw) + `.section-desc`(1.5625vw, **#111**)
- 모션: WAAPI 엔진(`.m-rise` / `.m-fade` / `.m-stagger` / `.m-count` / `.m-draw`, `--d` 인라인 지연, 전환 0.4s 뒤 재생)
- **scale-to-fit은 `zoom`이 아니라 `transform:scale`** (zoom은 vw와 %를 다르게 재계산해 절대배치 다이어그램·SVG 커넥터를 끊는다)
- viewer 훅: `window.setLang` / `goToSlide` / `irSlideInfo` / `irConfig`(`theme:'zaemit'`)

#### ② 메쉬 (가장 자주 빠뜨리는 지점)

- **슬라이드마다 `--mesh`를 다르게 준다.** `m01`~`mNN` 클래스를 슬라이드 수만큼 정의하고 코너 조합·컬러 페어를 바꾼다. 연속 슬라이드 동일 구성 금지.
- radial 끝은 반드시 `rgba(...,0)`. `transparent`로 끝내면 회색 프린지가 낀다.
- 농도: 콘텐츠 장 stop opacity **0.25~0.48(soft)**, 표지·간지·클로징 **0.45~0.78(vivid)**. 한 장에 파스텔 2~3색만.
- **중앙부는 비운다.** 메쉬는 가장자리·코너에만.

#### ③ 박스로 도배하지 않는다

Zaemit 컨셉의 `.card`(그라데이션 배경 + 1px `#DCE5F4` 헤어라인 + 이중 섀도)는 공식 문법이지만, **전 슬라이드를 카드로 채우면 안 된다**(§0-F). 카드 비중 1/3 이하, 연속 2장 금지. 나머지는 **콘텐츠가 곧 도형인** 레이아웃으로 만든다.

| 메시지 | 구조 (배경 카드 없이) |
|---|---|
| 규모·비율 대비 | 빅넘버(8vw+, solid `--z-accent`, `tabular-nums`, `.m-count`) |
| 인원·분포 | 도트 매트릭스 (`#E6EBF3` ↔ `--z-accent`) |
| 전후·대립 | 3열(내용 / 중앙 화살표 / 내용), 한쪽만 `.ablock`으로 강조 |
| 배수·가격 | 가로 바 (`#F1F4F9` 트랙 + 그라데이션 필, 길이가 곧 주장) |
| 상반된 두 값 | 중앙축 양방향 바 (좌 `#E03131` / 우 블루) |
| 분해 | 원 1개 → 칩 N개 + SVG 커넥터(글로우 stroke-width 7 opacity .22 + 본선 2, `filterUnits="userSpaceOnUse"`) |
| 걸러짐 | clip-path 사다리꼴 게이트 2레인 |
| 병목 이동 | 두께가 변하는 막대 파이프라인 2줄 (라벨은 막대 **밖**에) |
| 갈림길 | SVG fork + 하단 2열 |
| 시간 궤적 | SVG 곡선 + 주석 핀 (`.m-draw`) |
| 순서·연쇄 | 기울어진 도미노 열 + 바닥선 |
| 층위 | 계층 스택 (아래로 갈수록 넓게, 마지막 층 `.ablock`) |
| 순환 | 원형 루프 (허브 원 + 4노드 + 진행 화살촉) |
| 단계 상승 | 상승 계단 (`align-items:flex-end`, 마지막 `.ablock`) |
| 질문 던지기 | 대형 타이포 (간지 `bignum` 35vw 활용) |

- **`.ablock`(블루 면 + 흰 글씨)은 슬라이드당 1개.** 이걸 어기면 화면이 파랗게 무너진다.
- 회색은 `--z-note` 1톤만. **서브카피는 회색이 아니라 #111.**
- 위계는 컬러가 아니라 **굵기**로. 퍼플 계열 배제, 블루 1계열.
- `#E03131`은 리스크·한계 표기에만.
- 아이콘은 라인아트 SVG를 **틴트 타일**(`rgba(59,130,246,.08~.10)` 둥근 사각) 위에 올린다. 이모지 금지.

#### ④ 헤드라인이 좌측 라벨과 겹치지 않게

`.section-label`은 `left:0` 절대배치이고 `.section-title`은 센터 정렬이라, 헤드라인이 길면 라벨 위로 올라탄다. **`.head`에 `padding:0 14.5vw`를 주고, 2줄이 되는 헤드라인에는 `.h3s`를 붙인다.**

#### ⑤ 자가 검증 (덱 완성 후 반드시)

```bash
grep -c "font-size:[0-9.]*px" index.html            # 0 (max() 래핑 예외 제외)
grep -c "@media" index.html                          # 0
grep -o "—" index.html | wc -l                       # 0 (대시 금지)
grep -o "아니라" index.html | wc -l                  # ≤1
grep -o 'class="mesh m[0-9]*"' index.html | sort -u | wc -l   # 슬라이드 수와 같아야 함
grep -c "ablock" index.html                          # 슬라이드당 1개 이하인지 눈으로 확인
```

1. 골격 종류 **8종 이상**, 같은 골격 연속 2장 금지.
2. 배경이 화이트 베이스 + 파스텔인가. 어두우면 잘못 만든 것이다.
3. **문구는 [docs/ir-copy-style-guide.md](docs/ir-copy-style-guide.md)와 [docs/ir-sentence-style-guide.md](docs/ir-sentence-style-guide.md)를 덱을 쓰기 전에 읽는다.** 레퍼런스 덱의 옛 문장을 복사하지 않는다. 복사 대상은 디자인 시스템이다.
4. 출처·조건은 `※ Source:` 각주로 드러낸다.

### 0-H. 강의·특강 덱은 "출처 → 풀이 → 우리 회사" 구조 (대표 지시 2026-09-04)

> 대표 교정 원문: "그럴싸하게 장표를 많이 만든 것 같긴 하지만 같은 내용이 반복되고 알맹이가 없다. 말투 문제가 아니다. 논문과 요즘 트렌드, 고급 기사, 유명한 사람의 말을 가져와서 풀이하고 실제 우리 생활에 적용해 인사이트가 있는 내용으로 채워야 한다. 1시간 강의면 50페이지가 넘는 방대한 양이어야 한다."

- **장표 하나 = 출처 하나.** 논문·보고서·인물 발언·판결·사고 사례에서 출발해 핵심 숫자(또는 문장) → 풀이 → "여러분 회사에서는" 순서로 내려온다. 자기 주장만 있는 장표는 알맹이가 없는 장표다.
- **1시간 = 50장 이상.** 간지·인용(`.quote`)·논문 카드(`.paper`)·사례 카드(`.cases`)·타임라인·표·참고문헌 장을 섞어 채운다. 같은 메시지를 다른 장에서 반복하지 않는다.
- **모든 숫자·인용은 쓰기 전에 WebSearch/WebFetch로 검증한다.** 검증 안 되는 숫자는 버린다. 인용문은 한국어 번역(대형) + 영어 원문(소형) + 인용자·자리·날짜를 같이 싣고, 마지막에 참고문헌 장을 둔다.
- **장표마다 "실제 사례 → 결과 → 인사이트 → 우리 회사에서는" 네 박자** (대표 교정 2026-09-05: "결과만 결론만 쭉 나열하니까 공감도 안 되고 이해도 안 된다. 실제 사례를 공감할 수 있도록 만들지 않으면 버려야 되는 장표다"). 숫자·인용 아래에 `.cb` 사례 밴드(좌 `실제 사례` + ※ Source / 우 `우리 회사에서는`)를 둔다. 사례는 누가·언제·무슨 일이 있었는지가 있는 실제 사건이어야 하고(삼성 ChatGPT 유출, 클라르나 재채용, 커먼웰스뱅크 감원 철회, 딜로이트 환불, 맥도날드 AI 주문, 쉐보레 1달러, Replit DB 삭제, 에어캐나다 판결, 카파시 MenuGen), 검색으로 검증한 것만 쓴다. 자기 회사 사례(위븐·재밋)는 실제 있었던 일만 쓴다.
- 첫 사례: [ir/260904_dmoa_lecture](ir/260904_dmoa_lecture/index.html) (57장, 사례 밴드 42개). 검증된 출처 목록은 그 덱 56장.

### 0-I. 한국어 콘텐츠 작성 규칙을 슬라이드에 적용 (대표 지시 2026-09-05, 절대 규칙)

> **[docs/korean-content-writing-rules.md](docs/korean-content-writing-rules.md)를 IR·프레젠테이션의 모든 텍스트에 적용한다.** 대표 지시 원문: "이 지침 파일을 완벽히 참고해서 이 프로젝트에서 IR 자료를 만들거나 프레젠테이션을 만들 때 텍스트를 작성하는 방법에 적용해 놔." 원문은 블로그 글 기준으로 쓰였으므로 슬라이드에는 아래 표대로 옮겨 적용하고, 충돌하면 원문 규칙이 우선한다.

| 원문 규칙 | 슬라이드 적용 |
|---|---|
| 1-1 문단은 주장으로 | `.section-desc`·`.note`·카드 본문의 첫 문장에 주장. `※ Source` 표기는 그 뒤 |
| 1-2 파편형 단문 금지 | 두 문장 이상인 `.note`·카드 본문은 반드시 연결어(~해서, ~하고, ~인데, ~않으면, ~때문에)로 잇는다. 헤드라인·표 셀·도표 라벨은 예외 |
| 1-3 괄호 약어 금지 | "학습 격차(learning gap)" 대신 "학습 격차". 원어는 `.qen`(영문 인용줄)에만 |
| 1-5 무생물 주어 금지 | "보고서가 가리킨다, 숫자가 말한다, 말이 말하지 않는다" 금지. 사람·회사·연구진을 주어로 |
| 1-6 두 진술 논평 금지 | "둘 다 같은 지점을 가리킨다" 대신 "두 사람의 결론은 같다. ~이기 때문이다" |
| 1-7 "~것입니다" 남발 금지 | 서술로 닫는다 |
| 2-1·2-2 학술투·은유 금지 | 계보·갈래·간격·거리·사다리·척추, 옮겨가다·얹다·흐르다·가리키다 금지. "병목"처럼 굳어진 용어만 |
| 2-3 자료 의인화 금지 | "조사가 보여준다" → "조사 결과는 ~였다", "MIT는 ~라고 불렀다"(기관은 사람) |
| 2-6 예고는 -겠습니다 | 간지 `.lead`와 장 넘김 문장 |
| 2-7 전개 표지 삭제 | "요지는 이랬습니다", "결론부터 말하면" 삭제 |
| 2-8 긴 줄표 금지 | 이미 §2-⑥. 라벨·캡션·SVG `<text>`·`data-title-ko`까지 |
| 3-1 연구자 행위 과거형 | "카파시는 ~라고 했다", "MIT는 ~라고 불렀다", "피차이도 조건을 붙였다" |
| 3-4 수치는 원문 지표 그대로 | "3배"만 쓰지 않고 4%와 13%를 같이. 지표 정의를 한 구절로("AI 노출 지수 상위 20%") |
| 3-5 대립은 같은 지표만 | `.duals` 양방향 바는 같은 지표를 잰 두 자료에만. desc에 지표 이름을 적는다 |
| 3-6 자료의 한계 | 참고문헌 장에 "※ 자료의 한계" 문단 필수(업계 조사·2차 출처·기술적 증거·발표 시점) |
| 3-7 사실 지어내지 않기 | 도트·퍼널·파이프라인·슬라이더·도미노 같은 개념 다이어그램에 "(개념도)". 예시 표에 "(가상 예시)". 청중 반응 예측을 "여러 자리에서 그랬다"처럼 사실로 쓰지 않는다. 검증 안 된 수치(Wiz 18개월 등)는 검색으로 확인 뒤 사용 |
| 4-4·4-5 지칭 정의·이름 고정 | "이 둘/두 실험/판정자"는 먼저 정의. 검증(단계)·판정(행위)·판정자(사람)를 섞지 않는다 |
| 5 결론 4조각 | 클로징은 축 되짚기 → 본문 근거 압축(숫자 3개) → 본문 축 그대로의 할 일 → 마무리 한 문장. 새 표어·새 출처 금지 |
| 6 목록은 명사형 | 계단·표의 '할 일' 셀은 "업무 분류 / 판정자 지정 / 1년치 비용 계산"처럼 명사형. "~하기" 남발 금지 |
| 7 표 | `.ctable td{overflow-wrap:normal;word-break:keep-all}`, 행 이름 열 `white-space:nowrap` |
| 8 이미지 안 글자 | SVG `<text>` 최소 19(viewBox 1180 기준). 도표 라벨은 명사형(병목, 만나지 않음) |
| 9 시각 요소 | 좌측 컬러 액센트 바 금지, ①②★◆▶ 심볼 금지(번호는 "1." 숫자로). `※`·`→`·`·`는 허용 |

- 덱 완성 후 원문 §10 탈고 점검표 11항목을 `.note`·`.section-desc`·카드 본문 전수로 돌린다.
- 첫 적용 사례: [ir/260904_dmoa_lecture](ir/260904_dmoa_lecture/index.html) (56장, 2026-09-05 교정).

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

### 8. AI 수정 요청 메모(`data-ai-note`) 처리 (대표 요청 2026-09-07)

> 인쇄 미리보기(app/print-preview.html) 편집 모드에서 대표가 직접 고치기 어려운 요소에 **"AI 수정 요청" 말풍선**(툴바 노란 버튼 또는 Ctrl+Shift+M)을 달면, 그 요소에 `data-ai-note="요청 내용"` 속성이 붙어 "저장" 시 원본 `ir/<버전>/index.html`에 기록된다. 뷰어는 이 속성을 무시하므로 화면에는 영향이 없고, 미리보기는 이 속성이 있는 요소마다 노란 말풍선을 띄운다.

**대표가 "메모 처리해줘", "말풍선 처리해줘", "AI 요청 반영해줘"라고 하면:**
1. `node tools/ai-notes.js` (특정 덱은 `node tools/ai-notes.js ir/<버전>`)로 목록을 뽑는다. 페이지 번호·줄 번호·요소 태그·요청 내용이 나온다. 인자 없이 실행하면 모든 덱을 훑는다.
2. 각 요소를 요청대로 수정한다. 메모는 요소 하나에 붙지만, 요청이 슬라이드 전체("이 장표 레이아웃을 바꿔줘")를 가리키면 그 요소가 속한 슬라이드 기준으로 해석한다. 이 문서의 모든 스타일·문구 규칙은 그대로 적용된다.
3. 수정을 마친 요소에서 **`data-ai-note` 속성을 반드시 제거**한다. 속성이 남으면 미리보기에 말풍선이 계속 뜬다.
4. 처리하지 못한 메모는 속성을 그대로 두고, 무엇을 왜 못 했는지 보고한다. 임의로 지우지 않는다.
5. 처리 결과를 "p.N 요청 내용 → 한 일" 형태로 보고한다.

- 속성 값은 HTML 이스케이프(`&quot;`, `&amp;`)되어 있고 줄바꿈이 들어 있을 수 있다. 스크립트가 풀어서 보여준다.
- 대표가 미리보기에서 저장하지 않은 메모는 파일에 없다. 목록이 비어 있으면 "저장" 여부를 확인해 달라고 한다.

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
| **⚠️ 박스 안에 박스** | **금지 (2026-08-30 대표 지시)!** 카드 안의 칩, 프레임 안의 스크린샷, 밴드 안의 카드 모두 금지. 스크린샷·사진은 그 자체가 박스이므로 감싸지 않고 이미지에 직접 라운드·그림자를 준다. 콘텐츠 잘림의 첫 번째 원인 |
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
| **⚠️ 대시(—) 연결** | **전면 금지 (2026-08-30 대표 지시)!** 문장·구절을 `—` `–` `" - "`로 잇지 않는다. 주제는 볼드(`<b>`), 본문은 일반 굵기로 구분하거나 콜론(`:`)을 쓴다. 두 생각이면 마침표로 끊고, 부연은 괄호에 넣는다. 예외는 범위(`8~9월`)·화살표(`→`)·가운뎃점(`•`)·날짜 하이픈. [docs/ir-copy-style-guide.md](docs/ir-copy-style-guide.md) §2-⑥ 참조 |
| **⚠️ 무생물 주어·자료 의인화** | "보고서가 가리킨다, 숫자가 말한다" 금지. 사람·회사·연구진을 주어로 ([docs/korean-content-writing-rules.md](docs/korean-content-writing-rules.md) 1-5·2-3, §0-I) |
| **⚠️ 파편형 단문 나열** | 두 문장 이상인 note·카드 본문에 연결어가 하나도 없으면 다시 쓴다 (1-2) |
| **⚠️ 개념도·가상 예시 미표기** | 실데이터가 아닌 도트·퍼널·파이프라인·도미노·슬라이더에는 "(개념도)", 예시 표에는 "(가상 예시)". 청중 반응 예측을 사실처럼 쓰지 않는다 (3-7) |
| **⚠️ 자료의 한계 누락** | 참고문헌 장에 업계 조사·2차 출처·기술적 증거·발표 시점 한계를 밝힌다 (3-6) |
| **⚠️ 재밋 스타일을 다크로 만듬** | **"재밋 스타일" = Zaemit 컨셉(화이트 베이스 + 파스텔 메쉬)** (§0-G). `ir/260811_zaemit_26_st`는 이름만 zaemit이고 다크 덱이다. 결과물이 검정·네이비면 틀렸다 |
| **⚠️ 전 슬라이드 카드 그리드** | 카드 비중 덱 전체 1/3 이하·연속 2장 금지. 골격 최소 8종 혼용 (§0-F/§0-G) |
| **⚠️ 메쉬 변주 누락** | Zaemit 컨셉은 슬라이드마다 `--mesh`를 다르게 준다. `.mesh mNN` 클래스 수 = 슬라이드 수 |
| **⚠️ 강조 블록 남발** | `.ablock`(블루 면 + 흰 글씨)은 슬라이드당 1개. 서브카피는 회색이 아니라 #111 |
| **⚠️ 문구 지침 미독** | 덱 쓰기 전에 [docs/ir-copy-style-guide.md](docs/ir-copy-style-guide.md)와 [docs/ir-sentence-style-guide.md](docs/ir-sentence-style-guide.md)를 읽는다. 레퍼런스 덱의 옛 문장을 복사하지 않는다 |

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
