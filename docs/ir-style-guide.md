# IR 자료 스타일 가이드

> 이 문서는 IR 자료를 예쁘게 만드는 디자인/스타일 가이드입니다.
> 프린트 미리보기 호환성은 [ir-print-compatibility.md](./ir-print-compatibility.md)를 참조하세요.

---

## 1. 기본 디자인 시스템

### 1.1 색상 팔레트

```css
:root {
  /* 기본 배경/텍스트 */
  --dark: #0A0E27;           /* 메인 배경 */
  --text: #fff;              /* 기본 텍스트 */
  --text-muted: #94A3B8;     /* 보조 텍스트 */

  /* 액센트 컬러 */
  --accent: #00D4AA;         /* 민트 - 주요 강조 */
  --accent2: #7C3AED;        /* 퍼플 - 보조 강조 */

  /* 그라데이션 */
  --gradient1: linear-gradient(135deg, #0066FF 0%, #7C3AED 50%, #00D4AA 100%);
  --gradient2: linear-gradient(135deg, #00D4AA 0%, #0066FF 100%);
  --gradient3: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%);
}
```

### 1.2 타이포그래피

```css
/* 폰트 패밀리 */
font-family: 'Pretendard Variable', 'Plus Jakarta Sans', -apple-system, sans-serif;

/* 영문 우선 시 */
body.en { font-family: 'Plus Jakarta Sans', 'Pretendard Variable', sans-serif; }

/* 일본어 */
body.ja { font-family: 'Noto Sans JP', 'Plus Jakarta Sans', sans-serif; }
```

#### 제목 크기 체계
| 요소 | 데스크탑 | 모바일 (≤600px) |
|------|---------|----------------|
| section-title | 40-48px | 26px |
| section-desc | 16px | 14px |
| section-label | 13px | 13px |

### 1.3 간격 시스템

```css
/* 슬라이드 패딩 */
.slide { padding: 40px 100px; }  /* 데스크탑 */
.slide { padding: 30px 20px; }   /* 모바일 */

/* 섹션 간격 */
margin-bottom: 12px;  /* section-label */
margin-bottom: 12px;  /* section-title */
margin-bottom: 32px;  /* section-desc */
```

---

## 2. 슬라이드 구조

### 2.1 기본 슬라이드 템플릿

```html
<div class="slide [slide-type]" data-title-ko="제목" data-title-en="Title">
  <div class="slide-inner">
    <!-- 타이틀 영역 (고정) -->
    <div class="section-label" data-lang="ko">라벨</div>
    <div class="section-label" data-lang="en">Label</div>

    <div class="section-title" data-lang="ko">제목</div>
    <div class="section-title" data-lang="en">Title</div>

    <div class="section-desc" data-lang="ko">설명</div>
    <div class="section-desc" data-lang="en">Description</div>

    <!-- 콘텐츠 영역 (줌/정렬 적용) -->
    <div class="[content-container]">
      ...
    </div>
  </div>
</div>
```

### 2.2 슬라이드 타입별 클래스

| 슬라이드 | 클래스 | 콘텐츠 컨테이너 |
|---------|-------|---------------|
| 히어로 | `.hero` | `.hero-left`, `.hero-right` |
| 개요 | `.overview` | `.overview-layout`, `.ov-layout` |
| 문제점 | `.problem` | `.problem-flow` |
| 솔루션 | `.solution` | `.solution-content` |
| 서비스 | `.service` | `.svc-phases` |
| 시장 | `.market` | `.market-content`, `.mkt-table` |
| 경쟁 | `.competition` | `.comp-table` |
| 트랙션 | `.traction` | `.traction-grid` |
| 비즈니스 | `.business` | `.biz-diagram-wrap` |
| 가격 | `.pricing` | `.pricing-grid` |
| 영업 | `.sales` | `.sales-layout` |
| 팀 | `.team` | `.team-layout` |
| 글로벌 | `.global-partners` | `.gp-nda-row`, `.gp-top`, `.gp-countries` |
| 로드맵 | `.roadmap` | `.roadmap-container` |
| Exit | `.exit` | `.exit-chart-area` |
| Ask | `.ask` | `.ask-stats` |

---

## 3. 컴포넌트 스타일

### 3.1 카드

```css
/* 기본 카드 */
.card {
  background: rgba(17, 22, 51, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 20px;
}

/* 강조 카드 */
.card-highlight {
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid rgba(124, 58, 237, 0.25);
}
```

### 3.2 배지

```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
}

/* 변형 */
.badge-purple { background: rgba(124,58,237,0.2); color: #A78BFA; }
.badge-green { background: rgba(34,197,94,0.2); color: #22C55E; }
.badge-blue { background: rgba(59,130,246,0.2); color: #3B82F6; }
```

### 3.3 테이블

```css
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
}

.data-table th {
  background: rgba(255,255,255,0.04);
  padding: 14px;
  font-weight: 700;
  color: var(--text-muted);
  border-bottom: 2px solid rgba(255,255,255,0.1);
}

.data-table td {
  padding: 15px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.data-table tbody tr:hover {
  background: rgba(255,255,255,0.03);
}
```

### 3.4 그리드 레이아웃

```css
/* 4열 그리드 */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 3열 그리드 */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* 2열 그리드 */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}
```

---

## 4. 애니메이션

### 4.1 진입 애니메이션

```css
@keyframes aFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes aFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes aScaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes aSlideR {
  from { opacity: 0; transform: translateX(-32px); }
  to { opacity: 1; transform: translateX(0); }
}
```

### 4.2 애니메이션 적용 패턴

```css
/* 기본 상태: 숨김 */
.slide .content-element {
  opacity: 0;
}

/* 활성 슬라이드에서 애니메이션 */
.slide.active .content-element {
  animation: aFadeUp 0.5s ease 0.3s both;
}

/* 순차 애니메이션 */
.slide.active .item:nth-child(1) { animation-delay: 0.3s; }
.slide.active .item:nth-child(2) { animation-delay: 0.5s; }
.slide.active .item:nth-child(3) { animation-delay: 0.7s; }
```

### 4.3 모션 감소 지원

```css
body.no-motion .slide.active * {
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}
```

---

## 5. 반응형 디자인

### 5.1 브레이크포인트

| 브레이크포인트 | 대상 |
|--------------|-----|
| ≤1200px | 태블릿 가로 |
| ≤900px | 태블릿 세로 |
| ≤600px | 모바일 |

### 5.2 모바일 최적화

```css
@media (max-width: 600px) {
  /* 그리드 → 단일 열 */
  .grid-4, .grid-3 {
    grid-template-columns: 1fr;
  }

  /* 테이블 가로 스크롤 */
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 숨길 요소 */
  .desktop-only {
    display: none;
  }
}
```

---

## 6. 다국어 지원

### 6.1 언어 토글 구조

```html
<div class="lang-toggle">
  <button class="lang-btn active" data-lang="ko">KO</button>
  <button class="lang-btn" data-lang="en">EN</button>
  <button class="lang-btn" data-lang="ja">JA</button>
</div>
```

### 6.2 다국어 콘텐츠

```html
<div class="section-title" data-lang="ko">한국어 제목</div>
<div class="section-title" data-lang="en">English Title</div>
<div class="section-title" data-lang="ja">日本語タイトル</div>
```

### 6.3 언어별 표시 CSS

```css
[data-lang] { display: none; }
[data-lang="ko"] { display: revert; }

body.en [data-lang="ko"] { display: none; }
body.en [data-lang="en"] { display: revert; }

body.ja [data-lang="ko"] { display: none; }
body.ja [data-lang="ja"] { display: revert; }
```

---

## 7. 이미지 가이드

### 7.1 이미지 비율

| 용도 | 비율 | 예시 |
|-----|-----|-----|
| 팀원 사진 | 1:1 (정사각형) | 90x90px, 56x56px |
| 국가 사진 | 16:10 | 배경 커버 |
| 와이드 사진 | 16:9 | 360px 너비 |
| 아이콘 | 1:1 | 48x48px |

### 7.2 이미지 스타일

```css
.photo-circle {
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.1);
}

.photo-rounded {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
}

.photo-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-01-31 | 1.0 | 최초 작성 |
