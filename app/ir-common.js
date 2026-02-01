/**
 * IR Common Navigation System
 * 공통 사이드바, TOC, 슬라이드 네비게이션
 */

class IRNavigation {
  constructor(options = {}) {
    this.slides = document.querySelectorAll('.slide');
    this.total = this.slides.length;
    this.current = 0;
    this.lang = options.lang || 'en';
    this.theme = options.theme || 'dark'; // 'dark' or 'light'
    this.irVersion = options.irVersion || '2601';

    // Check if running in embed mode (inside viewer.html iframe)
    const params = new URLSearchParams(window.location.search);
    this.embedMode = params.get('embed') === 'true';

    // Apply embed mode class to body
    if (this.embedMode) {
      document.body.classList.add('embed-mode');
    }

    this.init();
  }

  init() {
    // Skip navigation injection in embed mode - viewer.html provides the nav
    if (!this.embedMode) {
      this.injectHTML();
      this.buildTOC();
    }
    this.bindEvents();
    this.updateUI();

    // Expose slide info for parent viewer
    this.exposeSlideInfo();
  }

  exposeSlideInfo() {
    // Make slide info available for parent frame
    window.irSlideInfo = {
      slides: Array.from(this.slides).map((slide, i) => ({
        index: i,
        titleKo: slide.dataset.titleKo || slide.dataset.title || `슬라이드 ${i + 1}`,
        titleEn: slide.dataset.titleEn || slide.dataset.title || `Slide ${i + 1}`,
        titleJa: slide.dataset.titleJa || slide.dataset.title || `スライド ${i + 1}`
      })),
      total: this.total,
      current: this.current
    };

    // Expose navigation methods for parent
    window.setLang = (lang) => this.setLang(lang);
    window.goToSlide = (idx) => this.goTo(idx);
  }

  setLang(lang) {
    this.lang = lang;
    document.body.classList.remove('en', 'ja', 'ko');
    if (lang !== 'ko') {
      document.body.classList.add(lang);
    }

    // Update language-specific elements
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.style.display = el.dataset.lang === lang ? '' : 'none';
    });
  }

  injectHTML() {
    // Menu Header
    const header = document.createElement('div');
    header.className = 'menu-header';
    header.innerHTML = `
      <button class="menu-btn" id="menuBtn">
        <span></span><span></span><span></span>
      </button>
      <div class="menu-header-title">WEVEN<span>IR Deck</span></div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-nav" id="tocNav"></div>
      <div class="sidebar-footer">
        <p>WEVEN Inc. &copy; 2025<br>Confidential</p>
      </div>
    `;
    document.body.insertBefore(sidebar, header.nextSibling);

    // Sidebar Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.insertBefore(overlay, sidebar.nextSibling);

    // Page Indicator
    const indicator = document.createElement('div');
    indicator.className = 'page-indicator';
    indicator.innerHTML = `
      <div class="page-progress"><div class="page-progress-fill" id="progressFill"></div></div>
      <div class="page-num"><span class="cur" id="pageNum">01</span> / <span id="pageTotal">${this.total}</span></div>
    `;
    document.body.appendChild(indicator);

    // Adjust slides for header
    this.slides.forEach(slide => {
      slide.style.top = '60px';
    });
  }

  buildTOC() {
    const tocNav = document.getElementById('tocNav');
    if (!tocNav) return;

    this.slides.forEach((slide, i) => {
      const item = document.createElement('div');
      item.className = 'toc-item' + (i === 0 ? ' active' : '');

      // Get title based on language
      const titleKey = 'title' + this.lang.charAt(0).toUpperCase() + this.lang.slice(1);
      const title = slide.dataset[titleKey] || slide.dataset.titleEn || `Slide ${i + 1}`;

      item.innerHTML = `
        <div class="toc-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="toc-label">${title}</div>
      `;
      item.addEventListener('click', () => this.goTo(i));
      tocNav.appendChild(item);
    });
  }

  bindEvents() {
    // Menu button
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.toggleSidebar());
    }

    // Overlay click
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.toggleSidebar());
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        this.next();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.prev();
      }
      if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
          this.toggleSidebar();
        }
      }
    });

    // Touch/swipe support
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    document.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) {
      sidebar.classList.toggle('open');
    }
    if (menuBtn) {
      menuBtn.classList.toggle('active');
    }
    if (overlay) {
      overlay.classList.toggle('active');
    }
  }

  goTo(idx) {
    if (idx < 0 || idx >= this.total) return;

    // Update slides
    this.slides[this.current].classList.remove('active');
    this.current = idx;
    this.slides[this.current].classList.add('active');

    this.updateUI();
  }

  next() {
    if (this.current < this.total - 1) {
      this.goTo(this.current + 1);
    }
  }

  prev() {
    if (this.current > 0) {
      this.goTo(this.current - 1);
    }
  }

  updateUI() {
    // Update TOC (only if not in embed mode)
    if (!this.embedMode) {
      const tocItems = document.querySelectorAll('.toc-item');
      tocItems.forEach((item, i) => {
        item.classList.toggle('active', i === this.current);
      });

      // Update page number
      const pageNum = document.getElementById('pageNum');
      if (pageNum) {
        pageNum.textContent = String(this.current + 1).padStart(2, '0');
      }

      // Update progress bar
      const progressFill = document.getElementById('progressFill');
      if (progressFill) {
        const progress = ((this.current + 1) / this.total) * 100;
        progressFill.style.width = progress + '%';
      }
    }

    // Update slide info for parent viewer
    if (window.irSlideInfo) {
      window.irSlideInfo.current = this.current;
    }

    // Notify parent window of slide change (for embed mode)
    if (this.embedMode && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'slideChange',
          current: this.current,
          total: this.total
        }, '*');
      } catch (e) {}
    }
  }
}

// Auto-initialize if data attributes present
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  // Check for embed mode from URL
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || body.dataset.lang || 'en';

  if (body.dataset.irNav === 'true') {
    window.irNav = new IRNavigation({
      lang: lang,
      theme: body.dataset.theme || 'dark',
      irVersion: body.dataset.irVersion || '2601'
    });
  }
});

// Export for manual initialization
window.IRNavigation = IRNavigation;
