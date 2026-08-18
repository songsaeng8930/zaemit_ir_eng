// ── PRINT PREVIEW JAVASCRIPT ──

// Global variables
let slides = [];
let total = 0;
let lang = 'ko';
let irVersion = '2601';  // IR 버전 (기본값)
let pageZooms = [];
let pageAlignments = [];  // [{titleH: 'left', contentV: 'top', contentH: 'center'}, ...]
let pageLayouts = [];  // 'auto' | 'row' | 'column' per slide
let pageFontDeltas = [];  // per-slide content font size delta in px (default 0)
let pageTitleZooms = [];  // per-slide title zoom % (default 100)
let pageTitleFontDeltas = [];  // per-slide title font size delta in px (default 0)
let globalZoom = 100;
let titleScale = 100;
let titleAlignH = null;  // null(원본 CSS 유지) | left, center, right (title horizontal alignment)
let contentAlignV = 'middle';  // top, middle, bottom
let contentAlignH = 'center';  // left, center, right

// ── TEXT EDIT MODE STATE ──
let editMode = false;
let saveDoc = null;       // 원본 저장용 문서 (fetchSlides에서 원본 HTML로 생성)
let sourceHtml = '';      // 미리보기가 로드한 시점의 원본 HTML 문자열
let editsDirty = false;   // 저장되지 않은 편집 존재 여부
let fileHandle = null;    // File System Access API 파일 핸들 캐시

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Get parameters from URL - check both query string and hash (hash survives redirects)
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.slice(1);
  const hashParams = new URLSearchParams(hash);

  // Hash params take precedence over query params
  lang = hashParams.get('lang') || params.get('lang') || 'ko';
  irVersion = hashParams.get('ir') || params.get('ir') || '2601';

  // Load saved zooms
  loadZooms();

  // Fetch and parse slides from main page
  fetchSlides();

  // Setup event listeners
  setupEventListeners();

  // Update UI language
  updateLanguage();
});

// Load zoom settings from localStorage
function loadZooms() {
  try {
    const saved = localStorage.getItem('printPreviewZooms');
    if (saved) {
      pageZooms = JSON.parse(saved);
    }
    const savedAlignments = localStorage.getItem('printPreviewAlignments');
    if (savedAlignments) {
      pageAlignments = JSON.parse(savedAlignments);
    }
    const savedTitleScale = localStorage.getItem('printPreviewTitleScale');
    if (savedTitleScale) {
      titleScale = parseInt(savedTitleScale);
    }
    // 타이틀 정렬은 IR 버전별로 원본 디자인이 다르므로 (예: 260814_introduce는 가운데 정렬)
    // 버전별 키로 저장/로드. 값이 없으면 null = 원본 CSS 정렬 유지.
    // (구 전역 키 'printPreviewTitleAlignH'는 자동 저장된 'left'가 남아있어 읽지 않음)
    const savedTitleAlignH = localStorage.getItem('printPreviewTitleAlignH:' + irVersion);
    if (savedTitleAlignH === 'left' || savedTitleAlignH === 'center' || savedTitleAlignH === 'right') {
      titleAlignH = savedTitleAlignH;
    }
    const savedAlignV = localStorage.getItem('printPreviewAlignV');
    if (savedAlignV) {
      contentAlignV = savedAlignV;
    }
    const savedAlignH = localStorage.getItem('printPreviewAlignH');
    if (savedAlignH) {
      contentAlignH = savedAlignH;
    }
    const savedFontDeltas = localStorage.getItem('printPreviewFontDeltas');
    if (savedFontDeltas) {
      pageFontDeltas = JSON.parse(savedFontDeltas);
    }
    const savedTitleZooms = localStorage.getItem('printPreviewTitleZooms');
    if (savedTitleZooms) {
      pageTitleZooms = JSON.parse(savedTitleZooms);
    }
    const savedTitleFontDeltas = localStorage.getItem('printPreviewTitleFontDeltas');
    if (savedTitleFontDeltas) {
      pageTitleFontDeltas = JSON.parse(savedTitleFontDeltas);
    }
  } catch (e) {
    console.warn('Failed to load zoom settings:', e);
  }
}

// Save zoom settings to localStorage
function saveZooms() {
  try {
    localStorage.setItem('printPreviewZooms', JSON.stringify(pageZooms));
    localStorage.setItem('printPreviewAlignments', JSON.stringify(pageAlignments));
    localStorage.setItem('printPreviewTitleScale', titleScale.toString());
    if (titleAlignH) {
      localStorage.setItem('printPreviewTitleAlignH:' + irVersion, titleAlignH);
    } else {
      localStorage.removeItem('printPreviewTitleAlignH:' + irVersion);
    }
    localStorage.setItem('printPreviewAlignV', contentAlignV);
    localStorage.setItem('printPreviewAlignH', contentAlignH);
    localStorage.setItem('printPreviewFontDeltas', JSON.stringify(pageFontDeltas));
    localStorage.setItem('printPreviewTitleZooms', JSON.stringify(pageTitleZooms));
    localStorage.setItem('printPreviewTitleFontDeltas', JSON.stringify(pageTitleFontDeltas));
  } catch (e) {
    console.warn('Failed to save zoom settings:', e);
  }
}

// Fetch slides from IR index.html
async function fetchSlides() {
  showLoading(lang === 'ko' ? '슬라이드 로딩 중...' : 'Loading slides...');

  try {
    // IR 버전에 따른 경로 설정
    const irPath = `../ir/${irVersion}/index.html`;
    const response = await fetch(irPath);
    const html = await response.text();
    sourceHtml = html;

    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Pristine second parse kept untouched for saving edits back to the file.
    // The display doc below gets vw→px conversion, image path rewrites etc.
    // that must never leak into the saved file.
    saveDoc = parser.parseFromString(html, 'text/html');

    // Extract and apply styles from index.html
    const styleEl = doc.querySelector('style');
    if (styleEl) {
      const newStyle = document.createElement('style');
      newStyle.id = 'indexStyles';
      // Convert vw to px for correct rendering in print-preview.
      // IR pages use <meta viewport width=1280>, so 1vw = 12.8px.
      // In print-preview, vw is relative to the browser viewport (often 1920px+),
      // making text and layout disproportionately large.
      // Also strip max(18px,...) wrappers so text scales proportionally.
      newStyle.textContent = convertVwCss(styleEl.textContent);
      // 260304: Replace green accent (#00D4AA) with blue (#3B82F6) for print
      if (irVersion === '260304') {
        newStyle.textContent = newStyle.textContent
          .replace(/#00D4AA/gi, '#3B82F6')
          .replace(/rgba\(0,212,170/g, 'rgba(59,130,246')
          .replace(/rgba\(0, 212, 170/g, 'rgba(59,130,246');
      }
      document.head.appendChild(newStyle);
    }

    // IR 문서의 웹폰트 <link>도 함께 로드 (Fugaz One·Russo One·Pretendard Variable 등).
    // 이게 없으면 IR 원본 폰트가 프린트 미리보기에서 폴백 폰트로 렌더된다.
    doc.querySelectorAll('head link[rel="stylesheet"]').forEach(linkEl => {
      const href = linkEl.getAttribute('href');
      if (!href || !/^https?:\/\//.test(href)) return; // 외부 폰트 CSS만 (로컬 상대경로 제외)
      if (document.head.querySelector(`link[href="${href}"]`)) return; // 중복 방지
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.dataset.irFont = irVersion;
      document.head.appendChild(l);
    });

    // Apply language class to body (required for 260202 CSS rules)
    document.body.classList.remove('ko', 'en', 'ja');
    document.body.classList.add(lang);

    // Apply theme class based on IR version (zaemit 컨셉은 라이트 계열로 처리)
    const isLightTheme = irVersion === '2602' || irVersion === '260202' || irVersion === '260814_introduce';
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    }

    // Get all slides
    const slideElements = doc.querySelectorAll('.slide');
    slides = Array.from(slideElements);
    total = slides.length;

    // Tag every element with a matching id in both docs (must run before any
    // structural change to the display doc so traversal order lines up)
    tagSlidesForEditing(doc, saveDoc);

    // IR 기준 경로로 이미지 경로 수정
    const irBasePath = `../ir/${irVersion}/`;
    slides.forEach(slide => {
      slide.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        // 상대 경로인 경우에만 수정 (http://, https://, data: 제외)
        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
          img.setAttribute('src', irBasePath + src);
        }
      });
    });

    // Initialize pageZooms if empty
    if (pageZooms.length !== total) {
      pageZooms = Array(total).fill(100);
    }

    // Initialize pageAlignments if empty
    if (pageAlignments.length !== total) {
      pageAlignments = Array(total).fill(null).map(() => ({ titleH: null, contentV: null, contentH: null }));
    }

    // Initialize pageFontDeltas if empty
    if (pageFontDeltas.length !== total) {
      pageFontDeltas = Array(total).fill(0);
    }

    // Initialize pageTitleZooms if empty
    if (pageTitleZooms.length !== total) {
      pageTitleZooms = Array(total).fill(100);
    }

    // Initialize pageTitleFontDeltas if empty
    if (pageTitleFontDeltas.length !== total) {
      pageTitleFontDeltas = Array(total).fill(0);
    }

    // Render slides
    renderSlides();

    // Apply saved per-slide settings
    requestAnimationFrame(() => {
      applyAllTitleZooms();
      applyAllTitleFontDeltas();
      applyAllFontDeltas();
    });

    hideLoading();
  } catch (e) {
    console.error('Failed to fetch slides:', e);
    showError(lang === 'ko' ? '슬라이드를 불러오는데 실패했습니다.' : 'Failed to load slides.');
  }
}

// Render all slides
function renderSlides() {
  const content = document.getElementById('previewContent');
  content.innerHTML = '';

  slides.forEach((slide, idx) => {
    const wrapper = createSlideWrapper(slide, idx);
    content.appendChild(wrapper);
  });

  // Apply initial zoom after render
  setTimeout(() => {
    slides.forEach((slide, idx) => {
      updateSlideScale(idx);
      applyContentZoom(idx, pageZooms[idx]);
    });
    // Apply saved per-slide title zooms (replaces global applyTitleScale)
    for (let i = 0; i < total; i++) {
      applyPageTitleZoom(i, pageTitleZooms[i]);
    }
    // Apply saved alignments
    applyTitleAlignment();
    applyContentAlignment();
    // Update global toolbar button states
    updateGlobalTitleAlignButtons();
    // Fix gradient text for PDF compatibility
    fixGradientTextForPDF();
  }, 100);
}

// Fix gradient text for PDF - auto-detect and fix background-clip: text
function fixGradientTextForPDF() {
  document.querySelectorAll('.slide-clone').forEach(clone => {
    clone.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const bgClip = style.getPropertyValue('-webkit-background-clip') ||
                     style.getPropertyValue('background-clip');

      if (bgClip === 'text') {
        // Determine fallback color based on theme
        // ir-2601 (dark theme) = #00D4AA (accent green)
        // ir-2602, ir-260202 (light theme) = #6366F1 (indigo)
        const isLightTheme = clone.classList.contains('ir-2602') ||
                            clone.classList.contains('ir-260202');
        const is260304 = clone.classList.contains('ir-260304');
        const isZaemit = clone.classList.contains('ir-260814_introduce');
        const fallbackColor = isZaemit ? '#3B82F6' : isLightTheme ? '#6366F1' : is260304 ? '#3B82F6' : '#00D4AA';

        // Remove gradient background and apply solid color
        el.style.setProperty('background', 'none', 'important');
        el.style.setProperty('-webkit-background-clip', 'unset', 'important');
        el.style.setProperty('background-clip', 'unset', 'important');
        el.style.setProperty('-webkit-text-fill-color', fallbackColor, 'important');
        el.style.setProperty('color', fallbackColor, 'important');
      }
    });
  });
}

// Create slide wrapper element
function createSlideWrapper(slide, idx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'preview-slide-wrapper';
  wrapper.id = 'slideWrapper' + idx;

  // Get title
  const titleKey = 'title' + lang.charAt(0).toUpperCase() + lang.slice(1);
  const slideTitle = slide.dataset[titleKey] || '';

  // Detect original layout from slide-inner
  const origInner = slide.querySelector('.slide-inner');
  const origIsRow = origInner && origInner.style.flexDirection === 'row';
  if (!pageLayouts[idx]) pageLayouts[idx] = origIsRow ? 'row' : 'column';

  // Header
  const header = document.createElement('div');
  header.className = 'preview-slide-header';

  const layoutLabel = lang === 'ko' ? '레이아웃:' : 'Layout:';
  const rowLabel = lang === 'ko' ? '가로' : 'Row';
  const colLabel = lang === 'ko' ? '세로' : 'Col';

  const fmtDelta = (v) => (v > 0 ? '+' : '') + v + 'px';

  header.innerHTML = `
    <div class="slide-info">
      <span class="slide-num">${String(idx + 1).padStart(2, '0')}</span>
      <span class="slide-title">${slideTitle}</span>
      <div class="page-manage-control">
        <button class="page-manage-btn" onclick="movePage(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="${lang === 'ko' ? '페이지 위로 이동' : 'Move page up'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button class="page-manage-btn" onclick="movePage(${idx}, 1)" ${idx === slides.length - 1 ? 'disabled' : ''} title="${lang === 'ko' ? '페이지 아래로 이동' : 'Move page down'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button class="page-manage-btn" onclick="addPageAfter(${idx})" title="${lang === 'ko' ? '이 페이지를 복제해 아래에 추가' : 'Duplicate page below'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>
        <button class="page-manage-btn page-manage-danger" onclick="deletePage(${idx})" title="${lang === 'ko' ? '페이지 삭제' : 'Delete page'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </div>
    </div>
    <div class="slide-controls">
      <div class="slide-controls-row">
        <span class="control-group-label">T</span>
        <div class="zoom-control">
          <label>${lang === 'ko' ? '줌:' : 'Zm:'}</label>
          <input type="range" min="50" max="150" value="${pageTitleZooms[idx]}"
                 id="titleZoomSlider${idx}" oninput="setPageTitleZoom(${idx}, this.value)">
          <span class="zoom-val" id="titleZoomVal${idx}">${pageTitleZooms[idx]}%</span>
        </div>
        <div class="page-font-control">
          <label>${lang === 'ko' ? '글꼴:' : 'Ft:'}</label>
          <button class="page-font-btn" onclick="setPageTitleFontDelta(${idx}, -1)" title="-1px">A−</button>
          <span class="page-font-val" id="titleFontVal${idx}">${fmtDelta(pageTitleFontDeltas[idx] || 0)}</span>
          <button class="page-font-btn" onclick="setPageTitleFontDelta(${idx}, 1)" title="+1px">A+</button>
          <button class="page-font-btn page-font-reset" onclick="resetPageTitleFontDelta(${idx})" title="Reset">↺</button>
        </div>
      </div>
      <div class="slide-controls-row">
        <span class="control-group-label">C</span>
        <div class="zoom-control">
          <label>${lang === 'ko' ? '줌:' : 'Zm:'}</label>
          <input type="range" min="50" max="150" value="${pageZooms[idx]}"
                 data-idx="${idx}" oninput="setPageZoom(${idx}, this.value)">
          <span class="zoom-val" id="zoomVal${idx}">${pageZooms[idx]}%</span>
        </div>
        <div class="page-font-control">
          <label>${lang === 'ko' ? '글꼴:' : 'Ft:'}</label>
          <button class="page-font-btn" onclick="setPageFontDelta(${idx}, -1)" title="-1px">A−</button>
          <span class="page-font-val" id="fontVal${idx}">${fmtDelta(pageFontDeltas[idx] || 0)}</span>
          <button class="page-font-btn" onclick="setPageFontDelta(${idx}, 1)" title="+1px">A+</button>
          <button class="page-font-btn page-font-reset" onclick="resetPageFontDelta(${idx})" title="Reset">↺</button>
        </div>
      </div>
      <div class="slide-controls-row">
        <div class="page-content-h-align-control">
          <label>H:</label>
          <div class="page-content-h-align-buttons" id="pageContentHAlignBtns${idx}">
            <button class="page-content-h-btn" data-h="left" onclick="setPageContentHAlign(${idx}, 'left')" title="Left">◀</button>
            <button class="page-content-h-btn" data-h="center" onclick="setPageContentHAlign(${idx}, 'center')" title="Center">●</button>
            <button class="page-content-h-btn" data-h="right" onclick="setPageContentHAlign(${idx}, 'right')" title="Right">▶</button>
          </div>
        </div>
        <div class="page-content-v-align-control">
          <label>V:</label>
          <div class="page-content-v-align-buttons" id="pageContentVAlignBtns${idx}">
            <button class="page-content-v-btn" data-v="top" onclick="setPageContentVAlign(${idx}, 'top')" title="Top">↑</button>
            <button class="page-content-v-btn" data-v="middle" onclick="setPageContentVAlign(${idx}, 'middle')" title="Middle">●</button>
            <button class="page-content-v-btn" data-v="bottom" onclick="setPageContentVAlign(${idx}, 'bottom')" title="Bottom">↓</button>
          </div>
        </div>
        <div class="page-layout-control">
          <label>${layoutLabel}</label>
          <div class="page-layout-buttons" id="pageLayoutBtns${idx}">
            <button class="page-layout-btn${pageLayouts[idx] === 'row' ? ' active' : ''}" data-layout="row" onclick="setPageLayout(${idx}, 'row')" title="${rowLabel}">☰</button>
            <button class="page-layout-btn${pageLayouts[idx] === 'column' ? ' active' : ''}" data-layout="column" onclick="setPageLayout(${idx}, 'column')" title="${colLabel}">☷</button>
          </div>
        </div>
        <button class="page-auto-fit-btn" onclick="autoFitPage(${idx})" title="${lang === 'ko' ? '자동 맞춤' : 'Auto Fit'}">
          ${lang === 'ko' ? '자동맞춤' : 'Auto Fit'}
        </button>
      </div>
    </div>
  `;
  wrapper.appendChild(header);

  // Frame
  const frame = document.createElement('div');
  frame.className = 'preview-slide-frame';
  frame.id = 'previewFrame' + idx;

  // Clone slide
  const clone = slide.cloneNode(true);

  // Preserve important inline style properties before removing style
  const origInlineStyle = slide.getAttribute('style') || '';
  const paddingMatch = origInlineStyle.match(/padding\s*:\s*([^;]+)/);
  const overflowMatch = origInlineStyle.match(/overflow\s*:\s*([^;]+)/);

  clone.removeAttribute('style');
  clone.classList.remove('active');

  // Ensure slide-clone class is added
  clone.classList.add('slide-clone');

  // Add IR version class for theme detection
  clone.classList.add('ir-' + irVersion);

  // 테마 배경색 직접 적용 (CSS 규칙보다 확실하게)
  const isZaemitTheme = irVersion === '260814_introduce';
  const isLightTheme = irVersion === '2602' || irVersion === '260202';
  const isCover = clone.classList.contains('cover');

  if (isZaemitTheme) {
    // Zaemit 컨셉 (260814_introduce) — 화이트 베이스 #FDFDFF + 잉크 #111
    clone.style.background = '#FDFDFF';
    clone.style.color = '#111111';
  } else if (isLightTheme) {
    // 라이트 테마 (2602, 260202)
    if (isCover) {
      clone.style.background = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)';
      clone.style.color = '#FFFFFF';
    } else {
      clone.style.background = '#FFFFFF';
      clone.style.color = '#0F172A';
    }
  } else {
    // 다크 테마 (2601 등)
    clone.style.background = '#0A0E27';
    clone.style.color = '#FFFFFF';
  }

  console.log('Slide', idx, 'irVersion:', irVersion, 'isLightTheme:', isLightTheme, 'isCover:', isCover);

  // Re-apply preserved inline padding (converted from vw to px)
  if (paddingMatch) {
    const convertedPadding = paddingMatch[1].trim()
      .replace(/max\(\s*18px\s*,\s*([\d.]+)vw\s*\)/g, (_, n) => (parseFloat(n) * VW_TO_PX) + 'px')
      .replace(/([\d.]+)vw/g, (_, n) => (parseFloat(n) * VW_TO_PX) + 'px');
    clone.style.padding = convertedPadding;
  }
  if (overflowMatch) {
    clone.style.overflow = overflowMatch[1].trim();
  }

  // Convert vw to px in inline styles and SVG attributes
  convertVwInDom(clone);

  // 260304: Replace green accent (#00D4AA) with blue (#3B82F6) in inline styles & SVG
  if (irVersion === '260304') {
    replaceGreenAccent(clone);
  }

  // Replace <video> elements with MOVIE placeholder
  replaceVideosWithPlaceholder(clone);

  // Apply language visibility
  applyLanguageVisibility(clone);

  frame.appendChild(clone);
  wrapper.appendChild(frame);

  return wrapper;
}

// 260304: Replace green accent (#00D4AA) with blue (#3B82F6) in cloned DOM
function replaceGreenAccent(node) {
  const walk = (el) => {
    // Replace in inline style attribute
    const style = el.getAttribute('style');
    if (style && (style.includes('#00D4AA') || style.includes('0,212,170') || style.includes('0, 212, 170'))) {
      el.setAttribute('style', style
        .replace(/#00D4AA/gi, '#3B82F6')
        .replace(/rgba\(0,\s*212,\s*170/g, 'rgba(59,130,246'));
    }
    // Replace in SVG fill/stroke/stop-color attributes
    ['fill', 'stroke', 'stop-color'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && val.includes('#00D4AA')) {
        el.setAttribute(attr, val.replace(/#00D4AA/gi, '#3B82F6'));
      }
    });
    // Recurse
    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i]);
    }
  };
  walk(node);
}

// Replace <video> elements with fallback image or MOVIE placeholder
function replaceVideosWithPlaceholder(element) {
  element.querySelectorAll('video').forEach(video => {
    // Check for sibling .video-fallback image
    const fallback = video.parentNode.querySelector('.video-fallback');
    if (fallback) {
      // Show fallback image, remove video
      fallback.style.display = 'block';
      video.remove();
      return;
    }

    const placeholder = document.createElement('div');
    placeholder.className = 'video-placeholder';

    // Copy dimensions from video's inline style if available
    const videoStyle = video.getAttribute('style') || '';
    if (videoStyle.includes('width')) {
      placeholder.style.width = video.style.width || '100%';
    } else {
      placeholder.style.width = '100%';
    }
    if (videoStyle.includes('max-width')) {
      placeholder.style.maxWidth = video.style.maxWidth;
    }
    if (videoStyle.includes('max-height')) {
      placeholder.style.maxHeight = video.style.maxHeight;
    }
    if (videoStyle.includes('border-radius')) {
      placeholder.style.borderRadius = video.style.borderRadius;
    }

    // Preserve aspect ratio hint
    placeholder.style.aspectRatio = '16 / 9';

    // Lucide Film icon SVG + MOVIE text
    placeholder.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="2" y1="7" x2="7" y2="7"/>
        <line x1="2" y1="17" x2="7" y2="17"/>
        <line x1="17" y1="7" x2="22" y2="7"/>
        <line x1="17" y1="17" x2="22" y2="17"/>
      </svg>
      <span>MOVIE</span>
    `;

    video.parentNode.replaceChild(placeholder, video);
  });
}

// Apply language visibility to cloned slide
function applyLanguageVisibility(element) {
  element.querySelectorAll('[data-lang]').forEach(el => {
    if (el.dataset.lang === lang) {
      el.classList.add('lang-visible');
    } else {
      el.classList.remove('lang-visible');
    }
  });
}

// Update slide scale to fit frame
function updateSlideScale(idx) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;

  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  const frameWidth = frame.offsetWidth;
  const scale = frameWidth / 1280;
  clone.style.transform = `scale(${scale})`;
}

// Apply content zoom (excludes title area)
// 단순화: title 제외한 모든 요소를 .content-wrapper로 감싸서 줌 적용
// Cover 페이지는 전체를 콘텐츠로 취급
function applyContentZoom(idx, zoomPercent) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;

  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  const slideInner = clone.querySelector('.slide-inner');
  if (!slideInner) return;

  const zoom = zoomPercent / 100;
  // 2601은 hero, 2602는 cover 클래스 사용
  const isCover = clone.classList.contains('cover') || clone.classList.contains('hero');

  // row 레이아웃이면 content-wrapper 생성 건너뛰고 slide-inner 전체에 zoom 적용
  const isRowLayout = pageLayouts[idx] === 'row';
  if (isRowLayout) {
    slideInner.style.setProperty('transform-origin', 'top left', 'important');
    slideInner.style.setProperty('transform', `scale(${zoom})`, 'important');
    return;
  }

  // Title 요소 목록 (Cover/Hero 페이지는 title 없음 - 전체가 콘텐츠)
  // .head: 260814_introduce(Zaemit 컨셉)의 타이틀 래퍼 — 콘텐츠 줌(C줌)에서 제외
  const titleSelectors = isCover ? [] : ['.head', '.section-label', '.section-title', '.section-desc'];

  // 이미 wrapper가 있으면 사용, 없으면 생성
  let contentWrapper = slideInner.querySelector(':scope > .content-wrapper');

  if (!contentWrapper) {
    contentWrapper = document.createElement('div');
    contentWrapper.className = 'content-wrapper';
    contentWrapper.style.cssText = 'width: 100%;';

    // Title이 아닌 모든 자식 요소를 wrapper로 이동
    const children = Array.from(slideInner.children);
    let inserted = false;

    children.forEach(child => {
      const isTitle = titleSelectors.some(sel => child.matches && child.matches(sel));
      if (!isTitle) {
        if (!inserted) {
          // 첫 번째 non-title 요소 위치에 wrapper 삽입
          slideInner.insertBefore(contentWrapper, child);
          inserted = true;
        }
        contentWrapper.appendChild(child);
      }
    });
  }

  // Wrapper에 줌 적용
  if (contentWrapper) {
    contentWrapper.style.setProperty('transform-origin', 'top center', 'important');
    contentWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
    contentWrapper.setAttribute('data-content-zoom', 'true');
  }
}

// Set page zoom
function setPageZoom(idx, value) {
  const val = parseInt(value);
  pageZooms[idx] = val;

  // Update display
  const valEl = document.getElementById('zoomVal' + idx);
  if (valEl) valEl.textContent = val + '%';

  // Apply zoom
  applyContentZoom(idx, val);

  // Save
  saveZooms();
}

// Set global zoom
function setGlobalZoom(value) {
  const val = parseInt(value);
  globalZoom = val;

  // Update display
  document.getElementById('globalZoomValue').textContent = val + '%';

  // Apply to all slides
  for (let i = 0; i < total; i++) {
    pageZooms[i] = val;

    const slider = document.querySelector(`input[data-idx="${i}"]`);
    if (slider) slider.value = val;

    const valEl = document.getElementById('zoomVal' + i);
    if (valEl) valEl.textContent = val + '%';

    applyContentZoom(i, val);
  }

  // Save
  saveZooms();
}

// Set title scale for all slides
function setTitleScale(value) {
  const val = parseInt(value);
  titleScale = val;

  // Update display
  document.getElementById('titleScaleValue').textContent = val + '%';

  // Apply to all per-slide title zooms
  for (let i = 0; i < total; i++) {
    pageTitleZooms[i] = val;
    applyPageTitleZoom(i, val);
    const titleZoomValEl = document.getElementById('titleZoomVal' + i);
    if (titleZoomValEl) titleZoomValEl.textContent = val + '%';
    const titleZoomSlider = document.getElementById('titleZoomSlider' + i);
    if (titleZoomSlider) titleZoomSlider.value = val;
  }

  // Save
  saveZooms();
}

// Apply title scale to all slides
function applyTitleScale(scalePercent) {
  const scale = scalePercent / 100;

  document.querySelectorAll('.slide-clone').forEach(clone => {
    // Title selectors - use querySelectorAll to get all language versions
    const titleSelectors = ['.section-label', '.section-title', '.section-desc'];

    titleSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => {
        el.style.setProperty('transform', `scale(${scale})`, 'important');
        el.style.setProperty('transform-origin', 'top left', 'important');
        // Adjust margin to compensate for scale
        if (scale < 1) {
          const originalHeight = el.offsetHeight;
          const scaledHeight = originalHeight * scale;
          const marginBottom = (scaledHeight - originalHeight) + 'px';
          el.style.setProperty('margin-bottom', marginBottom, 'important');
        } else {
          el.style.removeProperty('margin-bottom');
        }
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// TITLE ALIGNMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════

// Set global title alignment
function setTitleAlignment(horizontal) {
  titleAlignH = horizontal;
  updateGlobalTitleAlignButtons();
  applyTitleAlignment();
  saveZooms();
}

// Apply title alignment to all slides
function applyTitleAlignment() {
  document.querySelectorAll('.slide-clone').forEach((clone, idx) => {
    const pageAlign = pageAlignments[idx];
    const useCustom = pageAlign && pageAlign.titleH !== null;
    const alignH = useCustom ? pageAlign.titleH : titleAlignH;

    // Apply to title elements (alignH가 null이면 원본 CSS 정렬 유지)
    const titleSelectors = ['.section-label', '.section-title', '.section-desc'];
    titleSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => {
        if (alignH) {
          el.style.setProperty('text-align', alignH, 'important');
        } else {
          el.style.removeProperty('text-align');
        }
      });
    });

    // Update per-page button states
    updatePageTitleAlignButtons(idx, alignH, useCustom);
  });
}

// Set per-page title alignment
function setPageTitleAlignment(idx, horizontal) {
  if (!pageAlignments[idx]) {
    pageAlignments[idx] = { titleH: null, contentV: null, contentH: null };
  }
  pageAlignments[idx].titleH = horizontal;
  applyPageTitleAlignment(idx);
  updatePageTitleAlignButtons(idx, horizontal, true);
  saveZooms();
}

// Apply title alignment to a specific page
function applyPageTitleAlignment(idx) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;

  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  const pageAlign = pageAlignments[idx];
  const useCustom = pageAlign && pageAlign.titleH !== null;
  const alignH = useCustom ? pageAlign.titleH : titleAlignH;

  const titleSelectors = ['.section-label', '.section-title', '.section-desc'];
  titleSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => {
      if (alignH) {
        el.style.setProperty('text-align', alignH, 'important');
      } else {
        el.style.removeProperty('text-align');
      }
    });
  });
}

// Reset per-page title alignment to follow global
function resetPageTitleAlignment(idx) {
  if (pageAlignments[idx]) {
    pageAlignments[idx].titleH = null;
  }
  applyPageTitleAlignment(idx);
  updatePageTitleAlignButtons(idx, titleAlignH, false);
  saveZooms();
}

// Update global title alignment button states
function updateGlobalTitleAlignButtons() {
  document.querySelectorAll('.preview-toolbar .title-align-btn').forEach(btn => {
    const btnH = btn.dataset.h;
    btn.classList.toggle('active', btnH === titleAlignH);
  });
}

// Update per-page title alignment button states
function updatePageTitleAlignButtons(idx, alignH, isCustom) {
  const container = document.getElementById('pageTitleAlignBtns' + idx);
  if (!container) return;

  container.querySelectorAll('.page-title-align-btn').forEach(btn => {
    const btnH = btn.dataset.h;
    const isActive = btnH === alignH;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('global', !isCustom && isActive);
  });

  // Update reset button
  const resetBtn = container.nextElementSibling;
  if (resetBtn && resetBtn.classList.contains('page-align-reset')) {
    resetBtn.classList.toggle('using-global', !isCustom);
  }
}

// ═══════════════════════════════════════════════════════════
// CONTENT ALIGNMENT FUNCTIONS (Separate V and H)
// ═══════════════════════════════════════════════════════════

// Apply content alignment to all slides
function applyContentAlignment() {
  document.querySelectorAll('.slide-clone').forEach((clone, idx) => {
    const pageAlign = pageAlignments[idx];
    const useCustomV = pageAlign && pageAlign.contentV !== null;
    const useCustomH = pageAlign && pageAlign.contentH !== null;
    const alignV = useCustomV ? pageAlign.contentV : contentAlignV;
    const alignH = useCustomH ? pageAlign.contentH : contentAlignH;

    applyContentAlignmentToSlide(clone, alignV, alignH);
    updatePageContentVAlignButtons(idx, alignV, useCustomV);
    updatePageContentHAlignButtons(idx, alignH, useCustomH);
  });
}

// Apply content alignment to a single slide element
// 타이틀 고정, content-wrapper 내부에서 콘텐츠 수직 정렬만 적용
// 수평 정렬은 transform-origin만 변경 (너비 유지)
function applyContentAlignmentToSlide(clone, alignV, alignH) {
  const slideInner = clone.querySelector('.slide-inner');
  const contentWrapper = clone.querySelector('.slide-inner > .content-wrapper');

  // row 레이아웃 (content-wrapper 없이 slide-inner 직접 제어)
  // pageLayouts에서 해당 인덱스를 찾기
  const frame = clone.closest('.preview-slide-frame');
  const frameId = frame ? frame.id : '';
  const idxMatch = frameId.match(/\d+$/);
  const idx = idxMatch ? parseInt(idxMatch[0]) : -1;
  const isRowByLayout = idx >= 0 && pageLayouts[idx] === 'row';

  if (isRowByLayout && slideInner) {
    // row 레이아웃: slide-inner에 직접 정렬 적용
    const alignValue = alignV === 'middle' ? 'center' : alignV === 'bottom' ? 'flex-end' : 'flex-start';
    slideInner.style.setProperty('align-items', alignValue, 'important');

    const justifyValue = alignH === 'center' ? 'center' : alignH === 'right' ? 'flex-end' : 'flex-start';
    slideInner.style.setProperty('justify-content', justifyValue, 'important');

    const originX = alignH === 'left' ? 'left' : alignH === 'right' ? 'right' : 'center';
    const originY = alignV === 'top' ? 'top' : alignV === 'bottom' ? 'bottom' : 'center';
    slideInner.style.setProperty('transform-origin', `${originX} ${originY}`, 'important');
    return;
  }

  if (!contentWrapper) return;

  // 2601은 hero, 2602는 cover 클래스 사용
  const isCover = clone.classList.contains('cover') || clone.classList.contains('hero');
  const isRowLayout = isCover || clone.classList.contains('upcoming-svc');

  // 수직 정렬: content-wrapper의 justify-content 변경 (타이틀 영향 없음)
  let justifyContent = 'flex-start';
  switch (alignV) {
    case 'top': justifyContent = 'flex-start'; break;
    case 'middle': justifyContent = 'center'; break;
    case 'bottom': justifyContent = 'flex-end'; break;
  }

  if (isRowLayout) {
    // 가로 레이아웃(Cover/Hero/upcoming-svc): align-items로 수직 정렬
    let alignValue = 'stretch';
    if (justifyContent === 'center') alignValue = 'center';
    else if (justifyContent === 'flex-end') alignValue = 'flex-end';
    contentWrapper.style.setProperty('align-items', alignValue, 'important');
  } else {
    // 일반 페이지: 세로 레이아웃이므로 justify-content로 수직 정렬
    contentWrapper.style.setProperty('justify-content', justifyContent, 'important');
    // Ask 페이지는 원본 가운데 정렬 유지, 나머지는 stretch (너비 100%)
    const isCenteredLayout = clone.classList.contains('ask');
    contentWrapper.style.setProperty('align-items', isCenteredLayout ? 'center' : 'stretch', 'important');
  }

  // transform-origin만 변경 (줌 시 기준점, 너비에 영향 없음)
  const originX = alignH === 'left' ? 'left' : alignH === 'right' ? 'right' : 'center';
  const originY = alignV === 'top' ? 'top' : alignV === 'bottom' ? 'bottom' : 'center';
  contentWrapper.style.setProperty('transform-origin', `${originX} ${originY}`, 'important');
}

// Set per-page content VERTICAL alignment
function setPageContentVAlign(idx, vertical) {
  if (!pageAlignments[idx]) {
    pageAlignments[idx] = { titleH: null, contentV: null, contentH: null };
  }
  pageAlignments[idx].contentV = vertical;
  applyPageContentAlignment(idx);
  updatePageContentVAlignButtons(idx, vertical, true);
  saveZooms();
}

// Set per-page content HORIZONTAL alignment
function setPageContentHAlign(idx, horizontal) {
  if (!pageAlignments[idx]) {
    pageAlignments[idx] = { titleH: null, contentV: null, contentH: null };
  }
  pageAlignments[idx].contentH = horizontal;
  applyPageContentAlignment(idx);
  updatePageContentHAlignButtons(idx, horizontal, true);
  saveZooms();
}

// Apply content alignment to a specific page
function applyPageContentAlignment(idx) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;

  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  const pageAlign = pageAlignments[idx];
  const alignV = (pageAlign && pageAlign.contentV !== null) ? pageAlign.contentV : contentAlignV;
  const alignH = (pageAlign && pageAlign.contentH !== null) ? pageAlign.contentH : contentAlignH;

  applyContentAlignmentToSlide(clone, alignV, alignH);
}

// Reset per-page content VERTICAL alignment
function resetPageContentVAlign(idx) {
  if (pageAlignments[idx]) {
    pageAlignments[idx].contentV = null;
  }
  applyPageContentAlignment(idx);
  updatePageContentVAlignButtons(idx, contentAlignV, false);
  saveZooms();
}

// Reset per-page content HORIZONTAL alignment
function resetPageContentHAlign(idx) {
  if (pageAlignments[idx]) {
    pageAlignments[idx].contentH = null;
  }
  applyPageContentAlignment(idx);
  updatePageContentHAlignButtons(idx, contentAlignH, false);
  saveZooms();
}

// Update per-page content VERTICAL alignment button states
function updatePageContentVAlignButtons(idx, alignV, isCustom) {
  const container = document.getElementById('pageContentVAlignBtns' + idx);
  if (!container) return;

  container.querySelectorAll('.page-content-v-btn').forEach(btn => {
    const btnV = btn.dataset.v;
    const isActive = btnV === alignV;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('global', !isCustom && isActive);
  });

  // Update reset button
  const resetBtn = container.nextElementSibling;
  if (resetBtn && resetBtn.classList.contains('page-align-reset')) {
    resetBtn.classList.toggle('using-global', !isCustom);
  }
}

// Update per-page content HORIZONTAL alignment button states
function updatePageContentHAlignButtons(idx, alignH, isCustom) {
  const container = document.getElementById('pageContentHAlignBtns' + idx);
  if (!container) return;

  container.querySelectorAll('.page-content-h-btn').forEach(btn => {
    const btnH = btn.dataset.h;
    const isActive = btnH === alignH;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('global', !isCustom && isActive);
  });

  // Update reset button
  const resetBtn = container.nextElementSibling;
  if (resetBtn && resetBtn.classList.contains('page-align-reset')) {
    resetBtn.classList.toggle('using-global', !isCustom);
  }
}

// Reset to fit (100% zoom, default alignment)
function resetToFit() {
  // Reset zoom
  globalZoom = 100;
  titleScale = 100;
  pageZooms = Array(total).fill(100);

  // Reset all page alignments to follow global
  pageAlignments = Array(total).fill(null).map(() => ({ titleH: null, contentV: null, contentH: null }));

  // Reset font deltas
  pageFontDeltas = Array(total).fill(0);
  pageTitleZooms = Array(total).fill(100);
  pageTitleFontDeltas = Array(total).fill(0);
  for (let i = 0; i < total; i++) {
    applyPageFontDelta(i);
    applyPageTitleZoom(i, 100);
    applyPageTitleFontDelta(i);
    const fontValEl = document.getElementById('fontVal' + i);
    if (fontValEl) fontValEl.textContent = '0px';
    const titleFontValEl = document.getElementById('titleFontVal' + i);
    if (titleFontValEl) titleFontValEl.textContent = '0px';
    const titleZoomValEl = document.getElementById('titleZoomVal' + i);
    if (titleZoomValEl) titleZoomValEl.textContent = '100%';
    const titleZoomSlider = document.getElementById('titleZoomSlider' + i);
    if (titleZoomSlider) titleZoomSlider.value = 100;
  }

  // Reset global alignments to defaults (타이틀 정렬은 원본 CSS 유지)
  titleAlignH = null;
  contentAlignV = 'middle';
  contentAlignH = 'center';

  // Update UI
  document.getElementById('globalZoomSlider').value = 100;
  document.getElementById('globalZoomValue').textContent = '100%';
  document.getElementById('titleScaleSlider').value = 100;
  document.getElementById('titleScaleValue').textContent = '100%';

  // Update individual sliders
  for (let i = 0; i < total; i++) {
    const slider = document.querySelector(`input[data-idx="${i}"]`);
    if (slider) slider.value = 100;
    const valEl = document.getElementById('zoomVal' + i);
    if (valEl) valEl.textContent = '100%';
    applyContentZoom(i, 100);
  }

  // Title zooms and font deltas already reset in loop above

  // Apply alignments
  applyTitleAlignment();
  applyContentAlignment();
  updateGlobalTitleAlignButtons();

  // Save
  saveZooms();
}

// Setup event listeners
function setupEventListeners() {
  // Global zoom slider
  const globalSlider = document.getElementById('globalZoomSlider');
  if (globalSlider) {
    globalSlider.addEventListener('input', (e) => {
      setGlobalZoom(e.target.value);
    });
  }

  // Title scale slider
  const titleSlider = document.getElementById('titleScaleSlider');
  if (titleSlider) {
    titleSlider.addEventListener('input', (e) => {
      setTitleScale(e.target.value);
    });
    // Set initial value from saved settings
    titleSlider.value = titleScale;
    document.getElementById('titleScaleValue').textContent = titleScale + '%';
  }

  // Window resize
  window.addEventListener('resize', () => {
    slides.forEach((slide, idx) => {
      updateSlideScale(idx);
    });
  });

  // Track text edits inside slides
  const previewContent = document.getElementById('previewContent');
  if (previewContent) {
    previewContent.addEventListener('input', (e) => {
      if (e.target && e.target.closest && e.target.closest('.slide-clone')) {
        inspLastTextEdit = Date.now(); // Ctrl+Z 라우팅 기준 (텍스트 vs 구조 변경)
        markEditsDirty();
      }
    });

    // Enter inserts a real <br> (browser default would insert <div>/<br>
    // inconsistently — slides use <br> for line breaks)
    previewContent.addEventListener('keydown', (e) => {
      if (!editMode || e.key !== 'Enter') return;
      if (!(e.target && e.target.closest && e.target.closest('.slide-clone'))) return;
      e.preventDefault();
      insertBrAtCaret();
    });

    // contenteditable="true"는 리치 텍스트 붙여넣기를 허용하므로
    // 플레인 텍스트만 삽입되도록 강제 (plaintext-only 대체 — toggleEditMode 참고)
    previewContent.addEventListener('paste', (e) => {
      if (!editMode) return;
      if (!(e.target && e.target.closest && e.target.closest('.slide-clone'))) return;
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!text) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text.replace(/\r?\n/g, ' '));
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      markEditsDirty();
    });

    // 드래그 앤 드롭으로 리치 콘텐츠가 들어오는 것도 차단
    previewContent.addEventListener('drop', (e) => {
      if (!editMode) return;
      if (!(e.target && e.target.closest && e.target.closest('.slide-clone'))) return;
      e.preventDefault();
    });

    // 텍스트 복사/잘라내기 시점 기록 (Ctrl+C·우클릭 복사 모두 copy 이벤트로 잡힘).
    // Ctrl+V에서 요소 클립보드보다 텍스트 복사가 최신이면 텍스트 붙여넣기가 이긴다.
    const trackTextCopy = () => {
      const s = window.getSelection();
      if (s && !s.isCollapsed) inspLastTextCopy = Date.now();
    };
    document.addEventListener('copy', trackTextCopy);
    document.addEventListener('cut', trackTextCopy);

    // 엘리먼트 인스펙터: 호버 하이라이트
    previewContent.addEventListener('mousemove', (e) => {
      inspMouseX = e.clientX;
      inspMouseY = e.clientY;
      if (!editMode || inspDragging) return;
      inspHover = inspPick(e.target);
    });
    previewContent.addEventListener('mouseleave', () => { inspHover = null; });

    // 엘리먼트 인스펙터: 클릭 선택 (텍스트 캐럿 배치와 공존 — preventDefault 안 함)
    previewContent.addEventListener('click', (e) => {
      if (!editMode) return;
      const t = inspPick(e.target);
      if (t) inspSelect(t);
      // 슬라이드 밖(회색 배경) 클릭 시 해제 — 단 툴바 버튼/입력류는 제외
      else if (!(e.target.closest && e.target.closest('button, input, select, label'))) inspClearSel();
    });

    // ESC로 선택 해제, Ctrl+Z로 구조 변경 언두, Ctrl+S로 저장
    document.addEventListener('keydown', (e) => {
      // Ctrl+S: 편집 모드 여부와 무관하게 언제든 원본 저장
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (saveDoc) saveEdits();
        return;
      }
      if (!editMode) return;
      if (e.key === 'Escape') {
        inspClearSel();
        return;
      }
      // Ctrl+Z: 마지막 구조 변경(드래그/삭제/복제/초기화)이 마지막 텍스트
      // 편집보다 최신이면 우리 언두 스택에서 처리하고, 아니면 브라우저의
      // 기본 텍스트 undo에 맡긴다.
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        const top = inspUndoStack[inspUndoStack.length - 1];
        if (top && top.t >= inspLastTextEdit) {
          e.preventDefault();
          inspUndoStack.pop().undo();
        }
        return;
      }
      // Ctrl+Shift+C: 스타일 복사 (선택 요소 또는 커서가 놓인 요소)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault(); // 브라우저 DevTools 단축키보다 우선
        inspStyleCopy();
        return;
      }
      // Ctrl+Shift+V: 복사한 스타일 붙여넣기 (텍스트 선택 → 감싸기 / 요소 선택 → 교체)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        const ae = document.activeElement;
        if (!(ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA'))) {
          e.preventDefault(); // 브라우저 "서식 없이 붙여넣기"보다 우선
          inspStylePaste();
        }
        return;
      }
      // 요소 복사는 단축키 없이 선택 툴바의 복사 버튼으로만 제공 —
      // Ctrl+C는 항상 브라우저 텍스트 복사로 동작한다 (단축키 충돌 방지)
      // Ctrl+V: 복사한 요소를 "선택한 요소의 자식"으로 붙여넣기 (커서 아래 자식 다음).
      // 단 "마지막에 복사한 것이 붙는다" — 요소 복사 이후에 텍스트를 복사했다면
      // 요소 붙여넣기를 건너뛰고 브라우저 텍스트 붙여넣기(위 paste 핸들러)에 맡긴다.
      // 예전 요소를 다시 붙이려면 그 요소를 다시 Ctrl+C. 패널 입력창 포커스 중엔 제외.
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        const ae = document.activeElement;
        const inField = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');
        if (inspClipboard && inspSel && !inField && inspClipboardAt > inspLastTextCopy) {
          e.preventDefault();
          inspPaste();
        }
        return;
      }
    });
  }

  // Warn before leaving with unsaved edits
  window.addEventListener('beforeunload', (e) => {
    if (editsDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// Update UI language
function updateLanguage() {
  document.querySelectorAll('[data-lang]').forEach(el => {
    if (el.dataset.lang === lang) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

// Show loading overlay
function showLoading(text) {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-text" id="loadingText">${text}</div>
      <div class="loading-bar"><div class="loading-fill" id="loadingFill"></div></div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
    document.getElementById('loadingText').textContent = text;
  }
}

// Hide loading overlay
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Show error
function showError(text) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingText').style.color = '#EF4444';
  }
}

// Update loading progress
function setLoadingProgress(percent, text) {
  const fill = document.getElementById('loadingFill');
  const textEl = document.getElementById('loadingText');
  if (fill) fill.style.width = percent + '%';
  if (textEl && text) textEl.textContent = text;
}

// Auto fit page - calculate optimal zoom to fit content in frame and center it
// Set page layout (row or column)
function setPageLayout(idx, layout) {
  pageLayouts[idx] = layout;

  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;

  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  const slideInner = clone.querySelector('.slide-inner');
  if (!slideInner) return;

  // Remove existing content-wrapper if switching to row
  if (layout === 'row') {
    const cw = slideInner.querySelector(':scope > .content-wrapper');
    if (cw) {
      // Move children back to slide-inner
      while (cw.firstChild) {
        slideInner.insertBefore(cw.firstChild, cw);
      }
      cw.remove();
    }
    slideInner.style.setProperty('flex-direction', 'row', 'important');
    slideInner.style.setProperty('align-items', 'stretch', 'important');
    slideInner.style.removeProperty('transform');
  } else {
    slideInner.style.setProperty('flex-direction', 'column', 'important');
    slideInner.style.removeProperty('transform');
  }

  // Re-apply zoom
  applyContentZoom(idx, pageZooms[idx]);

  // Update button states
  const btns = document.querySelectorAll(`#pageLayoutBtns${idx} .page-layout-btn`);
  btns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layout === layout);
  });
}

function autoFitPage(idx) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;

  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  // 먼저 100% zoom으로 리셋
  pageZooms[idx] = 100;
  applyContentZoom(idx, 100);

  // 잠시 대기하여 레이아웃이 적용되도록
  requestAnimationFrame(() => {
    // scale 값 가져오기
    const transformMatch = clone.style.transform?.match(/scale\(([\d.]+)\)/);
    const scale = transformMatch ? parseFloat(transformMatch[1]) : 1;

    // 타이틀 요소들
    const titleSelectors = ['.section-label', '.section-title', '.section-desc'];

    // 타이틀 실제 높이 계산
    let titleTotalHeight = 0;
    titleSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const marginBottom = parseFloat(style.marginBottom) || 0;
        titleTotalHeight += (rect.height / scale) + marginBottom;
      });
    });

    // 콘텐츠 셀렉터
    const contentSelectors = [
      '.hero-left', '.hero-right', '.hero-stats',
      '.overview-layout', '.ov-layout', '.ov-badges',
      '.problem-flow', '.solution-content', '.solution-flow',
      '.svc-phases', '.svc-cloud-bar',
      '.market-content', '.mkt-stages', '.mkt-table',
      '.comp-table', '.traction-grid',
      '.biz-diagram-wrap', '.biz-rev-summary',
      '.pricing-grid', '.sales-layout',
      '.team-layout', '.team-ceo', '.team-members',
      '.gp-nda-row', '.gp-top', '.gp-countries',
      '.exit-chart-area', '.ask-stats', '.ask-highlights',
      '.roadmap-container',
      '.contact-area'
    ];

    // 콘텐츠 영역 찾기
    let contentWidth = 0;
    let contentHeight = 0;

    // Global Partners 페이지 특별 처리
    const gpNdaRow = clone.querySelector('.gp-nda-row');
    const gpTop = clone.querySelector('.gp-top');
    const gpCountries = clone.querySelector('.gp-countries');

    if (gpNdaRow) {
      // Global Partners 페이지: 모든 콘텐츠 요소의 총 높이
      [gpNdaRow, gpTop, gpCountries].forEach(el => {
        if (el) {
          const rect = el.getBoundingClientRect();
          contentHeight += rect.height / scale;
          contentWidth = Math.max(contentWidth, rect.width / scale);
        }
      });
    } else {
      // 일반 페이지: 첫 번째 콘텐츠 요소 찾기
      for (const selector of contentSelectors) {
        const el = clone.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          contentWidth = rect.width / scale;
          contentHeight = rect.height / scale;
          break;
        }
      }
    }

    if (contentWidth === 0 || contentHeight === 0) return;

    // 프레임 가용 공간
    const frameWidth = 1200; // 콘텐츠 최대 너비
    const slideHeight = 720;
    const topPadding = 30;
    const bottomPadding = 30;
    const contentTopPadding = 30; // 타이틀과 콘텐츠 사이 여백
    const availableHeight = slideHeight - topPadding - titleTotalHeight - contentTopPadding - bottomPadding;

    // 최적 줌 계산 (너비와 높이 중 더 제한적인 것 기준)
    const widthRatio = frameWidth / contentWidth;
    const heightRatio = availableHeight / contentHeight;
    let optimalZoom = Math.min(widthRatio, heightRatio) * 100;

    // 50% ~ 150% 범위로 제한
    optimalZoom = Math.max(50, Math.min(150, Math.round(optimalZoom)));

    // 줌 적용
    pageZooms[idx] = optimalZoom;
    applyContentZoom(idx, optimalZoom);

    // 슬라이더와 값 업데이트
    const slider = document.querySelector(`input[data-idx="${idx}"]`);
    if (slider) slider.value = optimalZoom;
    const valEl = document.getElementById('zoomVal' + idx);
    if (valEl) valEl.textContent = optimalZoom + '%';

    // 정렬 설정: 가운데 정렬
    if (!pageAlignments[idx]) {
      pageAlignments[idx] = { titleH: null, contentV: null, contentH: null };
    }
    pageAlignments[idx].contentV = 'middle';
    pageAlignments[idx].contentH = 'center';

    applyPageContentAlignment(idx);
    updatePageContentVAlignButtons(idx, 'middle', true);
    updatePageContentHAlignButtons(idx, 'center', true);

    saveZooms();
  });
}

// ═══════════════════════════════════════════════════════════
// PER-PAGE TITLE ZOOM
// ═══════════════════════════════════════════════════════════

function setPageTitleZoom(idx, value) {
  const val = parseInt(value);
  pageTitleZooms[idx] = val;

  const valEl = document.getElementById('titleZoomVal' + idx);
  if (valEl) valEl.textContent = val + '%';

  applyPageTitleZoom(idx, val);
  saveZooms();
}

function applyPageTitleZoom(idx, zoomPercent) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;
  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  const scale = zoomPercent / 100;
  const titleSelectors = ['.section-label', '.section-title', '.section-desc'];

  titleSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => {
      el.style.setProperty('transform', `scale(${scale})`, 'important');
      el.style.setProperty('transform-origin', 'top left', 'important');
      if (scale < 1) {
        const originalHeight = el.offsetHeight;
        const scaledHeight = originalHeight * scale;
        el.style.setProperty('margin-bottom', (scaledHeight - originalHeight) + 'px', 'important');
      } else if (scale > 1) {
        const originalHeight = el.offsetHeight;
        const scaledHeight = originalHeight * scale;
        el.style.setProperty('margin-bottom', (scaledHeight - originalHeight) + 'px', 'important');
      } else {
        el.style.removeProperty('margin-bottom');
      }
    });
  });
}

// Apply all saved title zooms on initial render
function applyAllTitleZooms() {
  for (let i = 0; i < total; i++) {
    if (pageTitleZooms[i] && pageTitleZooms[i] !== 100) {
      applyPageTitleZoom(i, pageTitleZooms[i]);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PER-PAGE TITLE FONT SIZE ADJUSTMENT (+/- 1px delta)
// ═══════════════════════════════════════════════════════════

function setPageTitleFontDelta(idx, direction) {
  if (!pageTitleFontDeltas[idx]) pageTitleFontDeltas[idx] = 0;
  pageTitleFontDeltas[idx] += direction;
  applyPageTitleFontDelta(idx);
  const valEl = document.getElementById('titleFontVal' + idx);
  if (valEl) valEl.textContent = (pageTitleFontDeltas[idx] > 0 ? '+' : '') + pageTitleFontDeltas[idx] + 'px';
  saveZooms();
}

function resetPageTitleFontDelta(idx) {
  pageTitleFontDeltas[idx] = 0;
  applyPageTitleFontDelta(idx);
  const valEl = document.getElementById('titleFontVal' + idx);
  if (valEl) valEl.textContent = '0px';
  saveZooms();
}

function applyPageTitleFontDelta(idx) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;
  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;
  const delta = pageTitleFontDeltas[idx] || 0;

  const titleSelectors = ['.section-label', '.section-title', '.section-desc'];

  titleSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => {
      // Process the title element and all its children
      const elements = [el, ...el.querySelectorAll('*')];
      elements.forEach(target => {
        if (target.tagName === 'BR' || target.tagName === 'SVG' || target.closest('svg')) return;

        const cs = window.getComputedStyle(target);
        const currentSize = parseFloat(cs.fontSize);
        if (!currentSize || isNaN(currentSize)) return;

        if (!target.hasAttribute('data-orig-title-font-size')) {
          target.setAttribute('data-orig-title-font-size', currentSize.toString());
        }

        const origSize = parseFloat(target.getAttribute('data-orig-title-font-size'));
        if (delta === 0) {
          target.style.fontSize = origSize + 'px';
        } else {
          target.style.fontSize = Math.max(1, origSize + delta) + 'px';
        }
      });
    });
  });
}

function applyAllTitleFontDeltas() {
  for (let i = 0; i < total; i++) {
    if (pageTitleFontDeltas[i] && pageTitleFontDeltas[i] !== 0) {
      applyPageTitleFontDelta(i);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PER-PAGE CONTENT FONT SIZE ADJUSTMENT (+/- 1px delta)
// ═══════════════════════════════════════════════════════════

function setPageFontDelta(idx, direction) {
  if (!pageFontDeltas[idx]) pageFontDeltas[idx] = 0;
  pageFontDeltas[idx] += direction;
  applyPageFontDelta(idx);
  const valEl = document.getElementById('fontVal' + idx);
  if (valEl) valEl.textContent = (pageFontDeltas[idx] > 0 ? '+' : '') + pageFontDeltas[idx] + 'px';
  saveZooms();
}

function resetPageFontDelta(idx) {
  pageFontDeltas[idx] = 0;
  applyPageFontDelta(idx);
  const valEl = document.getElementById('fontVal' + idx);
  if (valEl) valEl.textContent = '0px';
  saveZooms();
}

function applyPageFontDelta(idx) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;
  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;
  const delta = pageFontDeltas[idx] || 0;

  // Collect all content elements (skip titles: section-label, section-title, section-desc)
  const titleClasses = ['section-label', 'section-title', 'section-desc'];

  function isTitle(el) {
    return titleClasses.some(cls => el.classList && el.classList.contains(cls));
  }

  function isInsideTitle(el) {
    let node = el;
    while (node && node !== clone) {
      if (isTitle(node)) return true;
      node = node.parentElement;
    }
    return false;
  }

  // Walk all text-containing elements within content only
  const allElements = clone.querySelectorAll('*');
  allElements.forEach(el => {
    // Skip non-visible or structural elements
    if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT' || el.tagName === 'SVG' ||
        el.closest('svg') || el.tagName === 'BR' || el.tagName === 'IMG') return;

    // Skip title elements and their children
    if (isTitle(el) || isInsideTitle(el)) {
      // Reset to original if previously modified
      if (el.hasAttribute('data-orig-font-size')) {
        const origSize = parseFloat(el.getAttribute('data-orig-font-size'));
        el.style.fontSize = origSize + 'px';
      }
      return;
    }

    const cs = window.getComputedStyle(el);
    const currentSize = parseFloat(cs.fontSize);
    if (!currentSize || isNaN(currentSize)) return;

    // Store original font-size on first application
    if (!el.hasAttribute('data-orig-font-size')) {
      el.setAttribute('data-orig-font-size', currentSize.toString());
    }

    if (delta === 0) {
      // Reset to original
      el.style.fontSize = el.getAttribute('data-orig-font-size') + 'px';
    } else {
      const origSize = parseFloat(el.getAttribute('data-orig-font-size'));
      const newSize = Math.max(1, origSize + delta);
      el.style.fontSize = newSize + 'px';
    }
  });
}

// Apply all saved font deltas on initial render
function applyAllFontDeltas() {
  for (let i = 0; i < total; i++) {
    if (pageFontDeltas[i] && pageFontDeltas[i] !== 0) {
      applyPageFontDelta(i);
      const valEl = document.getElementById('fontVal' + i);
      if (valEl) valEl.textContent = (pageFontDeltas[i] > 0 ? '+' : '') + pageFontDeltas[i] + 'px';
    }
  }
}

// ═══════════════════════════════════════════════════════════
// VW → PX CONVERSION FOR PRINT PREVIEW
// IR pages use <meta viewport width=1280>, so 1vw = 12.8px.
// In print-preview the browser viewport is used instead,
// making all vw-based values too large. Convert to px.
// ═══════════════════════════════════════════════════════════
const VW_TO_PX = 12.8; // 1vw = 12.8px at 1280px viewport

// Convert vw values in a CSS text string to px
function convertVwCss(css) {
  // 1) Strip max(18px, Xvw) → just the px equivalent of Xvw
  css = css.replace(/max\(\s*18px\s*,\s*([\d.]+)vw\s*\)/g,
    (_, n) => (parseFloat(n) * VW_TO_PX) + 'px');
  // 2) Convert remaining Xvw → px
  css = css.replace(/([\d.]+)vw/g,
    (_, n) => (parseFloat(n) * VW_TO_PX) + 'px');
  return css;
}

// Convert vw in inline styles and SVG attributes of a DOM tree
function convertVwInDom(root) {
  const convert = (str) => {
    return str
      .replace(/max\(\s*18px\s*,\s*([\d.]+)vw\s*\)/g, (_, n) => (parseFloat(n) * VW_TO_PX) + 'px')
      .replace(/([\d.]+)vw/g, (_, n) => (parseFloat(n) * VW_TO_PX) + 'px');
  };

  const elements = [root, ...root.querySelectorAll('*')];
  elements.forEach(el => {
    // Inline styles
    const style = el.getAttribute('style');
    if (style && style.includes('vw')) {
      el.setAttribute('style', convert(style));
    }
    // SVG presentational attributes that may use vw
    ['width', 'height', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'r'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && val.includes('vw')) {
        el.setAttribute(attr, convert(val));
      }
    });
  });
}

// Close preview (go back or close tab)
// ═══════════════════════════════════════════════════════════
// TEXT EDITING — contenteditable + save back to source file
// ═══════════════════════════════════════════════════════════

// Assign matching data-pp-eid to every element of each slide in the display
// doc and the pristine save doc. Both docs are parsed from identical HTML, so
// same-index traversal maps 1:1.
function tagSlidesForEditing(displayDoc, pristineDoc) {
  const dSlides = displayDoc.querySelectorAll('.slide');
  const sSlides = pristineDoc.querySelectorAll('.slide');
  dSlides.forEach((ds, i) => {
    const ss = sSlides[i];
    if (!ss) return;
    const dEls = [ds, ...ds.querySelectorAll('*')];
    const sEls = [ss, ...ss.querySelectorAll('*')];
    dEls.forEach((el, j) => {
      if (!sEls[j]) return;
      const eid = i + '-' + j;
      el.setAttribute('data-pp-eid', eid);
      sEls[j].setAttribute('data-pp-eid', eid);
    });
  });
}

function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);
  document.querySelectorAll('.slide-clone').forEach(clone => {
    if (editMode) {
      // NOTE: 'plaintext-only'는 쓰지 않는다 — Blink이 -webkit-user-modify:
      // read-write-plaintext-only 요소 전체에 white-space:pre-wrap을 강제해
      // (CSS !important로도 무효화 불가) 소스 HTML의 줄바꿈·들여쓰기가 그대로
      // 렌더링되어 슬라이드 레이아웃이 틀어진다. 대신 일반 contenteditable을
      // 쓰고, 붙여넣기/드롭은 아래 paste·drop 핸들러가 플레인 텍스트로 강제한다.
      clone.setAttribute('contenteditable', 'true');
      clone.setAttribute('spellcheck', 'false');
    } else {
      clone.removeAttribute('contenteditable');
    }
  });
  const btn = document.getElementById('editModeBtn');
  if (btn) btn.classList.toggle('active', editMode);
  if (editMode) {
    inspEnsureUI();
    if (!inspRaf) inspRaf = requestAnimationFrame(inspLoop);
    showToast(lang === 'ko'
      ? '텍스트는 클릭해 바로 수정, 요소는 클릭 선택 후 삭제·복제·크기/여백 조절. Ctrl+Shift+C 스타일 복사 · Ctrl+Shift+V 붙여넣기. "저장"으로 파일에 반영됩니다.'
      : 'Click text to edit. Click an element to select it — delete, duplicate, resize. Ctrl+Shift+C copies a style, Ctrl+Shift+V applies it. Save writes to file.');
  } else {
    inspClearSel();
    inspHover = null;
    const hb = document.getElementById('ppInspHover');
    const sb = document.getElementById('ppInspSel');
    const pn = document.getElementById('ppInspPanel');
    if (hb) hb.style.display = 'none';
    if (sb) sb.style.display = 'none';
    if (pn) pn.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════
// ELEMENT INSPECTOR — 편집 모드에서 요소 호버 하이라이트/선택,
// 삭제·복제, 드래그로 너비·높이·패딩·마진 조절.
// 모든 변경은 display 클론 + saveDoc(원본 저장용) + slides 소스에
// 동시에 반영된다. saveDoc에는 vw 단위(1vw = 12.8px)로 기록해
// 원본 파일의 단위 체계를 유지한다.
// ═══════════════════════════════════════════════════════════

let inspHover = null;     // 호버 중인 요소 (display 클론 내부)
let inspSel = null;       // 선택된 요소
let inspRaf = null;
let inspDragging = null;
let inspDupSeq = 0;
let inspBoxEls = null;    // 박스모델 레이어 요소 캐시 {mt,mr,mb,ml,pt,pr,pb,pl,content}
// 복사/붙여넣기: 복사 시점의 3벌 스냅샷(display/saveDoc/src) — 이후 편집·삭제와 무관
let inspClipboard = null;
// "마지막에 복사한 것이 붙는다": 요소 복사 시점 vs 텍스트 복사 시점을 비교해
// Ctrl+V에서 더 최신 쪽이 이긴다 (요소 클립보드는 비워지지 않으므로 시점으로 판별)
let inspClipboardAt = 0;   // 마지막 요소 복사(inspCopy) 시각
let inspLastTextCopy = 0;  // 마지막 텍스트 복사/잘라내기(copy·cut 이벤트) 시각
let inspMouseX = 0, inspMouseY = 0; // 붙여넣기 위치 판단용 최근 커서 좌표
// 순서 이동: 현재 선택 요소의 이동 정보 {kind:'item'|'inline', axis:'x'|'y'} / 이동 드래그 상태
let inspMoveCur = null;
let inspMoveDrag = null;
// 세션 중 변경한 프로퍼티의 원래 인라인 값 (초기화용): eid → prop → {d,s,src}
const inspOrig = {};

// 우측 패널에 표시할 프로퍼티 목록 [prop, 라벨, 그룹]
const INSP_PROPS = [
  ['font-size',      '크기',   'font'],
  ['line-height',    '줄간격', 'font'],
  ['letter-spacing', '자간',   'font'],
  ['width',          '너비',   'size'],
  ['height',         '높이',   'size'],
  ['padding-top',    '위',     'pad'],
  ['padding-right',  '오른쪽', 'pad'],
  ['padding-bottom', '아래',   'pad'],
  ['padding-left',   '왼쪽',   'pad'],
  ['margin-top',     '위',     'mar'],
  ['margin-right',   '오른쪽', 'mar'],
  ['margin-bottom',  '아래',   'mar'],
  ['margin-left',    '왼쪽',   'mar']
];

// ── UNDO ──
// 구조 변경(드래그 조절·삭제·복제·초기화)용 언두 스택.
// 텍스트 타이핑은 브라우저 기본 undo가 처리하므로, Ctrl+Z 시점에
// "마지막 구조 변경"이 "마지막 텍스트 편집"보다 최신일 때만 우리가 처리한다.
let inspUndoStack = [];
let inspLastTextEdit = 0;

function inspPushUndo(fn) {
  inspUndoStack.push({ t: Date.now(), undo: fn });
  if (inspUndoStack.length > 100) inspUndoStack.shift();
}

// 지정 프로퍼티들의 현재 인라인 값(display/saveDoc/src 3벌)을 캡처해
// 되돌리는 함수를 반환
function inspSnapshotStyle(el, props) {
  const { sEl, srcEl } = inspCounterparts(el);
  const snap = props.map(p => ({
    p,
    d: el.style.getPropertyValue(p),
    s: sEl ? sEl.style.getPropertyValue(p) : null,
    src: srcEl ? srcEl.style.getPropertyValue(p) : null
  }));
  return () => {
    const cp = inspCounterparts(el);
    const rest = (t, p, v) => {
      if (!t || v === null) return;
      if (v) t.style.setProperty(p, v);
      else t.style.removeProperty(p);
    };
    snap.forEach(o => {
      rest(el, o.p, o.d);
      rest(cp.sEl, o.p, o.s);
      rest(cp.srcEl, o.p, o.src);
    });
    markEditsDirty();
    inspPanelUpdate();
  };
}

// [key, cssProp, axis, sign, className, title] — sign: 드래그 양(+)방향이 값 증가인지
const INSP_HANDLES = [
  ['w',  null,             'x',  1, 'pp-h-size pp-h-e',  '너비'],
  ['h',  null,             'y',  1, 'pp-h-size pp-h-s',  '높이'],
  ['wh', null,             'xy', 1, 'pp-h-size pp-h-se', '너비+높이'],
  ['pt', 'padding-top',    'y',  1, 'pp-h-pad pp-h-pt',  '안쪽 여백 (위)'],
  ['pr', 'padding-right',  'x', -1, 'pp-h-pad pp-h-pr',  '안쪽 여백 (오른쪽)'],
  ['pb', 'padding-bottom', 'y', -1, 'pp-h-pad pp-h-pb',  '안쪽 여백 (아래)'],
  ['pl', 'padding-left',   'x',  1, 'pp-h-pad pp-h-pl',  '안쪽 여백 (왼쪽)'],
  ['mt', 'margin-top',     'y',  1, 'pp-h-mar pp-h-mt',  '바깥 여백 (위)'],
  ['mr', 'margin-right',   'x',  1, 'pp-h-mar pp-h-mr',  '바깥 여백 (오른쪽)'],
  ['mb', 'margin-bottom',  'y',  1, 'pp-h-mar pp-h-mb',  '바깥 여백 (아래)'],
  ['ml', 'margin-left',    'x', -1, 'pp-h-mar pp-h-ml',  '바깥 여백 (왼쪽)']
];

function inspEnsureUI() {
  if (document.getElementById('ppInspSel')) return;

  const hover = document.createElement('div');
  hover.id = 'ppInspHover';
  document.body.appendChild(hover);

  const sel = document.createElement('div');
  sel.id = 'ppInspSel';
  const dupLabel = lang === 'ko' ? '복제' : 'Duplicate';
  const delLabel = lang === 'ko' ? '삭제' : 'Delete';
  const copyLabel = lang === 'ko' ? '요소 복사' : 'Copy element';
  const mvPrevLabel = lang === 'ko' ? '앞으로 이동' : 'Move earlier';
  const mvNextLabel = lang === 'ko' ? '뒤로 이동' : 'Move later';
  const mvDragLabel = lang === 'ko' ? '드래그로 위치 이동' : 'Drag to move';
  // 박스모델 시각화 레이어: 마진(주황 빗살)·패딩(초록 빗살)·콘텐츠 박스(점선).
  // 핸들보다 먼저 삽입해 항상 핸들 아래에 그려진다. 위치는 inspLoop가 매 프레임 갱신.
  const boxLayer = ['mt', 'mr', 'mb', 'ml'].map(k => `<div class="pp-box-mar" data-box="${k}"></div>`).join('')
    + ['pt', 'pr', 'pb', 'pl'].map(k => `<div class="pp-box-pad" data-box="${k}"></div>`).join('')
    + '<div class="pp-box-content" data-box="content"></div>';
  sel.innerHTML = boxLayer + `
    <div class="pp-insp-toolbar">
      <button type="button" id="ppInspMvPrev" class="pp-mv" title="${mvPrevLabel}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button type="button" id="ppInspMvNext" class="pp-mv" title="${mvNextLabel}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <button type="button" id="ppInspMove" class="pp-mv" title="${mvDragLabel}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
      </button>
      <button type="button" id="ppInspCopy" title="${copyLabel}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
      </button>
      <button type="button" id="ppInspDup" title="${dupLabel}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button type="button" id="ppInspDel" title="${delLabel}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    </div>
  ` + INSP_HANDLES.map(h =>
    `<div class="pp-insp-handle ${h[4]}" data-hkey="${h[0]}" title="${h[5]}"></div>`
  ).join('');
  document.body.appendChild(sel);

  inspBoxEls = {};
  sel.querySelectorAll('[data-box]').forEach(d => { inspBoxEls[d.getAttribute('data-box')] = d; });

  // 이동 드래그 시 드롭 위치 표시선
  const drop = document.createElement('div');
  drop.id = 'ppInspDropLine';
  document.body.appendChild(drop);

  // 툴바 mousedown이 슬라이드의 텍스트 캐럿/포커스를 뺏지 않게
  sel.addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('ppInspDel').addEventListener('click', inspDelete);
  document.getElementById('ppInspDup').addEventListener('click', inspDuplicate);
  document.getElementById('ppInspCopy').addEventListener('click', inspCopy);
  document.getElementById('ppInspMvPrev').addEventListener('click', () => inspMoveStep(-1));
  document.getElementById('ppInspMvNext').addEventListener('click', () => inspMoveStep(1));
  document.getElementById('ppInspMove').addEventListener('pointerdown', inspMoveDragStart);
  sel.querySelectorAll('.pp-insp-handle').forEach(h => {
    h.addEventListener('pointerdown', inspDragStart);
  });

  // 우측 프로퍼티 패널
  const panel = document.createElement('div');
  panel.id = 'ppInspPanel';
  const groupLabel = { font: lang === 'ko' ? '글자' : 'Text', size: '크기', pad: '안쪽 여백 (패딩)', mar: '바깥 여백 (마진)' };
  const resetTitle = lang === 'ko' ? '초기화' : 'Reset';
  const rowNum = (prop, label) => `
      <div class="pp-panel-row" data-prop="${prop}">
        <label>${label}</label>
        <input type="number" step="0.1" data-prop="${prop}">
        <span class="pp-unit">px</span>
        <button type="button" class="pp-row-reset" data-prop="${prop}" title="${resetTitle}">↺</button>
      </div>`;
  const rowReset = (props) => `<button type="button" class="pp-row-reset" data-prop="${props}" title="${resetTitle}">↺</button>`;
  // 이 프로젝트에서 실제 쓰는 폰트 스택 (덱 CSS와 동일 순서)
  const FONT_OPTS = [
    ["'Pretendard Variable','Pretendard',sans-serif", 'Pretendard'],
    ["'Plus Jakarta Sans',sans-serif", 'Plus Jakarta Sans'],
    ["'Fugaz One',sans-serif", 'Fugaz One'],
    ["'Russo One',sans-serif", 'Russo One'],
    ['serif', 'Serif'],
    ['monospace', 'Monospace']
  ];
  const alnIcon = {
    left: '<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>',
    center: '<line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>',
    right: '<line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>',
    justify: '<line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/>'
  };
  const alnTitle = lang === 'ko'
    ? { left: '왼쪽 정렬', center: '가운데 정렬', right: '오른쪽 정렬', justify: '양쪽 정렬' }
    : { left: 'Align left', center: 'Align center', right: 'Align right', justify: 'Justify' };
  const alnBtn = (k) => `<button type="button" data-align="${k}" title="${alnTitle[k]}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${alnIcon[k]}</svg></button>`;

  let phtml = `<div class="pp-panel-head"><span class="pp-panel-title">${lang === 'ko' ? '선택 요소' : 'Selected'}</span><span class="pp-panel-tag" id="ppPanelTag"></span></div>`;

  // ── 글자 그룹: 폰트·굵기 → 크기·줄간격·자간 → 색 → 스타일·정렬 ──
  phtml += `<div class="pp-panel-group pp-g-font">${groupLabel.font}</div>`;
  phtml += `
      <div class="pp-panel-row" data-prop="font-family">
        <label>${lang === 'ko' ? '폰트' : 'Font'}</label>
        <select data-prop="font-family" id="ppSelFont">
          <option value="">${lang === 'ko' ? '기본(상속)' : 'inherit'}</option>
          ${FONT_OPTS.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}
        </select>
        ${rowReset('font-family')}
      </div>
      <div class="pp-panel-row" data-prop="font-weight">
        <label>${lang === 'ko' ? '굵기' : 'Weight'}</label>
        <select data-prop="font-weight" id="ppSelWeight">
          <option value="">${lang === 'ko' ? '기본' : 'inherit'}</option>
          ${[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => `<option value="${w}">${w}</option>`).join('')}
        </select>
        ${rowReset('font-weight')}
      </div>`;
  INSP_PROPS.filter(p => p[2] === 'font').forEach(([prop, label]) => { phtml += rowNum(prop, label); });
  phtml += `
      <div class="pp-panel-row" data-prop="color">
        <label>${lang === 'ko' ? '글자색' : 'Color'}</label>
        <input type="color" data-prop="color" title="${lang === 'ko' ? '글자색' : 'Text color'}">
        <input type="text" class="pp-color-hex" data-prop="color" spellcheck="false" placeholder="#000000">
        ${rowReset('color')}
      </div>
      <div class="pp-panel-row" data-prop="background-color">
        <label>${lang === 'ko' ? '배경색' : 'BG'}</label>
        <input type="color" data-prop="background-color" title="${lang === 'ko' ? '배경색' : 'Background color'}">
        <input type="text" class="pp-color-hex" data-prop="background-color" spellcheck="false" placeholder="transparent">
        ${rowReset('background-color')}
      </div>
      <div class="pp-panel-row" data-prop="font-style,text-decoration-line">
        <label>${lang === 'ko' ? '스타일' : 'Style'}</label>
        <div class="pp-btn-group">
          <button type="button" data-tgl="italic" title="${lang === 'ko' ? '기울임' : 'Italic'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
          <button type="button" data-tgl="underline" title="${lang === 'ko' ? '밑줄' : 'Underline'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg></button>
          <button type="button" data-tgl="line-through" title="${lang === 'ko' ? '취소선' : 'Strikethrough'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg></button>
        </div>
        ${rowReset('font-style,text-decoration-line')}
      </div>
      <div class="pp-panel-row" data-prop="text-align">
        <label>${lang === 'ko' ? '정렬' : 'Align'}</label>
        <div class="pp-btn-group">${alnBtn('left')}${alnBtn('center')}${alnBtn('right')}${alnBtn('justify')}</div>
        ${rowReset('text-align')}
      </div>`;

  // ── 나머지 그룹(크기·패딩·마진)은 숫자 행 ──
  let curGroup = '';
  INSP_PROPS.filter(p => p[2] !== 'font').forEach(([prop, label, group]) => {
    if (group !== curGroup) {
      curGroup = group;
      phtml += `<div class="pp-panel-group pp-g-${group}">${groupLabel[group]}</div>`;
    }
    phtml += rowNum(prop, label);
  });
  panel.innerHTML = phtml;
  document.body.appendChild(panel);

  // 숫자 입력 (px 프로퍼티 — 3벌 px/vw 변환 적용)
  panel.querySelectorAll('input[type="number"][data-prop]').forEach(inp => {
    inp.addEventListener('input', () => {
      if (!inspSel) return;
      const v = parseFloat(inp.value);
      if (isNaN(v)) return;
      const prop = inp.getAttribute('data-prop');
      if (!inp._undoSnap) inp._undoSnap = inspSnapshotStyle(inspSel, [prop]);
      // 패딩은 음수 불가, 폰트 크기·줄간격은 1px 미만 방지 (자간은 음수 허용)
      const clamped = prop.indexOf('padding') === 0 ? Math.max(0, v)
        : (prop === 'font-size' || prop === 'line-height') ? Math.max(1, v) : v;
      inspApplyStyle(prop, clamped);
      inspPanelMarkRows();
    });
    // 값 확정(포커스 아웃/스피너 스텝) 시점에 언두 한 단위로 커밋
    inp.addEventListener('change', () => {
      if (inp._undoSnap) {
        inspPushUndo(inp._undoSnap);
        inp._undoSnap = null;
      }
    });
  });

  // 폰트·굵기 select — 값 문자열 3벌 반영, "기본" 선택 시 인라인 제거(상속 복귀)
  panel.querySelectorAll('select[data-prop]').forEach(sel => {
    sel.addEventListener('change', () => {
      if (!inspSel) return;
      const prop = sel.getAttribute('data-prop');
      const undo = inspSnapshotStyle(inspSel, [prop]);
      inspApplyStyleStr(prop, sel.value);
      inspPushUndo(undo);
      inspPanelUpdate();
    });
  });

  // 색상 스와치 — 드래그 중 연속 적용, 확정 시 언두 한 단위
  panel.querySelectorAll('input[type="color"][data-prop]').forEach(sw => {
    const prop = sw.getAttribute('data-prop');
    sw.addEventListener('input', () => {
      if (!inspSel) return;
      if (!sw._undoSnap) sw._undoSnap = inspSnapshotStyle(inspSel, [prop]);
      inspApplyStyleStr(prop, sw.value);
      const tx = panel.querySelector(`input.pp-color-hex[data-prop="${prop}"]`);
      if (tx && document.activeElement !== tx) tx.value = sw.value;
      inspPanelMarkRows();
    });
    sw.addEventListener('change', () => {
      if (sw._undoSnap) { inspPushUndo(sw._undoSnap); sw._undoSnap = null; }
    });
  });

  // 색상 헥스 직접 입력 (#hex · rgba(...) · transparent 모두 허용)
  panel.querySelectorAll('input.pp-color-hex[data-prop]').forEach(tx => {
    tx.addEventListener('change', () => {
      if (!inspSel) return;
      const v = tx.value.trim();
      if (!v) return;
      const prop = tx.getAttribute('data-prop');
      const undo = inspSnapshotStyle(inspSel, [prop]);
      inspApplyStyleStr(prop, v);
      inspPushUndo(undo);
      inspPanelUpdate();
    });
  });

  // 기울임/밑줄/취소선 토글
  panel.querySelectorAll('button[data-tgl]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!inspSel) return;
      const kind = btn.getAttribute('data-tgl');
      const cs = getComputedStyle(inspSel);
      if (kind === 'italic') {
        const undo = inspSnapshotStyle(inspSel, ['font-style']);
        inspApplyStyleStr('font-style', cs.fontStyle === 'italic' ? 'normal' : 'italic');
        inspPushUndo(undo);
      } else {
        const undo = inspSnapshotStyle(inspSel, ['text-decoration-line']);
        const cur = (cs.textDecorationLine || 'none').split(/\s+/).filter(s => s && s !== 'none');
        const i = cur.indexOf(kind);
        if (i >= 0) cur.splice(i, 1); else cur.push(kind);
        inspApplyStyleStr('text-decoration-line', cur.length ? cur.join(' ') : 'none');
        inspPushUndo(undo);
      }
      inspPanelUpdate();
    });
  });

  // 정렬
  panel.querySelectorAll('button[data-align]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!inspSel) return;
      const undo = inspSnapshotStyle(inspSel, ['text-align']);
      inspApplyStyleStr('text-align', btn.getAttribute('data-align'));
      inspPushUndo(undo);
      inspPanelUpdate();
    });
  });

  // 초기화 (쉼표로 묶인 다중 프로퍼티 행 지원)
  panel.querySelectorAll('.pp-row-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.getAttribute('data-prop').split(',').forEach(p => inspResetProp(p.trim()));
    });
  });
}

// 패널 값 갱신 (입력 중인 필드는 건드리지 않음)
function inspPanelUpdate() {
  inspUpdateMoveUI();
  const panel = document.getElementById('ppInspPanel');
  if (!panel) return;
  if (!editMode || !inspSel) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  const tagEl = document.getElementById('ppPanelTag');
  if (tagEl) {
    const cls = [...inspSel.classList].slice(0, 2).join('.');
    tagEl.textContent = inspSel.tagName.toLowerCase() + (cls ? '.' + cls : '');
  }
  const cs = getComputedStyle(inspSel);
  // 슬라이드 루트(캔버스)는 패딩만 조절 가능 — 실제 덱에서 .slide는
  // position:fixed라 너비/높이/마진 인라인이 의미 없거나 레이아웃을 깨뜨린다
  const isRoot = inspSel.classList.contains('slide-clone');
  panel.querySelectorAll('input[data-prop], select[data-prop], button[data-tgl], button[data-align]').forEach(c => {
    const prop = c.getAttribute('data-prop') || '';
    c.disabled = isRoot && prop.indexOf('padding') !== 0;
  });
  // 숫자 필드
  panel.querySelectorAll('input[type="number"][data-prop]').forEach(inp => {
    if (document.activeElement === inp) return;
    const v = parseFloat(cs.getPropertyValue(inp.getAttribute('data-prop')));
    inp.value = isNaN(v) ? '' : Math.round(v * 10) / 10;
  });
  // 폰트 — computed 첫 패밀리와 옵션의 첫 패밀리를 대조해 선택 표시
  const famSel = document.getElementById('ppSelFont');
  if (famSel && document.activeElement !== famSel) {
    const firstFam = f => (String(f).split(',')[0] || '').replace(/["']/g, '').trim().toLowerCase();
    const cur = firstFam(cs.fontFamily);
    let matched = '';
    famSel.querySelectorAll('option').forEach(o => { if (o.value && firstFam(o.value) === cur) matched = o.value; });
    famSel.value = matched;
  }
  // 굵기
  const wSel = document.getElementById('ppSelWeight');
  if (wSel && document.activeElement !== wSel) {
    const w = String(parseInt(cs.fontWeight, 10) || '');
    wSel.value = [...wSel.options].some(o => o.value === w) ? w : '';
  }
  // 색상 (완전 투명은 헥스 칸에 transparent로 표시)
  panel.querySelectorAll('input[type="color"][data-prop]').forEach(sw => {
    if (document.activeElement === sw) return;
    const prop = sw.getAttribute('data-prop');
    const hex = ppRgbToHex(cs.getPropertyValue(prop));
    sw.value = hex || (prop === 'color' ? '#000000' : '#ffffff');
    const tx = panel.querySelector(`input.pp-color-hex[data-prop="${prop}"]`);
    if (tx && document.activeElement !== tx) tx.value = hex || (prop === 'background-color' ? 'transparent' : '');
  });
  // 기울임/밑줄/취소선 활성 표시
  const deco = cs.textDecorationLine || '';
  panel.querySelectorAll('button[data-tgl]').forEach(btn => {
    const k = btn.getAttribute('data-tgl');
    btn.classList.toggle('on', k === 'italic' ? cs.fontStyle === 'italic' : deco.indexOf(k) !== -1);
  });
  // 정렬 활성 표시 (start/end → left/right 정규화)
  const ta = cs.textAlign === 'start' ? 'left' : cs.textAlign === 'end' ? 'right' : cs.textAlign;
  panel.querySelectorAll('button[data-align]').forEach(btn => {
    btn.classList.toggle('on', btn.getAttribute('data-align') === ta);
  });
  inspPanelMarkRows();
}

// 변경된(이번 세션에 덮어쓴) 프로퍼티 행 하이라이트 + 초기화 버튼 활성화
function inspPanelMarkRows() {
  const panel = document.getElementById('ppInspPanel');
  if (!panel || !inspSel) return;
  const eid = inspSel.getAttribute('data-pp-eid');
  const changed = (eid && inspOrig[eid]) || {};
  panel.querySelectorAll('.pp-panel-row').forEach(row => {
    // 스타일 행처럼 프로퍼티 여러 개를 묶은 행은 쉼표 목록 — 하나라도 변경이면 표시
    const isChanged = row.getAttribute('data-prop').split(',')
      .some(p => Object.prototype.hasOwnProperty.call(changed, p.trim()));
    row.classList.toggle('changed', isChanged);
    row.querySelector('.pp-row-reset').disabled = !isChanged;
  });
}

// 프로퍼티를 세션 시작 시점의 인라인 값으로 되돌린다
function inspResetProp(prop) {
  if (!inspSel) return;
  const eid = inspSel.getAttribute('data-pp-eid');
  const rec = eid && inspOrig[eid] && inspOrig[eid][prop];
  if (!rec) return;
  const el = inspSel;
  const undoFn = inspSnapshotStyle(el, [prop]); // 초기화 직전 값 캡처
  const { sEl, srcEl } = inspCounterparts(el);
  const restore = (t, val) => {
    if (!t) return;
    if (val) t.style.setProperty(prop, val);
    else t.style.removeProperty(prop);
  };
  restore(el, rec.d);
  restore(sEl, rec.s);
  restore(srcEl, rec.src);
  delete inspOrig[eid][prop];
  if (!Object.keys(inspOrig[eid]).length) delete inspOrig[eid];
  markEditsDirty();
  inspPanelUpdate();
  inspPushUndo(() => {
    undoFn();
    // 언두로 다시 "변경됨" 상태가 되므로 초기화 기록도 복원
    if (!inspOrig[eid]) inspOrig[eid] = {};
    inspOrig[eid][prop] = rec;
    inspPanelUpdate();
  });
}

// 이벤트 타깃 → 선택 가능한 요소로 정규화.
// SVG 내부는 SVG 루트로 스냅(아이콘 통째 선택), 프리뷰가 생성한
// content-wrapper 등 data-pp-eid 없는 요소(원본에 없음)는 조상으로 승격.
function inspPick(target) {
  if (!target || !target.closest) return null;
  let el = target;
  const svg = el.closest('svg');
  if (svg) el = svg;
  while (el && el !== document.body &&
         !(el.getAttribute && el.getAttribute('data-pp-eid'))) {
    el = el.parentElement;
  }
  if (!el || el === document.body || !el.closest('.slide-clone')) return null;
  // 슬라이드 루트(캔버스)도 선택 가능 — 박스모델(패딩/마진) 확인용.
  // 단 삭제/복제/크기·마진 핸들은 루트에서 비활성 (pp-root-sel)
  return el;
}

function inspSelect(el) {
  inspSel = el;
  inspPanelUpdate();
}

function inspClearSel() {
  inspSel = null;
  inspPanelUpdate();
}

// rAF 루프: 스크롤/줌/리사이즈와 무관하게 오버레이를 요소에 밀착
function inspLoop() {
  if (!editMode) { inspRaf = null; return; }
  if (inspSel && !document.contains(inspSel)) inspClearSel();
  if (inspHover && !document.contains(inspHover)) inspHover = null;

  const hb = document.getElementById('ppInspHover');
  const sb = document.getElementById('ppInspSel');
  if (hb) {
    if (inspHover && inspHover !== inspSel && !inspDragging) {
      const r = inspHover.getBoundingClientRect();
      hb.style.display = 'block';
      hb.style.left = r.left + 'px';
      hb.style.top = r.top + 'px';
      hb.style.width = r.width + 'px';
      hb.style.height = r.height + 'px';
    } else {
      hb.style.display = 'none';
    }
  }
  if (sb) {
    if (inspSel) {
      const r = inspSel.getBoundingClientRect();
      sb.style.display = 'block';
      sb.style.left = r.left + 'px';
      sb.style.top = r.top + 'px';
      sb.style.width = r.width + 'px';
      sb.style.height = r.height + 'px';
      // 캔버스(슬라이드 루트) 선택 시 삭제/복제·크기·마진 핸들 숨김 (CSS)
      sb.classList.toggle('pp-root-sel', inspSel.classList.contains('slide-clone'));
      inspUpdateAreas(sb);
    } else {
      sb.style.display = 'none';
    }
  }
  inspRaf = requestAnimationFrame(inspLoop);
}

// 선택 요소의 박스모델 시각화: 패딩(초록 빗살)·마진(주황 빗살)·콘텐츠(점선)
// inspBoxEls 캐시(mt/mr/mb/ml/pt/pr/pb/pl/content)의 위치를 매 프레임 갱신한다.
function inspUpdateAreas(sb) {
  if (!inspBoxEls || !inspSel) return;
  const cs = getComputedStyle(inspSel);
  const k = inspScale(inspSel) || 1;
  const v = p => Math.max(0, (parseFloat(cs.getPropertyValue(p)) || 0) * k);
  const pt = v('padding-top'), pr = v('padding-right'),
        pb = v('padding-bottom'), pl = v('padding-left');
  const mt = v('margin-top'), mr = v('margin-right'),
        mb = v('margin-bottom'), ml = v('margin-left');
  const px = n => n + 'px';
  const set = (key, st, show) => {
    const el = inspBoxEls[key];
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
    if (show) Object.assign(el.style, st);
  };
  // 패딩: 테두리 안쪽 스트립 (좌우 스트립은 상하 패딩과 겹치지 않게)
  set('pt', { left: '0px', right: '0px', top: '0px', height: px(pt), bottom: 'auto', width: 'auto' }, pt > 0.5);
  set('pb', { left: '0px', right: '0px', bottom: '0px', height: px(pb), top: 'auto', width: 'auto' }, pb > 0.5);
  set('pl', { left: '0px', top: px(pt), bottom: px(pb), width: px(pl), right: 'auto', height: 'auto' }, pl > 0.5);
  set('pr', { right: '0px', top: px(pt), bottom: px(pb), width: px(pr), left: 'auto', height: 'auto' }, pr > 0.5);
  // 마진: 테두리 바깥 스트립 (상하 스트립은 모서리까지 포함)
  set('mt', { left: px(-ml), right: px(-mr), top: px(-mt), height: px(mt), bottom: 'auto', width: 'auto' }, mt > 0.5);
  set('mb', { left: px(-ml), right: px(-mr), bottom: px(-mb), height: px(mb), top: 'auto', width: 'auto' }, mb > 0.5);
  set('ml', { left: px(-ml), top: '0px', bottom: '0px', width: px(ml), right: 'auto', height: 'auto' }, ml > 0.5);
  set('mr', { right: px(-mr), top: '0px', bottom: '0px', width: px(mr), left: 'auto', height: 'auto' }, mr > 0.5);
  // 콘텐츠 박스 점선 — 패딩이 전혀 없으면 선택 외곽선과 겹치므로 표시하지 않는다
  const hasPad = pt > 0.5 || pr > 0.5 || pb > 0.5 || pl > 0.5;
  set('content', { left: px(pl), top: px(pt), right: px(pr), bottom: px(pb), width: 'auto', height: 'auto' }, hasPad);
}

// 화면 px → 요소 로컬 px 변환 배율 (transform scale 등 누적 스케일)
function inspScale(el) {
  const r = el.getBoundingClientRect();
  if (el.offsetWidth && r.width) return r.width / el.offsetWidth;
  const p = el.parentElement; // SVG 등 offsetWidth 없는 요소는 부모 기준
  if (p && p.offsetWidth) return p.getBoundingClientRect().width / p.offsetWidth;
  return 1;
}

// eid로 saveDoc(저장용)·slides(소스) 카운터파트 찾기
function inspCounterparts(el) {
  const eid = el.getAttribute('data-pp-eid');
  if (!eid) return {};
  const q = `[data-pp-eid="${eid}"]`;
  const sEl = saveDoc ? saveDoc.querySelector(q) : null;
  let srcEl = null;
  for (const s of slides) {
    if (s.getAttribute('data-pp-eid') === eid) { srcEl = s; break; }
    const m = s.querySelector(q);
    if (m) { srcEl = m; break; }
  }
  return { eid, sEl, srcEl };
}

function inspPxToVw(px) {
  // 원본 파일 단위 체계: viewport width=1280 → 1vw = 12.8px
  let v = (px / 12.8).toFixed(4);
  v = v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return v + 'vw';
}

function inspApplyStyle(prop, px) {
  if (!inspSel) return;
  const v = Math.round(px * 10) / 10;
  const { eid, sEl, srcEl } = inspCounterparts(inspSel);
  // 첫 변경 시 원래 인라인 값을 기록해 두면 패널의 "초기화"로 되돌릴 수 있다
  if (eid) {
    if (!inspOrig[eid]) inspOrig[eid] = {};
    if (!Object.prototype.hasOwnProperty.call(inspOrig[eid], prop)) {
      inspOrig[eid][prop] = {
        d: inspSel.style.getPropertyValue(prop),
        s: sEl ? sEl.style.getPropertyValue(prop) : '',
        src: srcEl ? srcEl.style.getPropertyValue(prop) : ''
      };
    }
  }
  inspSel.style.setProperty(prop, v + 'px');
  if (sEl) sEl.style.setProperty(prop, inspPxToVw(v));
  if (srcEl) srcEl.style.setProperty(prop, v + 'px');
  markEditsDirty();
  return v;
}

// 값 문자열 프로퍼티(색·폰트·굵기·정렬·장식) 3벌 반영 — px→vw 변환이 필요 없는
// 프로퍼티용. 빈 값이면 인라인 선언을 제거해 상속/클래스 값으로 되돌린다.
function inspApplyStyleStr(prop, value) {
  if (!inspSel) return;
  const { eid, sEl, srcEl } = inspCounterparts(inspSel);
  if (eid) {
    if (!inspOrig[eid]) inspOrig[eid] = {};
    if (!Object.prototype.hasOwnProperty.call(inspOrig[eid], prop)) {
      inspOrig[eid][prop] = {
        d: inspSel.style.getPropertyValue(prop),
        s: sEl ? sEl.style.getPropertyValue(prop) : '',
        src: srcEl ? srcEl.style.getPropertyValue(prop) : ''
      };
    }
  }
  const set = t => {
    if (!t) return;
    if (value) t.style.setProperty(prop, value);
    else t.style.removeProperty(prop);
  };
  set(inspSel); set(sEl); set(srcEl);
  markEditsDirty();
}

// 'rgb(a)(...)' → '#rrggbb'. 완전 투명이면 '' 반환 (배경 없음 표시용)
function ppRgbToHex(v) {
  if (!v) return '';
  v = v.trim();
  if (v[0] === '#') return v;
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return '';
  const p = m[1].split(',').map(s => parseFloat(s));
  if (p.length > 3 && p[3] === 0) return '';
  return '#' + [0, 1, 2].map(i => (Math.round(p[i]) || 0).toString(16).padStart(2, '0')).join('');
}

function inspDragStart(e) {
  if (!inspSel) return;
  e.preventDefault();
  e.stopPropagation();
  const key = e.currentTarget.getAttribute('data-hkey');
  const conf = INSP_HANDLES.find(h => h[0] === key);
  if (!conf) return;
  const cs = getComputedStyle(inspSel);
  const undoProps = key === 'w' ? ['width'] : key === 'h' ? ['height']
    : key === 'wh' ? ['width', 'height'] : [conf[1]];
  inspDragging = {
    key, conf,
    scale: inspScale(inspSel) || 1,
    startX: e.clientX,
    startY: e.clientY,
    startW: parseFloat(cs.width) || 0,
    startH: parseFloat(cs.height) || 0,
    start: conf[1] ? (parseFloat(cs.getPropertyValue(conf[1])) || 0) : 0,
    moved: false,
    undoFn: inspSnapshotStyle(inspSel, undoProps) // 드래그 한 번 = 언두 한 단위
  };
  e.currentTarget.classList.add('pp-active'); // 드래그 중엔 핸들 항상 표시
  e.currentTarget.setPointerCapture(e.pointerId);
  e.currentTarget.addEventListener('pointermove', inspDragMove);
  e.currentTarget.addEventListener('pointerup', inspDragEnd, { once: true });
}

function inspDragMove(e) {
  const d = inspDragging;
  if (!d || !inspSel) return;
  d.moved = true;
  const dx = (e.clientX - d.startX) / d.scale;
  const dy = (e.clientY - d.startY) / d.scale;
  if (d.key === 'w' || d.key === 'wh') {
    inspApplyStyle('width', Math.max(8, d.startW + dx));
  }
  if (d.key === 'h' || d.key === 'wh') {
    inspApplyStyle('height', Math.max(8, d.startH + dy));
  }
  if (d.conf[1]) {
    const delta = (d.conf[2] === 'x' ? dx : dy) * d.conf[3];
    let val = d.start + delta;
    if (d.conf[1].indexOf('padding') === 0) val = Math.max(0, val);
    inspApplyStyle(d.conf[1], val);
  }
  inspPanelUpdate(); // 우측 패널 값 실시간 갱신
}

function inspDragEnd(e) {
  e.currentTarget.removeEventListener('pointermove', inspDragMove);
  e.currentTarget.classList.remove('pp-active');
  if (inspDragging && inspDragging.moved && inspDragging.undoFn) {
    inspPushUndo(inspDragging.undoFn);
  }
  inspDragging = null;
}

function inspDelete() {
  // 슬라이드 루트(캔버스)는 삭제 불가 — 페이지 배열이 깨진다
  if (!inspSel || inspSel.classList.contains('slide-clone')) return;
  const { sEl, srcEl } = inspCounterparts(inspSel);
  // 언두용: 세 문서 각각의 부모/다음형제 위치 기억
  const rec = [
    [inspSel, inspSel.parentNode, inspSel.nextSibling],
    [sEl, sEl && sEl.parentNode, sEl && sEl.nextSibling],
    [srcEl, srcEl && srcEl.parentNode, srcEl && srcEl.nextSibling]
  ];
  inspSel.remove();
  if (sEl) sEl.remove();
  if (srcEl) srcEl.remove();
  inspClearSel();
  inspHover = null;
  markEditsDirty();
  inspPushUndo(() => {
    rec.forEach(([el, parent, next]) => {
      if (!el || !parent) return;
      parent.insertBefore(el, (next && next.parentNode === parent) ? next : null);
    });
    markEditsDirty();
  });
}

// eid 재부여: 기존 eid → 새 eid 매핑을 한 번 만들어 모든 복제본에 동일 적용
// (이후의 텍스트/스타일 동기화가 복제본에서도 1:1로 작동)
function inspRetagAll(roots) {
  const map = {};
  roots.forEach(root => {
    if (!root) return;
    [root, ...root.querySelectorAll('[data-pp-eid]')].forEach(el => {
      const old = el.getAttribute('data-pp-eid');
      if (!old) return;
      if (!map[old]) map[old] = 'dup' + (++inspDupSeq) + '-' + Object.keys(map).length;
      el.setAttribute('data-pp-eid', map[old]);
    });
  });
}

function inspDuplicate() {
  // 슬라이드 루트(캔버스)는 복제 불가 — 페이지 인덱스/툴바와 동기화되지 않는다
  if (!inspSel || inspSel.classList.contains('slide-clone')) return;
  const { sEl, srcEl } = inspCounterparts(inspSel);
  const dNew = inspSel.cloneNode(true);
  const sNew = sEl ? sEl.cloneNode(true) : null;
  const srcNew = srcEl ? srcEl.cloneNode(true) : null;
  inspRetagAll([dNew, sNew, srcNew]);

  inspSel.after(dNew);
  if (sEl && sNew) sEl.after(sNew);
  if (srcEl && srcNew) srcEl.after(srcNew);
  markEditsDirty();
  inspSelect(dNew);
  inspPushUndo(() => {
    if (inspSel === dNew) inspClearSel();
    dNew.remove();
    if (sNew) sNew.remove();
    if (srcNew) srcNew.remove();
    markEditsDirty();
  });
}

// ── 복사/붙여넣기 ──
// 복사: 선택 요소의 3벌(display/saveDoc/src) 스냅샷을 클립보드에 보관.
// 붙여넣기: 현재 선택한 요소의 "자식"으로 삽입 — 마우스 커서 아래에 있는
// 직계 자식의 바로 다음 위치에, 자식 위에 없으면 맨 끝에 붙는다.

function inspCopy() {
  // 슬라이드 루트(캔버스) 통째 복사는 미지원 — 페이지 단위 관리와 충돌
  if (!inspSel || inspSel.classList.contains('slide-clone')) return;
  const { sEl, srcEl } = inspCounterparts(inspSel);
  inspClipboard = {
    d: inspSel.cloneNode(true),
    s: sEl ? sEl.cloneNode(true) : null,
    src: srcEl ? srcEl.cloneNode(true) : null
  };
  inspClipboardAt = Date.now();
  showToast(lang === 'ko'
    ? '요소 복사됨 — 붙여넣을 부모 요소를 선택하고 Ctrl+V'
    : 'Element copied — select a target parent, then Ctrl+V');
}

function inspPaste() {
  if (!inspClipboard || !inspSel) return;
  const dNew = inspClipboard.d.cloneNode(true);
  const sNew = inspClipboard.s ? inspClipboard.s.cloneNode(true) : null;
  const srcNew = inspClipboard.src ? inspClipboard.src.cloneNode(true) : null;
  inspRetagAll([dNew, sNew, srcNew]);

  // 마우스 커서 아래에 있는 inspSel의 직계 자식 → 그 다음 위치에 삽입
  let anchor = document.elementFromPoint(inspMouseX, inspMouseY);
  while (anchor && anchor.parentElement !== inspSel) anchor = anchor.parentElement;

  if (anchor) anchor.after(dNew);
  else inspSel.appendChild(dNew);

  // 카운터파트(saveDoc/src) 삽입 기준점 eid:
  // anchor 자체의 eid, 없으면(프리뷰 생성 content-wrapper 등) 서브트리의
  // 마지막 eid — "wrapper 다음" == 원본에서 "wrapper의 마지막 요소 다음"
  let refEid = null;
  if (anchor) {
    if (anchor.getAttribute && anchor.getAttribute('data-pp-eid')) {
      refEid = anchor.getAttribute('data-pp-eid');
    } else if (anchor.querySelectorAll) {
      const list = anchor.querySelectorAll('[data-pp-eid]');
      if (list.length) refEid = list[list.length - 1].getAttribute('data-pp-eid');
    }
  }
  const { sEl: sParent, srcEl: srcParent } = inspCounterparts(inspSel);
  const place = (parent, node) => {
    if (!parent || !node) return;
    let ref = refEid ? parent.querySelector(`[data-pp-eid="${refEid}"]`) : null;
    // 기준 요소가 깊이 중첩돼 있으면(예: wrapper의 마지막 요소가 카드 내부)
    // parent의 직계 자식까지 올라가서 그 다음에 삽입
    while (ref && ref !== parent && ref.parentElement !== parent) ref = ref.parentElement;
    if (ref && ref !== parent) ref.after(node);
    else parent.appendChild(node);
  };
  place(sParent, sNew);
  place(srcParent, srcNew);

  markEditsDirty();
  inspSelect(dNew);
  inspPushUndo(() => {
    if (inspSel === dNew) inspClearSel();
    dNew.remove();
    if (sNew) sNew.remove();
    if (srcNew) srcNew.remove();
    markEditsDirty();
  });
}

// ── 스타일 복사/붙여넣기 (Ctrl+Shift+C / Ctrl+Shift+V) ──
// 복사: 선택 요소(또는 텍스트 커서가 놓인 요소)의 class + 인라인 style 캡처.
// 붙여넣기:
//   · 텍스트를 드래그 선택 중이면 → 그 범위를 복사한 스타일의 인라인 요소로 감싼다
//     (예: .pt-c span 스타일을 다른 문구에 입히기)
//   · 요소를 선택 중이면 → 그 요소의 class/인라인 style을 복사한 값으로 교체 (3벌 반영)

let inspStyleClipboard = null; // { tag, className, styleAttr }

// 스타일 복사 원본: inspSel 우선, 없으면 텍스트 캐럿이 놓인 요소
function inspStyleSourceEl() {
  if (inspSel && !inspSel.classList.contains('slide-clone')) return inspSel;
  const ts = window.getSelection();
  const n = ts && ts.anchorNode;
  if (!n) return null;
  const el = n.nodeType === Node.TEXT_NODE ? n.parentElement : n;
  if (!el || !el.closest || !el.closest('.slide-clone')) return null;
  return inspPick(el);
}

function inspStyleCopy() {
  const el = inspStyleSourceEl();
  if (!el) {
    showToast(lang === 'ko'
      ? '스타일을 복사할 요소를 클릭하거나 텍스트에 커서를 두세요.'
      : 'Click an element or place the caret in text to copy its style.', true);
    return;
  }
  // 인라인 style은 saveDoc 카운터파트에서 가져온다 — display 클론에는
  // 미리보기 전용 인라인 스타일(px 변환·타이틀 줌 등)이 섞여 있을 수 있다
  const { sEl } = inspCounterparts(el);
  const styleRef = sEl || el;
  const INLINE_TAGS = /^(SPAN|B|I|EM|STRONG|U|SMALL|MARK|SUB|SUP)$/;
  inspStyleClipboard = {
    tag: INLINE_TAGS.test(el.tagName) ? el.tagName.toLowerCase() : 'span',
    className: el.getAttribute('class') || '',
    styleAttr: styleRef.getAttribute('style') || ''
  };
  const desc = [el.tagName.toLowerCase(),
                inspStyleClipboard.className ? '.' + inspStyleClipboard.className.trim().split(/\s+/).join('.') : '']
                .join('');
  showToast(lang === 'ko'
    ? `스타일 복사됨 (${desc}) — 텍스트를 드래그 선택하거나 요소 선택 후 Ctrl+Shift+V`
    : `Style copied (${desc}) — select text or an element, then Ctrl+Shift+V`);
}

function inspStylePaste() {
  if (!inspStyleClipboard) {
    showToast(lang === 'ko'
      ? '복사한 스타일이 없습니다 — 먼저 Ctrl+Shift+C로 스타일을 복사하세요.'
      : 'No style copied yet — use Ctrl+Shift+C first.', true);
    return;
  }
  const clip = inspStyleClipboard;

  // 1) 텍스트 범위 선택 중 → 복사한 스타일의 인라인 요소로 감싸기
  const ts = window.getSelection();
  if (ts && !ts.isCollapsed && ts.rangeCount) {
    const range = ts.getRangeAt(0);
    const cac = range.commonAncestorContainer;
    const host = cac.nodeType === Node.TEXT_NODE ? cac.parentElement : cac;
    if (host && host.closest && host.closest('.slide-clone')) {
      // 블록 요소가 걸친 범위는 감싸지 않는다 (구조 파손 방지)
      const probe = range.cloneContents();
      const INLINE = new Set(['B', 'I', 'EM', 'STRONG', 'SPAN', 'BR', 'U', 'SMALL', 'SUB', 'SUP', 'MARK']);
      const blockOk = Array.from(probe.querySelectorAll('*')).every(n => INLINE.has(n.tagName));
      if (!blockOk) {
        showToast(lang === 'ko'
          ? '한 문단 안의 텍스트만 선택해서 스타일을 입힐 수 있습니다.'
          : 'Select text within a single paragraph to apply the style.', true);
        return;
      }
      const wrap = document.createElement(clip.tag);
      if (clip.className) wrap.setAttribute('class', clip.className);
      if (clip.styleAttr) wrap.setAttribute('style', clip.styleAttr);
      try {
        range.surroundContents(wrap);
      } catch (err) {
        // 범위가 인라인 요소 경계를 걸치면 extract 후 감싼다
        wrap.appendChild(range.extractContents());
        range.insertNode(wrap);
      }
      ts.removeAllRanges();
      markEditsDirty();
      inspPushUndo(() => {
        const parent = wrap.parentNode;
        if (!parent) return;
        while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
        wrap.remove();
        parent.normalize();
        markEditsDirty();
      });
      showToast(lang === 'ko'
        ? '선택한 텍스트에 스타일이 적용되었습니다. ("저장"으로 파일에 반영)'
        : 'Style applied to the selected text. (Save to write to file)');
      return;
    }
  }

  // 2) 요소 선택 중 → class/인라인 style을 복사한 값으로 교체 (display/saveDoc/src 3벌)
  if (!inspSel || inspSel.classList.contains('slide-clone')) {
    showToast(lang === 'ko'
      ? '스타일을 입힐 텍스트를 드래그 선택하거나 요소를 클릭하세요.'
      : 'Select target text or click a target element first.', true);
    return;
  }
  const el = inspSel;
  const { sEl, srcEl } = inspCounterparts(el);
  const targets = [el, sEl, srcEl].filter(Boolean);
  const prev = targets.map(t => ({ t, c: t.getAttribute('class'), s: t.getAttribute('style') }));
  targets.forEach(t => {
    if (clip.className) t.setAttribute('class', clip.className);
    else t.removeAttribute('class');
    if (clip.styleAttr) t.setAttribute('style', clip.styleAttr);
    else t.removeAttribute('style');
  });
  markEditsDirty();
  inspPanelUpdate();
  inspPushUndo(() => {
    prev.forEach(o => {
      if (o.c === null) o.t.removeAttribute('class'); else o.t.setAttribute('class', o.c);
      if (o.s === null) o.t.removeAttribute('style'); else o.t.setAttribute('style', o.s);
    });
    markEditsDirty();
    inspPanelUpdate();
  });
  showToast(lang === 'ko'
    ? '요소에 스타일이 적용되었습니다. (Ctrl+Z로 취소 가능)'
    : 'Style applied to the element. (Ctrl+Z to undo)');
}

// ── 순서 이동 (리스트 항목 / 인라인 span) ──
// 선택 요소가 flex·grid 자식이나 <li>면 형제 사이에서 순서 이동('item'),
// 텍스트 컨테이너 안의 인라인 요소면 텍스트 내에서 위치 이동('inline')을
// 툴바 ◀▶ 버튼과 드래그(그립)로 제공한다. 다른 인스펙터 조작과 동일하게
// display 클론 + saveDoc + slides 소스 3벌에 동시 반영한다.

// 이동 가능 여부 판정 → null 또는 {kind, axis}
function inspMoveInfo(el) {
  if (!el || el.classList.contains('slide-clone')) return null;
  const parent = el.parentElement;
  if (!parent || !el.closest('.slide-clone')) return null;
  // 인라인 요소: 부모에 텍스트나 다른 인라인 형제가 있으면 텍스트 내 이동
  if (getComputedStyle(el).display.indexOf('inline') === 0) {
    const hasSib = Array.prototype.some.call(parent.childNodes, n => n !== el &&
      ((n.nodeType === Node.TEXT_NODE && n.nodeValue.trim()) ||
       (n.nodeType === Node.ELEMENT_NODE && getComputedStyle(n).display.indexOf('inline') === 0)));
    if (hasSib) return { kind: 'inline', axis: 'x' };
  }
  // 그 외: 형제 요소가 2개 이상이면 순서 이동 가능 (flex·grid·블록 스택 공통)
  if (parent.children.length < 2) return null;
  const pd = getComputedStyle(parent).display;
  let axis;
  if (/flex/.test(pd)) {
    axis = /column/.test(getComputedStyle(parent).flexDirection) ? 'y' : 'x';
  } else {
    // 형제 중심점 분포로 판정: 가로로만 퍼져 있으면 x, 그 외(세로 스택·2차원) y
    const items = Array.prototype.map.call(parent.children, s => {
      const r = s.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    const tol = 8;
    const multiCol = items.some(it => Math.abs(it.cx - items[0].cx) > tol);
    const multiRow = items.some(it => Math.abs(it.cy - items[0].cy) > tol);
    axis = multiCol && !multiRow ? 'x' : 'y';
  }
  return { kind: 'item', axis };
}

// 인라인 이동의 한 칸 기준 노드: 공백뿐인 텍스트 노드는 건너뛴다
function inspInlineStepRef(el, dir) {
  let n = dir < 0 ? el.previousSibling : el.nextSibling;
  while (n && n.nodeType === Node.TEXT_NODE && !n.nodeValue.replace(/​/g, '').trim()) {
    n = dir < 0 ? n.previousSibling : n.nextSibling;
  }
  return n;
}

// 선택 변경/이동 후 이동 컨트롤 표시 상태 갱신
function inspUpdateMoveUI() {
  const sb = document.getElementById('ppInspSel');
  if (!sb) return;
  const info = (editMode && inspSel && document.contains(inspSel)) ? inspMoveInfo(inspSel) : null;
  inspMoveCur = info;
  sb.classList.toggle('pp-can-move', !!info);
  sb.classList.toggle('pp-mv-y', !!(info && info.axis === 'y'));
  const bp = document.getElementById('ppInspMvPrev');
  const bn = document.getElementById('ppInspMvNext');
  if (!info) {
    if (bp) bp.disabled = true;
    if (bn) bn.disabled = true;
    return;
  }
  const prev = info.kind === 'item' ? inspSel.previousElementSibling : inspInlineStepRef(inspSel, -1);
  const next = info.kind === 'item' ? inspSel.nextElementSibling : inspInlineStepRef(inspSel, 1);
  if (bp) bp.disabled = !prev;
  if (bn) bn.disabled = !next;
}

// 요소의 현재 위치(부모/다음형제)를 3벌 캡처해 되돌리는 함수 반환
function inspSnapshotPosition(el) {
  const { sEl, srcEl } = inspCounterparts(el);
  const rec = [el, sEl, srcEl].map(n => n ? [n, n.parentNode, n.nextSibling] : null);
  return () => {
    rec.forEach(r => {
      if (!r || !r[1]) return;
      const [n, parent, next] = r;
      parent.insertBefore(n, (next && next.parentNode === parent) ? next : null);
    });
    markEditsDirty();
    inspPanelUpdate();
  };
}

// 부모 구조가 카운터파트와 정렬돼 있는지 (인덱스 기반 미러링 가능 여부)
function inspParentAligned(el, cEl) {
  if (!cEl || !cEl.parentNode) return false;
  const a = el.parentNode.childNodes, b = cEl.parentNode.childNodes;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].nodeType !== b[i].nodeType) return false;
  }
  return Array.prototype.indexOf.call(a, el) === Array.prototype.indexOf.call(b, cEl);
}

// el을 같은 부모의 ref 노드 앞/뒤로 이동 (ref=null → 맨 끝).
// 카운터파트 미러: ref가 eid 있는 요소면 eid로 찾고, 텍스트 노드 등이면
// 구조가 정렬된 경우에만 같은 인덱스의 노드를 기준으로 삼는다.
function inspMoveRelToNode(el, ref, before) {
  const parent = el.parentNode;
  if (!parent) return;
  if (ref) {
    if (ref === el || ref.parentNode !== parent) return;
    const next = before ? ref : ref.nextSibling;
    if (next === el || next === el.nextSibling) return; // 이미 그 위치
  } else if (!el.nextSibling) return;

  const undoFn = inspSnapshotPosition(el);
  const { sEl, srcEl } = inspCounterparts(el);
  // 미러 기준은 display 변경 "전"에 계산해야 인덱스가 유효하다
  const refEid = (ref && ref.nodeType === Node.ELEMENT_NODE && ref.getAttribute('data-pp-eid')) || null;
  const refIdx = ref ? Array.prototype.indexOf.call(parent.childNodes, ref) : -1;
  const mirror = (cEl) => {
    if (!cEl || !cEl.parentNode) return;
    if (!ref) { cEl.parentNode.appendChild(cEl); return; }
    let cRef = null;
    if (refEid) {
      cRef = Array.prototype.find.call(cEl.parentNode.children,
        c => c.getAttribute('data-pp-eid') === refEid) || null;
    } else if (inspParentAligned(el, cEl)) {
      cRef = cEl.parentNode.childNodes[refIdx] || null;
    }
    if (!cRef || cRef === cEl) return;
    cEl.parentNode.insertBefore(cEl, before ? cRef : cRef.nextSibling);
  };
  mirror(sEl);
  mirror(srcEl);
  parent.insertBefore(el, before ? ref : (ref ? ref.nextSibling : null));
  markEditsDirty();
  inspPushUndo(undoFn);
  inspPanelUpdate();
}

// 노드의 eid 조상 기준 자식 인덱스 경로 (각 단계의 childNodes 수 포함 —
// 카운터파트에서 구조가 어긋나면 resolve가 null을 반환하도록)
function inspNodePath(node, ancestor) {
  const path = [];
  let n = node;
  while (n && n !== ancestor) {
    const p = n.parentNode;
    if (!p) return null;
    path.unshift({ i: Array.prototype.indexOf.call(p.childNodes, n), len: p.childNodes.length });
    n = p;
  }
  return n === ancestor ? path : null;
}

function inspResolvePath(root, path) {
  let n = root;
  for (const step of path) {
    if (!n || n.childNodes.length !== step.len) return null;
    n = n.childNodes[step.i];
  }
  return n;
}

// el을 텍스트 노드의 offset 위치로 이동 (필요 시 텍스트 분할).
// textNode는 el 부모 서브트리 안의 텍스트면 중첩 인라인 내부여도 된다.
// 분할은 3벌에 동일하게 적용해 노드 수 정렬을 유지한다 — 텍스트 값은
// 저장 시 syncElementText가 display 기준으로 맞춘다.
function inspMoveIntoText(el, textNode, offset) {
  const parent = el.parentNode;
  if (!parent || !parent.contains(textNode) || el.contains(textNode)) return;
  const len = textNode.nodeValue.length;
  const mode = offset <= 0 ? 'before' : offset >= len ? 'after' : 'split';
  // 캐럿이 현재 위치 바로 옆 경계면 이동 불필요
  if (mode === 'before' && textNode === el.nextSibling) return;
  if (mode === 'after' && textNode === el.previousSibling) return;

  const undoPos = inspSnapshotPosition(el);
  const splitPairs = []; // 언두 시 재병합할 [앞 절반, 뒤 절반] 텍스트 노드 쌍
  const apply = (tEl, tText) => {
    const tp = tText.parentNode;
    if (mode === 'before') tp.insertBefore(tEl, tText);
    else if (mode === 'after') tp.insertBefore(tEl, tText.nextSibling);
    else {
      const after = tText.splitText(Math.min(offset, tText.nodeValue.length));
      splitPairs.push([tText, after]);
      tp.insertBefore(tEl, after);
    }
  };

  // 카운터파트 미러: textNode의 가장 가까운 eid 조상에서 인덱스 경로로 찾는다
  let anc = textNode.parentElement;
  while (anc && !(anc.getAttribute && anc.getAttribute('data-pp-eid'))) anc = anc.parentElement;
  const path = anc ? inspNodePath(textNode, anc) : null;
  if (anc && path) {
    const ancCp = inspCounterparts(anc);
    const elCp = inspCounterparts(el);
    [[elCp.sEl, ancCp.sEl], [elCp.srcEl, ancCp.srcEl]].forEach(([cEl, cAnc]) => {
      if (!cEl || !cAnc) return;
      const cText = inspResolvePath(cAnc, path);
      if (!cText || cText.nodeType !== Node.TEXT_NODE) return;
      apply(cEl, cText);
    });
  }
  apply(el, textNode);
  markEditsDirty();
  inspPushUndo(() => {
    undoPos(); // 요소를 원래 위치로 (3벌)
    // 분할했던 텍스트 노드를 재병합해 노드 수 정렬을 원상 복구
    splitPairs.forEach(([a, b]) => {
      if (a.parentNode && b.parentNode === a.parentNode) {
        a.nodeValue += b.nodeValue;
        b.remove();
      }
    });
  });
  inspPanelUpdate();
}

// ◀▶ 버튼: item은 형제 한 칸, inline은 인접 텍스트를 한 글자씩 통과
function inspMoveStep(dir) {
  if (!inspSel || !inspMoveCur) return;
  if (inspMoveCur.kind === 'item') {
    const ref = dir < 0 ? inspSel.previousElementSibling : inspSel.nextElementSibling;
    if (ref) inspMoveRelToNode(inspSel, ref, dir < 0);
    return;
  }
  // 인접 형제가 내용 있는 텍스트 노드면 그 안으로 한 글자만 이동
  const adj = dir < 0 ? inspSel.previousSibling : inspSel.nextSibling;
  if (adj && adj.nodeType === Node.TEXT_NODE && adj.nodeValue.replace(/​/g, '').trim()) {
    inspMoveIntoText(inspSel, adj, dir < 0 ? adj.nodeValue.length - 1 : 1);
    return;
  }
  // 텍스트가 없으면(요소·공백뿐) 노드 단위 한 칸
  const ref = inspInlineStepRef(inspSel, dir);
  if (ref) inspMoveRelToNode(inspSel, ref, dir < 0);
}

// ── 이동 드래그 (그립 핸들) ──

function inspMoveDragStart(e) {
  if (!inspSel || !inspMoveCur) return;
  e.preventDefault();
  e.stopPropagation();
  inspMoveDrag = { target: null, prevOpacity: inspSel.style.opacity };
  inspDragging = inspMoveDrag; // 드래그 중 호버 하이라이트 억제 (공용 플래그)
  inspSel.style.opacity = '0.45';
  const h = e.currentTarget;
  h.classList.add('pp-active');
  h.setPointerCapture(e.pointerId);
  h.addEventListener('pointermove', inspMoveDragMove);
  h.addEventListener('pointerup', inspMoveDragEnd, { once: true });
}

function inspMoveDragMove(e) {
  if (!inspMoveDrag || !inspSel || !inspMoveCur) return;
  inspMoveDrag.target = inspMoveCur.kind === 'item'
    ? inspItemDropTarget(e.clientX, e.clientY)
    : inspInlineDropTarget(e.clientX, e.clientY);
  inspShowDropLine(inspMoveDrag.target);
}

function inspMoveDragEnd(e) {
  const h = e.currentTarget;
  h.removeEventListener('pointermove', inspMoveDragMove);
  h.classList.remove('pp-active');
  const t = inspMoveDrag && inspMoveDrag.target;
  if (inspSel && inspMoveDrag) inspSel.style.opacity = inspMoveDrag.prevOpacity;
  inspMoveDrag = null;
  inspDragging = null;
  inspShowDropLine(null);
  if (!t || !inspSel) return;
  if (t.textNode) inspMoveIntoText(inspSel, t.textNode, t.offset);
  else inspMoveRelToNode(inspSel, t.ref, t.before);
}

// item 드롭 대상: 커서에서 가장 가까운 형제의 앞/뒤.
// 표시선 방향은 항목 전체의 배치로 판정한다 — 세로 스택이면 가로선,
// 한 줄(2~3단 컬럼 등)이면 세로선, 행·열이 모두 있는 랩된 grid만
// 커서 위치 기준으로 행/열을 구분한다.
function inspItemDropTarget(x, y) {
  const parent = inspSel.parentElement;
  if (!parent) return null;
  const items = [];
  Array.prototype.forEach.call(parent.children, s => {
    const r = s.getBoundingClientRect();
    items.push({ s, r, cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
  });
  if (items.length < 2) return null;
  const tol = 8;
  const multiCol = items.some(it => Math.abs(it.cx - items[0].cx) > tol);
  const multiRow = items.some(it => Math.abs(it.cy - items[0].cy) > tol);
  let best = null, bestD = Infinity;
  items.forEach(it => {
    if (it.s === inspSel) return;
    const d = (x - it.cx) * (x - it.cx) + (y - it.cy) * (y - it.cy);
    if (d < bestD) { bestD = d; best = it; }
  });
  if (!best) return null;
  let axisX;
  if (multiCol && !multiRow) axisX = true;        // 한 줄 가로 배치
  else if (multiRow && !multiCol) axisX = false;  // 세로 스택
  else axisX = Math.abs(y - best.cy) <= best.r.height / 2; // 랩된 grid
  const before = axisX ? x < best.cx : y < best.cy;
  return { ref: best.s, before, axisX };
}

// inline 드롭 대상: 캐럿 위치의 형제 텍스트 노드(+offset) 또는 형제 인라인 요소 앞/뒤
function inspInlineDropTarget(x, y) {
  const parent = inspSel.parentNode;
  let range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y);
    if (p) { range = document.createRange(); range.setStart(p.offsetNode, p.offset); range.collapse(true); }
  }
  if (!range) return null;
  const n = range.startContainer;
  // 부모 서브트리 안의 텍스트면 중첩 인라인 내부여도 글자 사이 드롭 허용
  if (n.nodeType === Node.TEXT_NODE && parent.contains(n) && !inspSel.contains(n)) {
    return { textNode: n, offset: range.startOffset, caretRect: inspCaretRect(range) };
  }
  if (n === parent) {
    const child = parent.childNodes[range.startOffset] || null;
    if (child === inspSel) return null;
    if (child) {
      const r = child.getBoundingClientRect ? child.getBoundingClientRect() : null;
      return { ref: child, before: true, axisX: true, rect: r };
    }
    return { ref: null, before: false, axisX: true }; // 맨 끝
  }
  // 형제 인라인 요소 내부 → 그 요소의 앞/뒤
  let elp = n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement;
  while (elp && elp.parentNode !== parent) elp = elp.parentElement;
  if (elp && elp !== inspSel) {
    const r = elp.getBoundingClientRect();
    return { ref: elp, before: x < r.left + r.width / 2, axisX: true };
  }
  return null;
}

// 접힌 range의 캐럿 사각형 (빈 rect면 컨테이너 기준 폴백)
function inspCaretRect(range) {
  const r = range.getClientRects()[0] || range.getBoundingClientRect();
  if (r && (r.width || r.height)) return r;
  const n = range.startContainer;
  const host = n.nodeType === Node.TEXT_NODE ? n.parentElement : n;
  return host ? host.getBoundingClientRect() : null;
}

// 드롭 위치 표시선 갱신
function inspShowDropLine(t) {
  const dl = document.getElementById('ppInspDropLine');
  if (!dl) return;
  let x, y, w, h;
  if (t && t.caretRect) {
    x = t.caretRect.left - 1; y = t.caretRect.top; w = 2; h = t.caretRect.height || 16;
  } else if (t && t.ref) {
    const r = t.ref.getBoundingClientRect ? t.ref.getBoundingClientRect() : null;
    if (!r) { dl.style.display = 'none'; return; }
    if (t.axisX) { x = (t.before ? r.left : r.right) - 1.5; y = r.top; w = 3; h = r.height; }
    else { x = r.left; y = (t.before ? r.top : r.bottom) - 1.5; w = r.width; h = 3; }
  } else if (t && t.ref === null && inspSel && inspSel.parentNode) {
    // 맨 끝 드롭: 부모의 마지막 지점
    const pr = inspSel.parentNode.getBoundingClientRect();
    x = pr.right - 2; y = pr.top; w = 3; h = pr.height;
  } else {
    dl.style.display = 'none';
    return;
  }
  dl.style.display = 'block';
  dl.style.left = x + 'px';
  dl.style.top = y + 'px';
  dl.style.width = w + 'px';
  dl.style.height = h + 'px';
}

// Insert a <br> element at the current caret position (used for Enter in edit mode)
function insertBrAtCaret() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const br = document.createElement('br');
  range.insertNode(br);
  // Anchor the caret in a zero-width-space text node AFTER the <br> — a bare
  // caret after a trailing <br> gets normalized to before it, so typed text
  // would land on the wrong side. The ZWSP is stripped when saving.
  const anchor = document.createTextNode('\u200B');
  br.parentNode.insertBefore(anchor, br.nextSibling);
  range.setStart(anchor, 1);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  markEditsDirty();
}

function markEditsDirty() {
  editsDirty = true;
  const btn = document.getElementById('saveEditsBtn');
  if (btn) {
    btn.disabled = false;
    btn.classList.add('dirty');
  }
}

function clearEditsDirty() {
  editsDirty = false;
  const btn = document.getElementById('saveEditsBtn');
  if (btn) {
    btn.disabled = true;
    btn.classList.remove('dirty');
  }
}

// Copy edited text from a clone element into its pristine source counterpart.
// Fast path: same number of direct text nodes → copy values only (preserves
// the file's original formatting/whitespace everywhere else).
// Fallback (structure changed by editing): transfer innerHTML, but only for
// elements whose content is plain inline markup.
function syncElementText(cloneEl, srcEl) {
  const cTexts = Array.from(cloneEl.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
  const sTexts = Array.from(srcEl.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);

  if (cTexts.length === sTexts.length) {
    let changed = false;
    cTexts.forEach((n, k) => {
      const value = n.nodeValue.replace(/\u200B/g, ''); // strip caret-anchor ZWSP
      if (sTexts[k].nodeValue !== value) {
        sTexts[k].nodeValue = value;
        changed = true;
      }
    });
    return changed;
  }

  // Structure changed — only safe to transfer if content is inline-only
  const INLINE = new Set(['B', 'I', 'EM', 'STRONG', 'SPAN', 'BR', 'U', 'SMALL', 'SUB', 'SUP', 'MARK']);

  const tmp = cloneEl.cloneNode(true);
  // contenteditable에서 Enter로 줄을 나누면 <div>줄</div>이 생긴다.
  // 내용이 인라인 전용인 자식 <div>는 <br> + 내용으로 정규화해
  // 원본 파일의 <br> 줄바꿈 관례를 유지한다.
  Array.from(tmp.children).forEach(child => {
    if (child.tagName === 'DIV' &&
        Array.from(child.querySelectorAll('*')).every(el => INLINE.has(el.tagName))) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createElement('br'));
      while (child.firstChild) frag.appendChild(child.firstChild);
      child.replaceWith(frag);
    }
  });

  // clone 쪽만 인라인 전용이면 저장한다. src 쪽 구조는 검사하지 않는다 —
  // 사용자가 복잡한 구조(중첩 div 등)를 인라인 텍스트로 단순화한 편집
  // (줄 삭제 등)도 저장되어야 하기 때문. clone이 인라인 전용이라는 것은
  // 최종 내용이 단순 텍스트라는 뜻이므로 그대로가 사용자의 의도다.
  const cloneOk = Array.from(tmp.querySelectorAll('*')).every(el => INLINE.has(el.tagName));
  if (!cloneOk) return false;
  // Strip preview-only attributes (keep data-pp-eid — stripped at serialization)
  [tmp, ...tmp.querySelectorAll('*')].forEach(el => {
    el.removeAttribute('data-orig-font-size');
    el.removeAttribute('data-orig-title-font-size');
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
  });
  srcEl.innerHTML = tmp.innerHTML.replace(/\u200B/g, ''); // strip caret-anchor ZWSP
  return true;
}

// Sync all edits from the rendered clones into saveDoc
// 반환: { synced: 반영된 요소 수, failedPages: 텍스트가 다른데 반영 못 한 페이지 번호(1-base) }
function syncEditsToSaveDoc() {
  const sMap = {};
  saveDoc.querySelectorAll('[data-pp-eid]').forEach(el => {
    sMap[el.getAttribute('data-pp-eid')] = el;
  });

  let syncedCount = 0;
  const clones = Array.from(document.querySelectorAll('.slide-clone'));
  clones.forEach(clone => {
    const els = [clone, ...clone.querySelectorAll('[data-pp-eid]')];
    els.forEach(el => {
      const eid = el.getAttribute('data-pp-eid');
      const src = eid && sMap[eid];
      if (src && syncElementText(el, src)) syncedCount++;
    });
  });

  // 동기화 후 검증: 슬라이드 텍스트가 saveDoc과 여전히 다르면
  // 그 페이지의 편집은 파일에 반영되지 못한 것 (복잡한 구조 등).
  // 조용히 넘어가지 않고 호출부에서 사용자에게 알린다.
  const norm = s => s.replace(/​/g, '').replace(/\s+/g, ' ').trim();
  const sSlides = saveDoc.querySelectorAll('.slide');
  const failedPages = [];
  clones.forEach((clone, i) => {
    const ss = sSlides[i];
    if (ss && norm(clone.textContent) !== norm(ss.textContent)) failedPages.push(i + 1);
  });

  return { synced: syncedCount, failedPages };
}

function serializeSaveDoc() {
  const root = saveDoc.documentElement.cloneNode(true);
  root.querySelectorAll('[data-pp-eid]').forEach(el => el.removeAttribute('data-pp-eid'));
  let html = '<!DOCTYPE html>\n' + root.outerHTML + '\n';
  // The DOM serializer expands self-closing SVG shape tags (<path/> → <path></path>).
  // Collapse them back to keep the saved file close to the original formatting.
  html = html.replace(/><\/(path|line|circle|rect|polyline|polygon|ellipse|stop|use)>/g, '/>');
  // The parser moves whitespace after </html> into the body — normalize the tail
  // so repeated load/save cycles don't accumulate blank lines.
  html = html.replace(/\s*(<\/body><\/html>)\s*$/, '\n$1\n');
  return html;
}

// 저장 버튼 상태 표시: default(저장) / saving(저장 중…) / saved(저장됨 ✓)
function setSaveBtnState(state) {
  const btn = document.getElementById('saveEditsBtn');
  if (!btn) return;
  const ko = btn.querySelector('span[data-lang="ko"]');
  const en = btn.querySelector('span[data-lang="en"]');
  btn.classList.remove('saving', 'saved');
  if (state === 'saving') {
    btn.classList.add('saving');
    btn.disabled = true;
    if (ko) ko.textContent = '저장 중…';
    if (en) en.textContent = 'Saving…';
  } else if (state === 'saved') {
    btn.classList.add('saved');
    btn.disabled = true;
    if (ko) ko.textContent = '저장됨 ✓';
    if (en) en.textContent = 'Saved ✓';
    setTimeout(() => setSaveBtnState('default'), 2000);
  } else {
    if (ko) ko.textContent = '저장';
    if (en) en.textContent = 'Save';
    btn.disabled = !editsDirty;
    btn.classList.toggle('dirty', editsDirty);
  }
}

// 저장 진입점 (버튼 클릭 + Ctrl+S) — 진행/완료 상태를 버튼에 표시
async function saveEdits() {
  if (!saveDoc) return;
  setSaveBtnState('saving');
  try {
    await doSaveEdits();
  } finally {
    // 성공 경로들은 clearEditsDirty()를 호출하므로 dirty 여부로 결과 판별
    setSaveBtnState(editsDirty ? 'default' : 'saved');
  }
}

async function doSaveEdits() {
  if (!saveDoc) return;

  const { synced, failedPages } = syncEditsToSaveDoc();
  const newHtml = serializeSaveDoc();

  // 반영 실패를 조용히 넘기지 않는다 — 구조가 복잡해 동기화하지 못한
  // 페이지가 있으면 사용자에게 알린다 (파일 저장 자체는 계속 진행).
  if (failedPages.length) {
    showToast(lang === 'ko'
      ? `주의: ${failedPages.join(', ')}페이지의 일부 편집은 구조가 복잡해 파일에 반영되지 않습니다.`
      : `Warning: edits on page(s) ${failedPages.join(', ')} could not be applied to the file (complex structure).`, true);
  }

  // 미리보기를 연 후 다른 곳(다른 세션·에디터)에서 원본 파일이 수정됐다면
  // 그대로 덮어쓰면 그 변경이 유실된다 — 저장 전에 확인받는다.
  try {
    const cur = await fetch(`../ir/${irVersion}/index.html`, { cache: 'no-store' });
    if (cur.ok) {
      const curText = await cur.text();
      if (curText !== sourceHtml) {
        const msg = lang === 'ko'
          ? '미리보기를 연 후 원본 파일이 다른 곳에서 수정되었습니다.\n지금 저장하면 그 변경사항이 덮어써져 사라집니다.\n\n그래도 저장할까요?\n(취소 후 새로고침하면 최신 파일 기준으로 다시 편집할 수 있습니다)'
          : 'The source file was modified elsewhere after this preview loaded.\nSaving now will overwrite those changes.\n\nSave anyway?';
        if (!confirm(msg)) return;
      }
    }
  } catch (e) { /* 파일 재확인 실패 시 기존 동작대로 저장 진행 */ }

  // 1) Server save endpoint — writes ir/<version>/index.html directly
  //    로컬: node server.js (인증 없음, 토큰 헤더 무시)
  //    실서버: api/save-ir/index.php (X-Save-Token 인증, 401이면 비밀번호 입력받아 재시도)
  try {
    // 기본 토큰 내장 — 사용자에게 비밀번호를 묻지 않는다 (단독 사용 전제).
    // 서버(api/save-ir/index.php)의 TOKEN_HASH를 바꾼 경우에만 401 → 입력창이 뜬다.
    const DEFAULT_SAVE_TOKEN = 'weven-546bf4e9';
    let saveToken = DEFAULT_SAVE_TOKEN;
    try { saveToken = localStorage.getItem('irSaveToken') || DEFAULT_SAVE_TOKEN; } catch (e) {}
    for (let attempt = 0; attempt < 3; attempt++) {
      // 주의: 끝 슬래시 필수 — 실서버(Apache)는 /api/save-ir 를 301로 돌리며 POST가 GET으로 바뀐다
      const res = await fetch('/api/save-ir/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Save-Token': saveToken },
        body: JSON.stringify({ ir: irVersion, html: newHtml })
      });
      if (res.ok) {
        const data = await res.json();
        sourceHtml = newHtml;
        clearEditsDirty();
        showToast(lang === 'ko'
          ? `서버에 저장되었습니다: ${data.path} (변경된 요소 ${synced}개)`
          : `Saved on server: ${data.path} (${synced} elements changed)`);
        return;
      }
      if (res.status === 401) {
        const input = prompt(lang === 'ko'
          ? (attempt === 0 && saveToken === ''
              ? '서버 저장 비밀번호를 입력하세요:'
              : '비밀번호가 올바르지 않습니다. 다시 입력하세요:')
          : 'Enter the server save password:');
        if (input === null || input === '') return; // 취소 → 저장 중단
        saveToken = input;
        try { localStorage.setItem('irSaveToken', saveToken); } catch (e) {}
        continue;
      }
      if (res.status !== 404 && res.status !== 405) {
        // Endpoint exists but rejected the save — report instead of silently falling back
        let msg = 'HTTP ' + res.status;
        try { msg = (await res.json()).error || msg; } catch (e) {}
        showToast((lang === 'ko' ? '서버 저장 실패: ' : 'Server save failed: ') + msg, true);
        return;
      }
      break; // 404/405 → static server without save API, fall through to local file save
    }
  } catch (e) {
    // Network/endpoint unavailable, fall through to local file save
  }

  // 2) Fallback: File System Access API (Chrome/Edge, localhost/https)
  if (window.showOpenFilePicker) {
    try {
      if (!fileHandle) {
        showToast(lang === 'ko'
          ? `저장할 원본 파일을 선택하세요: ir/${irVersion}/index.html`
          : `Select the source file: ir/${irVersion}/index.html`);
        const [handle] = await window.showOpenFilePicker({
          id: 'ir-source-' + irVersion,
          types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }]
        });
        // Safety check: picked file must match what this preview was loaded from
        const picked = await handle.getFile();
        const pickedText = await picked.text();
        if (pickedText !== sourceHtml) {
          const msg = lang === 'ko'
            ? '선택한 파일 내용이 현재 미리보기의 원본과 다릅니다.\n(다른 파일이거나, 미리보기를 연 후 파일이 수정되었습니다)\n\n그래도 덮어쓸까요?'
            : 'The selected file differs from what this preview loaded.\nOverwrite anyway?';
          if (!confirm(msg)) return;
        }
        const perm = await handle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          showToast(lang === 'ko' ? '쓰기 권한이 거부되었습니다.' : 'Write permission denied.', true);
          return;
        }
        fileHandle = handle;
      }

      const writable = await fileHandle.createWritable();
      await writable.write(newHtml);
      await writable.close();
      sourceHtml = newHtml;
      clearEditsDirty();
      showToast(lang === 'ko'
        ? `원본 파일에 저장되었습니다. (변경된 요소 ${synced}개)`
        : `Saved to source file. (${synced} elements changed)`);
    } catch (e) {
      if (e && e.name === 'AbortError') return; // user cancelled picker
      console.error('Save failed:', e);
      showToast((lang === 'ko' ? '저장 실패: ' : 'Save failed: ') + e.message, true);
    }
    return;
  }

  // Fallback: download the updated file
  const blob = new Blob([newHtml], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'index.html';
  a.click();
  URL.revokeObjectURL(a.href);
  clearEditsDirty();
  showToast(lang === 'ko'
    ? `이 브라우저는 직접 저장을 지원하지 않아 다운로드했습니다. ir/${irVersion}/index.html 에 덮어쓰세요.`
    : `Direct save not supported — downloaded instead. Replace ir/${irVersion}/index.html with it.`);
}

let toastTimer = null;
function showToast(text, isError) {
  let toast = document.getElementById('ppToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ppToast';
    toast.className = 'pp-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.toggle('error', !!isError);
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}


function closePreview() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}

// Browser print
function browserPrint() {
  window.print();
}

// Load external script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load: ' + src));
    document.head.appendChild(script);
  });
}

// html2canvas 1.4.1 can't parse CSS color() function (color(srgb ...) / color(display-p3 ...))
// Modern Chrome serializes ALL computed colors in this format.
// Fix: fetch html2canvas source, patch SUPPORTED_COLOR_FUNCTIONS to add "color" handler, then exec.
async function loadHtml2canvasPatched() {
  const res = await fetch('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  let src = await res.text();
  // Inject "color" function handler into SUPPORTED_COLOR_FUNCTIONS = { hsl:..., rgb:... }
  // color(srgb r g b) or color(srgb r g b / a) — args are CSS tokens with .type and .number
  // Token types: 17=NUMBER, 20=IDENT, 31=WHITESPACE, 4=COMMA, etc.
  // We filter non-separator tokens, skip the colorspace ident, read float values, convert to 0-255.
  src = src.replace(
    /rgba:\s*(\w+)\s*}/,
    'rgba:$1,color:function(c,a){' +
      'var t=a.filter(function(v){return v.type!==31&&v.type!==4});' +  // remove whitespace/comma
      'var n=t.filter(function(v){return v.type===17});' +              // number tokens only
      'if(n.length>=3){' +
        'var r=Math.round(Math.min(1,Math.max(0,n[0].number))*255);' +
        'var g=Math.round(Math.min(1,Math.max(0,n[1].number))*255);' +
        'var b=Math.round(Math.min(1,Math.max(0,n[2].number))*255);' +
        'var al=n.length>=4?n[3].number:1;' +
        'return((r<<24)|(g<<16)|(b<<8)|(Math.round(al*255)<<0))>>>0' +
      '}return 0' +
    '}}'
  );
  const script = document.createElement('script');
  script.textContent = src;
  document.head.appendChild(script);
}

// Export to PDF
async function exportPDF() {
  showLoading(lang === 'ko' ? '라이브러리 로딩 중...' : 'Loading libraries...');

  try {
    // Load libraries
    if (typeof html2canvas === 'undefined') {
      await loadHtml2canvasPatched();
    }
    if (!window.jspdf) {
      await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js');
    }
  } catch (e) {
    showError(lang === 'ko' ? '라이브러리 로딩 실패' : 'Failed to load libraries');
    setTimeout(hideLoading, 2000);
    return;
  }

  const jsPDF = window.jspdf.jsPDF;

  // 16:9 landscape PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [338.67, 190.5]
  });
  const pW = 338.67, pH = 190.5;

  for (let i = 0; i < total; i++) {
    setLoadingProgress(
      ((i + 1) / total * 100),
      (lang === 'ko' ? 'PDF 생성 중' : 'Generating PDF') + `... (${i + 1}/${total})`
    );

    const frame = document.getElementById('previewFrame' + i);
    if (!frame) continue;

    const clone = frame.querySelector('.slide-clone');
    if (!clone) continue;

    try {
      // Temporarily set clone to full size for capture
      const originalTransform = clone.style.transform;
      clone.style.transform = 'none';
      clone.style.position = 'relative';

      // Determine background color based on IR version (light vs dark theme)
      const isLightTheme = irVersion === '2602' || irVersion === '260202';
      const bgColor = irVersion === '260814_introduce' ? '#FDFDFF' : isLightTheme ? '#FFFFFF' : '#0A0E27';

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgColor,
        width: 1280,
        height: 720,
        logging: false
      });

      // Restore transform
      clone.style.transform = originalTransform;
      clone.style.position = '';

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pW, pH);
    } catch (e) {
      console.error('Slide ' + (i + 1) + ' capture failed:', e);
      if (i > 0) pdf.addPage();
    }
  }

  // Save PDF
  const filename = 'Zaemit_' + irVersion + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
  pdf.save(filename);

  hideLoading();
}

// ═══════════════════════════════════════════════════════════
// PAGE MANAGEMENT — 페이지 순서 이동·복제 추가·삭제
// slides(소스 문서)·saveDoc(원본 저장용)·페이지별 설정 배열·화면을
// 함께 갱신한다. 변경 후 "원본 저장"을 눌러야 ir/<버전>/index.html에
// 반영된다 (텍스트 편집과 동일한 저장 흐름).
// ═══════════════════════════════════════════════════════════

let pageDupSeq = 0;

// slides[idx]의 saveDoc 카운터파트 (.slide 루트는 항상 data-pp-eid 보유)
function saveDocSlideOf(idx) {
  if (!saveDoc || !slides[idx]) return null;
  const eid = slides[idx].getAttribute('data-pp-eid');
  return eid ? saveDoc.querySelector(`.slide[data-pp-eid="${eid}"]`) : null;
}

// 페이지별 설정 배열 전체에 같은 구조 변경 적용
function forEachPageSetting(op) {
  [pageZooms, pageAlignments, pageLayouts, pageFontDeltas, pageTitleZooms, pageTitleFontDeltas].forEach(op);
}

// 클론의 미저장 텍스트 편집을 소스(slides)에도 반영 — 재렌더링으로 유실 방지
function syncEditsToSrc() {
  const map = {};
  slides.forEach(s => {
    [s, ...s.querySelectorAll('[data-pp-eid]')].forEach(el => {
      map[el.getAttribute('data-pp-eid')] = el;
    });
  });
  document.querySelectorAll('.slide-clone').forEach(clone => {
    [clone, ...clone.querySelectorAll('[data-pp-eid]')].forEach(el => {
      const src = map[el.getAttribute('data-pp-eid')];
      if (src) syncElementText(el, src);
    });
  });
}

// 구조 변경 전 공통 준비: 미저장 편집 동기화 + 인스펙터 선택 해제
function beforePageChange() {
  if (saveDoc) syncEditsToSaveDoc();
  syncEditsToSrc();
  if (typeof inspClearSel === 'function') inspClearSel();
  if (typeof inspHover !== 'undefined') inspHover = null;
}

// 구조 변경 후 공통 마무리: 재렌더링 + 페이지별 설정 재적용 + 대상으로 스크롤
function afterPageChange(focusIdx) {
  renderSlides();
  requestAnimationFrame(() => {
    applyAllTitleZooms();
    applyAllTitleFontDeltas();
    applyAllFontDeltas();
    if (editMode) {
      document.querySelectorAll('.slide-clone').forEach(c => {
        c.setAttribute('contenteditable', 'true');
        c.setAttribute('spellcheck', 'false');
      });
    }
    const w = document.getElementById('slideWrapper' + focusIdx);
    if (w) w.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  markEditsDirty();
  saveZooms();
}

function movePage(idx, dir) {
  const j = idx + dir;
  if (j < 0 || j >= slides.length) return;
  beforePageChange();
  // saveDoc DOM 순서 변경 (직렬화 순서가 곧 저장 파일의 페이지 순서)
  const a = saveDocSlideOf(idx), b = saveDocSlideOf(j);
  if (a && b) (dir < 0 ? b.before(a) : b.after(a));
  // 소스 문서 DOM 순서도 함께 변경 (문서 순회 일관성 유지)
  const sa = slides[idx], sb = slides[j];
  if (sa.parentNode && sa.parentNode === sb.parentNode) (dir < 0 ? sb.before(sa) : sb.after(sa));
  // 배열(슬라이드 + 페이지별 설정) 스왑
  [slides[idx], slides[j]] = [slides[j], slides[idx]];
  forEachPageSetting(arr => { [arr[idx], arr[j]] = [arr[j], arr[idx]]; });
  afterPageChange(j);
}

function deletePage(idx) {
  if (slides.length <= 1) {
    showToast(lang === 'ko' ? '마지막 페이지는 삭제할 수 없습니다.' : 'Cannot delete the last page.', true);
    return;
  }
  const titleKey = 'title' + lang.charAt(0).toUpperCase() + lang.slice(1);
  const title = slides[idx].dataset[titleKey] || String(idx + 1);
  const msg = lang === 'ko'
    ? (idx + 1) + '페이지(' + title + ')를 삭제할까요?\n"저장"을 눌러야 파일에서도 삭제됩니다.'
    : 'Delete page ' + (idx + 1) + ' (' + title + ')?\nUse "Save" to persist the change.';
  if (!confirm(msg)) return;
  beforePageChange();
  const sEl = saveDocSlideOf(idx);
  if (sEl) sEl.remove();
  if (slides[idx].parentNode) slides[idx].remove();
  slides.splice(idx, 1);
  total = slides.length;
  forEachPageSetting(arr => arr.splice(idx, 1));
  afterPageChange(Math.min(idx, slides.length - 1));
}

function addPageAfter(idx) {
  beforePageChange();
  const src = slides[idx];
  const sEl = saveDocSlideOf(idx);
  const srcNew = src.cloneNode(true);
  const sNew = sEl ? sEl.cloneNode(true) : null;
  // eid 재부여: 소스/saveDoc 복제본에 동일한 새 eid 매핑 적용
  // (이후 텍스트 편집·인스펙터 동기화가 복제 페이지에서도 1:1로 작동)
  pageDupSeq++;
  const map = {};
  const retag = (root) => {
    if (!root) return;
    [root, ...root.querySelectorAll('[data-pp-eid]')].forEach(el => {
      const old = el.getAttribute('data-pp-eid');
      if (!old) return;
      if (!map[old]) map[old] = 'pg' + pageDupSeq + '-' + Object.keys(map).length;
      el.setAttribute('data-pp-eid', map[old]);
    });
  };
  retag(srcNew);
  retag(sNew);
  if (src.parentNode) src.after(srcNew);
  if (sEl && sNew) sEl.after(sNew);
  slides.splice(idx + 1, 0, srcNew);
  total = slides.length;
  forEachPageSetting(arr => {
    const v = arr[idx];
    const copy = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
    arr.splice(idx + 1, 0, copy);
  });
  afterPageChange(idx + 1);
}
