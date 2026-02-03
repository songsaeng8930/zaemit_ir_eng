# IR 모션 스타일 가이드

## 개요

IR 버전별로 두 가지 모션 철학을 적용합니다:
- **은은한 모션 (Subtle Motion)**: 2601, 2602 - 전문적이고 절제된 애니메이션
- **화려한 모션 (Rich Motion)**: 260202 - 역동적이고 인상적인 애니메이션

---

## 은은한 모션 (Subtle Motion) - 2601, 2602

### 철학
> "콘텐츠가 주인공, 모션은 조연"

- 자연스러운 등장으로 시선 유도
- 과하지 않은 움직임으로 전문성 유지
- 일관된 리듬으로 안정감 제공

### 기본 키프레임

```css
/* 아래에서 올라오며 페이드인 */
@keyframes aFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 단순 페이드인 */
@keyframes aFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 약간 작은 상태에서 확대 */
@keyframes aScaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

/* 좌에서 슬라이드 */
@keyframes aSlideR {
  from { opacity: 0; transform: translateX(-32px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 우에서 슬라이드 */
@keyframes aSlideL {
  from { opacity: 0; transform: translateX(32px); }
  to { opacity: 1; transform: translateX(0); }
}
```

### 타이밍 설정

| 요소 | 지속시간 | 딜레이 | 이징 |
|------|---------|--------|------|
| 섹션 라벨 | 0.5s | 0.15s | ease |
| 섹션 타이틀 | 0.55s | 0.3s | ease |
| 섹션 설명 | 0.5s | 0.45s | ease |
| 히어로 요소 | 0.6s | 0.2s~0.4s | ease |
| 카드 항목 | 0.45s | 0.6s~1.05s (순차) | ease |

### 호버 효과

```css
/* 카드 호버 - 미세한 상승 */
.card:hover {
  transform: translateY(-4px);
  transition: transform 0.2s ease;
}

/* 버튼 호버 - 부드러운 상승 */
.btn:hover {
  transform: translateY(-3px);
  transition: transform 0.3s ease;
}
```

### SVG 라인 드로잉 (2601, 2602)

```css
@keyframes svgLineDraw {
  from { stroke-dashoffset: var(--dash); }
  to { stroke-dashoffset: 0; }
}

@keyframes svgAreaReveal {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 적용 예시 */
.chart-line {
  animation: svgLineDraw 1.8s ease-out 0.8s forwards;
}

.chart-area {
  animation: svgAreaReveal 0.6s ease-out 2s forwards;
}
```

---

## 화려한 모션 (Rich Motion) - 260202

### 철학
> "모션이 브랜드, 움직임으로 기억에 남기다"

- 대담한 움직임으로 임팩트 전달
- 다층적 애니메이션으로 깊이감 생성
- 무한 루프 효과로 생동감 유지

### 기본 키프레임

```css
/* 강조된 페이드업 - 더 큰 이동거리 */
@keyframes aFadeUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 스케일 + 페이드 - 더 드라마틱 */
@keyframes aScaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

/* 탄성 등장 */
@keyframes aBounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

/* 위에서 떨어지며 등장 */
@keyframes aDropIn {
  from { opacity: 0; transform: translateY(-40px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 회전하며 등장 */
@keyframes aRotateIn {
  from { opacity: 0; transform: rotate(-10deg) scale(0.9); }
  to { opacity: 1; transform: rotate(0) scale(1); }
}
```

### 고급 이징 커브

```css
:root {
  /* 탄성 효과 - 빠른 시작, 부드러운 착지 */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* 과장된 바운스 */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* 스냅 효과 - 빠른 착지 */
  --ease-snap: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### 타이밍 설정

| 요소 | 지속시간 | 딜레이 | 이징 |
|------|---------|--------|------|
| 섹션 라벨 | 0.6s | 0.1s | ease-out-expo |
| 섹션 타이틀 | 0.7s | 0.25s | ease-out-expo |
| 섹션 설명 | 0.6s | 0.4s | ease |
| 히어로 요소 | 0.8s | 0.15s~0.5s | ease-bounce |
| 카드 항목 | 0.5s | 0.5s~1.2s (순차) | ease-out-expo |
| 주요 CTA | 0.6s | 0.8s | ease-bounce |

### 무한 루프 애니메이션

```css
/* 궤도 회전 */
@keyframes orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orbit-ring {
  animation: orbit 20s linear infinite;
}

.orbit-ring.reverse {
  animation: orbit 25s linear infinite reverse;
}

/* 펄스 효과 */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

.pulse-badge {
  animation: pulse 2s ease-in-out infinite;
}

/* 부유 효과 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.floating-element {
  animation: float 3s ease-in-out infinite;
}

/* 파티클 효과 */
@keyframes particle {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% { opacity: 1; }
  90% { opacity: 1; }
  50% {
    transform: translateY(-200px) translateX(50px);
  }
}

.particle {
  animation: particle 8s ease-in-out infinite;
}
```

### 스크롤 트리거 효과

```css
/* 슬라이드 활성화 시 요소별 순차 등장 */
.slide.active .hero-title {
  animation: aFadeUp 0.7s var(--ease-out-expo) 0.2s both;
}

.slide.active .hero-subtitle {
  animation: aFadeUp 0.6s var(--ease-out-expo) 0.35s both;
}

.slide.active .hero-cta {
  animation: aBounceIn 0.6s var(--ease-bounce) 0.5s both;
}

.slide.active .hero-visual {
  animation: aScaleIn 0.8s var(--ease-out-expo) 0.4s both;
}
```

### 인터랙티브 호버

```css
/* 카드 호버 - 3D 리프트 */
.card {
  transition: transform 0.4s var(--ease-out-expo),
              box-shadow 0.4s ease;
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

/* 버튼 호버 - 강조 효과 */
.btn-primary {
  transition: all 0.3s var(--ease-out-expo);
}

.btn-primary:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 10px 30px rgba(var(--primary-rgb), 0.3);
}

/* 이미지 호버 - 줌인 */
.img-hover {
  overflow: hidden;
}

.img-hover img {
  transition: transform 0.6s var(--ease-out-expo);
}

.img-hover:hover img {
  transform: scale(1.1);
}
```

---

## 비교표

| 특성 | 은은한 모션 (2601, 2602) | 화려한 모션 (260202) |
|------|-------------------------|---------------------|
| **이동 거리** | 28px | 50px |
| **스케일 변화** | 0.92 → 1 | 0.8 → 1 |
| **최대 지속시간** | 0.55s | 0.8s |
| **이징 커브** | ease | cubic-bezier (커스텀) |
| **무한 애니메이션** | 없음 | orbit, pulse, float |
| **호버 효과** | translateY(-4px) | translateY(-8px) scale(1.02) |
| **전체 시퀀스** | ~1.5s | ~2.5s |
| **퍼포먼스 영향** | 낮음 | 중간~높음 |

---

## 접근성 지원

```css
/* 모션 감소 선호 사용자 대응 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 수동 토글 지원 */
body.no-motion * {
  animation-duration: 0.001s !important;
  animation-delay: 0s !important;
  transition-duration: 0.001s !important;
}
```

---

## 구현 체크리스트

### 은은한 모션 적용 시
- [ ] aFadeUp, aFadeIn, aScaleIn 키프레임 정의
- [ ] 요소별 순차 딜레이 설정 (0.15s 간격)
- [ ] 호버 시 translateY(-4px) 적용
- [ ] prefers-reduced-motion 대응

### 화려한 모션 적용 시
- [ ] 확장된 키프레임 세트 정의
- [ ] 커스텀 이징 커브 변수 설정
- [ ] 무한 루프 애니메이션 추가
- [ ] 3D 호버 효과 적용
- [ ] 파티클/궤도 효과 추가 (선택)
- [ ] prefers-reduced-motion 대응
- [ ] 모바일 퍼포먼스 테스트
