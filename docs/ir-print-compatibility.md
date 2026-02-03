# IR 프린트 미리보기 호환성 가이드

> 이 문서는 IR 자료가 프린트 미리보기 화면에서 깨지지 않도록 하는 필수 지침입니다.
> **AI가 새로운 IR 페이지를 생성하거나 수정할 때 반드시 이 규칙을 따라야 합니다.**

---

## 핵심 원칙 (최우선 준수사항)

### 1. CSS 오버라이드 최소화
> **원본 페이지의 CSS를 건드리지 않는다.**
> 프린트 미리보기는 원본 페이지를 그대로 복제(clone)하여 표시한다.
> `print-preview.css`에서 레이아웃을 강제로 변경하면 원본과 다르게 보인다.

### 2. Wrapper만 씌우기
> content-wrapper를 동적으로 생성하여 줌/정렬을 적용한다.
> wrapper 내부의 원본 레이아웃은 그대로 유지한다.

### 3. 타이틀과 콘텐츠 분리
> **타이틀 (section-label, section-title, section-desc)**: 항상 좌측 상단 고정
> **콘텐츠**: content-wrapper로 감싸서 줌/정렬 적용
> 타이틀은 콘텐츠 줌/정렬에 영향받지 않는다.

---

## IR 버전별 차이점 (2601 vs 2602 vs 260202)

| 항목 | 2601 (다크 테마) | 2602 (라이트 테마) | 260202 (라이트 테마) |
|-----|-----------------|------------------|---------------------|
| 첫 페이지 클래스 | `.hero` | `.cover` | `.cover` |
| 테마 | dark | light | light |
| ir-common.js | 미사용 (인라인 스크립트) | 사용 | 미사용 (인라인 스크립트) |
| 언어 시스템 | `lang-visible` 클래스 | `body.ko/en` 클래스 | `body.ko/en` 클래스 |
| 언어 함수 | `window.setLang` 직접 정의 필요 | ir-common.js에서 제공 | `window.setLang` 직접 정의 필요 |

### ⚠️ 언어 시스템 차이 (핵심!)
- **2601**: JS가 `lang-visible` 클래스 추가 → CSS가 `:not(.lang-visible)` 숨김
- **260202/2602**: `body.ko`/`body.en` 클래스 → CSS 규칙으로 언어 표시

### 2601 필수 요소
```javascript
// ir/2601/index.html의 스크립트에 반드시 포함:
window.setLang = function(newLang) {
  lang = newLang;
  document.body.classList.remove('en', 'ja', 'ko');
  if (newLang !== 'ko') {
    document.body.classList.add(newLang);
  }
  // inline style 초기화 - CSS 규칙이 적용되도록
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.style.display = '';
  });
};

window.goToSlide = function(idx) {
  // 슬라이드 이동 로직
};
```

---

## 슬라이드 구조 규칙

### 1. 기본 구조

```html
<div class="slide [slide-type]" data-title-ko="제목" data-title-en="Title">
  <div class="slide-inner">
    <!-- 타이틀 영역 (고정 위치, 줌 영향 없음) -->
    <div class="section-label">...</div>
    <div class="section-title">...</div>
    <div class="section-desc">...</div>

    <!-- 콘텐츠 영역 (자동으로 content-wrapper 생성됨) -->
    <div class="[content-container]">
      ...모든 콘텐츠...
    </div>
  </div>
</div>
```

### 2. Cover/Hero 페이지 구조 (특별 처리)

Cover/Hero 페이지는 타이틀이 없고, 가로 레이아웃을 사용:

```html
<!-- 2601 Hero 페이지 -->
<div class="slide hero" data-title-ko="표지">
  <div class="slide-inner">
    <div class="hero-left">...</div>   <!-- 좌측 텍스트 -->
    <div class="hero-right">...</div>  <!-- 우측 카드 -->
  </div>
</div>

<!-- 2602 Cover 페이지 -->
<div class="slide cover" data-title-en="Cover">
  <div class="slide-inner">
    <div class="cover-left">...</div>
    <div class="cover-right">...</div>
  </div>
</div>
```

> **중요**: Cover/Hero 페이지는 전체가 콘텐츠로 취급된다.
> content-wrapper에 `flex-direction: row`가 적용되어 가로 레이아웃 유지.

---

## print-preview.css 핵심 규칙

### 🚨 0. 슬라이드 기본 표시 규칙 (필수!)

> **IR 원본 CSS에서 `.slide { visibility: hidden; opacity: 0; }` 설정이 있으면 print-preview에서 안 보임!**
> **반드시 다음 규칙으로 오버라이드해야 함:**

```css
.slide-clone.slide {
  opacity: 1 !important;
  visibility: visible !important;  /* 필수! 이거 빠지면 아무것도 안보임 */
}
```

### 1. 언어 가시성 - display:none만 사용

```css
/* display: none만 사용하여 원본 display 속성 유지 */
.slide-clone [data-lang]:not(.lang-visible) {
  display: none !important;
}
/* 보이는 요소는 CSS 규칙이 자동 적용됨 (별도 지정 불필요) */
```

> **경고**: `display: block !important`를 사용하면 flex 요소가 깨진다!
> 예: `.ov-circle`은 `display: flex`가 필요한데 block으로 바뀌면 텍스트 정렬이 깨짐.

### 2. slide-inner - 타이틀 고정

```css
.slide-clone .slide-inner {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important; /* 타이틀 항상 위에 */
}
```

### 3. content-wrapper - 줌/정렬 적용

```css
/* 기본: 세로 레이아웃, 너비 100% 유지 */
.slide-clone .slide-inner > .content-wrapper {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch !important; /* 자식 너비 100% 유지 */
  justify-content: flex-start; /* JS로 변경 가능 */
}

/* Cover/Hero 페이지만 가로 레이아웃 */
.slide-clone.cover .slide-inner > .content-wrapper,
.slide-clone.hero .slide-inner > .content-wrapper {
  flex-direction: row !important;
  gap: 48px;
  align-items: stretch;
}
```

### 4. 너비 유지 규칙

```css
/* 일반 페이지: 콘텐츠 너비 100% 유지 */
.slide-clone:not(.cover):not(.hero) .slide-inner > .content-wrapper > * {
  width: 100%;
}
/* Cover/Hero는 좌우 분할이므로 이 규칙 제외 */
```

---

## print-preview.js 핵심 로직

### 1. content-wrapper 생성

```javascript
function applyContentZoom(idx, zoomPercent) {
  // Cover/Hero 페이지 감지
  const isCover = clone.classList.contains('cover') || clone.classList.contains('hero');

  // Cover/Hero: 전체가 콘텐츠 (title 없음)
  // 일반 페이지: title 제외
  const titleSelectors = isCover ? [] : ['.section-label', '.section-title', '.section-desc'];

  // content-wrapper 생성 후 title 아닌 요소들 이동
  // ... wrapper 생성 로직 ...
}
```

### 2. 정렬 적용

```javascript
function applyContentAlignmentToSlide(clone, alignV, alignH) {
  const isCover = clone.classList.contains('cover') || clone.classList.contains('hero');

  // 수직 정렬
  if (isCover) {
    // 가로 레이아웃: align-items로 수직 정렬
    contentWrapper.style.setProperty('align-items', alignValue, 'important');
  } else {
    // 세로 레이아웃: justify-content로 수직 정렬
    contentWrapper.style.setProperty('justify-content', justifyContent, 'important');
    // 너비는 항상 stretch 유지
    contentWrapper.style.setProperty('align-items', 'stretch', 'important');
  }
}
```

---

## Viewer 연동

### viewer.html이 iframe 내 IR 페이지와 통신하는 방법

1. **언어 전환**: `iframeWin.setLang(lang)` 호출
2. **슬라이드 이동**: `iframeWin.goToSlide(idx)` 호출

### IR 페이지에서 노출해야 하는 함수

```javascript
// 반드시 window 객체에 노출
window.setLang = function(lang) { ... };
window.goToSlide = function(idx) { ... };
```

### 언어 CSS 규칙 (IR 페이지 내)

```css
/* 기본: 한국어 표시 */
[data-lang="en"] { display: none !important; }
[data-lang="ko"] { display: revert; }
[data-lang="ja"] { display: none !important; }

/* 영어 모드 */
body.en [data-lang="en"] { display: revert !important; }
body.en [data-lang="ko"] { display: none !important; }

/* 일본어 모드 */
body.ja [data-lang="ja"] { display: revert !important; }
body.ja [data-lang="ko"] { display: none !important; }

/* flex 요소는 별도 처리 (예: 동그라미) */
.ov-circle[data-lang="ko"] { display: flex !important; }
body.en .ov-circle[data-lang="en"] { display: flex !important; }
body.en .ov-circle[data-lang="ko"] { display: none !important; }
```

> **핵심**: body 클래스(en/ja)로 언어 전환, CSS 규칙이 display 처리
> **경고**: JS에서 inline style로 display를 설정하면 안됨 (flex 요소 깨짐)

---

## 자주 발생하는 문제와 해결

### 1. 동그라미 안 텍스트가 위로 올라감
**원인**: `display: block`으로 오버라이드되어 flex 중앙정렬 깨짐
**해결**: `display: none !important`만 사용, 보이는 요소는 원본 display 유지

### 2. Cover/Hero 페이지가 세로로 표시됨
**원인**: `flex-direction: column` 강제 적용
**해결**: `.cover`, `.hero` 클래스에 `flex-direction: row !important` 적용

### 3. 콘텐츠 너비가 좁아짐
**원인**: `align-items: center`가 자식 너비를 shrink
**해결**: 일반 페이지는 `align-items: stretch !important` 유지

### 4. 타이틀이 콘텐츠와 함께 움직임
**원인**: slide-inner에 `justify-content: center` 적용
**해결**: slide-inner는 `justify-content: flex-start` 고정, content-wrapper에서 정렬

### 5. viewer에서 언어 전환 안됨
**원인**: IR 페이지에 `setLang` 함수가 없음
**해결**: `window.setLang` 함수를 전역으로 노출

### 6. 🚨 프린트 미리보기에서 슬라이드가 완전히 안 보임
**원인**: IR 원본 CSS에 `.slide { visibility: hidden; opacity: 0; }` 설정
**해결**: print-preview.css에 `visibility: visible !important;` 추가 필수
```css
.slide-clone.slide {
  opacity: 1 !important;
  visibility: visible !important;  /* 이거 빠지면 아무것도 안보임! */
}
```

### 7. 260202/2602 언어 요소가 안 보임
**원인**: print-preview의 언어 숨김 규칙이 260202/2602에도 적용됨
**해결**: 260202/2602는 언어 규칙에서 제외
```css
/* 2601용 규칙 - 260202/2602 제외 */
.slide-clone:not(.ir-260202):not(.ir-2602) [data-lang]:not(.lang-visible) {
  display: none !important;
}
```

---

## 새 IR 버전 생성 시 체크리스트

### HTML
- [ ] 첫 페이지는 `.hero` 또는 `.cover` 클래스 사용
- [ ] 모든 슬라이드에 `data-title-ko`, `data-title-en` 속성
- [ ] 다국어 요소에 `data-lang` 속성
- [ ] flex 요소(동그라미 등)는 별도 CSS 규칙으로 display: flex 유지

### JavaScript
- [ ] `window.setLang` 함수 전역 노출
- [ ] `window.goToSlide` 함수 전역 노출
- [ ] 언어 전환 시 body 클래스 변경 (inline style 아님)
- [ ] inline style 초기화: `el.style.display = ''`

### CSS (IR 원본)
- [ ] 언어별 display 규칙 (body.en, body.ja)
- [ ] flex 요소 특별 처리 (display: flex !important 유지)

### print-preview.css (프린트 미리보기 호환성)
- [ ] 🚨 `.slide-clone.slide`에 `visibility: visible !important` 포함 확인
- [ ] 🚨 `.slide-clone.slide`에 `opacity: 1 !important` 포함 확인
- [ ] 새 IR 버전의 언어 시스템 확인 (lang-visible vs body.ko/en)
- [ ] 언어 숨김 규칙에서 새 IR 버전 제외 필요 여부 확인

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-01-31 | 1.0 | 최초 작성 |
| 2026-01-31 | 1.1 | Wrapper 패턴 전체 적용 |
| 2026-02-01 | 2.0 | **전면 개정**: CSS 오버라이드 최소화 원칙, Cover/Hero 특별 처리, 언어 가시성 규칙, Viewer 연동 가이드, 2601 vs 2602 차이점 |
| 2026-02-03 | 2.1 | **🚨 치명적 버그 수정**: `visibility: visible !important` 필수 규칙 추가, 260202 언어 시스템 차이 문서화, 새 IR 생성 시 체크리스트 확장 |
