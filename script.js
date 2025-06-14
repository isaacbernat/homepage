document.addEventListener("DOMContentLoaded", function() {
    const lazyImage = document.querySelector('.main-image.lazy-load');

    if (lazyImage) {
        const highResImage = new Image();  // Create a new image object in memory
        highResImage.src = lazyImage.dataset.src; // Start loading the high-res image

        highResImage.onload = function() {  // Once the high-res image is fully loaded, replace the low-res one
            lazyImage.src = highResImage.src;  // Swap the src to the high-res version
            lazyImage.classList.remove('lazy-load');  // Remove the 'lazy-load' class to remove the blur
        };
    }
});
