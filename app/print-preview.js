// ── PRINT PREVIEW JAVASCRIPT ──

// Global variables
let slides = [];
let total = 0;
let lang = 'ko';
let irVersion = '2601';  // IR 버전 (기본값)
let pageZooms = [];
let pageAlignments = [];  // [{titleH: 'left', contentV: 'top', contentH: 'center'}, ...]
let globalZoom = 100;
let titleScale = 100;
let titleAlignH = 'left';  // left, center, right (title horizontal alignment)
let contentAlignV = 'middle';  // top, middle, bottom
let contentAlignH = 'center';  // left, center, right

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Get parameters from URL
  const params = new URLSearchParams(window.location.search);
  lang = params.get('lang') || 'ko';
  irVersion = params.get('ir') || '2601';  // IR 버전 파라미터

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
      newStyle.textContent = styleEl.textContent;
      document.head.appendChild(newStyle);
    }

    // Apply language class to body
    if (lang === 'en') {
      document.body.classList.add('en');
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

    // Render slides
    renderSlides();

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
    // Apply saved title scale
    applyTitleScale(titleScale);
    // Apply saved alignments
    applyTitleAlignment();
    applyContentAlignment();
    // Update global toolbar button states
    updateGlobalTitleAlignButtons();
  }, 100);
}

// Create slide wrapper element
function createSlideWrapper(slide, idx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'preview-slide-wrapper';
  wrapper.id = 'slideWrapper' + idx;

  // Get title
  const titleKey = 'title' + lang.charAt(0).toUpperCase() + lang.slice(1);
  const slideTitle = slide.dataset[titleKey] || '';

  // Header
  const header = document.createElement('div');
  header.className = 'preview-slide-header';

  header.innerHTML = `
    <div class="slide-info">
      <span class="slide-num">${String(idx + 1).padStart(2, '0')}</span>
      <span class="slide-title">${slideTitle}</span>
    </div>
    <div class="slide-controls">
      <div class="zoom-control">
        <label>${lang === 'ko' ? '줌:' : 'Zoom:'}</label>
        <input type="range" min="50" max="150" value="${pageZooms[idx]}"
               data-idx="${idx}" oninput="setPageZoom(${idx}, this.value)">
        <span class="zoom-val" id="zoomVal${idx}">${pageZooms[idx]}%</span>
      </div>
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
      <button class="page-auto-fit-btn" onclick="autoFitPage(${idx})" title="${lang === 'ko' ? '자동 맞춤' : 'Auto Fit'}">
        ${lang === 'ko' ? '자동맞춤' : 'Auto Fit'}
      </button>
    </div>
  `;
  wrapper.appendChild(header);

  // Frame
  const frame = document.createElement('div');
  frame.className = 'preview-slide-frame';
  frame.id = 'previewFrame' + idx;

  // Clone slide
  const clone = slide.cloneNode(true);
  clone.className = 'slide-clone';
  clone.removeAttribute('style');
  clone.classList.remove('active');

  // Apply language visibility
  applyLanguageVisibility(clone);

  frame.appendChild(clone);
  wrapper.appendChild(frame);

  return wrapper;
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
function applyContentZoom(idx, zoomPercent) {
  const frame = document.getElementById('previewFrame' + idx);
  if (!frame) return;

  const clone = frame.querySelector('.slide-clone');
  if (!clone) return;

  const zoom = zoomPercent / 100;

  // Content selectors - 메인 컨테이너만 (중첩 방지)
  // gp-nda-row가 있으면 하위의 gp-nda, gp-top, gp-countries에는 적용하지 않음
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
    '.gp-nda-row',  // gp-nda-row만 줌 적용 (하위 요소는 제외)
    '.gp-top', '.gp-countries',  // gp-nda-row가 없는 경우 대비
    '.exit-chart-area', '.ask-stats', '.ask-highlights',
    '.roadmap-container',
    '.contact-area'
  ];

  // Reset previous transforms
  clone.querySelectorAll('[data-content-zoom]').forEach(el => {
    el.style.removeProperty('transform');
    el.style.removeProperty('transform-origin');
    el.removeAttribute('data-content-zoom');
  });

  // Global Partners 페이지 특별 처리: 모든 콘텐츠를 wrapper로 감싸기
  const gpNdaRow = clone.querySelector('.gp-nda-row');
  const gpTop = clone.querySelector('.gp-top');
  const gpCountries = clone.querySelector('.gp-countries');

  if (gpNdaRow && gpTop && gpCountries) {
    // 이미 wrapper가 있는지 확인
    let gpWrapper = clone.querySelector('.gp-content-wrapper');
    if (!gpWrapper) {
      // wrapper 생성
      gpWrapper = document.createElement('div');
      gpWrapper.className = 'gp-content-wrapper';
      gpWrapper.style.cssText = 'width: 100%;';

      // 부모 요소 찾기
      const parent = gpNdaRow.parentElement;

      // wrapper에 콘텐츠 이동
      parent.insertBefore(gpWrapper, gpNdaRow);
      gpWrapper.appendChild(gpNdaRow);
      gpWrapper.appendChild(gpTop);
      gpWrapper.appendChild(gpCountries);
    }

    // wrapper에 줌 적용
    gpWrapper.style.setProperty('transform-origin', 'top center', 'important');
    gpWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
    gpWrapper.setAttribute('data-content-zoom', 'true');
    return; // Global Partners는 여기서 끝
  }

  // Hero 페이지 특별 처리: hero-left, hero-right를 wrapper로 감싸기
  const heroLeft = clone.querySelector('.hero-left');
  const heroRight = clone.querySelector('.hero-right');

  if (heroLeft && heroRight) {
    let heroWrapper = clone.querySelector('.hero-content-wrapper');
    if (!heroWrapper) {
      heroWrapper = document.createElement('div');
      heroWrapper.className = 'hero-content-wrapper';
      heroWrapper.style.cssText = 'display: flex; gap: 40px; width: 100%; align-items: center;';

      const parent = heroLeft.parentElement;
      parent.insertBefore(heroWrapper, heroLeft);
      heroWrapper.appendChild(heroLeft);
      heroWrapper.appendChild(heroRight);
    }

    heroWrapper.style.setProperty('transform-origin', 'top center', 'important');
    heroWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
    heroWrapper.setAttribute('data-content-zoom', 'true');
    return;
  }

  // Ask 페이지 특별 처리: h2, ask-desc, ask-stats, ask-footer를 wrapper로 감싸기
  const askStats = clone.querySelector('.ask-stats');
  const askFooter = clone.querySelector('.ask-footer');

  if (askStats && askFooter) {
    let askWrapper = clone.querySelector('.ask-content-wrapper');
    if (!askWrapper) {
      askWrapper = document.createElement('div');
      askWrapper.className = 'ask-content-wrapper';
      askWrapper.style.cssText = 'width: 100%; text-align: center;';

      const parent = askStats.parentElement;

      // h2와 ask-desc 찾기
      const h2Elements = parent.querySelectorAll('h2[data-lang]');
      const askDescs = parent.querySelectorAll('.ask-desc');

      // 첫 번째 h2 앞에 wrapper 삽입
      if (h2Elements.length > 0) {
        parent.insertBefore(askWrapper, h2Elements[0]);
      } else {
        parent.insertBefore(askWrapper, askStats);
      }

      // 모든 요소를 wrapper로 이동
      h2Elements.forEach(el => askWrapper.appendChild(el));
      askDescs.forEach(el => askWrapper.appendChild(el));
      askWrapper.appendChild(askStats);
      askWrapper.appendChild(askFooter);
    }

    askWrapper.style.setProperty('transform-origin', 'top center', 'important');
    askWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
    askWrapper.setAttribute('data-content-zoom', 'true');
    return;
  }

  // Product 페이지 특별 처리: svc-phases, svc-cloud-bar를 wrapper로 감싸기
  const svcPhases = clone.querySelector('.svc-phases');
  const svcCloudBar = clone.querySelector('.svc-cloud-bar');

  if (svcPhases && svcCloudBar) {
    let svcWrapper = clone.querySelector('.svc-content-wrapper');
    if (!svcWrapper) {
      svcWrapper = document.createElement('div');
      svcWrapper.className = 'svc-content-wrapper';
      svcWrapper.style.cssText = 'width: 100%;';

      const parent = svcPhases.parentElement;
      parent.insertBefore(svcWrapper, svcPhases);
      svcWrapper.appendChild(svcPhases);
      svcWrapper.appendChild(svcCloudBar);
    }

    svcWrapper.style.setProperty('transform-origin', 'top center', 'important');
    svcWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
    svcWrapper.setAttribute('data-content-zoom', 'true');
    return;
  }

  // Business 페이지 특별 처리: biz-diagram-wrap, biz-rev-summary를 wrapper로 감싸기
  const bizDiagram = clone.querySelector('.biz-diagram-wrap');
  const bizRevSummary = clone.querySelector('.biz-rev-summary');

  if (bizDiagram && bizRevSummary) {
    let bizWrapper = clone.querySelector('.biz-content-wrapper');
    if (!bizWrapper) {
      bizWrapper = document.createElement('div');
      bizWrapper.className = 'biz-content-wrapper';
      bizWrapper.style.cssText = 'width: 100%;';

      const parent = bizDiagram.parentElement;
      parent.insertBefore(bizWrapper, bizDiagram);
      bizWrapper.appendChild(bizDiagram);
      bizWrapper.appendChild(bizRevSummary);
    }

    bizWrapper.style.setProperty('transform-origin', 'top center', 'important');
    bizWrapper.style.setProperty('transform', `scale(${zoom})`, 'important');
    bizWrapper.setAttribute('data-content-zoom', 'true');
    return;
  }

  // Team 페이지 특별 처리: team-ceo, team-members를 wrapper로 감싸기
  const teamCeo = clone.querySelector('.team-ceo');
  const teamMembers = clone.querySelector('.team-members');

  if (teamCeo && teamMembers) {
    // team-layout이 이미 wrapper 역할을 하는지 확인
    const teamLayout = clone.querySelector('.team-layout');
    if (teamLayout) {
      teamLayout.style.setProperty('transform-origin', 'top center', 'important');
      teamLayout.style.setProperty('transform', `scale(${zoom})`, 'important');
      teamLayout.setAttribute('data-content-zoom', 'true');
      return;
    }
  }

  // Apply new zoom with !important to override CSS
  contentSelectors.forEach(selector => {
    const el = clone.querySelector(selector);
    if (el) {
      // 이미 zoom이 적용된 부모가 있으면 스킵
      if (el.closest('[data-content-zoom]')) {
        return;
      }
      el.style.setProperty('transform-origin', 'top center', 'important');
      el.style.setProperty('transform', `scale(${zoom})`, 'important');
      el.setAttribute('data-content-zoom', 'true');
    }
  });
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

  // Apply to all slides
  applyTitleScale(val);

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
function applyContentAlignmentToSlide(clone, alignV, alignH) {
  const slideInner = clone.querySelector('.slide-inner');
  if (!slideInner) return;

  // 타이틀 요소들은 상단 고정
  const titleSelectors = ['.section-label', '.section-title', '.section-desc'];
  titleSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => {
      el.style.setProperty('width', '1200px', 'important');
      el.style.setProperty('max-width', '1200px', 'important');
      el.style.setProperty('min-width', '1200px', 'important');
    });
  });

  // 콘텐츠 요소 찾기 - 페이지별 메인 컨테이너만 (개별 하위 요소는 제외)
  // 중요: 한 페이지에 여러 요소가 있으면 첫 번째만 margin-top 적용
  const contentSelectors = [
    // Hero
    '.hero-left', '.hero-right',
    // Overview
    '.overview-layout', '.ov-layout',
    // Problem
    '.problem-flow',
    // Solution
    '.solution-content', '.solution-flow',
    // Service
    '.svc-phases',
    // Market
    '.market-content', '.mkt-stages',
    // Competition
    '.comp-table',
    // Traction
    '.traction-grid',
    // Business
    '.biz-diagram-wrap',
    // Pricing
    '.pricing-grid',
    // Sales
    '.sales-layout',
    // Team
    '.team-layout',
    // Global Partners - gp-nda-row가 전체 컨테이너
    '.gp-nda-row',
    // Roadmap
    '.roadmap-container',
    // Exit
    '.exit-chart-area',
    // Ask
    '.ask-stats'
  ];

  // 수평 정렬용 셀렉터 (너비 100%가 아닌 요소만)
  // Global Partners 페이지 요소들(.gp-nda-row, .gp-top, .gp-countries)은
  // 이미 너비 100%로 설정되어 있으므로 수평 정렬 대상에서 제외
  const horizontalAlignSelectors = [
    '.hero-left', '.hero-right',
    '.overview-layout', '.ov-layout',
    '.problem-flow',
    '.solution-content', '.solution-flow',
    '.svc-phases',
    '.market-content', '.mkt-stages',
    '.comp-table',
    '.traction-grid',
    '.biz-diagram-wrap',
    '.pricing-grid',
    '.sales-layout',
    '.team-layout',
    // '.gp-nda-row', '.gp-top', '.gp-countries' - 제외 (width: 100%)
    '.roadmap-container',
    '.exit-chart-area',
    '.ask-stats'
  ];

  // slide-inner 기본 설정 - 타이틀은 항상 좌측 상단 고정
  slideInner.style.setProperty('position', 'relative', 'important');
  slideInner.style.setProperty('justify-content', 'flex-start', 'important');
  slideInner.style.setProperty('align-items', 'flex-start', 'important');

  // 타이틀은 항상 좌측 정렬 (align-self로 고정)
  titleSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => {
      el.style.setProperty('align-self', 'flex-start', 'important');
    });
  });

  // 콘텐츠 요소에만 수평 정렬 적용 (margin으로 처리)
  const allContentSelectors = [...contentSelectors, '.gp-top', '.gp-countries'];
  allContentSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => {
      switch (alignH) {
        case 'left':
          el.style.setProperty('align-self', 'flex-start', 'important');
          break;
        case 'center':
          el.style.setProperty('align-self', 'center', 'important');
          break;
        case 'right':
          el.style.setProperty('align-self', 'flex-end', 'important');
          break;
      }
    });
  });

  // scale 값 가져오기
  const transformMatch = clone.style.transform?.match(/scale\(([\d.]+)\)/);
  const scale = transformMatch ? parseFloat(transformMatch[1]) : 1;

  // 타이틀 실제 높이 계산 (scale 보정) - marginBottom 포함
  let titleTotalHeight = 0;
  titleSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const marginBottom = parseFloat(style.marginBottom) || 0;
      titleTotalHeight += (rect.height / scale) + marginBottom;
    });
  });

  // 콘텐츠 가용 공간 = 타이틀 바로 아래 ~ 프레임 하단(하단 패딩 제외)
  // 슬라이드 높이 720 - 상단 패딩 30 - 타이틀 높이 - 하단 패딩 30
  const slideHeight = 720;
  const topPadding = 30;
  const bottomPadding = 30;
  const availableHeight = slideHeight - topPadding - titleTotalHeight - bottomPadding;

  // 첫 번째 콘텐츠 요소 찾기 및 전체 콘텐츠 높이 계산
  let firstContentElement = null;
  let totalContentHeight = 0;

  // Wrapper 기반 페이지들 확인 (applyContentZoom에서 생성된 wrapper 사용)
  const wrapperSelectors = [
    '.gp-content-wrapper',    // Global Partners
    '.hero-content-wrapper',  // Hero
    '.ask-content-wrapper',   // Ask
    '.svc-content-wrapper',   // Product/Service
    '.biz-content-wrapper'    // Business
  ];

  // 먼저 wrapper가 있는지 확인
  for (const selector of wrapperSelectors) {
    const wrapper = clone.querySelector(selector);
    if (wrapper) {
      firstContentElement = wrapper;
      const rect = wrapper.getBoundingClientRect();
      totalContentHeight = rect.height / scale;
      break;
    }
  }

  // wrapper가 없으면 기존 로직 사용
  if (!firstContentElement) {
    // Global Partners 페이지 특별 처리: 여러 요소의 총 높이 계산
    const gpNdaRow = clone.querySelector('.gp-nda-row');
    const gpTop = clone.querySelector('.gp-top');
    const gpCountries = clone.querySelector('.gp-countries');

    if (gpNdaRow) {
      // Global Partners 페이지인 경우
      firstContentElement = gpNdaRow;

      // gp-nda-row + gp-top + gp-countries 전체 높이 계산
      [gpNdaRow, gpTop, gpCountries].forEach(el => {
        if (el) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const marginTop = parseFloat(style.marginTop) || 0;
          const marginBottom = parseFloat(style.marginBottom) || 0;
          totalContentHeight += (rect.height / scale) + marginTop + marginBottom;
        }
      });
      // 첫 번째 요소의 margin-top은 우리가 설정할 것이므로 제외
      const firstStyle = window.getComputedStyle(gpNdaRow);
      totalContentHeight -= parseFloat(firstStyle.marginTop) || 0;
    } else {
      // 일반 페이지: 첫 번째 콘텐츠 요소만 사용
      for (const selector of contentSelectors) {
        const el = clone.querySelector(selector);
        if (el) {
          firstContentElement = el;
          const rect = el.getBoundingClientRect();
          totalContentHeight = rect.height / scale;
          break;
        }
      }
    }
  }

  if (!firstContentElement) return;

  // 수직 정렬 적용 (첫 번째 콘텐츠 요소에만)
  // availableHeight = 타이틀 바로 아래 ~ 프레임 하단
  // 콘텐츠가 가용 공간보다 크면 margin-top을 0으로 (짤림 방지)
  const contentOverflow = totalContentHeight > availableHeight;

  switch (alignV) {
    case 'top':
      // 상단 정렬: 타이틀 아래에 여백 20px (콘텐츠가 넘치면 0)
      const topMargin = contentOverflow ? 0 : 20;
      firstContentElement.style.setProperty('margin-top', topMargin + 'px', 'important');
      break;
    case 'middle':
      // 가운데 정렬: 타이틀 바로 아래 ~ 프레임 하단 기준 가운데
      const middleMargin = Math.max(0, (availableHeight - totalContentHeight) / 2);
      firstContentElement.style.setProperty('margin-top', middleMargin + 'px', 'important');
      break;
    case 'bottom':
      // 하단 정렬: 프레임 하단에 붙음
      const bottomMargin = Math.max(0, availableHeight - totalContentHeight);
      firstContentElement.style.setProperty('margin-top', bottomMargin + 'px', 'important');
      break;
  }
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

  // Apply title scale
  applyTitleScale(100);

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

// Export to PDF
async function exportPDF() {
  showLoading(lang === 'ko' ? '라이브러리 로딩 중...' : 'Loading libraries...');

  try {
    // Load libraries
    if (typeof html2canvas === 'undefined') {
      await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
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

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0A0E27',
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
  const filename = 'WEVEN_Zaemit_IR_' + new Date().toISOString().slice(0, 10) + '.pdf';
  pdf.save(filename);

  hideLoading();
}
