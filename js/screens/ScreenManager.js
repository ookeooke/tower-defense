// js/screens/ScreenManager.js
export class ScreenManager {
    constructor() {
        this.screens = new Map();
        this.currentScreen = null;
        this.previousScreen = null;
    }
    
    // Register a screen
    register(name, screenElement, screen = null) {
        this.screens.set(name, {
            element: screenElement,
            instance: screen
        });
    }
    
    // Show a screen
    show(screenName, data = {}) {
        const screen = this.screens.get(screenName);
        if (!screen) {
            console.error(`Screen '${screenName}' not found`);
            return;
        }
        
        // Hide current screen
        if (this.currentScreen) {
            this.hide(this.currentScreen);
            this.previousScreen = this.currentScreen;
        }
        
        // Show new screen
        this.currentScreen = screenName;
        screen.element.classList.remove('hide');
        screen.element.style.display = '';
        
        // Call show method if screen has an instance
        if (screen.instance && screen.instance.show) {
            screen.instance.show(data);
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('screenChanged', {
            detail: { screen: screenName, data }
        }));
    }
    
    // Hide a screen
    hide(screenName) {
        const screen = this.screens.get(screenName);
        if (!screen) return;
        
        screen.element.classList.add('hide');
        screen.element.style.display = 'none';
        
        // Call hide method if screen has an instance
        if (screen.instance && screen.instance.hide) {
            screen.instance.hide();
        }
    }
    
    // Hide all screens
    hideAll() {
        this.screens.forEach((screen, name) => {
            this.hide(name);
        });
        this.currentScreen = null;
    }
    
    // Go back to previous screen
    back() {
        if (this.previousScreen) {
            this.show(this.previousScreen);
        }
    }
    
    // Get current screen name
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    // Check if a screen is currently showing
    isShowing(screenName) {
        return this.currentScreen === screenName;
    }
}