# WEVEN IR 프로젝트 개요

> **AI 필독**: 이 문서는 프로젝트 전체 구조와 작동 방식을 설명합니다.
> 새로운 작업을 시작하기 전에 반드시 이 문서를 읽으세요.

---

## 프로젝트 구조

```
zaemit_ir_eng/
├── app/                        # 앱 공통 파일
│   ├── index.html              # 자동 리다이렉트 (conf.json → viewer)
│   ├── viewer.html             # IR 뷰어 (iframe으로 IR 로드)
│   ├── viewer/index.html       # viewer 서브 경로 지원
│   ├── conf.json               # IR 버전 설정 (defaultIR, versions[])
│   ├── print-preview.html      # 프린트 미리보기 페이지
│   ├── print-preview.js        # 프린트 미리보기 로직
│   ├── print-preview.css       # 프린트 미리보기 스타일
│   ├── ir-common.js            # IR 공통 네비게이션 (2602 사용)
│   ├── ir-nav-dark.css         # 다크 테마 네비게이션 CSS
│   ├── ir-nav-light.css        # 라이트 테마 네비게이션 CSS
│   └── list.html               # IR 버전 목록 페이지
│
├── ir/                         # IR 콘텐츠
│   ├── 260203/                 # 260203 버전 (다크 테마, 최신, 기본)
│   │   ├── index.html          # 메인 IR 파일 (인라인 스크립트, KO/EN/JA)
│   │   ├── *.png               # 이미지 파일
│   │   └── *.mp4               # 데모 영상
│   │
│   ├── 260202/                 # 260202 버전 (라이트 테마)
│   │   └── index.html          # 메인 IR 파일
│   │
│   ├── 2601/                   # 2601 버전 (다크 테마)
│   │   ├── index.html          # 메인 IR 파일 (인라인 스크립트)
│   │   └── *.png               # 이미지 파일
│   │
│   └── 2602/                   # 2602 버전 (라이트 테마)
│       ├── index.html          # 메인 IR 파일 (ir-common.js 사용)
│       └── *.png               # 이미지 파일
│
├── docs/                       # 문서
│   ├── project-overview.md     # 이 파일
│   ├── ir-print-compatibility.md  # 프린트 호환성 가이드 (필독)
│   ├── ir-style-guide.md       # 다크 테마 스타일 가이드
│   ├── ir-style-guide-light.md # 라이트 테마 스타일 가이드
│   ├── ir-motion-style-guide.md # 모션 가이드 (은은한/화려한)
│   └── ir-i18n-guide.md        # 다국어(KO/EN/JA) 대응 가이드
│
└── CLAUDE.md                   # AI 작업 지침 (핵심 규칙)
```

---

## IR 버전 비교

| 항목 | 2601 | 2602 | 260202 | **260203** (최신) |
|-----|------|------|--------|-----------|
| 테마 | 다크 | 라이트 | 라이트 | **다크** |
| 첫 페이지 | `.hero` | `.cover` | `.cover` | **`.hero`** |
| 스크립트 | 인라인 | ir-common.js | 인라인 | **인라인** |
| 언어 시스템 | `lang-visible` | `body.ko/en` | `body.ko/en` | **`body.ko/en/ja`** |
| 언어 수 | 2 (KO/EN) | 2 (KO/EN) | 2 (KO/EN) | **3 (KO/EN/JA)** |
| 뷰포트 | device-width | device-width | device-width | **width=1280** |
| 모션 | 은은한 | 은은한 | 화려한 | **은은한** |
| 기본 IR | - | - | - | **conf.json default** |

---

## 주요 컴포넌트

### 1. IR 페이지 (ir/[version]/index.html)

각 IR 버전의 메인 파일. 슬라이드 기반 프레젠테이션.

**필수 요소:**
- 슬라이드 구조: `.slide > .slide-inner`
- 다국어 지원: `data-lang` 속성 (ko/en/ja)
- 슬라이드 제목: `data-title-ko`, `data-title-en`, `data-title-ja`

**260203 특징 (최신):**
- 다크 테마 (#0A0E27 배경)
- 인라인 스크립트 (ir-common.js 미사용)
- 첫 페이지: `.slide.hero` 클래스
- 3개 국어 (KO/EN/JA) 완전 지원
- 뷰포트 `width=1280` 고정 (모바일 PC 뷰 강제)
- Noto Sans JP 웹폰트 로드
- 데모 영상 (mp4) 포함

### 2. conf.json (앱 설정)

```json
{
  "title": "WEVEN Zaemit IR",
  "defaultLang": "ko",
  "defaultIR": "260203",
  "versions": [
    {
      "id": "260203",
      "name": "IR Deck (Full)",
      "nameEn": "IR Deck (Full)",
      "date": "2026-02-10",
      "theme": "dark",
      "default": true
    }
  ]
}
```

### 3. Viewer (app/viewer.html)

IR을 iframe으로 로드하여 표시하는 뷰어.

**기능:**
- 언어 전환 (KO/EN/JA)
- 슬라이드 네비게이션 (키보드, 휠, 터치)
- 사이드바 TOC (슬라이드 제목 자동 수집)
- 프린트 미리보기 링크
- 페이지 인디케이터 (프로그레스바 + 번호)
- URL 상태 관리 (ir, lang, page 파라미터 — query string/hash 모두 지원)

**iframe 스케일링 (`fitFrame()`):**

| 환경 | iframe 크기 | zoom | 콘텐츠 제한 | 배경 |
|-----|-----------|------|-----------|------|
| **PC** | `vw/scale × vh/scale` | `min(vw/1280, vh*0.85/960)` | 높이 최대 85% | iframe이 뷰포트 전체 커버 |
| **모바일 세로** | `vw × vh` (풀 뷰포트) | 없음 | CSS 주입으로 슬라이드 패딩 조정 → 콘텐츠 영역 960px | 슬라이드 배경이 뷰포트 전체 채움 |
| **모바일 가로** | `vw/scale × vh/scale` | `vh/960` | 높이 기준 스케일 | iframe이 뷰포트 전체 커버 |

- BASE_W=1280, BASE_H=960
- PC: CSS `zoom` 속성으로 스케일링 (video repaint 회피)
- 모바일 세로: iframe이 풀 뷰포트를 커버하되, `body.mobile-portrait` 클래스 + 주입 CSS로 슬라이드 패딩을 늘려 콘텐츠 영역을 960px로 제한
- 모바일 가로: PC와 동일한 zoom 방식 (높이가 제약)

**모바일 CSS 주입 (viewer → iframe):**
```css
/* viewer가 iframe 내부에 주입하는 CSS */
body.mobile-portrait .slide {
  padding-top: calc(50vh - 440px) !important;
  padding-bottom: calc(50vh - 440px) !important;
}
```
> 슬라이드 자체는 풀 뷰포트 유지(배경 채움), 패딩으로 콘텐츠 영역만 제한

**터치 네비게이션:**
- 터치 오버레이 (z-index:50, iframe 위에 위치)
- 좌/우 탭: 이전/다음 슬라이드
- 좌/우 스와이프 (>50px): 이전/다음 슬라이드

**iframe 통신:**
```javascript
// 언어 전환
iframeWin.setLang('ja');

// 슬라이드 이동
iframeWin.goToSlide(3);
```

### 4. index.html (자동 리다이렉트)

`app/` 접근 시 `conf.json`의 `defaultIR`을 읽어 자동으로 viewer로 리다이렉트.

### 5. Print Preview (app/print-preview.html)

PDF/인쇄용 미리보기 페이지.

**핵심 원칙:**
1. 원본 슬라이드를 복제(clone)
2. CSS 오버라이드 최소화
3. content-wrapper로 줌/정렬만 적용

**자세한 내용**: [ir-print-compatibility.md](./ir-print-compatibility.md)

---

## 언어 시스템

### HTML 구조

```html
<div class="section-title" data-lang="ko">한국어</div>
<div class="section-title" data-lang="en">English</div>
<div class="section-title" data-lang="ja">日本語</div>
```

### CSS 규칙 (260203 방식)

```css
/* 기본: 한국어 */
[data-lang="en"] { display: none !important; }
[data-lang="ko"] { display: revert; }
[data-lang="ja"] { display: none !important; }

/* body.en: 영어 모드 */
body.en [data-lang="en"] { display: revert !important; }
body.en [data-lang="ko"] { display: none !important; }

/* body.ja: 일본어 모드 */
body.ja [data-lang="ja"] { display: revert !important; }
body.ja [data-lang="ko"] { display: none !important; }
```

### JavaScript (IR 페이지에서 노출 필수)

```javascript
window.setLang = function(lang) {
  document.body.classList.remove('en', 'ja', 'ko');
  if (lang !== 'ko') {
    document.body.classList.add(lang);
  }
  // inline style 초기화
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.style.display = '';
  });
};
```

> **중요**: inline style로 display를 설정하지 않는다.
> body 클래스를 변경하고 CSS 규칙이 처리하도록 한다.
> **자세한 다국어 가이드**: [ir-i18n-guide.md](./ir-i18n-guide.md)

---

## 테마 시스템

### 다크 테마 (2601, 260203)

```css
:root {
  --dark: #0A0E27;
  --accent: #00D4AA;
  --accent2: #7C3AED;
  --text: #fff;
  --text-muted: #94A3B8;
}
```

### 라이트 테마 (2602, 260202)

```css
:root {
  --bg-primary: #FFFFFF;
  --accent-primary: #4F46E5;
  --accent-secondary: #0EA5E9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
}
```

---

## 개발 서버 실행

```bash
cd d:\www\zaemit_ir_eng
npx http-server -p 8080 -c-1 --cors
```

**접속 URL:**
- 자동 리다이렉트: http://127.0.0.1:8080/app/
- Viewer: http://127.0.0.1:8080/app/viewer.html?ir=260203
- 일본어: http://127.0.0.1:8080/app/viewer.html?ir=260203&lang=ja
- Print Preview: http://127.0.0.1:8080/app/print-preview?ir=260203
- 직접 접근: http://127.0.0.1:8080/ir/260203/

---

## 작업 시 주의사항

### 1. CSS 오버라이드 금지

print-preview.css에서 원본 레이아웃을 변경하는 CSS를 추가하지 않는다.

### 2. Cover/Hero 페이지 특별 처리

- 2601, 260203: `.hero` 클래스
- 2602, 260202: `.cover` 클래스

두 클래스 모두 처리해야 한다:

```javascript
const isCover = clone.classList.contains('cover') || clone.classList.contains('hero');
```

### 3. flex 요소 display 유지

언어 전환 시 `display: block`으로 변경하면 안된다.
`display: none !important`만 사용하고, 보이는 요소는 원본 display를 유지한다.

### 4. 함수 전역 노출

viewer.html이 호출할 수 있도록 IR 페이지에서 함수를 전역 노출해야 한다:

```javascript
window.setLang = function(lang) { ... };
window.goToSlide = function(idx) { ... };
```

### 5. 다국어 3벌 작성 (260203)

모든 텍스트 요소에 ko/en/ja 3벌을 작성한다.
SVG 내 `<text>` 요소도 반드시 포함한다.
일본어 텍스트가 길면 SVG 도형 너비를 확장한다.

---

## 관련 문서

| 문서 | 내용 |
|-----|-----|
| [ir-print-compatibility.md](./ir-print-compatibility.md) | **필독** - 프린트 미리보기 호환성 규칙 |
| [ir-style-guide.md](./ir-style-guide.md) | 다크 테마 디자인 가이드 |
| [ir-style-guide-light.md](./ir-style-guide-light.md) | 라이트 테마 디자인 가이드 |
| [ir-motion-style-guide.md](./ir-motion-style-guide.md) | 모션 가이드 (은은한/화려한) |
| [ir-i18n-guide.md](./ir-i18n-guide.md) | 다국어(KO/EN/JA) 대응 가이드 |

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-02-01 | 1.0 | 최초 작성 - 프로젝트 구조, 컴포넌트, 언어/테마 시스템, 주의사항 |
| 2026-02-11 | 2.0 | **전면 업데이트**: 260203 추가, conf.json 구조, viewer 상세 기능(터치/스케일링/URL상태), 자동 리다이렉트, 다국어(JA) 가이드 연동, IR 버전 비교표 |
