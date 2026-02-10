# WEVEN IR 프로젝트 - AI 작업 지침

## 필독 문서 (작업 전 반드시 읽을 것)

1. **[docs/project-overview.md](docs/project-overview.md)** - 프로젝트 전체 구조
2. **[docs/ir-print-compatibility.md](docs/ir-print-compatibility.md)** - 프린트 미리보기 호환성 규칙 (**새 IR 생성 시 필수!**)
3. **[docs/ir-style-guide.md](docs/ir-style-guide.md)** - 다크 테마 스타일 가이드
4. **[docs/ir-style-guide-light.md](docs/ir-style-guide-light.md)** - 라이트 테마 스타일 가이드
5. **[docs/ir-i18n-guide.md](docs/ir-i18n-guide.md)** - 다국어(KO/EN/JA) 대응 가이드

---

## 핵심 원칙

### 1. CSS 오버라이드 금지
print-preview.css에서 원본 레이아웃을 변경하는 CSS를 추가하지 않는다.
wrapper만 씌우고, 원본 스타일은 그대로 유지한다.

### 2. 버전별 차이 인지
- **2601**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `lang-visible` 언어 시스템
- **2602**: 라이트 테마, `.cover` 클래스, ir-common.js 사용, `body.ko/en` 언어 시스템
- **260202**: 라이트 테마, `.cover` 클래스, 인라인 스크립트, `body.ko/en` 언어 시스템
- **260203**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `body.ko/en/ja` 언어 시스템, **3개 국어(KO/EN/JA)** 지원, 뷰포트 `width=1280` 고정

### 3. 언어 시스템 (버전별 다름!)
- **2601**: `lang-visible` 클래스 시스템 (JS가 클래스 추가)
- **260202/2602/260203**: `body.ko`/`body.en`/`body.ja` 클래스 시스템 (CSS 규칙 적용)
- inline style로 display를 설정하지 않는다.

### 4. 전역 함수 노출
IR 페이지에서 `window.setLang`, `window.goToSlide` 함수를 전역으로 노출해야 한다.

### 5. 아이콘은 Lucide SVG만 사용
- 이모지(📊🔽🚀 등)를 아이콘으로 사용하지 않는다.
- 모든 아이콘은 **Lucide** 인라인 SVG를 사용한다.
- 형식: `<svg width="N" height="N" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">...</svg>`
- 참고: https://lucide.dev/icons

### 6. 다국어 콘텐츠 필수 (260203)
- **모든 텍스트 요소**에 `data-lang="ko"`, `data-lang="en"`, `data-lang="ja"` 3벌 작성
- SVG 내 `<text>` 요소도 반드시 3개 국어 제공
- 일본어 텍스트가 긴 경우 SVG pill/rect 너비 확장 또는 폰트 크기 축소
- 자세한 내용: [docs/ir-i18n-guide.md](docs/ir-i18n-guide.md)

---

## 자주 발생하는 실수

| 실수 | 해결 |
|-----|-----|
| **visibility: visible 누락** | **프린트 미리보기 빈화면** - `.slide-clone.slide`에 `visibility: visible !important` 필수 |
| **260202/2602/260203 언어 규칙 충돌** | print-preview의 언어 숨김에서 `:not(.ir-260202):not(.ir-2602):not(.ir-260203)` 제외 |
| display: block으로 오버라이드 | flex 요소 깨짐 - display: none만 사용 |
| Cover만 처리하고 Hero 누락 | .cover와 .hero 둘 다 처리 |
| justify-content: center를 slide-inner에 적용 | 타이틀도 움직임 - content-wrapper에만 적용 |
| width: 100%를 모든 자식에 적용 | Cover/Hero 가로 레이아웃 깨짐 - 제외 처리 |
| setLang 함수 미노출 | viewer에서 언어 전환 안됨 |
| border-top / border-left 강조 보더 사용 | 카드/박스에 상단·좌측 컬러 보더(accent border) 사용 금지 - 전체 border만 사용 |
| **일본어 번역 누락** | SVG `<text>`, 차트 라벨, 연도 축 등에서 `data-lang="ja"` 빠짐 — 반드시 3개 국어 확인 |
| **일본어 텍스트 overflow** | SVG pill/rect 너비 부족으로 텍스트 넘침 — 너비 확장 또는 폰트 축소, `white-space:nowrap` 활용 |

---

## 작업 시작 전 확인사항

- [ ] docs/project-overview.md 읽음
- [ ] docs/ir-print-compatibility.md 읽음
- [ ] 2601과 2602와 260202와 260203의 차이점 인지
- [ ] print-preview.css의 CSS 오버라이드 최소화 원칙 이해
- [ ] 다국어(KO/EN/JA) 3벌 작성 원칙 이해

---

## 새 IR 버전 생성 시 필수 확인 (print-preview 호환성)

**반드시 docs/ir-print-compatibility.md 참조!**

1. **print-preview.css에 visibility: visible 있는지 확인**
   ```css
   .slide-clone.slide {
     opacity: 1 !important;
     visibility: visible !important;  /* 필수! */
   }
   ```

2. **언어 시스템 확인** - 새 IR이 어떤 방식 사용하는지:
   - `lang-visible` 클래스 시스템 (2601 방식)
   - `body.ko/en/ja` 클래스 시스템 (260202/2602/260203 방식)

3. **언어 규칙 충돌 방지** - 다른 시스템이면 제외 처리:
   ```css
   .slide-clone:not(.ir-NEW):not(.ir-2602):not(.ir-260203) [data-lang]:not(.lang-visible) { ... }
   ```

4. **테마 클래스 추가** - print-preview.js에서:
   ```javascript
   const isLightTheme = irVersion === '2602' || irVersion === '260202' || versionConfig?.theme === 'light';
   ```

---

## 앱 구조 (app/)

### conf.json
```json
{
  "defaultIR": "260203",
  "versions": [{ "id": "260203", "theme": "dark", "default": true }, ...]
}
```

### 라우팅
- `app/` → `index.html`이 `conf.json`의 `defaultIR`로 자동 리다이렉트
- `app/viewer.html?ir=260203` → IR 뷰어 (iframe 기반)
- `app/viewer.html?ir=260203&lang=ja&page=3` → 특정 페이지/언어로 직접 이동
- URL 파라미터: `ir`, `lang`, `page` (query string 또는 hash 모두 지원)

### viewer.html 주요 기능
- iframe 기반 IR 로드 (ir-frame)
- 사이드바 TOC (슬라이드 제목 자동 수집)
- KO/EN/JA 언어 전환
- 키보드/휠/터치 네비게이션 (모바일: 좌/우 탭 + 좌/우 스와이프)
- 페이지 인디케이터 (프로그레스바 + 번호)

### viewer.html 스케일링 (`fitFrame()`)
- **BASE_W=1280, BASE_H=960** (IR 콘텐츠 기준 해상도)
- **PC**: CSS `zoom` 기반 스케일링, 콘텐츠 높이 최대 85%, iframe이 뷰포트 전체 커버
- **모바일 세로**: 뷰포트 `width=1280` 고정, iframe 풀 뷰포트 + CSS 주입으로 슬라이드 패딩 조정 (콘텐츠 960px, 배경 풀 커버)
- **모바일 가로**: zoom 스케일링 (높이 기준)
- **핵심**: `transform:scale()` 대신 CSS `zoom` 사용 (비디오 flickering 방지)
- **모바일 CSS 주입**: `body.mobile-portrait` 클래스 토글 + `padding-top/bottom: calc(50vh - 440px)` 주입하여 콘텐츠 영역 제한

### viewer.html 수정 시 주의사항
- `fitFrame()` 수정 시 PC/모바일 세로/모바일 가로 3가지 경우 모두 테스트
- 모바일에서 `100vh`는 iframe 뷰포트 높이 (세로 ~2770px) — 슬라이드가 늘어나지 않도록 주의
- 터치 오버레이(#touchOverlay)는 iframe 위에 위치하여 터치 이벤트 캡처
- 비디오 요소에 `transform:translateZ(0);backface-visibility:hidden` (GPU 레이어 프로모션)

---

## 개발 서버

```bash
npx http-server -p 8080 -c-1 --cors
```

- Viewer: http://127.0.0.1:8080/app/viewer.html?ir=260203
- 일본어: http://127.0.0.1:8080/app/viewer.html?ir=260203&lang=ja
- Print Preview: http://127.0.0.1:8080/app/print-preview?ir=260203
- 자동 리다이렉트: http://127.0.0.1:8080/app/
