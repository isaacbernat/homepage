document.addEventListener("DOMContentLoaded", function() {
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
