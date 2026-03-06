# WEVEN IR 프로젝트 - AI 작업 지침

## 필독 문서 (작업 전 반드시 읽을 것)

1. **[docs/project-overview.md](docs/project-overview.md)** - 프로젝트 전체 구조
2. **[docs/ir-print-compatibility.md](docs/ir-print-compatibility.md)** - 프린트 미리보기 호환성 규칙 (**새 IR 생성 시 필수!**)
3. **[docs/ir-style-guide.md](docs/ir-style-guide.md)** - 다크 테마 스타일 가이드
4. **[docs/ir-style-guide-light.md](docs/ir-style-guide-light.md)** - 라이트 테마 스타일 가이드
5. **[docs/ir-i18n-guide.md](docs/ir-i18n-guide.md)** - 다국어(KO/EN/JA) 대응 가이드

---

## 핵심 원칙

### ⚠️ 0. 폰트 최소 크기 18px — 절대 규칙 (가장 중요!)

> **모든 텍스트의 CSS font-size는 반드시 18px 이상이어야 한다.**

- 뷰포트가 `width=1280`으로 고정이므로, `1vw = 12.8px`이다.
- 따라서 **1.40625vw 미만의 모든 font-size에는 반드시 `max(18px, Xvw)` 적용** 필수.
- `font-size:1.09375vw` ❌ → `font-size:max(18px,1.09375vw)` ✅
- `font-size:0.9375vw` ❌ → `font-size:max(18px,0.9375vw)` ✅
- 1.40625vw(=18px) 이상은 이미 18px 이상이므로 `max()` 불필요.
- **CSS 클래스뿐만 아니라 인라인 `style="font-size:..."` 도 반드시 확인!** 인라인 스타일 누락이 가장 흔한 실수.
- **유일한 예외**: 데이터 테이블 보조 텍스트(MUV 차트 아래 표 등)로, 공간 부족 시 의도적으로 작게 유지 가능. 단, 명시적 허락 필요.
- **콘텐츠 오버플로 주의**: 18px 최소값 적용 시 콘텐츠가 슬라이드 높이(85%)를 넘을 수 있음.
  → 패딩/마진 축소, 줄바꿈 방지(`white-space:nowrap`), 간격 압축으로 대응.
  → `max()` 값을 24px 이상으로 올리면 거의 확실히 오버플로 발생하므로 **18px이 상한선**.

**새 슬라이드 생성 시 체크리스트:**
1. CSS `<style>` 블록의 모든 font-size 선언 확인
2. HTML 인라인 `style="font-size:..."` 전수 검사
3. SVG 내부 `font-size` 속성은 SVG 좌표계이므로 제외
4. 완성 후 `grep "font-size:[0-1]\.[0-3]"` 로 18px 미만 누락 검증

### 1. IR 페이지에 viewer 중복 UI 금지

> **IR 페이지(ir/XXXXXX/index.html)에는 viewer가 제공하는 UI를 넣지 않는다.**

viewer(`app/viewer.html`)가 이미 제공하는 요소들:
- 사이드바 / TOC (목차)
- 페이지 인디케이터 (번호, 프로그레스바)
- 언어 전환 토글 (KO/EN/JA)
- 메뉴 헤더 (타이틀바)
- Powered by 배지

IR 페이지는 **슬라이드 콘텐츠 + 네비게이션 JS + viewer 연동 훅**만 포함:
- `window.setLang` — viewer가 호출
- `window.goToSlide` — viewer가 호출
- `window.irSlideInfo` — viewer가 읽음
- 키보드/휠/터치 핸들러 — iframe 포커스 시 동작
- `body.no-motion` 토글 지원 — CSS만 (UI 버튼 불필요)

### 2. CSS 오버라이드 금지
print-preview.css에서 원본 레이아웃을 변경하는 CSS를 추가하지 않는다.
wrapper만 씌우고, 원본 스타일은 그대로 유지한다.

### 3. 버전별 차이 인지
- **2601**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `lang-visible` 언어 시스템
- **2602**: 라이트 테마, `.cover` 클래스, ir-common.js 사용, `body.ko/en` 언어 시스템
- **260202**: 라이트 테마, `.cover` 클래스, 인라인 스크립트, `body.ko/en` 언어 시스템
- **260203**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `body.ko/en/ja` 언어 시스템, **3개 국어(KO/EN/JA)** 지원, 뷰포트 `width=1280` 고정

### 4. 언어 시스템 (버전별 다름!)
- **2601**: `lang-visible` 클래스 시스템 (JS가 클래스 추가)
- **260202/2602/260203**: `body.ko`/`body.en`/`body.ja` 클래스 시스템 (CSS 규칙 적용)
- inline style로 display를 설정하지 않는다.

### 5. 전역 함수 노출
IR 페이지에서 `window.setLang`, `window.goToSlide` 함수를 전역으로 노출해야 한다.

### 6. 아이콘은 Lucide SVG만 사용
- 이모지(📊🔽🚀 등)를 아이콘으로 사용하지 않는다.
- 모든 아이콘은 **Lucide** 인라인 SVG를 사용한다.
- 형식: `<svg width="N" height="N" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">...</svg>`
- 참고: https://lucide.dev/icons

### 7. 다국어 콘텐츠 필수 (260203)
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
| **⚠️ font-size 18px 미만** | **가장 흔한 실수!** CSS 클래스와 인라인 style 모두에서 `max(18px, Xvw)` 적용 필수. 특히 **인라인 style이 자주 누락됨** |
| **⚠️ IR 페이지에 viewer UI 중복** | sidebar, 페이지번호, 언어토글, 메뉴헤더, powered badge 등 viewer가 제공하는 UI를 IR 페이지에 넣지 않는다 |
| **max(24px,...) 사용으로 오버플로** | 18px이 상한선! 24px 이상 min 사용 시 콘텐츠가 슬라이드 밖으로 넘침 — 패딩/마진 축소로 대응 |

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
- Print Preview: http://127.0.0.1:8080/app/print-preview.html?ir=260203
- 자동 리다이렉트: http://127.0.0.1:8080/app/
