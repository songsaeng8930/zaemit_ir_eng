# IR 다국어(i18n) 대응 가이드

> 260203부터 한국어(KO), 영어(EN), 일본어(JA) 3개 국어를 지원합니다.
> 이 문서는 다국어 콘텐츠 작성 시 주의사항을 정리합니다.

---

## 1. 기본 원칙

### 모든 텍스트는 3벌 작성

```html
<div class="section-title" data-lang="ko">한국어 제목</div>
<div class="section-title" data-lang="en">English Title</div>
<div class="section-title" data-lang="ja">日本語タイトル</div>
```

### 슬라이드 제목 속성도 3개

```html
<div class="slide example" data-title-ko="제목" data-title-en="Title" data-title-ja="タイトル">
```

### SVG 내 텍스트도 3벌

```html
<text x="480" y="50" data-lang="ko">한국어</text>
<text x="480" y="50" data-lang="en">English</text>
<text x="480" y="50" data-lang="ja">日本語</text>
```

---

## 2. 언어 전환 CSS

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
```

> **중요**: `display: block`이 아니라 `display: revert`를 사용한다.
> flex 요소가 block으로 바뀌면 레이아웃이 깨진다.

---

## 3. 일본어 대응 시 주의사항

### 3.1 텍스트 길이 문제

일본어는 한국어/영어보다 텍스트가 길어지는 경우가 많다.

| 한국어 | 일본어 | 비율 |
|-------|-------|------|
| 풀 스택 애플리케이션 | フルスタックアプリケーション | ~1.5배 |
| 바이브코딩 시대 | バイブコーディング時代 | ~1.3배 |
| Zaemit 플랫폼 | Zaemit プラットフォーム | ~1.4배 |

### 3.2 SVG pill/rect 너비 확장

일본어가 SVG 도형을 넘칠 때, **도형 너비를 키운다**:

```html
<!-- Before: 일본어 넘침 -->
<rect x="300" y="15" width="360" height="78" rx="39"/>

<!-- After: 양쪽으로 확장 -->
<rect x="250" y="15" width="460" height="78" rx="39"/>
```

- `x`를 줄이고 `width`를 키워 중심점은 유지
- 텍스트의 `text-anchor="middle"`은 변경 불필요

### 3.3 CSS white-space 활용

카드나 단계 박스에서 텍스트가 줄바꿈되는 경우:

```css
.mkt-stage-text {
  font-size: 13px;      /* 14px → 13px 축소 */
  white-space: nowrap;  /* 줄바꿈 방지 */
}
```

### 3.4 폰트 크기 축소

넓힐 수 없는 제한된 공간에서는 폰트를 줄인다:

```css
/* 현재 단계 텍스트 */
.mkt-stage-current .mkt-stage-text {
  font-size: 13px;      /* 16px → 13px */
  white-space: nowrap;
}
```

---

## 4. 폰트 시스템

### 4.1 폰트 패밀리

```css
/* 기본 (한국어) */
font-family: 'Pretendard Variable', 'Plus Jakarta Sans', -apple-system, sans-serif;

/* 숫자/영문 강조 */
font-family: 'Plus Jakarta Sans', 'Pretendard Variable', sans-serif;

/* 일본어 전용 (SVG 등 명시적 지정 시) */
font-family: 'Noto Sans JP', 'Plus Jakarta Sans', sans-serif;
```

### 4.2 웹폰트 로드

```html
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## 5. 번역 누락 확인 체크리스트

새 슬라이드 작성 또는 수정 후 반드시 확인:

- [ ] `section-label` — ko/en/ja 3벌
- [ ] `section-title` — ko/en/ja 3벌
- [ ] `section-desc` — ko/en/ja 3벌
- [ ] 슬라이드 `data-title-ko/en/ja` 속성
- [ ] SVG `<text>` 요소 — ko/en/ja 3벌
- [ ] 차트 라벨 (`.mkt-clabel` 등) — ko/en/ja 3벌
- [ ] 연도 축 라벨 — ko/en/ja 3벌
- [ ] 카드/테이블 내 텍스트 — ko/en/ja 3벌
- [ ] 통계 단위 (`명/일`, `/day`, `名/日` 등) — ko/en/ja 3벌

---

## 6. 일본어 번역 용어 참고

| 한국어 | 영어 | 일본어 |
|-------|------|-------|
| 바이브코딩 | Vibe Coding | バイブコーディング |
| 플랫폼 | Platform | プラットフォーム |
| 풀 스택 애플리케이션 | Full-Stack Applications | フルスタックアプリケーション |
| 웹사이트 빌더 | Website Builder | ウェブサイトビルダー |
| 에이전시 | Agency | エージェンシー |
| 리셀러 | Reseller | リセラー |
| 공급자 | Supplier | 供給者 |
| 사용자 | User | ユーザー |
| 전문가 | Expert | 専門家 |
| 사업가 | Business | 事業者 |
| 결제 수수료 | Payment Commission | 決済手数料 |
| 구독 | Subscription | サブスク / 購読 |
| 도메인 | Domain | ドメイン |
| 플러그인 | Plugin | プラグイン |
| 스타일팩 | Style Pack | スタイルパック |
| 호스팅 | Hosting | ホスティング |
| 디지털 전환 | Digital Transformation | デジタルトランスフォーメーション / DX転換 |
| 유료 결제 | Paid Conversion | 有料決済 |
| 이탈 | Drop-off | 離脱 |
| 성장 전략 | Growth Strategy | 成長戦略 |
| 로드맵 | Roadmap | ロードマップ |
| 스케일업 | Scale-up | スケールアップ |
| 투자 유치 | Fundraising | 資金調達 |

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|-----|
| 2026-02-11 | 1.0 | 최초 작성 — 다국어 원칙, 일본어 대응 주의사항, 폰트 시스템, 번역 용어집 |
