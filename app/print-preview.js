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
let titleAlignH = 'left';  // left, center, right (title horizontal alignment)
let contentAlignV = 'middle';  // top, middle, bottom
let contentAlignH = 'center';  // left, center, right

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
    const savedTitleAlignH = localStorage.getItem('printPreviewTitleAlignH');
    if (savedTitleAlignH) {
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
    localStorage.setItem('printPreviewTitleAlignH', titleAlignH);
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

    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

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

    // Apply language class to body (required for 260202 CSS rules)
    document.body.classList.remove('ko', 'en', 'ja');
    document.body.classList.add(lang);

    // Apply theme class based on IR version
    const isLightTheme = irVersion === '2602' || irVersion === '260202';
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    }

    // Get all slides
    const slideElements = doc.querySelectorAll('.slide');
    slides = Array.from(slideElements);
    total = slides.length;

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
        const fallbackColor = isLightTheme ? '#6366F1' : is260304 ? '#3B82F6' : '#00D4AA';

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
  const isLightTheme = irVersion === '2602' || irVersion === '260202';
  const isCover = clone.classList.contains('cover');

  if (isLightTheme) {
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
  const titleSelectors = isCover ? [] : ['.section-label', '.section-title', '.section-desc'];

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

    // Apply to title elements
    const titleSelectors = ['.section-label', '.section-title', '.section-desc'];
    titleSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => {
        el.style.setProperty('text-align', alignH, 'important');
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
      el.style.setProperty('text-align', alignH, 'important');
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

  // Reset global alignments to defaults
  titleAlignH = 'left';
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
      const bgColor = isLightTheme ? '#FFFFFF' : '#0A0E27';

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
