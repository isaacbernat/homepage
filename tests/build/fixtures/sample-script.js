// Sample JavaScript for testing minification
function testFunction() {
    console.log('This is a test function');
    
    // This comment should be removed during minification
    const testVariable = 'Hello World';
    
    if (testVariable) {
        return testVariable.toUpperCase();
    }
    
    return null;
}

// Another function for testing
const arrowFunction = (param) => {
    return param * 2;
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    testFunction();
});