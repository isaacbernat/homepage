document.addEventListener('DOMContentLoaded', function () {
  // Initial Image Setup & Lazy Loading
  const lazyImage = document.querySelector('.main-image');
  if (!lazyImage) return;

  // --- Part 1: Fix initial blink ---
  const initialTheme =
    document.documentElement.getAttribute('data-theme') || 'light'; // Set by the <head> script
  const initialPlaceholder =
    initialTheme === 'dark'
      ? 'images/keyboard-dark-480.webp'
      : 'images/keyboard-light-480.webp';
  if (lazyImage.classList.contains('lazy-load')) {
    lazyImage.src = initialPlaceholder; // Set correct low-res placeholder ASAP for lazy-load state
  }

  // --- Part 2: Handle the high-res load ---
  if (lazyImage.classList.contains('lazy-load')) {
    const sourceElement = lazyImage.previousElementSibling;

    const onImageLoad = () => {
      // Cleanup when high-res image is loaded
      lazyImage.classList.remove('lazy-load'); // This triggers the 2s un-blur
      lazyImage.removeEventListener('load', onImageLoad);
    };
    lazyImage.addEventListener('load', onImageLoad);

    updateImageSource(initialTheme, lazyImage, sourceElement); // Load the high-res images
    if (lazyImage.complete) {
      // cached image handler
      onImageLoad();
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // Light/dark theme handler
  const themeToggleButton = document.querySelector('.theme-toggle');
  if (!themeToggleButton) return;

  themeToggleButton.addEventListener('click', function () {
    const currentTheme = document.documentElement.getAttribute('data-theme'); // Get the current theme from the <html> tag
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; // Toggle the theme
    document.documentElement.setAttribute('data-theme', newTheme); // Set the new theme on the <html> tag
    localStorage.setItem('theme', newTheme); // Save the user's preference to localStorage

    // specific code to update the homepage's image
    const lazyImage = document.querySelector('.main-image');
    const picture = lazyImage ? lazyImage.closest('picture') : null;
    const sourceElement = picture ? picture.querySelector('source') : null;
    updateImageSource(newTheme, lazyImage, sourceElement); // Load appropriate image
  });
});

function updateImageSource(theme, imageElement, sourceElement) {
  if (!imageElement) return;

  const srcsetValue =
    theme === 'dark' // srcset based on the theme
      ? imageElement.dataset.srcsetDark
      : imageElement.dataset.srcsetLight;
  if (!srcsetValue) return;

  if (sourceElement) {
    // <source> tag for modern browsers
    sourceElement.srcset = srcsetValue;
  }

  const fallbackSrc = srcsetValue.split(',')[0].split(' ')[0];
  imageElement.src = fallbackSrc; // high-res 1x fallback on the <img> tag for older browsers
}

document.addEventListener('DOMContentLoaded', function () {
  // Simple email obfuscation
  const emailSpan = document.getElementById('email-link');
  if (!emailSpan) return;

  const user = emailSpan.getAttribute('data-user');
  const domain = emailSpan.getAttribute('data-domain');
  const fullEmail = `${user}@${domain}`;
  const mailtoLink = document.createElement('a');
  mailtoLink.href = `mailto:${fullEmail}`;
  mailtoLink.textContent = fullEmail;
  emailSpan.parentNode.replaceChild(mailtoLink, emailSpan);
});

window.addEventListener('load', function () {
  const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

  idleCallback(() => {
    // 1. Define the asset paths (Source of Truth)
    // These must match index.njk exactly.
    const IMG_DATA = {
      light: "images/keyboard-light-1920.webp 1x, images/keyboard-light-3840.webp 2x",
      dark: "images/keyboard-dark-1920.webp 1x, images/keyboard-dark-3840.webp 2x"
    };

    // 2. Detect Environment
    const lazyImage = document.querySelector('.main-image');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const oppositeTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // 3. Define the preload worker
    const preloadImage = (srcsetStr) => {
      // Check if already in cache (imperfect check, but saves creating objects)
      // Browsers are smart enough not to re-download if we create a duplicate Image object,
      // but we skip the CPU work if we can.
      const img = new Image();
      img.srcset = srcsetStr;
    };

    // 4. Execution Logic
    if (lazyImage) {
      // Case A: We are on the Homepage. 
      // Current theme image is already loaded/loading by the browser.
      // We only need the opposite theme.
      preloadImage(IMG_DATA[oppositeTheme]);
    } else {
      // Case B: We are on CV or 404.
      // Nothing is loaded. We want the Homepage to feel instant if they go there.
      // Priority 1: Preload the CURRENT theme (most likely destination state).
      preloadImage(IMG_DATA[currentTheme]);
      
      // Priority 2: Preload the OPPOSITE theme (in case they toggle immediately).
      // We wrap this in a timeout to let Priority 1 get a head start on the network.
      setTimeout(() => {
        preloadImage(IMG_DATA[oppositeTheme]);
      }, 200);
    }
  });
});
