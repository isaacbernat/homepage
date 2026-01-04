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

  // --- Configuration ---
  // Source of Truth for image paths.
  // Decoupling this from the DOM allows us to preload these assets
  // on pages where the DOM element doesn't exist yet (e.g., CV page).
  const ASSETS = {
    light: {
      low: 'images/keyboard-light-480.webp',
      high: 'images/keyboard-light-1920.webp 1x, images/keyboard-light-3840.webp 2x',
    },
    dark: {
      low: 'images/keyboard-dark-480.webp',
      high: 'images/keyboard-dark-1920.webp 1x, images/keyboard-dark-3840.webp 2x',
    },
  };

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

  // --- Core Logic: Image Manager ---
  const ImageManager = {
    getHighResUrl(srcset) {
      if (!srcset) return '';
      const parts = srcset.split(',');
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

      // remove the 'srcset' from the <source> tag to stop the browser from fighting our manual Blob URL injection.
      if (source) source.removeAttribute('srcset');
      elements.lazyImage.src = state.blobCache[theme];

      // Ensure the browser paints the new frame before revealing
      requestAnimationFrame(() => {
        elements.lazyImage.classList.remove('lazy-load');
      });
    },
  };

  // --- Hero Image Orchestration ---
  function initHeroImage() {
    const { currentTheme } = state;
    const highResSrcset = ASSETS[currentTheme].high;
    const highResUrl = ImageManager.getHighResUrl(highResSrcset);

    // Scenario A: We are on the Homepage (Hero Image exists)
    if (elements.lazyImage) {
      const lowResPath = ASSETS[currentTheme].low;

      // 1. Force-Fetch 480p Placeholder
      const loader480 = new Image();
      loader480.src = lowResPath;

      loader480.onload = () => {
        const picture = elements.lazyImage.closest('picture');
        const source = picture ? picture.querySelector('source') : null;
        if (source) source.srcset = lowResPath;
        elements.lazyImage.src = lowResPath;

        // 2. Start High-Res Blob Strategy
        requestAnimationFrame(() => {
          ImageManager.loadAndCacheBlob(currentTheme, highResUrl, () => {
            ImageManager.applyToDom(currentTheme);
            preloadOppositeTheme();
          });
        });
      };

      // Fallback
      loader480.onerror = () => {
        elements.lazyImage.src = highResUrl;
      };
    }
    // Scenario B: We are on CV/404 (Hero missing)
    else {
      // Preload the current theme's Home asset so navigation is instant
      const idleCallback =
        window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
      idleCallback(() => {
        ImageManager.loadAndCacheBlob(currentTheme, highResUrl);
        // Optional: Preload opposite theme too if you want maximum readiness
        preloadOppositeTheme();
      });
    }
  }

  function preloadOppositeTheme() {
    const idleCallback =
      window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

    idleCallback(() => {
      const oppositeTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
      const highResSrcset = ASSETS[oppositeTheme].high;
      const url = ImageManager.getHighResUrl(highResSrcset);

      ImageManager.loadAndCacheBlob(oppositeTheme, url);
    });
  }

  // --- Theme Toggle ---
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
        const newSrcset = ImageManager.getSrcset(nextTheme);
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
