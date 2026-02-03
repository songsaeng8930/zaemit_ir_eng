# WEVEN IR 프로젝트 - AI 작업 지침

## 필독 문서 (작업 전 반드시 읽을 것)

1. **[docs/project-overview.md](docs/project-overview.md)** - 프로젝트 전체 구조
2. **🚨 [docs/ir-print-compatibility.md](docs/ir-print-compatibility.md)** - 프린트 미리보기 호환성 규칙 (**새 IR 생성 시 필수!**)
3. **[docs/ir-style-guide.md](docs/ir-style-guide.md)** - 다크 테마 스타일 가이드
4. **[docs/ir-style-guide-light.md](docs/ir-style-guide-light.md)** - 라이트 테마 스타일 가이드

---

## 핵심 원칙

### 1. CSS 오버라이드 금지
print-preview.css에서 원본 레이아웃을 변경하는 CSS를 추가하지 않는다.
wrapper만 씌우고, 원본 스타일은 그대로 유지한다.

### 2. 버전별 차이 인지
- **2601**: 다크 테마, `.hero` 클래스, 인라인 스크립트, `lang-visible` 언어 시스템
- **2602**: 라이트 테마, `.cover` 클래스, ir-common.js 사용, `body.ko/en` 언어 시스템
- **260202**: 라이트 테마, `.cover` 클래스, 인라인 스크립트, `body.ko/en` 언어 시스템

### 3. 언어 시스템 (버전별 다름!)
- **2601**: `lang-visible` 클래스 시스템 (JS가 클래스 추가)
- **260202/2602**: `body.ko`/`body.en` 클래스 시스템 (CSS 규칙 적용)
- inline style로 display를 설정하지 않는다.

### 4. 전역 함수 노출
IR 페이지에서 `window.setLang`, `window.goToSlide` 함수를 전역으로 노출해야 한다.

---

## 자주 발생하는 실수

| 실수 | 해결 |
|-----|-----|
| 🚨 **visibility: visible 누락** | **프린트 미리보기 빈화면** - `.slide-clone.slide`에 `visibility: visible !important` 필수 |
| 🚨 **260202/2602 언어 규칙 충돌** | print-preview의 언어 숨김에서 `:not(.ir-260202):not(.ir-2602)` 제외 |
| display: block으로 오버라이드 | flex 요소 깨짐 - display: none만 사용 |
| Cover만 처리하고 Hero 누락 | .cover와 .hero 둘 다 처리 |
| justify-content: center를 slide-inner에 적용 | 타이틀도 움직임 - content-wrapper에만 적용 |
| width: 100%를 모든 자식에 적용 | Cover/Hero 가로 레이아웃 깨짐 - 제외 처리 |
| setLang 함수 미노출 | viewer에서 언어 전환 안됨 |

---

## 작업 시작 전 확인사항

- [ ] docs/project-overview.md 읽음
- [ ] docs/ir-print-compatibility.md 읽음
- [ ] 2601과 2602와 260202의 차이점 인지
- [ ] print-preview.css의 CSS 오버라이드 최소화 원칙 이해

---

## 🚨 새 IR 버전 생성 시 필수 확인 (print-preview 호환성)

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
   - `body.ko/en` 클래스 시스템 (260202/2602 방식)

3. **언어 규칙 충돌 방지** - 다른 시스템이면 제외 처리:
   ```css
   .slide-clone:not(.ir-NEW):not(.ir-2602) [data-lang]:not(.lang-visible) { ... }
   ```

4. **테마 클래스 추가** - print-preview.js에서:
   ```javascript
   const isLightTheme = irVersion === '2602' || irVersion === '260202' || irVersion === 'NEW';
   ```

---

## 개발 서버

```bash
npx http-server -p 8080 -c-1 --cors
```

- Viewer: http://127.0.0.1:8080/app/viewer.html?ir=2601
- Print Preview: http://127.0.0.1:8080/app/print-preview?ir=2601
