# IR 스타일 가이드 — Zaemit 컨셉 (제3의 디자인 스타일)

> 기존 **다크 테마**(ir-style-guide.md), **라이트 테마**(ir-style-guide-light.md)와 별도의
> **Zaemit 컨셉** 디자인 시스템입니다.
> 원본: https://cdn.zaemit.ai/weven/index.html (WEVEN×Kakao 소개자료, 2026.08 디자인확정서 v1 기반)
> 적용 IR: **260814_introduce** (이후 Zaemit 컨셉 IR 제작 시 이 문서를 따른다)

---

## 1. 디자인 철학

- **미니멀 에디토리얼**: 화이트 베이스(#FDFDFF) 위에 파스텔 radial 메쉬를 가장자리/코너에만 배치. **중앙부는 항상 깨끗하게** — 콘텐츠 가독 최우선.
- **위계는 컬러가 아니라 굵기**: 전 텍스트 기본 잉크 `#111`. 회색은 주석급(`--z-note`) 1톤만 허용.
- **포인트 컬러는 블루 1계열**: `#3B82F6` 중심. 슬라이드당 핵심 키워드에만. 퍼플 계열 배제.
- **강조 블록은 슬라이드당 1개**: 포인트 컬러 면(그라데이션) + 흰 글씨 블록은 한 슬라이드에 하나만.

---

## 2. 컬러 토큰

```css
:root{
  --z-ink:#111;                /* 전 텍스트 기본 잉크 */
  --z-note:#a6afc0;            /* 주석급 회색 — 유일하게 허용되는 회색 (캡션·출처·라벨) */
  --z-accent:#3B82F6;          /* 포인트 블루 */
  --z-accent-light:#74ACFF;    /* 그라데이션 밝은 쪽 */
  --z-accent-deep:#2C63D9;     /* 그라데이션 진한 쪽 */
  --z-bg:#FDFDFF;              /* 베이스 화이트 */
  /* 파스텔 팔레트 (RGB triplet — rgba(var(--z-pa-*), a) 형태로 사용) */
  --z-pa-lav:185,168,255;      /* 라벤더 #B9A8FF */
  --z-pa-sky:158,200,255;      /* 스카이 #9EC8FF */
  --z-pa-pink:247,185,220;     /* 핑크   #F7B9DC */
  --z-pa-mint:167,232,216;     /* 민트   #A7E8D8 */
  --z-pa-peach:255,211,184;    /* 피치   #FFD3B8 */
}
```

- 그라데이션 텍스트(`.grad-text`): `linear-gradient(96deg, #2C63D9 0%, #3B82F6 48%, #74ACFF 100%)` — 블루 스펙트럼 내 명도 변화만, 슬라이드당 1회.
- 리스크/한계 강조: `#E03131` (비교표의 '한계' 열 등 제한적 사용).

---

## 3. 배경색 패턴 — 파스텔 메쉬 시스템

### 구조 (3층)
1. **1층**: 슬라이드 전체 `#FDFDFF` 화이트 베이스
2. **2층**: `.mesh` — 파스텔 radial-gradient 2~4개 + blur. 슬라이드별 다른 조합
3. **3층**: 콘텐츠

### .mesh 공통 규칙
```css
.mesh{
  position:absolute; inset:-12.5vw;   /* blur 번짐 여유 */
  z-index:0; pointer-events:none;
  filter:blur(5.5vw);                 /* 원본 70px@2560 상당 */
  background:var(--mesh);
}
```

### 절대 규칙
- radial 끝은 반드시 `rgba(...,0)` — `transparent`로 끝내면 **회색 프린지**가 낀다.
- **페이지별 변주 필수**: 각 슬라이드가 `--mesh`로 radial 위치(코너 조합)·컬러 페어를 바꾼다. **연속 슬라이드 동일 구성 금지**.
- 농도: **soft**(콘텐츠 장) stop opacity 0.25~0.45 / **vivid**(표지·간지·클로징) 상한 0.45~0.78.
- 한 페이지에 파스텔 2~3색만.

### 구도 베리에이션 카탈로그 (원본에서 사용된 형태)
| 형태 | 설명 | 예 |
|-----|------|-----|
| 코너 2~4점 | 대각/좌우 코너에 점 배치, 중앙 비움 | 표지, 간지 |
| 대각선 흐름 | 좌상→우하(또는 역방향)로 색이 흐름 | 포트폴리오 |
| 좌/우측면 감싸기 | 한쪽 엣지를 3색이 세로로 감싸고 반대편은 비움 | 상세·기술 장 |
| 상/하단 밴드 | 한쪽 엣지를 3색이 가로로 흐름 | Full-Lifecycle, 로드맵 |
| 비네트 | 네 코너를 감싸고 중앙 완전 비움 | 간지, 포지셔닝 |

---

## 4. 폰트

| 용도 | 폰트 | 비고 |
|-----|------|-----|
| 본문 전체 | **Pretendard** (CDN variable) | 100~800 웨이트 |
| Zaemit 워드마크 | **Fugaz One** (Google Fonts) | 단일 웨이트 400 — `font-synthesis:none`으로 합성 볼드 차단, `.za` 클래스 |
| WEVEN 워드마크 | **Russo One** (Google Fonts) | 단일 웨이트 400, Fugaz 대비 `0.95em` 시각 보정 |

- `Zaemit` 텍스트는 항상 `.za`(Fugaz One)로, 색은 블루 또는 흰색(강조 블록 위).
- `×` 기호는 Pretendard **Thin(100)**, opacity .3.

### 타이포 스케일 (1280 기준 vw — 원본 2560px ÷ 25.6)
| 요소 | vw | 원본px | 웨이트 |
|-----|-----|--------|-------|
| 표지 h1 | 4.296875vw | 110 | 800 |
| t-h1 (목차·간지 h1) | 4.0625vw | 104 | 800 |
| t-h2 (섹션 타이틀 1줄) | 3.4375vw | 88 | 800 |
| t-h3 (섹션 타이틀 2줄) | 3.125vw | 80 | 800 |
| t-sub (서브카피) | 1.5625vw | 40 | 500~600, **#111** (회색 아님!) |
| 본문 | max(18px,1.328125vw) | 34 | 400~500 |
| 캡션·주석 | max(18px,1.015625vw) | 26 | 500, --z-note |
| 오버라인(영문) | max(18px,1.015625vw) | 26 | 600, letter-spacing 0.27vw |
| 간지 배경 대형 숫자 | 35.15625vw | 900 | 800, rgba(59,130,246,.08) |

- letter-spacing: 헤드라인 -0.03em / 본문 -0.01em / 한글 `word-break:keep-all`.
- **프로젝트 공통 규칙 유지**: 1.40625vw(18px) 미만은 반드시 `max(18px, Xvw)` 래핑.

---

## 5. 박스(카드) 처리 형태

### 기본 카드 `.card` — Zaemit 컨셉 시그니처
```css
.card{
  background:linear-gradient(180deg,#FFFFFF 0%,#FEFEFF 46%,#F9FBFE 100%);
  border:1px solid #DCE5F4;          /* ⚠️ Zaemit 컨셉 공식 예외 — 아래 참조 */
  border-top-color:#EAF0FA;          /* 상단 엣지 톤업 */
  border-radius:1.09375vw;           /* 28px 상당 */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.95),   /* 상단 광택 1px */
    0 2px 5px rgba(30,58,138,.05),          /* 가까운 접지 */
    0 1.171875vw 2.421875vw -0.78125vw rgba(59,130,246,.15); /* 부유감 */
}
```

> **⚠️ 보더 예외 등록**: 다크/라이트 테마의 "카드 border 금지" 규칙과 달리,
> Zaemit 컨셉은 `1px solid #DCE5F4` 헤어라인 보더 + 이중 섀도가 **공식 카드 문법**이다.
> 단, 두꺼운 보더·accent border(border-top 컬러 강조 등)는 여전히 금지.

### 변형
- **강조 블록** (슬라이드당 1개): `linear-gradient(120deg, var(--z-accent-deep) 0%, var(--z-accent) 100%)` + 흰 글씨 + `box-shadow: 0 0.9375vw 1.953125vw -0.703125vw rgba(59,130,246,.45)`
- **미확정/추진 중 상태**: `background:rgba(255,255,255,.55)` + **대시 보더** `2px dashed #C9D6EA`(또는 rgba(59,130,246,.45))
- **틴트 판**: 아이콘 배경 `rgba(59,130,246,.06~.10)` + `border-radius` 둥근 사각
- **상태 뱃지(pill)**: `border-radius:999px`, 완료=`rgba(59,130,246,.09)`+블루 / 예정=백색+`1.5px dashed #AEBFD9`+회색

---

## 6. 실사 이미지 사용 패턴

- **웹사이트 풀샷**: 카드 안에 **브라우저 프레임 목업**으로 감싼다
  - 패턴 A(심플): 카드 상단 회색 dot 3개(`#DCE5F4`, 15px 원) + 이미지
  - 패턴 B(풀 브라우저): 신호등 dot(`#FF5F57/#FEBC2E/#28C840`) + URL pill(`zaemit.ai`)
  - 이미지: `object-fit:cover; object-position:top center` — 상단 기준 크롭
- **현장 사진(미팅 등)**: 라운드 사각(`border-radius:1.09375vw`) 카드에 `object-fit:cover; object-position:center`
- **인물 프로필**: 원형 아바타 (`border-radius:50%`), 배경 `rgba(59,130,246,.08)`
- 이미지 자리 배경: `#F1F3F8` (로드 전/플레이스홀더)
- 에셋은 `ir/<버전>/assets/`에 로컬 보관

---

## 7. 아이콘 사용 패턴

- **커스텀 라인 아트 SVG** (Lucide 스타일 확장): `fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`, viewBox 24/32/48 격자
- 아이콘은 **틴트 타일** 위에 올린다: `border-radius` 둥근 사각 + `background:rgba(59,130,246,.08)` + `color:var(--z-accent)`
- 기능 칩 등에서는 파스텔 컬러 포인트 허용 (칩별로 라벤더/스카이/민트/피치/핑크 틴트 + 진한 동계열 스트로크)
- 이모지·Font Awesome 등 금지 (프로젝트 공통 규칙과 동일)

### 커넥터(다이어그램 선) 문법
- 이중 스트로크: **글로우선**(stroke-width 7, opacity .22, `feGaussianBlur stdDeviation=6`) + **본선**(stroke-width 2)
- 색: `#3B82F6` (일부 허브 다이어그램 `#6D5BF6` 바이올렛 허용)
- 화살표는 path로 직접 (`M.. L.. L..` 꺾쇠)
- SVG filter는 `filterUnits="userSpaceOnUse"` — 수평선(bbox 높이 0)에서 필터 붕괴 방지

---

## 8. 레이아웃 형태

### 공통 구조 (viewer 연동 — 프로젝트 공통)
```html
<div class="slide" data-title-ko="제목">
  <div class="mesh mXX"></div>
  <div class="slide-inner">
    <div class="head">
      <div class="section-label">1. 결과물 - <span class="num">01</span></div>
      <div class="section-title">헤드라인 <span class="pt-c">키워드</span></div>
      <div class="section-desc">서브카피</div>
    </div>
    <div class="content ...">...</div>
  </div>
</div>
```

- **헤드라인 센터 정렬**: 콘텐츠 슬라이드의 타이틀 블록은 가로 센터.
- **섹션 라벨**: 헤드라인 첫 줄 상단선에 맞춰 **좌측 절대 배치**(`position:absolute; left:0`). `"N. 파트명 - 01"` 형식, 굵기 700, #111.
- 헤드라인 1줄 → t-h2 / 2줄 → t-h3 크기.
- 페이지 번호·사이드바 등 viewer 제공 UI는 넣지 않는다 (프로젝트 공통 규칙).

### 슬라이드 유형별 패턴
| 유형 | 구성 |
|-----|------|
| 표지/클로징 | 중앙 정렬 히어로 — `Zaemit × WEVEN` 락업 + h1 + 서브. vivid 메쉬 |
| 목차 | 좌상단 타이틀 + **5단 균등 그리드** (칼럼 사이 1px 세로선 `#dedee8`, 상단 파트명/하단 페이지범위) |
| 간지 | 중앙 정렬 + **배경 대형 숫자**(35vw, 블루 8%) + 줄 단위 헤드라인. vivid 메쉬 |
| 포트폴리오 | 4분할 카드 (풀샷 + 이름 + 제작시간 빅넘버 + MCP 뱃지) |
| 상세 (쌍둥이 포맷) | 좌 브라우저 풀샷 1.48fr / 우 스펙 시트 1fr (k-v 행 + 구분선) + 하단 **제작시간 강조 블록** |
| 기술 장 | 좌 45 / 우 55 (또는 미러) — 다이어그램 + 브라우저 목업 |
| 다이어그램 장 | 절대 좌표 배치 + SVG 커넥터 오버레이 (칩 스택 → 허브 → 사용자) |
| 비교 장 | 좌 비교표(헤더 굵기 + 얇은 행 구분선 + Zaemit 강조 행) / 우 2축 포지셔닝 맵 SVG |
| 타임라인 | 가로 5노드 — 완료(솔리드+체크 도트) / 협상 중(대시 라인+대시 도트) |
| 로드맵 | 좌→우 상승 계단 (바닥 정렬, 마지막 = 강조 블록 + 플로팅 목표 뱃지) |
| 팀 | 대표 카드(좌, 3행 스팬) + 6인 그리드(2열×3행), 원형 아바타 |

### 수치 표현
- **빅넘버**: 초대형 800 웨이트 + 솔리드 accent (`350`, `34,717`, `15h` 등), `font-variant-numeric:tabular-nums`
- 차트: 바(블루 그라데이션, 마지막만 진한 강조) + 라인 오버레이(글로우) 콤보. 축·격자 최소화, 구분선 `#dedee8`

---

## 9. 모션

- 톤 절제: **페이드 + 상승(0.9375vw)만**. 바운스/회전 없음.
- 등장 순서: 라벨 → 타이틀 → 서브 → 콘텐츠(스태거 0.08~0.15s 간격) → 커넥터 → 강조 블록
- `body.no-motion` 토글 시 즉시 최종 상태 (프로젝트 공통).

---

## 10. 체크리스트 (Zaemit 컨셉 IR 제작 시)

- [ ] 모든 크기값 vw 단위 (÷25.6 변환, 1px 헤어라인 보더만 px)
- [ ] font-size 1.40625vw 미만은 `max(18px, Xvw)` 래핑
- [ ] 슬라이드별 메쉬 구성 변주 (연속 동일 구성 금지, radial 끝 rgba(...,0))
- [ ] 강조 블록(블루 면) 슬라이드당 1개
- [ ] 회색은 `--z-note` 1톤만, 서브카피는 #111
- [ ] `Zaemit` 워드마크는 `.za`(Fugaz One) + font-synthesis:none
- [ ] 카드: 시그니처 스타일(그라데이션 배경 + 1px #DCE5F4 + 이중 섀도)
- [ ] window.setLang / window.goToSlide / window.irSlideInfo 노출
- [ ] @media 쿼리 금지, viewer UI 중복 금지
