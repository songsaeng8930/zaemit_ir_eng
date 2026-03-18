# IR 자료 스타일 가이드 (라이트 테마)

> 밝고 전문적인 느낌의 대안 디자인입니다. 프린트 친화적이며 기업 투자자에게 친숙한 스타일입니다.
> 다크 테마 스타일 가이드는 [ir-style-guide.md](./ir-style-guide.md)를 참조하세요.

---

## 0. 핵심 디자인 원칙 — 절대 규칙

> **이 규칙은 다크/라이트 테마 모두에 적용되며, 어떤 상황에서도 위반하지 않는다.**

### 0.1 수직 가운데 정렬 필수

> **모든 슬라이드의 `slide-inner`는 `display:flex;flex-direction:column;justify-content:center`로 콘텐츠를 수직 가운데 정렬한다.**

- 타이틀과 콘텐츠가 상단에 붙으면 안 된다.
- `fitSlideContent` zoom 적용 후에도 수직 가운데 정렬이 유지되어야 한다.

### 0.2 보더(border) 사용 금지

> **카드, 박스, 컨테이너에 border를 사용하지 않는다.**

- ❌ `border: 1px solid #E2E8F0` — 카드 외곽선
- ❌ `border-top: 4px solid #4F46E5` — accent border
- ✅ `box-shadow: var(--light-shadow-md)` — 그림자로 영역 구분
- ✅ `background: var(--light-bg-tertiary)` — 배경색 차이로 구분
- **허용 예외**: 테이블 행 구분선, 프로그레스바, 구분자(divider)

### 0.3 아이콘은 Lucide 인라인 SVG만

> **이모지, Font Awesome, Material Icons 등 절대 사용하지 않는다.**

- 모든 아이콘은 **Lucide** 인라인 SVG: `<svg viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" ...>`
- 참고: https://lucide.dev/icons

### 0.4 프레젠테이션 폰트 크기

> **슬라이드는 웹사이트가 아닌 프레젠테이션이다. 모든 텍스트는 최소 18px 이상.**

- vw 단위 + `max(18px, Xvw)` 패턴 필수 (CLAUDE.md 섹션 0-B 참조)
- 웹사이트용 작은 폰트(12px, 13px, 14px) 절대 사용 금지

---

## 1. 색상 팔레트

```css
:root {
  /* ═══ LIGHT THEME ═══ */

  /* 배경 */
  --light-bg-primary: #FFFFFF;        /* 메인 배경 - 순백색 */
  --light-bg-secondary: #F8FAFC;      /* 보조 배경 - 연한 그레이 */
  --light-bg-tertiary: #F1F5F9;       /* 카드/섹션 배경 */
  --light-bg-accent: #EEF2FF;         /* 강조 배경 (연한 인디고) */

  /* 텍스트 */
  --light-text-primary: #0F172A;      /* 기본 텍스트 - 진한 네이비 */
  --light-text-secondary: #475569;    /* 보조 텍스트 - 중간 그레이 */
  --light-text-muted: #94A3B8;        /* 흐린 텍스트 */
  --light-text-inverse: #FFFFFF;      /* 반전 텍스트 (어두운 배경용) */

  /* 액센트 컬러 */
  --light-accent-primary: #4F46E5;    /* 인디고 - 주요 강조 */
  --light-accent-secondary: #0EA5E9;  /* 스카이블루 - 보조 강조 */
  --light-accent-success: #10B981;    /* 에메랄드 - 성공/긍정 */
  --light-accent-warning: #F59E0B;    /* 앰버 - 주의/강조 */

  /* 보더/구분선 */
  --light-border-light: #E2E8F0;      /* 연한 보더 */
  --light-border-medium: #CBD5E1;     /* 중간 보더 */
  --light-border-accent: #A5B4FC;     /* 강조 보더 (인디고) */

  /* 그라데이션 */
  --light-gradient-hero: linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%);
  --light-gradient-accent: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  --light-gradient-success: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  --light-gradient-warm: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);

  /* 그림자 */
  --light-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --light-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --light-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  --light-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

---

## 2. 테마 적용

```css
/* 라이트 테마 활성화 */
body.light-theme {
  background: var(--light-bg-primary);
  color: var(--light-text-primary);
}

body.light-theme .slide {
  background: var(--light-bg-primary);
}
```

---

## 3. 컴포넌트 스타일

### 3.1 슬라이드 기본

```css
body.light-theme .slide {
  background: var(--light-bg-primary);
  color: var(--light-text-primary);
}

body.light-theme .section-label {
  color: var(--light-accent-primary);
  font-weight: 700;
  letter-spacing: 2px;
}

body.light-theme .section-title {
  color: var(--light-text-primary);
  font-weight: 800;
}

body.light-theme .section-desc {
  color: var(--light-text-secondary);
  line-height: 1.7;
}
```

### 3.2 카드

```css
/* 라이트 테마 카드 — border 사용 금지, 그림자로 구분 */
body.light-theme .card {
  background: var(--light-bg-primary);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--light-shadow-md);
  transition: all 0.2s ease;
}

body.light-theme .card:hover {
  box-shadow: var(--light-shadow-lg);
}

/* 강조 카드 — 배경색 차이로 강조 */
body.light-theme .card-highlight {
  background: var(--light-bg-accent);
}

/* 그라데이션 헤더 카드 */
body.light-theme .card-gradient-header {
  background: var(--light-bg-primary);
  border: none;
  overflow: hidden;
  position: relative;
}

body.light-theme .card-gradient-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--light-gradient-hero);
}
```

### 3.3 배지

```css
/* 라이트 테마 배지 */
body.light-theme .badge {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

body.light-theme .badge-primary {
  background: #EEF2FF;
  color: #4F46E5;
  border: 1px solid #C7D2FE;
}

body.light-theme .badge-success {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

body.light-theme .badge-warning {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
}

body.light-theme .badge-info {
  background: #F0F9FF;
  color: #0284C7;
  border: 1px solid #BAE6FD;
}

/* 솔리드 배지 (그라데이션) */
body.light-theme .badge-solid {
  background: var(--light-gradient-hero);
  color: white;
  border: none;
}
```

### 3.4 테이블

```css
/* 라이트 테마 테이블 */
body.light-theme .data-table {
  background: var(--light-bg-primary);
  border: 1px solid var(--light-border-light);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--light-shadow-sm);
}

body.light-theme .data-table th {
  background: var(--light-bg-tertiary);
  color: var(--light-text-secondary);
  font-weight: 700;
  padding: 16px;
  border-bottom: 2px solid var(--light-border-medium);
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

body.light-theme .data-table td {
  padding: 16px;
  color: var(--light-text-primary);
  border-bottom: 1px solid var(--light-border-light);
}

body.light-theme .data-table tbody tr:hover {
  background: var(--light-bg-secondary);
}

body.light-theme .data-table tbody tr:last-child td {
  border-bottom: none;
}

/* 강조 행 */
body.light-theme .data-table tr.highlight {
  background: var(--light-bg-accent);
}
```

### 3.5 버튼

```css
/* 라이트 테마 버튼 */
body.light-theme .btn-primary {
  background: var(--light-gradient-hero);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: var(--light-shadow-md);
  transition: all 0.2s ease;
}

body.light-theme .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--light-shadow-lg);
}

body.light-theme .btn-secondary {
  background: var(--light-bg-primary);
  color: var(--light-accent-primary);
  border: 2px solid var(--light-accent-primary);
  padding: 10px 22px;
  border-radius: 10px;
  font-weight: 600;
}

body.light-theme .btn-secondary:hover {
  background: var(--light-bg-accent);
}
```

---

## 4. 히어로 슬라이드

```css
/* 그라데이션 배경 히어로 */
body.light-theme .slide.hero {
  background: var(--light-gradient-hero);
  color: white;
}

body.light-theme .slide.hero .section-label {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  display: inline-block;
}

body.light-theme .slide.hero .section-title {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

body.light-theme .slide.hero .section-desc {
  color: rgba(255, 255, 255, 0.9);
}

/* 히어로 카드 (흰색) */
body.light-theme .slide.hero .hero-card {
  background: white;
  color: var(--light-text-primary);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--light-shadow-xl);
}
```

---

## 5. 숫자/통계

```css
/* 큰 숫자 강조 */
body.light-theme .stat-number {
  font-size: 48px;
  font-weight: 800;
  background: var(--light-gradient-hero);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

body.light-theme .stat-label {
  color: var(--light-text-secondary);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 통계 카드 */
body.light-theme .stat-card {
  background: var(--light-bg-primary);
  border: 1px solid var(--light-border-light);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: var(--light-shadow-sm);
}

body.light-theme .stat-card:hover {
  border-color: var(--light-border-accent);
  box-shadow: var(--light-shadow-md);
}
```

---

## 6. 차트/다이어그램

```css
/* 플로우 차트 화살표 */
body.light-theme .flow-arrow {
  color: var(--light-accent-primary);
}

/* 프로그레스 바 */
body.light-theme .progress-bar {
  background: var(--light-bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
}

body.light-theme .progress-fill {
  background: var(--light-gradient-hero);
  height: 8px;
  border-radius: 8px;
}

/* 파이 차트 색상 */
body.light-theme .chart-color-1 { fill: #4F46E5; }
body.light-theme .chart-color-2 { fill: #0EA5E9; }
body.light-theme .chart-color-3 { fill: #10B981; }
body.light-theme .chart-color-4 { fill: #F59E0B; }
body.light-theme .chart-color-5 { fill: #EC4899; }
```

---

## 7. 이미지

```css
/* 이미지 스타일 */
body.light-theme .photo-circle {
  border: 3px solid var(--light-border-light);
  box-shadow: var(--light-shadow-md);
}

body.light-theme .photo-rounded {
  border: 1px solid var(--light-border-light);
  border-radius: 12px;
  box-shadow: var(--light-shadow-sm);
}

/* 로고/아이콘 배경 */
body.light-theme .icon-bg {
  background: var(--light-bg-tertiary);
  border-radius: 12px;
  padding: 12px;
}
```

---

## 8. 다크/라이트 테마 비교

| 요소 | 다크 테마 | 라이트 테마 |
|-----|---------|-----------|
| 배경 | `#0A0E27` (네이비) | `#FFFFFF` (화이트) |
| 텍스트 | `#FFFFFF` | `#0F172A` |
| 보조 텍스트 | `#94A3B8` | `#475569` |
| 주요 강조 | `#00D4AA` (민트) | `#4F46E5` (인디고) |
| 보조 강조 | `#7C3AED` (퍼플) | `#0EA5E9` (스카이블루) |
| 카드 배경 | `rgba(17,22,51,0.6)` | `#FFFFFF` + 그림자 |
| 보더 | `rgba(255,255,255,0.06)` | `#E2E8F0` |

---

## 9. 테마 전환 JavaScript

```javascript
// 테마 토글
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// 저장된 테마 로드
function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light-theme');
  }
}

// 시스템 테마 감지
function detectSystemTheme() {
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.body.classList.add('light-theme');
  }
}

// 페이지 로드 시 테마 적용
document.addEventListener('DOMContentLoaded', loadTheme);
```

---

## 10. 애니메이션 시스템

> 라이트 테마도 2601(다크 테마)와 동일한 모션 시스템을 적용합니다.
> 자세한 내용은 [ir-style-guide.md](./ir-style-guide.md)의 섹션 4를 참조하세요.

### 10.1 기본 Keyframes

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
```

### 10.2 타이틀 애니메이션 (모든 슬라이드 공통)

```css
/* 요소 초기 상태: 숨김 */
.slide .section-label,
.slide .section-title,
.slide .section-desc {
  opacity: 0;
}

/* 타이틀 순차 등장 */
.slide.active .section-label { animation: aFadeUp 0.5s ease 0.15s both; }
.slide.active .section-title { animation: aFadeUp 0.55s ease 0.3s both; }
.slide.active .section-desc  { animation: aFadeUp 0.5s ease 0.45s both; }
```

### 10.3 Cover 페이지 애니메이션

```css
/* 요소 초기 상태 */
.slide .cover-left, .slide .hero-left,
.slide .cover-right, .slide .hero-right {
  opacity: 0;
}

/* 좌우 분할 슬라이드인 */
.slide.active .cover-left,
.slide.active .hero-left {
  animation: aSlideR 0.6s ease 0.2s both;
}

.slide.active .cover-right,
.slide.active .hero-right {
  animation: aSlideL 0.6s ease 0.4s both;
}
```

### 10.4 콘텐츠 애니메이션

```css
/* 콘텐츠 요소 초기 상태 */
.slide .solution-layout,
.slide .solution-feature,
.slide .traction-layout,
.slide .metric-card,
.slide .ask-layout,
.slide .team-member {
  opacity: 0;
}

/* 메인 레이아웃 */
.slide.active .solution-layout { animation: aFadeUp 0.5s ease 0.5s both; }
.slide.active .traction-layout { animation: aFadeUp 0.5s ease 0.5s both; }
.slide.active .ask-layout { animation: aFadeUp 0.5s ease 0.5s both; }

/* 순차 카드 애니메이션 */
.slide.active .solution-feature:nth-child(1) { animation: aFadeUp 0.45s ease 0.55s both; }
.slide.active .solution-feature:nth-child(2) { animation: aFadeUp 0.45s ease 0.7s both; }
.slide.active .solution-feature:nth-child(3) { animation: aFadeUp 0.45s ease 0.85s both; }

.slide.active .metric-card:nth-child(1) { animation: aFadeUp 0.45s ease 0.55s both; }
.slide.active .metric-card:nth-child(2) { animation: aFadeUp 0.45s ease 0.7s both; }
.slide.active .metric-card:nth-child(3) { animation: aFadeUp 0.45s ease 0.85s both; }
.slide.active .metric-card:nth-child(4) { animation: aFadeUp 0.45s ease 1.0s both; }

.slide.active .team-member:nth-child(1) { animation: aFadeUp 0.45s ease 0.55s both; }
.slide.active .team-member:nth-child(2) { animation: aFadeUp 0.45s ease 0.7s both; }
.slide.active .team-member:nth-child(3) { animation: aFadeUp 0.45s ease 0.85s both; }
```

### 10.5 모션 감소 모드

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
body.no-motion .slide.active .cover-left,
body.no-motion .slide.active .cover-right,
body.no-motion .slide.active .solution-feature,
body.no-motion .slide.active .metric-card,
body.no-motion .slide.active .team-member {
  opacity: 1 !important;
  transform: none !important;
}
```

---

## 11. 프린트 최적화

```css
@media print {
  /* 프린트 시 자동으로 라이트 테마 적용 */
  body {
    background: white !important;
    color: #0F172A !important;
  }

  .slide {
    background: white !important;
    box-shadow: none !important;
  }

  .card {
    box-shadow: none !important;
    border: 1px solid #E2E8F0 !important;
  }

  /* 그라데이션 → 단색 */
  .stat-number {
    background: none !important;
    -webkit-text-fill-color: #4F46E5 !important;
    color: #4F46E5 !important;
  }

  /* 불필요한 요소 숨김 */
  .no-print {
    display: none !important;
  }
}
```

---

## 11. 사용 예시

### 11.1 기본 슬라이드

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="light-theme">
  <div class="slide">
    <div class="slide-inner">
      <div class="section-label">OVERVIEW</div>
      <div class="section-title">회사 소개</div>
      <div class="section-desc">글로벌 SaaS 플랫폼을 제공합니다.</div>

      <div class="overview-layout">
        <div class="stat-card">
          <div class="stat-number">150+</div>
          <div class="stat-label">고객사</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">$5M</div>
          <div class="stat-label">ARR</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

### 11.2 테마 토글 버튼

```html
<button class="theme-toggle" onclick="toggleTheme()">
  <span class="dark-icon">🌙</span>
  <span class="light-icon">☀️</span>
</button>

<style>
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--light-border-light);
  background: var(--light-bg-primary);
  cursor: pointer;
}

body.light-theme .dark-icon { display: inline; }
body.light-theme .light-icon { display: none; }

body:not(.light-theme) .dark-icon { display: none; }
body:not(.light-theme) .light-icon { display: inline; }
</style>
```

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-01-31 | 1.0 | 최초 작성 |
| 2026-02-01 | 1.1 | **애니메이션 시스템 추가**: Keyframes, 타이틀/Cover/콘텐츠 애니메이션, 모션 감소 모드 |
