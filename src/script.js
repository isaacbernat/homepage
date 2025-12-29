document.addEventListener('DOMContentLoaded', function () {
  // Initial Image Setup & Lazy Loading
  const lazyImage = document.querySelector('.main-image');
  if (!lazyImage) return;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  // Configuration
  const lowResPath = currentTheme === 'dark' 
    ? 'images/keyboard-dark-480.webp'
    : 'images/keyboard-light-480.webp';
    
  const highResSrcset = currentTheme === 'dark' 
    ? lazyImage.dataset.srcsetDark 
    : lazyImage.dataset.srcsetLight;

  const loader480 = new Image();
  loader480.src = lowResPath;

  loader480.onload = function() {  // Update DOM with 480p
    const picture = lazyImage.closest('picture');
    const source = picture ? picture.querySelector('source') : null;
    
    if (source) source.srcset = lowResPath;
    lazyImage.src = lowResPath;

    requestAnimationFrame(() => {  // Wait for paint, then fetch High-Res
        loadHighRes(source, highResSrcset, currentTheme);
    });
  };

  loader480.onerror = function() {  // Fallback
    loadHighRes(null, highResSrcset, currentTheme);
  };
});


function loadHighRes(sourceElement, highResSrcset, currentTheme) {
  const lazyImage = document.querySelector('.main-image');
  
  const loaderHigh = new Image();
  loaderHigh.srcset = highResSrcset;
  
  loaderHigh.onload = function() {
    if (sourceElement) sourceElement.srcset = highResSrcset;  // Swap the Source (High-Res is now in DOM, but still has .lazy-load class)
    
    const fallbackSrc = highResSrcset.split(',')[0].split(' ')[0];
    lazyImage.src = fallbackSrc;
    
    requestAnimationFrame(() => {  // Wait for the browser to accept the new source and paint it
        lazyImage.classList.remove('lazy-load');  // Start the transition
    });

    preloadOppositeTheme(currentTheme);  // anticipate a smooth transition in the likely scenario the user changes theme
  };
}

// --- ATOMIC THEME TOGGLER ---
// Fixes the FOUC and rapid-click network thrashing
document.addEventListener('DOMContentLoaded', function () {
  const themeToggleButton = document.querySelector('.theme-toggle');
  if (!themeToggleButton) return;

  // Track the latest requested state
  let latestRequestedTheme = document.documentElement.getAttribute('data-theme') || 'light';

  themeToggleButton.addEventListener('click', function () {
    // 1. Calculate the target theme based on the LAST request (not necessarily the current DOM)
    const nextTheme = latestRequestedTheme === 'dark' ? 'light' : 'dark';
    latestRequestedTheme = nextTheme; // Update the "Desired State" immediately
    
    // 2. Save preference immediately (so reload persists intent)
    localStorage.setItem('theme', nextTheme);

    // 3. Prepare the assets
    const lazyImage = document.querySelector('.main-image');
    if (!lazyImage) {  // If no image (e.g. 404 page), just swap CSS instantly
      document.documentElement.setAttribute('data-theme', nextTheme);
      return;
    }

    const newSrcset = nextTheme === 'dark' 
      ? lazyImage.dataset.srcsetDark 
      : lazyImage.dataset.srcsetLight;

    // 4. Create a detached loader for the NEW theme
    const tempLoader = new Image();
    tempLoader.srcset = newSrcset;

    // 5. The "Atomic Commit" logic
    const commitChange = () => {
      // Only apply this change if it matches the USER'S LAST CLICK.
      // If user clicked Light -> Dark -> Light quickly, the 'Dark' loader will finish
      // but 'latestRequestedTheme' will be 'light'. We skip the 'Dark' update.
      if (latestRequestedTheme === nextTheme) {
        // A. Update CSS (Background Color)
        document.documentElement.setAttribute('data-theme', nextTheme);

        // B. Update Image (Content)
        const picture = lazyImage.closest('picture');
        const source = picture ? picture.querySelector('source') : null;
        if (source) source.srcset = newSrcset;
        lazyImage.src = newSrcset.split(',')[0].split(' ')[0];
      }
    };

    // 6. Wait for decode, then commit
    // Since we preloaded the opposite theme, this should be nearly instant (from cache).
    // But wrapping it in onload ensures the browser is ready to paint, preventing FOUC.
    if (tempLoader.complete) {
        commitChange();
    } else {
        tempLoader.onload = commitChange;
        // Safety: If image fails or takes too long, force the switch anyway after 100ms
        // so the button doesn't feel broken.
        setTimeout(commitChange, 100); 
    }
  });
});


// --- Helper for Opposite Theme Preloading ---
function preloadOppositeTheme(currentTheme) {
  const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
  
  idleCallback(() => {
    const IMG_DATA = {
      light: "images/keyboard-light-1920.webp 1x, images/keyboard-light-3840.webp 2x",
      dark: "images/keyboard-dark-1920.webp 1x, images/keyboard-dark-3840.webp 2x"
    };

    const oppositeTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const srcsetToPreload = IMG_DATA[oppositeTheme];

    if (srcsetToPreload) {
      const preloader = new Image();
      preloader.srcset = srcsetToPreload;
    }
  });
}

// --- Email Obfuscation (Unchanged) ---
document.addEventListener('DOMContentLoaded', function () {
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
