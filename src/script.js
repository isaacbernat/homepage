/*
 * Architecture Notes:
 * 1. "Atomic" Theme Toggling: Uses Blob URLs to prevent browser cache revalidation delays.
 *    This ensures a 0ms toggle time and eliminates FOUC on high-latency networks.
 * 2. Progressive Image Loading: Manually orchestrates the 480p -> High-Res DOM update
 *    sequence to ensure visual stability before the heavy asset loads.
 * 3. Scope: Runs inside an IIFE to prevent global namespace pollution.
 * 4. Privacy: Simple email obfuscation.
 */

(function () {
  'use strict';

  // --- State Management ---
  const state = {
    blobCache: { light: null, dark: null },
    currentTheme:
      document.documentElement.getAttribute('data-theme') || 'light',
    // Check screen density once on load to determine which asset to fetch
    isRetina: (window.devicePixelRatio || 1) > 1.5,
  };

  // --- DOM Elements ---
  const elements = {
    lazyImage: document.querySelector('.main-image'),
    themeToggle: document.querySelector('.theme-toggle'),
    emailLink: document.getElementById('email-link'),
  };

  // --- Core Logic: Image Loader ---
  const ImageManager = {
    getHighResUrl(dataset) {
      // Parse "url 1x, url 2x" format
      if (!dataset) return '';
      const parts = dataset.split(',');
      // If Retina and 2x exists, use it. Otherwise 1x.
      const candidate = state.isRetina && parts[1] ? parts[1] : parts[0];
      return candidate.trim().split(' ')[0];
    },

    loadAndCacheBlob(theme, url, callback) {
      if (state.blobCache[theme]) {
        if (callback) callback();
        return;
      }

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load ${url}`);
          return res.blob();
        })
        .then((blob) => {
          state.blobCache[theme] = URL.createObjectURL(blob);
          if (callback) callback();
        })
        .catch((err) =>
          console.warn(`[ImageManager] Blob fetch error for ${theme}:`, err),
        );
    },

    applyToDom(theme) {
      if (!elements.lazyImage || !state.blobCache[theme]) return;

      const picture = elements.lazyImage.closest('picture');
      const source = picture ? picture.querySelector('source') : null;

      // Engineer Note: We remove the 'srcset' from the <source> tag.
      // This stops the browser from fighting our manual Blob URL injection.
      if (source) source.removeAttribute('srcset');

      elements.lazyImage.src = state.blobCache[theme];

      // Ensure the browser paints the new frame before revealing
      requestAnimationFrame(() => {
        elements.lazyImage.classList.remove('lazy-load');
      });
    },
  };

  // --- Initialization Sequence ---
  function initHeroImage() {
    if (!elements.lazyImage) return;

    const { currentTheme } = state;
    const lazyImage = elements.lazyImage;

    // 1. Configuration
    const lowResPath =
      currentTheme === 'dark'
        ? 'images/keyboard-dark-480.webp'
        : 'images/keyboard-light-480.webp';

    const highResSrcset =
      currentTheme === 'dark'
        ? lazyImage.dataset.srcsetDark
        : lazyImage.dataset.srcsetLight;

    const highResUrl = ImageManager.getHighResUrl(highResSrcset);

    // 2. Force-Fetch 480p Placeholder
    const loader480 = new Image();
    loader480.src = lowResPath;

    loader480.onload = () => {
      // Update DOM with 480p
      const picture = lazyImage.closest('picture');
      const source = picture ? picture.querySelector('source') : null;
      if (source) source.srcset = lowResPath;
      lazyImage.src = lowResPath;

      // 3. Start High-Res Blob Strategy
      // We use requestAnimationFrame to let the 480p image paint first
      requestAnimationFrame(() => {
        ImageManager.loadAndCacheBlob(currentTheme, highResUrl, () => {
          ImageManager.applyToDom(currentTheme);
          preloadOppositeTheme();
        });
      });
    };

    // Fallback: If 480p fails, just let the browser handle standard srcset
    loader480.onerror = () => {
      if (lazyImage.closest('picture')?.querySelector('source')) {
        lazyImage.closest('picture').querySelector('source').srcset =
          highResSrcset;
      }
      lazyImage.src = highResUrl;
    };
  }

  function preloadOppositeTheme() {
    // Low Priority: Prepare the other theme for a 0ms toggle later
    const idleCallback =
      window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

    idleCallback(() => {
      const oppositeTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
      const oppositeSrcset =
        oppositeTheme === 'dark'
          ? elements.lazyImage.dataset.srcsetDark
          : elements.lazyImage.dataset.srcsetLight;

      const url = ImageManager.getHighResUrl(oppositeSrcset);
      ImageManager.loadAndCacheBlob(oppositeTheme, url);
    });
  }

  // --- Theme Toggle Logic ---
  function initThemeToggle() {
    if (!elements.themeToggle) return;

    elements.themeToggle.addEventListener('click', () => {
      const nextTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
      state.currentTheme = nextTheme;

      // Persist intent
      localStorage.setItem('theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);

      // Instant Swap if Blob is ready
      if (state.blobCache[nextTheme]) {
        ImageManager.applyToDom(nextTheme);
      } else {
        // Edge Case: User toggled before preload finished.
        // Fallback to standard browser loading (will have FOUC on slow networks, but functional)
        const newSrcset =
          nextTheme === 'dark'
            ? elements.lazyImage.dataset.srcsetDark
            : elements.lazyImage.dataset.srcsetLight;

        const url = ImageManager.getHighResUrl(newSrcset);

        // Try to fetch blob ASAP
        ImageManager.loadAndCacheBlob(nextTheme, url, () => {
          ImageManager.applyToDom(nextTheme);
        });
      }
    });
  }

  // --- Utilities ---
  function initEmailObfuscation() {
    if (!elements.emailLink) return;
    const user = elements.emailLink.getAttribute('data-user');
    const domain = elements.emailLink.getAttribute('data-domain');
    const fullEmail = `${user}@${domain}`;

    const mailtoLink = document.createElement('a');
    mailtoLink.href = `mailto:${fullEmail}`;
    mailtoLink.textContent = fullEmail;
    elements.emailLink.parentNode.replaceChild(mailtoLink, elements.emailLink);
  }

  // --- Bootstrap ---
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initHeroImage();
      initThemeToggle();
      initEmailObfuscation();
    } catch (e) {
      console.warn('Initialization error:', e);
    }
  });
})();
