# WEVEN IR 프로젝트 개요

> **AI 필독**: 이 문서는 프로젝트 전체 구조와 작동 방식을 설명합니다.
> 새로운 작업을 시작하기 전에 반드시 이 문서를 읽으세요.

---

## 프로젝트 구조

```
zaemit_ir_eng/
├── app/                        # 앱 공통 파일
│   ├── viewer.html             # IR 뷰어 (iframe으로 IR 로드)
│   ├── print-preview.html      # 프린트 미리보기 페이지
│   ├── print-preview.js        # 프린트 미리보기 로직
│   ├── print-preview.css       # 프린트 미리보기 스타일
│   ├── ir-common.js            # IR 공통 네비게이션 (2602 사용)
│   ├── ir-nav-dark.css         # 다크 테마 네비게이션 CSS
│   ├── ir-nav-light.css        # 라이트 테마 네비게이션 CSS
│   └── conf.json               # IR 버전 설정
│
├── ir/                         # IR 콘텐츠
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
│   └── ir-style-guide-light.md # 라이트 테마 스타일 가이드
│
└── .claude/                    # Claude 설정
    └── settings.local.json     # 로컬 설정
```

---

## 주요 컴포넌트

### 1. IR 페이지 (ir/[version]/index.html)

각 IR 버전의 메인 파일. 슬라이드 기반 프레젠테이션.

**필수 요소:**
- 슬라이드 구조: `.slide > .slide-inner`
- 다국어 지원: `data-lang` 속성
- 슬라이드 제목: `data-title-ko`, `data-title-en`, `data-title-ja`

**2601 특징:**
- 다크 테마 (#0A0E27 배경)
- 인라인 스크립트 (ir-common.js 미사용)
- 첫 페이지: `.slide.hero` 클래스

**2602 특징:**
- 라이트 테마 (#FFFFFF 배경)
- ir-common.js 사용
- 첫 페이지: `.slide.cover` 클래스

### 2. Viewer (app/viewer.html)

IR을 iframe으로 로드하여 표시하는 뷰어.

**기능:**
- 언어 전환 (KO/EN/JA)
- 슬라이드 네비게이션
- 사이드바 TOC
- 프린트 미리보기 링크

**iframe 통신:**
```javascript
// 언어 전환
iframeWin.setLang('en');

// 슬라이드 이동
iframeWin.goToSlide(3);
```

### 3. Print Preview (app/print-preview.html)

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

### CSS 규칙 (IR 페이지 내)

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

---

## 테마 시스템

### 다크 테마 (2601)

```css
:root {
  --dark: #0A0E27;
  --accent: #00D4AA;
  --accent2: #7C3AED;
  --text: #fff;
  --text-muted: #94A3B8;
}
```

### 라이트 테마 (2602)

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
- Viewer: http://127.0.0.1:8080/app/viewer.html?ir=2601
- Print Preview: http://127.0.0.1:8080/app/print-preview?ir=2601
- 직접 접근: http://127.0.0.1:8080/ir/2601/

---

## 작업 시 주의사항

### 1. CSS 오버라이드 금지

print-preview.css에서 원본 레이아웃을 변경하는 CSS를 추가하지 않는다.

```css
/* ❌ 나쁜 예 */
.slide-clone .some-element {
  display: flex !important;  /* 원본이 block일 수 있음 */
  width: 1200px !important;  /* 원본 너비 무시 */
}

/* ✅ 좋은 예 */
.slide-clone .content-wrapper {
  /* wrapper에만 줌/정렬 적용 */
  transform: scale(0.8);
}
```

### 2. Cover/Hero 페이지 특별 처리

- 2601: `.hero` 클래스
- 2602: `.cover` 클래스

두 클래스 모두 처리해야 한다:

```javascript
const isCover = clone.classList.contains('cover') || clone.classList.contains('hero');
```

```css
.slide-clone.cover .content-wrapper,
.slide-clone.hero .content-wrapper {
  flex-direction: row !important;
}
```

### 3. flex 요소 display 유지

`.ov-circle` 같은 flex 요소는 `display: flex`가 필요하다.
언어 전환 시 `display: block`으로 변경하면 안된다.

```css
/* 언어 숨김은 display: none만 사용 */
.slide-clone [data-lang]:not(.lang-visible) {
  display: none !important;
}
/* 보이는 요소는 원본 display 유지 (별도 지정 불필요) */
```

### 4. 함수 전역 노출

viewer.html이 호출할 수 있도록 IR 페이지에서 함수를 전역 노출해야 한다:

```javascript
window.setLang = function(lang) { ... };
window.goToSlide = function(idx) { ... };
```

---

## 관련 문서

| 문서 | 내용 |
|-----|-----|
| [ir-print-compatibility.md](./ir-print-compatibility.md) | **필독** - 프린트 미리보기 호환성 규칙 |
| [ir-style-guide.md](./ir-style-guide.md) | 다크 테마 디자인 가이드 |
| [ir-style-guide-light.md](./ir-style-guide-light.md) | 라이트 테마 디자인 가이드 |

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-02-01 | 1.0 | 최초 작성 - 프로젝트 구조, 컴포넌트, 언어/테마 시스템, 주의사항 |
