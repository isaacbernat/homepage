document.addEventListener("DOMContentLoaded", function() {  // Initial Image Setup & Lazy Loading
    const lazyImage = document.querySelector('.main-image');
    if (!lazyImage) return;

    // --- Part 1: Fix initial blink ---
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';  // Set by the <head> script
    const initialPlaceholder = (initialTheme === 'dark')
        ? 'images/keyboard-dark-480.webp'
        : 'images/keyboard-light-480.webp';
    if (lazyImage.classList.contains('lazy-load')) {
        lazyImage.src = initialPlaceholder; // Set correct low-res placeholder ASAP for lazy-load state
    }

    // --- Part 2: Handle the high-res load ---
    if (lazyImage.classList.contains('lazy-load')) {
        const sourceElement = lazyImage.previousElementSibling;

        const onImageLoad = () => {  // Cleanup when high-res image is loaded
            lazyImage.classList.remove('lazy-load');  // This triggers the 2s un-blur
            lazyImage.removeEventListener('load', onImageLoad);
        };
        lazyImage.addEventListener('load', onImageLoad);

        updateImageSource(initialTheme, lazyImage, sourceElement);  // Load the high-res images
        if (lazyImage.complete) {  // cached image handler
            onImageLoad();
        }
    }
});


document.addEventListener("DOMContentLoaded", function() {  // Light/dark theme handler
    const themeToggleButton = document.querySelector('.theme-toggle');
    if (!themeToggleButton) return;

    themeToggleButton.addEventListener('click', function() {
        const lazyImage = document.querySelector('.main-image');
        const sourceElement = lazyImage.previousElementSibling;

        const currentTheme = document.documentElement.getAttribute('data-theme');  // Get the current theme from the <html> tag
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';  // Toggle the theme
        document.documentElement.setAttribute('data-theme', newTheme);  // Set the new theme on the <html> tag
        localStorage.setItem('theme', newTheme);  // Save the user's preference to localStorage
        updateImageSource(newTheme, lazyImage, sourceElement);  // Load appropriate image
    });
});


function updateImageSource(theme, imageElement, sourceElement) {
    if (!imageElement) return;

    const srcsetValue = (theme === 'dark')  // srcset based on the theme
        ? imageElement.dataset.srcsetDark
        : imageElement.dataset.srcsetLight;
    if (!srcsetValue) return;

    if (sourceElement) {  // <source> tag for modern browsers
        sourceElement.srcset = srcsetValue;
    }

    const fallbackSrc = srcsetValue.split(',')[0].split(' ')[0];
    imageElement.src = fallbackSrc;  // high-res 1x fallback on the <img> tag for older browsers
}
