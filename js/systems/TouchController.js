// js/systems/TouchController.js
import { MobileUtils } from '../utils/MobileUtils.js';
import { Tower } from '../entities/Tower.js';
import { towerTypes } from '../config/towerTypes.js';

export class TouchController {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.touches = new Map();
        this.lastTap = 0;
        this.tapTimeout = null;
        this.dragStartPos = null;
        this.isDragging = false;
        this.selectedEntity = null;
        this.placementIndicator = { x: 0, y: 0, show: false, valid: false };
        
        // Touch gesture thresholds
        this.TAP_THRESHOLD = 10; // pixels
        this.DOUBLE_TAP_TIME = 300; // ms
        this.LONG_PRESS_TIME = 500; // ms
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
        
        // Mouse events for testing on desktop
        if (!MobileUtils.isMobile) {
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        }
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    handleTouchStart(e) {
        MobileUtils.preventDefaults(e);
        
        for (let touch of e.changedTouches) {
            const pos = this.getCanvasPos(touch);
            const touchData = {
                start: pos,
                current: pos,
                startTime: Date.now(),
                moved: false,
                identifier: touch.identifier
            };
            
            this.touches.set(touch.identifier, touchData);
            
            // Long press detection
            touchData.longPressTimer = setTimeout(() => {
                if (!touchData.moved) {
                    this.handleLongPress(pos);
                }
            }, this.LONG_PRESS_TIME);
            
            // Show visual feedback
            const rect = this.canvas.getBoundingClientRect();
            MobileUtils.showTouchFeedback(
                touch.clientX - rect.left, 
                touch.clientY - rect.top
            );
            
            // Light vibration on touch
            MobileUtils.vibrate(5);
        }
        
        // Handle single touch start
        if (e.touches.length === 1) {
            this.dragStartPos = this.getCanvasPos(e.touches[0]);
        }
    }
    
    handleTouchMove(e) {
        MobileUtils.preventDefaults(e);
        
        for (let touch of e.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                const pos = this.getCanvasPos(touch);
                touchData.current = pos;
                
                // Check if moved beyond tap threshold
                const dx = pos.x - touchData.start.x;
                const dy = pos.y - touchData.start.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > this.TAP_THRESHOLD) {
                    touchData.moved = true;
                    clearTimeout(touchData.longPressTimer);
                }
                
                // Handle dragging
                if (this.selectedEntity === 'hero' && this.gameState.hero && !this.gameState.hero.isDead) {
                    this.gameState.hero.setTarget(pos.x, pos.y);
                    this.isDragging = true;
                } else if (this.gameState.selectedTower) {
                    // Show placement indicator
                    this.updatePlacementIndicator(pos);
                }
            }
        }
    }
    
    handleTouchEnd(e) {
        MobileUtils.preventDefaults(e);
        
        for (let touch of e.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                clearTimeout(touchData.longPressTimer);
                
                const endTime = Date.now();
                const duration = endTime - touchData.startTime;
                
                // Check if it was a tap (not moved much and quick)
                if (!touchData.moved && duration < 200) {
                    const pos = touchData.current;
                    
                    // Check for double tap
                    if (endTime - this.lastTap < this.DOUBLE_TAP_TIME) {
                        clearTimeout(this.tapTimeout);
                        this.handleDoubleTap(pos);
                        this.lastTap = 0;
                    } else {
                        // Single tap with delay to check for double tap
                        this.lastTap = endTime;
                        this.tapTimeout = setTimeout(() => {
                            this.handleTap(pos);
                            this.lastTap = 0;
                        }, this.DOUBLE_TAP_TIME);
                    }
                }
                
                this.touches.delete(touch.identifier);
            }
        }
        
        // Reset states
        if (this.touches.size === 0) {
            this.isDragging = false;
            this.dragStartPos = null;
            this.placementIndicator.show = false;
            
            if (this.selectedEntity === 'hero' && !this.isDragging) {
                this.selectedEntity = null;
                this.gameState.selectedHero = false;
            }
        }
    }
    
    handleTouchCancel(e) {
        // Handle touch cancel same as touch end
        this.handleTouchEnd(e);
    }
    
    handleMouseDown(e) {
        if (MobileUtils.isMobile) return;
        
        const pos = this.getCanvasPos(e);
        const fakeTouch = {
            identifier: 'mouse',
            clientX: e.clientX,
            clientY: e.clientY
        };
        
        this.touches.set('mouse', {
            start: pos,
            current: pos,
            startTime: Date.now(),
            moved: false,
            identifier: 'mouse'
        });
        
        this.dragStartPos = pos;
    }
    
    handleMouseMove(e) {
        if (MobileUtils.isMobile) return;
        
        const touchData = this.touches.get('mouse');
        if (touchData) {
            const pos = this.getCanvasPos(e);
            const dx = pos.x - touchData.start.x;
            const dy = pos.y - touchData.start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.TAP_THRESHOLD) {
                touchData.moved = true;
            }
            
            touchData.current = pos;
            
            if (this.selectedEntity === 'hero' && this.gameState.hero) {
                this.gameState.hero.setTarget(pos.x, pos.y);
            } else if (this.gameState.selectedTower) {
                this.updatePlacementIndicator(pos);
            }
        }
    }
    
    handleMouseUp(e) {
        if (MobileUtils.isMobile) return;
        
        const touchData = this.touches.get('mouse');
        if (touchData && !touchData.moved) {
            const pos = this.getCanvasPos(e);
            this.handleTap(pos);
        }
        
        this.touches.delete('mouse');
        this.placementIndicator.show = false;
    }
    
    getCanvasPos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const clientX = event.clientX || event.pageX;
        const clientY = event.clientY || event.pageY;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    handleTap(pos) {
        // Check if tapping on hero
        if (this.gameState.hero && !this.gameState.hero.isDead) {
            const heroDistance = Math.hypot(
                this.gameState.hero.x - pos.x,
                this.gameState.hero.y - pos.y
            );
            
            if (heroDistance < 30) {
                this.selectHero();
                return;
            }
        }
        
        // Check if tapping on a tower
        for (const tower of this.gameState.towers) {
            const towerDistance = Math.hypot(tower.x - pos.x, tower.y - pos.y);
            if (towerDistance < 35)