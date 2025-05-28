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
            if (towerDistance < 35) {
                this.selectTower(tower);
                return;
            }
        }
        
        // Try to place tower or move hero
        if (this.gameState.selectedHero && this.gameState.hero && !this.gameState.hero.isDead) {
            this.gameState.hero.setTarget(pos.x, pos.y);
            this.gameState.selectedHero = false;
            this.selectedEntity = null;
            MobileUtils.vibrate(10);
        } else if (this.gameState.selectedTower) {
            this.placeTower(pos);
        } else {
            // Deselect everything and show tower selector
            this.deselectAll();
        }
    }
    
    handleDoubleTap(pos) {
        // Quick upgrade on double tap
        for (const tower of this.gameState.towers) {
            const towerDistance = Math.hypot(tower.x - pos.x, tower.y - pos.y);
            if (towerDistance < 35) {
                if (tower.canUpgrade() && this.gameState.gold >= tower.getUpgradeCost()) {
                    tower.upgrade(this.gameState);
                    this.showTowerInfo(tower);
                    MobileUtils.vibrate([10, 50, 10]); // Pattern vibration for upgrade
                    
                    // Show upgrade effect
                    this.showUpgradeEffect(tower.x, tower.y);
                }
                return;
            }
        }
        
        // Double tap on hero to center camera (if implemented)
        if (this.gameState.hero && !this.gameState.hero.isDead) {
            const heroDistance = Math.hypot(
                this.gameState.hero.x - pos.x,
                this.gameState.hero.y - pos.y
            );
            if (heroDistance < 30) {
                // Could implement camera centering here
                MobileUtils.vibrate(20);
            }
        }
    }
    
    handleLongPress(pos) {
        // Long press on tower shows detailed info
        for (const tower of this.gameState.towers) {
            const towerDistance = Math.hypot(tower.x - pos.x, tower.y - pos.y);
            if (towerDistance < 35) {
                this.selectTower(tower);
                MobileUtils.vibrate(30);
                return;
            }
        }
        
        // Long press on empty space could show range indicators for all towers
        if (this.gameState.towers.length > 0) {
            // Could implement showing all tower ranges
            MobileUtils.vibrate(20);
        }
    }
    
    selectHero() {
        this.selectedEntity = 'hero';
        this.gameState.selectedHero = true;
        this.gameState.selectedTower = null;
        this.gameState.selectedTowerObj = null;
        
        // Clear tower selection
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('towerInfo').style.display = 'none';
        document.getElementById('towers').style.display = 'none';
        
        MobileUtils.vibrate(10);
    }
    
    selectTower(tower) {
        this.gameState.selectedTowerObj = tower;
        this.gameState.selectedTower = null;
        this.gameState.selectedHero = false;
        this.selectedEntity = null;
        
        // Clear tower button selection
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        
        // Show tower info and hide tower selector
        this.showTowerInfo(tower);
        document.getElementById('towers').style.display = 'none';
        
        MobileUtils.vibrate(10);
    }
    
    placeTower(pos) {
        if (this.gameState.isValidTowerPosition(pos.x, pos.y)) {
            const towerType = this.gameState.selectedTower;
            const cost = towerTypes[towerType].cost;
            
            if (this.gameState.gold >= cost) {
                // Create new tower
                this.gameState.towers.push(new Tower(pos.x, pos.y, towerType));
                this.gameState.gold -= cost;
                
                // Clear selection
                this.gameState.selectedTower = null;
                document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                
                // Feedback
                MobileUtils.vibrate([10, 30, 10]);
                this.showPlacementEffect(pos.x, pos.y);
                
                // Keep tower selector open for quick placement
                this.placementIndicator.show = false;
            } else {
                // Not enough gold
                MobileUtils.vibrate([50, 50, 50]);
                this.showErrorEffect(pos.x, pos.y, 'Not enough gold!');
            }
        } else {
            // Invalid position
            MobileUtils.vibrate([30, 30]);
            this.showErrorEffect(pos.x, pos.y, 'Invalid position!');
        }
    }
    
    deselectAll() {
        this.gameState.selectedTowerObj = null;
        this.gameState.selectedTower = null;
        this.gameState.selectedHero = false;
        this.selectedEntity = null;
        
        document.getElementById('towerInfo').style.display = 'none';
        document.getElementById('towers').style.display = 'flex';
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    }
    
    updatePlacementIndicator(pos) {
        this.placementIndicator.x = pos.x;
        this.placementIndicator.y = pos.y;
        this.placementIndicator.show = true;
        this.placementIndicator.valid = this.gameState.isValidTowerPosition(pos.x, pos.y);
        
        // Store in gameState for renderer
        this.gameState.placementPos = pos;
        this.gameState.isValidPlacement = this.placementIndicator.valid;
    }
    
    showTowerInfo(tower) {
        const info = document.getElementById('towerInfo');
        const config = tower.config;
        
        // Update tower info
        document.getElementById('towerName').textContent = towerTypes[tower.type].name;
        document.getElementById('towerLevel').textContent = tower.level + 1;
        document.getElementById('towerDamage').textContent = config.damage;
        document.getElementById('towerRange').textContent = config.range;
        document.getElementById('towerFireRate').textContent = (config.fireRate / 1000).toFixed(1) + 's';
        document.getElementById('towerDPS').textContent = Math.round(config.damage / (config.fireRate / 1000));
        
        // Update buttons
        const upgradeBtn = document.getElementById('upgradeBtn');
        const sellBtn = document.getElementById('sellBtn');
        
        if (tower.canUpgrade()) {
            const upgradeCost = tower.getUpgradeCost();
            upgradeBtn.textContent = `Upgrade (💰${upgradeCost})`;
            upgradeBtn.disabled = this.gameState.gold < upgradeCost;
            upgradeBtn.onclick = () => {
                if (tower.upgrade(this.gameState)) {
                    this.showTowerInfo(tower);
                    MobileUtils.vibrate([10, 50, 10]);
                    this.showUpgradeEffect(tower.x, tower.y);
                }
            };
        } else {
            upgradeBtn.textContent = 'MAX LEVEL';
            upgradeBtn.disabled = true;
            upgradeBtn.onclick = null;
        }
        
        sellBtn.textContent = `Sell (💰${tower.getSellValue()})`;
        sellBtn.onclick = () => {
            tower.sell(this.gameState);
            info.style.display = 'none';
            document.getElementById('towers').style.display = 'flex';
            MobileUtils.vibrate(20);
        };
        
        info.style.display = 'block';
    }
    
    // Visual effects
    showPlacementEffect(x, y) {
        // Add placement particles to gameState
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.gameState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 20,
                color: '#22c55e'
            });
        }
    }
    
    showUpgradeEffect(x, y) {
        // Add upgrade particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.gameState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4 - 2,
                life: 30,
                color: '#fbbf24'
            });
        }
    }
    
    showErrorEffect(x, y, message) {
        // Could implement floating text effect
        console.log(`Error at ${x}, ${y}: ${message}`);
    }
    
    // Get placement indicator for rendering
    getPlacementIndicator() {
        return this.placementIndicator;
    }
    
    // Clean up
    destroy() {
        // Remove all event listeners
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.handleTouchCancel);
        
        if (!MobileUtils.isMobile) {
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        }
        
        // Clear any pending timeouts
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }
        
        // Clear all touch data
        this.touches.forEach(touchData => {
            if (touchData.longPressTimer) {
                clearTimeout(touchData.longPressTimer);
            }
        });
        this.touches.clear();
    }
}