# IR 프린트 미리보기 호환성 가이드

> 이 문서는 IR 자료가 프린트 미리보기 화면에서 깨지지 않도록 하는 필수 지침입니다.
> 디자인/스타일 가이드는 [ir-style-guide.md](./ir-style-guide.md)를 참조하세요.

---

## 핵심 원칙

> **프린트 미리보기는 슬라이드를 복제(clone)하여 별도 페이지에 렌더링합니다.**
>
> 원본 CSS가 그대로 적용되지만, 일부 레이아웃은 `print-preview.css`에서 강제 덮어쓰기가 필요합니다.

---

## 1. 슬라이드 구조 규칙

### 1.1 필수 구조

```html
<div class="slide [slide-type]" data-title-ko="제목" data-title-en="Title">
  <div class="slide-inner">
    <!-- 타이틀 영역 -->
    <div class="section-label">...</div>
    <div class="section-title">...</div>
    <div class="section-desc">...</div>

    <!-- 콘텐츠 영역 (단일 컨테이너 권장) -->
    <div class="[content-container]">
      ...모든 콘텐츠...
    </div>
  </div>
</div>
```

### 1.2 ⚠️ 중요: 콘텐츠는 단일 컨테이너로 감싸기

**문제 상황:**
```html
<!-- ❌ 나쁜 예: 여러 독립 요소 -->
<div class="slide-inner">
  <div class="section-title">...</div>
  <div class="content-a">...</div>  <!-- 줌/정렬 개별 적용 -->
  <div class="content-b">...</div>  <!-- 줌/정렬 개별 적용 -->
  <div class="content-c">...</div>  <!-- 줌/정렬 개별 적용 -->
</div>
```

**해결:**
```html
<!-- ✅ 좋은 예: 단일 wrapper로 감싸기 -->
<div class="slide-inner">
  <div class="section-title">...</div>
  <div class="content-wrapper">
    <div class="content-a">...</div>
    <div class="content-b">...</div>
    <div class="content-c">...</div>
  </div>
</div>
```

> **왜?** 프린트 미리보기에서 줌과 정렬은 **첫 번째 콘텐츠 요소**에만 적용됩니다.
> 여러 독립 요소가 있으면 첫 번째만 움직이고 나머지는 그대로입니다.

---

## 2. 콘텐츠 셀렉터 등록

### 2.1 print-preview.js에 셀렉터 추가

새로운 콘텐츠 컨테이너를 만들면 반드시 `print-preview.js`의 `contentSelectors` 배열에 추가해야 합니다.

**파일:** `app/print-preview.js`

```javascript
// applyContentZoom 함수 내
const contentSelectors = [
  '.hero-left', '.hero-right', '.hero-stats',
  '.overview-layout', '.ov-layout',
  '.problem-flow', '.solution-content',
  '.svc-phases',
  '.market-content', '.mkt-table',
  '.comp-table', '.traction-grid',
  '.biz-diagram-wrap',
  '.pricing-grid', '.sales-layout',
  '.team-layout',
  '.gp-nda-row', '.gp-top', '.gp-countries',  // Global Partners
  '.roadmap-container',
  '.exit-chart-area', '.ask-stats',
  '.contact-area',
  // ⬇️ 새 셀렉터 추가
  '.new-content-container'
];
```

**두 곳에 추가 필요:**
1. `applyContentZoom()` 함수 내 `contentSelectors`
2. `applyContentAlignmentToSlide()` 함수 내 `contentSelectors`

---

## 3. 특별 처리가 필요한 페이지

### 3.1 Hero 페이지 (1번)

**문제:** `.hero-left`, `.hero-right` 두 요소가 독립적으로 존재

**해결:** JavaScript에서 동적으로 wrapper 생성

```javascript
// print-preview.js에 이미 구현됨
if (heroLeft && heroRight) {
  let heroWrapper = clone.querySelector('.hero-content-wrapper');
  if (!heroWrapper) {
    heroWrapper = document.createElement('div');
    heroWrapper.className = 'hero-content-wrapper';
    heroWrapper.style.cssText = 'display: flex; gap: 40px; width: 100%; align-items: center;';
    // 콘텐츠들을 wrapper로 이동
    parent.insertBefore(heroWrapper, heroLeft);
    heroWrapper.appendChild(heroLeft);
    heroWrapper.appendChild(heroRight);
  }
  // wrapper에 줌 적용
  heroWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
}
```

### 3.2 Global Partners 페이지 (13번)

**문제:** `.gp-nda-row`, `.gp-top`, `.gp-countries` 세 요소가 독립적으로 존재

**해결:** JavaScript에서 동적으로 wrapper 생성

```javascript
// print-preview.js에 이미 구현됨
if (gpNdaRow && gpTop && gpCountries) {
  let gpWrapper = clone.querySelector('.gp-content-wrapper');
  if (!gpWrapper) {
    gpWrapper = document.createElement('div');
    gpWrapper.className = 'gp-content-wrapper';
    // 콘텐츠들을 wrapper로 이동
    parent.insertBefore(gpWrapper, gpNdaRow);
    gpWrapper.appendChild(gpNdaRow);
    gpWrapper.appendChild(gpTop);
    gpWrapper.appendChild(gpCountries);
  }
  // wrapper에 줌 적용
  gpWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
}
```

### 3.3 Product/Service 페이지 (7번)

**문제:** `.svc-phases`, `.svc-cloud-bar` 두 요소가 독립적으로 존재

**해결:** JavaScript에서 동적으로 wrapper 생성

```javascript
// print-preview.js에 이미 구현됨
if (svcPhases && svcCloudBar) {
  let svcWrapper = clone.querySelector('.svc-content-wrapper');
  if (!svcWrapper) {
    svcWrapper = document.createElement('div');
    svcWrapper.className = 'svc-content-wrapper';
    svcWrapper.style.cssText = 'width: 100%;';
    // 콘텐츠들을 wrapper로 이동
    parent.insertBefore(svcWrapper, svcPhases);
    svcWrapper.appendChild(svcPhases);
    svcWrapper.appendChild(svcCloudBar);
  }
  // wrapper에 줌 적용
  svcWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
}
```

### 3.4 Business 페이지 (10번)

**문제:** `.biz-diagram-wrap`, `.biz-rev-summary` 두 요소가 독립적으로 존재

**해결:** JavaScript에서 동적으로 wrapper 생성

```javascript
// print-preview.js에 이미 구현됨
if (bizDiagram && bizRevSummary) {
  let bizWrapper = clone.querySelector('.biz-content-wrapper');
  if (!bizWrapper) {
    bizWrapper = document.createElement('div');
    bizWrapper.className = 'biz-content-wrapper';
    bizWrapper.style.cssText = 'width: 100%;';
    // 콘텐츠들을 wrapper로 이동
    parent.insertBefore(bizWrapper, bizDiagram);
    bizWrapper.appendChild(bizDiagram);
    bizWrapper.appendChild(bizRevSummary);
  }
  // wrapper에 줌 적용
  bizWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
}
```

### 3.5 Ask 페이지 (17번)

**문제:** `h2`, `.ask-desc`, `.ask-stats`, `.ask-footer` 여러 요소가 독립적으로 존재

**해결:** JavaScript에서 동적으로 wrapper 생성

```javascript
// print-preview.js에 이미 구현됨
if (askStats && askFooter) {
  let askWrapper = clone.querySelector('.ask-content-wrapper');
  if (!askWrapper) {
    askWrapper = document.createElement('div');
    askWrapper.className = 'ask-content-wrapper';
    askWrapper.style.cssText = 'width: 100%; text-align: center;';

    // h2와 ask-desc 찾기
    const h2Elements = parent.querySelectorAll('h2[data-lang]');
    const askDescs = parent.querySelectorAll('.ask-desc');

    // 모든 요소를 wrapper로 이동
    h2Elements.forEach(el => askWrapper.appendChild(el));
    askDescs.forEach(el => askWrapper.appendChild(el));
    askWrapper.appendChild(askStats);
    askWrapper.appendChild(askFooter);
  }
  // wrapper에 줌 적용
  askWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
}
```

### 3.6 로드맵 페이지 (14번)

**주의:** 계단식 레이아웃 유지 필요

```css
/* print-preview.css */
.slide-clone .roadmap-timeline {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-end !important;
}

.slide-clone .roadmap-year:nth-child(1) { padding-bottom: 0 !important; }
.slide-clone .roadmap-year:nth-child(2) { padding-bottom: 70px !important; }
.slide-clone .roadmap-year:nth-child(3) { padding-bottom: 140px !important; }
.slide-clone .roadmap-year:nth-child(4) { padding-bottom: 210px !important; }
```

### 3.7 테이블 페이지 (경쟁, 시장)

**문제:** 테이블이 고정 너비를 가지면 레이아웃 깨짐

**해결:**
```css
/* print-preview.css */
.slide-clone .comp-table,
.slide-clone .mkt-table {
  width: 100% !important;  /* 고정 너비 대신 100% */
}
```

---

## 4. CSS 덮어쓰기 규칙

### 4.1 print-preview.css 구조

```css
/* 1. 기본 슬라이드 스타일 */
.slide-clone {
  /* 원본 스타일 유지 */
}

/* 2. 타이틀 영역 (줌 영향 안받음) */
.slide-clone .section-label,
.slide-clone .section-title,
.slide-clone .section-desc {
  flex-shrink: 0 !important;
  align-self: stretch !important;
}

/* 3. 페이지별 특별 처리 */
.slide-clone .specific-element {
  display: ... !important;
  /* 필요한 속성만 덮어쓰기 */
}
```

### 4.2 !important 사용 지침

| 상황 | !important 사용 |
|-----|----------------|
| 레이아웃 깨짐 수정 | ✅ 필수 |
| 인라인 스타일 덮어쓰기 | ✅ 필수 |
| 단순 스타일 조정 | ❌ 지양 |

### 4.3 width 설정 주의

```css
/* ❌ 나쁜 예: 고정 너비가 내부 그리드를 깨뜨림 */
.slide-clone .gp-japan {
  width: 1200px !important;
}

/* ✅ 좋은 예: 100%로 설정하고 부모에서 제어 */
.slide-clone .gp-japan {
  width: 100% !important;
}
```

---

## 5. 이미지 경로

### 5.1 상대 경로 자동 변환

프린트 미리보기는 `app/` 폴더에서 실행되므로, IR 폴더의 이미지 경로가 자동 변환됩니다.

```javascript
// print-preview.js
const irBasePath = `../ir/${irVersion}/`;
slides.forEach(slide => {
  slide.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
      img.setAttribute('src', irBasePath + src);
    }
  });
});
```

### 5.2 이미지 경로 규칙

| 경로 유형 | 예시 | 변환 |
|---------|-----|-----|
| 상대 경로 | `kjh.png` | `../ir/2601/kjh.png` |
| 절대 URL | `https://...` | 변환 안함 |
| Data URI | `data:image/...` | 변환 안함 |

---

## 6. 다국어 처리

### 6.1 언어별 표시

```css
/* print-preview.css */
.slide-clone [data-lang] {
  display: none !important;
}

.slide-clone [data-lang].lang-visible {
  display: block !important;
  display: revert !important;
}
```

### 6.2 JavaScript 처리

```javascript
// print-preview.js
function applyLanguageVisibility(element) {
  element.querySelectorAll('[data-lang]').forEach(el => {
    if (el.dataset.lang === lang) {
      el.classList.add('lang-visible');
    } else {
      el.classList.remove('lang-visible');
    }
  });
}
```

---

## 7. 디버깅 체크리스트

프린트 미리보기에서 특정 페이지가 깨질 때:

### 7.1 줌이 안 먹을 때

- [ ] `contentSelectors` 배열에 해당 셀렉터가 있는가?
- [ ] 여러 독립 요소가 있는가? → wrapper로 감싸기
- [ ] CSS에서 `transform`을 덮어쓰고 있는가?

### 7.2 정렬이 안 먹을 때

- [ ] `contentSelectors` 배열에 해당 셀렉터가 있는가?
- [ ] 첫 번째 콘텐츠 요소가 맞는가?
- [ ] `margin-top`이 다른 CSS에서 덮어쓰여지는가?

### 7.3 레이아웃이 깨질 때

- [ ] `display` 속성이 원본과 다른가?
- [ ] `grid-template-columns`가 제대로 적용되는가?
- [ ] `width`가 고정값으로 설정되어 내부 레이아웃을 깨뜨리는가?

### 7.4 이미지가 안 보일 때

- [ ] 경로가 상대 경로인가?
- [ ] 이미지 파일이 IR 폴더에 있는가?
- [ ] `irBasePath` 변환이 제대로 되는가?

---

## 8. 새 페이지 추가 시 체크리스트

1. **HTML 구조**
   - [ ] 콘텐츠를 단일 컨테이너로 감쌌는가?
   - [ ] `data-lang` 속성이 모든 다국어 요소에 있는가?

2. **print-preview.js**
   - [ ] `applyContentZoom()`의 `contentSelectors`에 추가
   - [ ] `applyContentAlignmentToSlide()`의 `contentSelectors`에 추가
   - [ ] 특별 처리가 필요하면 조건문 추가

3. **print-preview.css**
   - [ ] 레이아웃 깨짐 시 CSS 덮어쓰기 추가
   - [ ] `!important` 최소화

4. **테스트**
   - [ ] 줌 50% ~ 150% 테스트
   - [ ] 수직 정렬 (top/middle/bottom) 테스트
   - [ ] 수평 정렬 (left/center/right) 테스트
   - [ ] Auto Fit 버튼 테스트

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-01-31 | 1.0 | 최초 작성 |
