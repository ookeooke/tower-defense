// js/utils/MobileUtils.js
export const MobileUtils = {
    // Detect if device is mobile
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    
    // Detect if device supports touch
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    
    // Get device type
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Opera Mini/i.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    },
    
    // Prevent default touch behaviors
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    },
    
    // Get touch position from event
    getTouchPos(e, element) {
        const rect = element.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    },
    
    // Get all touch positions (for multi-touch)
    getAllTouchPositions(e, element) {
        const rect = element.getBoundingClientRect();
        const positions = [];
        
        for (let i = 0; i < e.touches.length; i++) {
            positions.push({
                id: e.touches[i].identifier,
                x: e.touches[i].clientX - rect.left,
                y: e.touches[i].clientY - rect.top
            });
        }
        
        return positions;
    },
    
    // Vibrate device (if supported)
    vibrate(duration = 10) {
        if ('vibrate' in navigator && this.isMobile) {
            navigator.vibrate(duration);
        }
    },
    
    // Pattern vibration
    vibratePattern(pattern) {
        if ('vibrate' in navigator && this.isMobile) {
            navigator.vibrate(pattern);
        }
    },
    
    // Show visual touch feedback
    showTouchFeedback(x, y, container = document.body) {
        const indicator = document.getElementById('touchIndicator');
        if (indicator) {
            const rect = container.getBoundingClientRect();
            indicator.style.left = (x + rect.left) + 'px';
            indicator.style.top = (y + rect.top) + 'px';
            indicator.classList.add('show');
            
            // Remove class after animation
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 600);
        }
    },
    
    // Request fullscreen
    requestFullscreen(element = document.documentElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        }
    },
    
    // Exit fullscreen
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    },
    
    // Check if in fullscreen
    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.msFullscreenElement ||
                 document.mozFullScreenElement);
    },
    
    // Toggle fullscreen
    toggleFullscreen() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.requestFullscreen();
        }
    },
    
    // Lock screen orientation (if supported)
    lockOrientation(orientation = 'landscape') {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock(orientation).catch(err => {
                console.log('Orientation lock failed:', err);
            });
        }
    },
    
    // Get current orientation
    getOrientation() {
        if (screen.orientation) {
            return screen.orientation.type;
        }
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    },
    
    // Prevent pull-to-refresh
    preventPullToRefresh() {
        let lastY = 0;
        
        document.addEventListener('touchstart', e => {
            lastY = e.touches[0].clientY;
        }, { passive: false });
        
        document.addEventListener('touchmove', e => {
            const y = e.touches[0].clientY;
            const scrolling = y > lastY && window.scrollY === 0;
            
            if (scrolling) {
                e.preventDefault();
            }
            lastY = y;
        }, { passive: false });
    },
    
    // Calculate scaled touch position for canvas
    getScaledTouchPos(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0] || e.changedTouches[0];
        
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    },
    
    // Check if device has notch (for safe areas)
    hasNotch() {
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (iOS) {
            const ratio = window.devicePixelRatio || 1;
            const screen = {
                width: window.screen.width * ratio,
                height: window.screen.height * ratio
            };
            
            // iPhone X and later
            return (screen.width === 1125 && screen.height === 2436) || // iPhone X, XS, 11 Pro
                   (screen.width === 1242 && screen.height === 2688) || // iPhone XS Max, 11 Pro Max
                   (screen.width === 828 && screen.height === 1792) ||  // iPhone XR, 11
                   (screen.width === 1170 && screen.height === 2532) || // iPhone 12, 12 Pro, 13, 13 Pro
                   (screen.width === 1284 && screen.height === 2778) || // iPhone 12 Pro Max, 13 Pro Max
                   (screen.width === 1080 && screen.height === 2340);   // iPhone 12 mini, 13 mini
        }
        return false;
    },
    
    // Get safe area insets
    getSafeAreaInsets() {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            top: parseInt(computedStyle.getPropertyValue('--sat') || 0),
            right: parseInt(computedStyle.getPropertyValue('--sar') || 0),
            bottom: parseInt(computedStyle.getPropertyValue('--sab') || 0),
            left: parseInt(computedStyle.getPropertyValue('--sal') || 0)
        };
    },
    
    // Optimize canvas for retina displays
    optimizeCanvasForRetina(canvas, ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        // Set actual size in memory
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Scale everything down using CSS
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        // Scale drawing context for correct drawing operations
        ctx.scale(dpr, dpr);
        
        return dpr;
    },
    
    // Detect if device has low performance
    isLowEndDevice() {
        // Check for older iOS devices
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (iOS) {
            const match = navigator.userAgent.match(/OS (\d+)_/);
            if (match && parseInt(match[1]) < 12) {
                return true;
            }
        }
        
        // Check for low RAM (if available)
        if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
            return true;
        }
        
        // Check for low core count
        if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4) {
            return true;
        }
        
        return false;
    },
    
    // Initialize mobile-specific settings
    initMobileSettings() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', e => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Prevent scrolling
        document.body.style.position = 'fixed';
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Add viewport meta tags dynamically if needed
        if (!document.querySelector('meta[name="viewport"]')) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
        }
        
        // Prevent pull-to-refresh
        this.preventPullToRefresh();
        
        // Set up CSS environment variables for safe areas
        if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
            document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
            document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
            document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
        }
    }
};