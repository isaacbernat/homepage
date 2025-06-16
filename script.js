document.addEventListener("DOMContentLoaded", function() {  // Lazy loads the main image
    const lazyImage = document.querySelector('.main-image.lazy-load');
    if (!lazyImage || !lazyImage.dataset.srcset) {
        return;
    }

    const sourceElement = lazyImage.previousElementSibling;  // Find the <source> element that is the sibling of the <img>
    const srcsetValue = lazyImage.dataset.srcset;

    const onImageLoad = () => {
        lazyImage.classList.remove('lazy-load');  // Remove the blur effect
        lazyImage.removeEventListener('load', onImageLoad);  // Clean up the event listener so it doesn't fire again
    };
    lazyImage.addEventListener('load', onImageLoad);  // Fire AFTER the browser has chosen the correct image from the srcset, downloaded it, and is ready to display it.
    if (sourceElement) {  // let browser CHOOSE the most appropriate image to download according to screen's pixel density
        sourceElement.srcset = srcsetValue;
    }
    const fallbackSrc = srcsetValue.split(',')[0].split(' ')[0];
    lazyImage.src = fallbackSrc;  // 1x image for `src` for older browsers that don't understand <picture> or for other edge cases.

    if (lazyImage.complete) {  // Handle cached images: fire the 'load' event
        onImageLoad();
    }
});


document.addEventListener("DOMContentLoaded", function() {  // Dark theme
    const themeToggleButton = document.querySelector('.theme-toggle');
    if (!themeToggleButton) {
        return;
    }

    themeToggleButton.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');  // Get the current theme from the <html> tag
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';  // Toggle the theme
        document.documentElement.setAttribute('data-theme', newTheme);  // Set the new theme on the <html> tag
        localStorage.setItem('theme', newTheme);  // Save the user's preference to localStorage
    });
});
