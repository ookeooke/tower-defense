// js/screens/Screen.js
export class Screen {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.isVisible = false;
    }
    
    // Called when screen is shown
    show(data = {}) {
        this.isVisible = true;
        this.onShow(data);
    }
    
    // Called when screen is hidden
    hide() {
        this.isVisible = false;
        this.onHide();
    }
    
    // Override in subclasses
    onShow(data) {
        // Implement in subclass
    }
    
    // Override in subclasses
    onHide() {
        // Implement in subclass
    }
    
    // Helper to get element within this screen
    getElement(selector) {
        return this.element.querySelector(selector);
    }
    
    // Helper to get all elements within this screen
    getElements(selector) {
        return this.element.querySelectorAll(selector);
    }
}