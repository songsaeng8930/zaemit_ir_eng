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
| 바이브코딩 시장 | `.vibe-market` | `.mkt-timeline`, `.mkt-stages` |
| 경쟁 | `.competition` | `.comp-table` |
| 트랙션 | `.traction` | `.traction-grid` |
| 비즈니스 | `.business` | `.biz-diagram-wrap` |
| 가격 | `.pricing-plan` | `.pricing-grid` |
| 판매 현황 | `.sales-overview` | `.sales-layout` |
| 판매 상세 | `.sales-detail` | `.sd-layout`, `.sd-circles` |
| 팀 | `.team` | `.team-layout` |
| 글로벌 | `.global-partners` | `.gp-nda-row`, `.gp-countries` |
| 로드맵/스케일업 | `.roadmap` | `.roadmap-container` |
| 데모 영상 | `.plugin-demo-video` | `.demo-video-container` |
| Exit (IPO) | `.exit` | `.exit-chart-area` |
| Exit (M&A) | `.exit-ma` | `.ma-columns`, `.ma-synergy` |
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

## 4. 애니메이션 시스템 (2601 Motion System)

> 2601의 모션 시스템은 매우 우수하며, 모든 슬라이드 요소에 세련된 진입 애니메이션을 제공합니다.

### 4.1 기본 Keyframes

```css
/* 위로 페이드인 - 가장 많이 사용 */
@keyframes aFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 단순 페이드인 */
@keyframes aFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 스케일 확대 페이드인 */
@keyframes aScaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

/* 왼쪽에서 슬라이드인 */
@keyframes aSlideR {
  from { opacity: 0; transform: translateX(-32px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 오른쪽에서 슬라이드인 */
@keyframes aSlideL {
  from { opacity: 0; transform: translateX(32px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 위에서 타이프다운 (테이블 행에 사용) */
@keyframes aTypeDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* SVG 선 그리기 애니메이션 */
@keyframes aLineDraw {
  from { stroke-dashoffset: var(--dash); }
  to { stroke-dashoffset: 0; }
}

/* 영역 나타나기 */
@keyframes aAreaReveal {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 펄스 (히어로 배지) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 궤도 회전 (히어로 비주얼) */
@keyframes rot {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}

/* 파티클 떠다니기 */
@keyframes fl {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  50% { transform: translateY(-200px) translateX(50px); }
}
```

### 4.2 요소 초기 상태

```css
/* 모든 애니메이션 대상 요소: 초기에 숨김 */
.slide .section-label,
.slide .section-title,
.slide .section-desc,
.slide .hero-left,
.slide .hero-right,
.slide .hero-stats,
.slide .overview-layout,
.slide .problem-flow,
.slide .problem-col,
.slide .solution-content,
.slide .solution-step,
.slide .svc-phases,
.slide .svc-phase,
.slide .svc-cloud-bar,
.slide .mkt-table-wrap,
.slide .mkt-chart-area,
.slide .mkt-stage,
.slide .traction-grid,
.slide .traction-card,
.slide .biz-diagram-wrap,
.slide .biz-rev-summary,
.slide .pricing-grid,
.slide .pricing-card,
.slide .sales-layout,
.slide .team-layout,
.slide .gp-nda,
.slide .gp-top,
.slide .gp-countries,
.slide .gp-country,
.slide .roadmap-container,
.slide .roadmap-year,
.slide .exit-chart-area,
.slide .comp-table,
.slide .comp-zaemit-cell,
.slide .market-content,
.slide .ask-stats,
.slide .cta-buttons {
  opacity: 0;
}
```

### 4.3 타이틀 애니메이션 (모든 슬라이드 공통)

```css
/* 타이틀은 순차적으로 등장 */
.slide.active .section-label { animation: aFadeUp 0.5s ease 0.15s both; }
.slide.active .section-title { animation: aFadeUp 0.55s ease 0.3s both; }
.slide.active .section-desc  { animation: aFadeUp 0.5s ease 0.45s both; }
```

### 4.4 페이지별 콘텐츠 애니메이션

#### Hero 페이지 (커버)
```css
/* 좌우 분할 슬라이드인 */
.slide.active .hero-left  { animation: aSlideR 0.6s ease 0.2s both; }
.slide.active .hero-right { animation: aSlideL 0.6s ease 0.4s both; }
.slide.active .hero-stats { animation: aFadeUp 0.5s ease 0.7s both; }
```

#### Overview 페이지
```css
.slide.active .overview-layout { animation: aFadeUp 0.5s ease 0.5s both; }
```

#### Problem 페이지
```css
.slide.active .problem-flow { animation: aFadeUp 0.5s ease 0.55s both; }
/* 컬럼 순차 등장 */
.slide.active .problem-col:nth-child(1) { animation: aFadeUp 0.5s ease 0.5s both; }
.slide.active .problem-col:nth-child(2) { animation: aFadeUp 0.5s ease 0.9s both; }
.slide.active .problem-col:nth-child(3) { animation: aFadeUp 0.5s ease 1.3s both; }
```

#### Solution 페이지
```css
.slide.active .solution-content { animation: aFadeIn 0.3s ease 0.5s both; }
.slide.active .solution-step:nth-child(1) { animation: aFadeUp 0.5s ease 0.55s both; }
.slide.active .solution-step:nth-child(2) { animation: aFadeUp 0.5s ease 0.75s both; }
.slide.active .solution-step:nth-child(3) { animation: aFadeUp 0.5s ease 0.95s both; }
```

#### Service 페이지
```css
.slide.active .svc-phases { animation: aFadeIn 0.3s ease 0.5s both; }
.slide.active .svc-phase:nth-child(1) { animation: aFadeUp 0.5s ease 0.55s both; }
.slide.active .svc-phase:nth-child(2) { animation: aFadeUp 0.5s ease 0.7s both; }
.slide.active .svc-phase:nth-child(3) { animation: aFadeUp 0.5s ease 0.85s both; }
.slide.active .svc-cloud-bar { animation: aFadeUp 0.4s ease 1.1s both; }
```

#### Traction/Pricing 페이지 (카드 순차 등장)
```css
.slide.active .traction-grid { animation: aFadeIn 0.3s ease 0.5s both; }
.slide.active .traction-card:nth-child(1) { animation: aFadeUp 0.45s ease 0.55s both; }
.slide.active .traction-card:nth-child(2) { animation: aFadeUp 0.45s ease 0.7s both; }
.slide.active .traction-card:nth-child(3) { animation: aFadeUp 0.45s ease 0.85s both; }
.slide.active .traction-card:nth-child(4) { animation: aFadeUp 0.45s ease 1.0s both; }

.slide.active .pricing-grid { animation: aFadeIn 0.3s ease 0.5s both; }
.slide.active .pricing-card:nth-child(1) { animation: aFadeUp 0.45s ease 0.55s both; }
.slide.active .pricing-card:nth-child(2) { animation: aFadeUp 0.45s ease 0.7s both; }
.slide.active .pricing-card:nth-child(3) { animation: aFadeUp 0.45s ease 0.85s both; }
.slide.active .pricing-card:nth-child(4) { animation: aFadeUp 0.45s ease 1.0s both; }
```

#### Business Model 페이지
```css
.slide.active .biz-diagram-wrap { animation: aScaleIn 0.6s ease 0.5s both; }
.slide.active .biz-rev-summary { animation: aFadeUp 0.4s ease 1.0s both; }
```

#### Competition 페이지 (테이블 행 순차)
```css
.slide.active .comp-table { animation: aFadeUp 0.6s ease 0.5s both; }
.slide.active .comp-table tbody tr:nth-child(1) .comp-zaemit-cell { animation: aTypeDown 0.35s ease 0.6s both; }
.slide.active .comp-table tbody tr:nth-child(2) .comp-zaemit-cell { animation: aTypeDown 0.35s ease 0.75s both; }
.slide.active .comp-table tbody tr:nth-child(3) .comp-zaemit-cell { animation: aTypeDown 0.35s ease 0.9s both; }
.slide.active .comp-table tbody tr:nth-child(4) .comp-zaemit-cell { animation: aTypeDown 0.35s ease 1.05s both; }
.slide.active .comp-table tbody tr:nth-child(5) .comp-zaemit-cell { animation: aTypeDown 0.35s ease 1.2s both; }
.slide.active .comp-table tbody tr:nth-child(6) .comp-zaemit-cell { animation: aTypeDown 0.35s ease 1.35s both; }
```

#### Market 페이지 (성숙도 단계 순차)
```css
.slide.active .market-content { animation: aFadeUp 0.5s ease 0.5s both; }
.slide.active .mkt-stages { animation: aFadeIn 0.3s ease 0.85s both; }
.slide.active .mkt-stage:nth-child(1) { animation: aFadeUp 0.4s ease 0.9s both; }
.slide.active .mkt-stage:nth-child(2) { animation: aFadeUp 0.4s ease 1.05s both; }
.slide.active .mkt-stage:nth-child(3) { animation: aScaleIn 0.5s ease 1.2s both; }  /* 현재 단계: 특별 강조 */
.slide.active .mkt-stage:nth-child(4) { animation: aFadeUp 0.4s ease 1.5s both; }
.slide.active .mkt-stage:nth-child(5) { animation: aFadeUp 0.4s ease 1.65s both; }
```

#### Global Partners 페이지
```css
.slide.active .gp-nda { animation: aSlideR 0.5s ease 0.5s both; }
.slide.active .gp-top { animation: aFadeUp 0.5s ease 0.7s both; }
.slide.active .gp-countries { animation: aFadeIn 0.3s ease 0.9s both; }
.slide.active .gp-country:nth-child(1) { animation: aFadeUp 0.4s ease 0.95s both; }
.slide.active .gp-country:nth-child(2) { animation: aFadeUp 0.4s ease 1.1s both; }
.slide.active .gp-country:nth-child(3) { animation: aFadeUp 0.4s ease 1.25s both; }
.slide.active .gp-country:nth-child(4) { animation: aFadeUp 0.4s ease 1.4s both; }
```

#### Roadmap 페이지
```css
.slide.active .roadmap-container { animation: aFadeIn 0.6s ease 0.4s both; }
.slide.active .roadmap-year:nth-child(1) { animation: aFadeUp 0.4s ease 0.6s both; }
.slide.active .roadmap-year:nth-child(2) { animation: aFadeUp 0.4s ease 0.8s both; }
.slide.active .roadmap-year:nth-child(3) { animation: aFadeUp 0.4s ease 1.0s both; }
.slide.active .roadmap-year:nth-child(4) { animation: aFadeUp 0.4s ease 1.2s both; }
```

#### Exit/Ask 페이지
```css
.slide.active .exit-chart-area { animation: aFadeIn 0.7s ease 0.5s both; }
.slide.active .ask-stats { animation: aFadeUp 0.5s ease 0.55s both; }
.slide.active .cta-buttons { animation: aFadeUp 0.45s ease 0.8s both; }
```

### 4.5 SVG 차트 애니메이션

```css
/* SVG 선 그리기 준비 */
.svg-draw {
  stroke-dasharray: var(--dash);
  stroke-dashoffset: var(--dash);
}

/* 활성화 시 선 그리기 */
.slide.active .svg-draw {
  animation: aLineDraw 2s cubic-bezier(.25,.1,.25,1) 0.6s both;
}

/* 차트 영역 나타나기 */
.svg-area { opacity: 0; }
.slide.active .svg-area {
  animation: aAreaReveal 0.8s ease 1.8s both;
}

/* Exit 차트: 두 선 순차 그리기 */
.svg-draw-rev, .svg-draw-sub {
  stroke-dasharray: var(--dash);
  stroke-dashoffset: var(--dash);
}
.slide.active .svg-draw-rev { animation: aLineDraw 2.2s cubic-bezier(.25,.1,.25,1) 0.6s both; }
.slide.active .svg-draw-sub { animation: aLineDraw 2.2s cubic-bezier(.25,.1,.25,1) 0.8s both; }
```

**SVG 사용법:**
```html
<svg>
  <polyline class="svg-draw" style="--dash: 500" points="..." />
  <polygon class="svg-area" points="..." />
</svg>
```

### 4.6 히어로 특수 효과

```css
/* 히어로 배지 펄스 */
.hero-badge::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s infinite;
}

/* 궤도 링 회전 */
.orbit-ring {
  animation: rot 20s linear infinite;
}
.orbit-ring:nth-child(1) { inset: 10%; }
.orbit-ring:nth-child(2) { inset: 25%; animation-duration: 30s; animation-direction: reverse; }
.orbit-ring:nth-child(3) { inset: 40%; animation-duration: 25s; }

/* 파티클 효과 */
.particle {
  animation: fl 8s ease-in-out infinite;
}
```

### 4.7 모션 토글 (접근성)

```css
/* 모션 토글 버튼 */
.motion-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.04);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.motion-toggle-btn.off {
  border-color: rgba(239,68,68,0.3);
  background: rgba(239,68,68,0.08);
  color: #EF4444;
}
```

```javascript
// 모션 토글
function toggleMotion() {
  document.body.classList.toggle('no-motion');
  const btn = document.querySelector('.motion-toggle-btn');
  btn.classList.toggle('off');
}
```

### 4.8 모션 감소 모드 (body.no-motion)

```css
/* 모든 애니메이션 즉시 완료 */
body.no-motion *,
body.no-motion *::before,
body.no-motion *::after {
  animation-duration: 0.001s !important;
  animation-delay: 0s !important;
  transition-duration: 0.001s !important;
  transition-delay: 0s !important;
}

/* 요소 즉시 표시 */
body.no-motion .slide.active .section-label,
body.no-motion .slide.active .section-title,
body.no-motion .slide.active .section-desc,
body.no-motion .slide.active .hero-left,
body.no-motion .slide.active .hero-right,
body.no-motion .slide.active .problem-col,
body.no-motion .slide.active .solution-step,
body.no-motion .slide.active .svc-phase,
body.no-motion .slide.active .traction-card,
body.no-motion .slide.active .pricing-card,
body.no-motion .slide.active .gp-country,
body.no-motion .slide.active .roadmap-year,
body.no-motion .slide.active .mkt-stage {
  opacity: 1 !important;
  transform: none !important;
}

/* SVG 선 즉시 표시 */
body.no-motion .svg-draw,
body.no-motion .svg-draw-rev,
body.no-motion .svg-draw-sub {
  stroke-dashoffset: 0 !important;
}

/* 무한 애니메이션 중지 */
body.no-motion .orbit-ring,
body.no-motion .particle,
body.no-motion .hero-badge::before {
  animation: none !important;
}

/* 파티클 숨김 (정지 상태는 의미 없음) */
body.no-motion .particles {
  display: none !important;
}
```

### 4.9 애니메이션 타이밍 가이드

| 요소 유형 | 지연 시작 | 지속 시간 | 간격 |
|---------|---------|---------|-----|
| 타이틀 (label/title/desc) | 0.15s | 0.5s | +0.15s |
| 메인 콘텐츠 | 0.5s | 0.5-0.6s | - |
| 순차 카드/아이템 | 0.55s | 0.45s | +0.15s |
| SVG 차트 | 0.6s | 2.0s | - |
| 무한 루프 | 즉시 | 8-30s | - |

> **핵심 원칙**: 첫 요소는 0.5s 이후 시작, 순차 요소는 0.15s 간격

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

## 8. 라이트 테마

> 밝고 전문적인 느낌의 대안 디자인은 별도 문서를 참조하세요.
> 👉 **[ir-style-guide-light.md](./ir-style-guide-light.md)**

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-01-31 | 1.0 | 최초 작성 |
| 2026-01-31 | 1.1 | 라이트 테마 스타일 가이드 분리 (ir-style-guide-light.md) |
| 2026-02-01 | 2.0 | **모션 시스템 전면 문서화**: 2601의 모든 애니메이션 키프레임, 페이지별 애니메이션 규칙, SVG 차트 애니메이션, 모션 감소 모드, 타이밍 가이드 추가 |
| 2026-02-11 | 2.1 | 260203 슬라이드 타입 추가: vibe-market, sales-detail, plugin-demo-video, exit-ma, pricing-plan 등 |
