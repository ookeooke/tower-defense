// js/Game.js
import { GameState } from './systems/GameState.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { WaveManager } from './systems/WaveManager.js';
import { Tower } from './entities/Tower.js';
import { towerTypes } from './config/towerTypes.js';
import { gameConfig } from './config/gameConfig.js';

export class Game {
    constructor(canvas, saveManager, worldMap) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.saveManager = saveManager;
        this.worldMap = worldMap;
        
        // Initialize game systems
        this.gameState = new GameState();
        this.renderer = new RenderSystem(this.ctx);
        this.waveManager = new WaveManager();
        
        // Game loop properties
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameTime = 1000 / 60; // 60 FPS
        
        // Current map data
        this.currentMap = null;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleCanvasInteraction = this.handleCanvasInteraction.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Canvas interaction
        this.canvas.addEventListener('click', this.handleCanvasInteraction);
        this.canvas.addEventListener('touchstart', this.handleCanvasInteraction);
        
        // Tower selection buttons
        document.querySelectorAll('.tower-btn[data-tower]').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTowerSelection(e));
        });
        
        // Upgrade and sell buttons
        document.getElementById('upgradeBtn').addEventListener('click', () => this.handleUpgrade());
        document.getElementById('sellBtn').addEventListener('click', () => this.handleSell());
        
        // Respawn hero button
        document.getElementById('respawnHero').addEventListener('click', () => this.handleRespawnHero());
        
        // Game control buttons
        document.getElementById('pauseBtn').addEventListener('click', () => this.handlePause());
        document.getElementById('speedBtn').addEventListener('click', () => this.handleSpeed());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    start(map, difficulty) {
        this.currentMap = map;
        window.currentMap = map; // Keep global reference for compatibility
        
        this.gameState.setDifficulty(difficulty);
        this.gameState.currentMapId = map.id;
        this.gameState.reset();
        
        // Apply map-specific settings
        if (this.currentMap) {
            this.gameState.gold = this.currentMap.startingGold;
            this.gameState.lives = this.currentMap.startingLives;
            this.gameState.maxWave = this.currentMap.waves;
            gameConfig.path = this.currentMap.paths[0];
        }
        
        // Reset UI elements
        this.resetUI();
        
        // Start game loop
        this.lastTime = performance.now();
        this.accumulator = 0;
        requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop(currentTime) {
        if (!this.gameState.gameRunning) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Apply game speed (only if not paused)
        if (!this.gameState.isPaused && this.gameState.phase === 'combat') {
            this.accumulator += deltaTime * this.gameState.gameSpeed;
        }
        
        // Update game at fixed timestep
        while (this.accumulator >= this.frameTime && !this.gameState.isPaused && this.gameState.phase === 'combat') {
            this.update();
            this.accumulator -= this.frameTime;
        }
        
        // Always update tower targeting (even when paused)
        this.updateTowerTargeting();
        
        // Always render
        this.renderer.render(this.gameState);
        
        // Always update UI
        this.gameState.updateUI();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update() {
        // Update wave manager
        this.waveManager.update(this.gameState);
        
        // Update enemies
        for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = this.gameState.enemies[i];
            const reachedEnd = enemy.update();
            
            if (reachedEnd) {
                this.gameState.lives--;
                this.gameState.enemies.splice(i, 1);
                
                if (this.gameState.lives <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Update hero
        if (this.gameState.hero && !this.gameState.hero.isDead) {
            this.gameState.hero.update(this.gameState.enemies);
        }
        
        // Update towers
        this.gameState.towers.forEach(tower => {
            tower.update(this.gameState.enemies, this.gameState.projectiles);
        });
        
        // Update projectiles
        for (let i = this.gameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.gameState.projectiles[i];
            if (projectile.update(this.gameState.enemies, this.gameState.particles, this.gameState)) {
                this.gameState.projectiles.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.gameState.particles.length - 1; i >= 0; i--) {
            const particle = this.gameState.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.gameState.particles.splice(i, 1);
            }
        }
    }
    
    updateTowerTargeting() {
        this.gameState.towers.forEach(tower => {
            // Update targeting
            tower.target = null;
            let closestDistance = tower.config.range;
            
            for (let enemy of this.gameState.enemies) {
                const dx = enemy.x - tower.x;
                const dy = enemy.y - tower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= tower.config.range && distance < closestDistance) {
                    tower.target = enemy;
                    closestDistance = distance;
                }
            }
            
            // Update angle to target
            if (tower.target) {
                const dx = tower.target.x - tower.x;
                const dy = tower.target.y - tower.y;
                tower.angle = Math.atan2(dy, dx);
            }
        });
    }
    
    handleCanvasInteraction(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Get position from either mouse or touch
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        
        // Check if clicking on hero first
        if (this.gameState.hero && !this.gameState.hero.isDead) {
            const heroDistance = Math.hypot(this.gameState.hero.x - x, this.gameState.hero.y - y);
            if (heroDistance < 20) {
                this.selectHero();
                return;
            }
        }
        
        // If hero is selected, move hero
        if (this.gameState.selectedHero) {
            this.gameState.hero.setTarget(x, y);
            this.gameState.selectedHero = false;
            return;
        }
        
        // Check if clicking on existing tower
        for (const tower of this.gameState.towers) {
            if (Math.hypot(tower.x - x, tower.y - y) < 30) {
                this.selectTower(tower);
                return;
            }
        }
        
        // Try to place new tower
        if (this.gameState.selectedTower && this.gameState.isValidTowerPosition(x, y)) {
            this.placeTower(x, y);
        } else {
            this.deselectAll();
        }
    }
    
    handleTowerSelection(e) {
        const towerType = e.currentTarget.dataset.tower;
        
        document.querySelectorAll('.tower-btn[data-tower]').forEach(b => b.classList.remove('selected'));
        
        if (this.gameState.selectedTower === towerType) {
            this.gameState.selectedTower = null;
        } else {
            this.gameState.selectedTower = towerType;
            e.currentTarget.classList.add('selected');
        }
    }
    
    selectHero() {
        this.gameState.selectedHero = true;
        this.gameState.selectedTower = null;
        this.gameState.selectedTowerObj = null;
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('towerInfo').style.display = 'none';
    }
    
    selectTower(tower) {
        this.gameState.selectedTowerObj = tower;
        this.gameState.selectedTower = null;
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        this.showTowerInfo(tower);
    }
    
    placeTower(x, y) {
        const cost = towerTypes[this.gameState.selectedTower].cost;
        if (this.gameState.gold >= cost) {
            this.gameState.towers.push(new Tower(x, y, this.gameState.selectedTower));
            this.gameState.gold -= cost;
            this.gameState.selectedTower = null;
            document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        }
    }
    
    deselectAll() {
        this.gameState.selectedTowerObj = null;
        document.getElementById('towerInfo').style.display = 'none';
    }
    
    showTowerInfo(tower) {
        document.getElementById('towerName').textContent = towerTypes[tower.type].name;
        document.getElementById('towerLevel').textContent = tower.level + 1;
        document.getElementById('towerDamage').textContent = tower.config.damage;
        document.getElementById('towerRange').textContent = tower.config.range;
        document.getElementById('towerFireRate').textContent = (tower.config.fireRate / 1000).toFixed(1) + 's';
        
        const upgradeBtn = document.getElementById('upgradeBtn');
        const sellBtn = document.getElementById('sellBtn');
        
        if (tower.canUpgrade()) {
            upgradeBtn.textContent = `Upgrade (💰${tower.getUpgradeCost()})`;
            upgradeBtn.disabled = this.gameState.gold < tower.getUpgradeCost();
        } else {
            upgradeBtn.textContent = 'MAX LEVEL';
            upgradeBtn.disabled = true;
        }
        
        sellBtn.textContent = `Sell (💰${tower.getSellValue()})`;
        document.getElementById('towerInfo').style.display = 'block';
    }
    
    handleUpgrade() {
        if (this.gameState.selectedTowerObj && this.gameState.selectedTowerObj.upgrade(this.gameState)) {
            this.showTowerInfo(this.gameState.selectedTowerObj);
        }
    }
    
    handleSell() {
        if (this.gameState.selectedTowerObj) {
            this.gameState.selectedTowerObj.sell(this.gameState);
        }
    }
    
    handleRespawnHero() {
        if (this.gameState.hero && this.gameState.hero.isDead && this.gameState.gold >= 100) {
            this.gameState.respawnHero();
        }
    }
    
    handlePause() {
        if (this.gameState.gameRunning) {
            this.gameState.togglePause();
        }
    }
    
    handleSpeed() {
        if (this.gameState.gameRunning && !this.gameState.isPaused && this.gameState.phase === 'combat') {
            this.gameState.cycleSpeed();
        }
    }
    
    handleKeyboard(e) {
        if (!this.gameState.gameRunning) return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'p':
                e.preventDefault();
                this.gameState.togglePause();
                break;
            case 'f':
                e.preventDefault();
                if (!this.gameState.isPaused && this.gameState.phase === 'combat') {
                    this.gameState.cycleSpeed();
                }
                break;
        }
    }
    
    resetUI() {
        // Reset speed button
        const speedBtn = document.getElementById('speedBtn');
        speedBtn.textContent = '⏩';
        speedBtn.classList.remove('active');
        
        // Reset pause button
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = '⏸️';
        pauseBtn.classList.remove('active');
    }
    
    gameOver() {
        this.gameState.showGameOver();
        this.saveBestScore();
    }
    
    saveBestScore() {
        const currentBest = parseInt(localStorage.getItem('towerDefenseBestScore') || 0);
        if (this.gameState.score > currentBest) {
            localStorage.setItem('towerDefenseBestScore', this.gameState.score);
        }
    }
    
    stop() {
        this.gameState.gameRunning = false;
    }
}