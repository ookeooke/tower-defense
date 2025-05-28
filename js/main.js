// js/main.js
import { GameState } from './systems/GameState.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { WaveManager } from './systems/WaveManager.js';
import { Tower } from './entities/Tower.js';
import { towerTypes } from './config/towerTypes.js';
import { gameConfig } from './config/gameConfig.js';
import { SaveManager } from './systems/SaveManager.js';
import { maps, getMapById } from './config/mapConfig.js';
import { WorldMap } from './systems/WorldMap.js';

// Initialize game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize save manager and world map
const saveManager = new SaveManager();
const worldMap = new WorldMap(saveManager);
window.saveManager = saveManager; // Make available globally
window.maps = maps; // Make maps available globally
window.worldMap = worldMap; // Make world map available globally

// Current map data
let currentMap = null;

// Handle responsive canvas sizing
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const rect = container.getBoundingClientRect();
    
    // Set canvas size to match container
    canvas.width = gameConfig.canvas.width;
    canvas.height = gameConfig.canvas.height;
    
    // Scale the canvas to fit
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}

function showGameHUD() {
    document.getElementById('towers').classList.remove('hide');
    document.getElementById('towers').style.display = 'flex'; // Force display
    document.getElementById('gameControls').classList.remove('hide');
}

function hideGameHUD() {
    document.getElementById('towers').classList.add('hide');
    document.getElementById('gameControls').classList.add('hide');
}

function hideAllScreens() {
    const screens = [
        'mainMenu',
        'heroSelect',
        'worldMap',
        'instructions',
        'shopScreen',
        'achievementsScreen',
        'dailyChallengeScreen',
        'mapSelect'
        // Removed 'gameOver' and 'victory' - they should be managed separately
    ];
    
    screens.forEach(screenId => {
        const element = document.getElementById(screenId);
        if (element) {
            element.classList.add('hide');
            element.style.display = '';  // Reset display property
        }
    });
    
    hideGameHUD();
}
// Handle window resize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const gameState = new GameState();
const renderer = new RenderSystem(ctx);
const waveManager = new WaveManager();

// Initially hide the canvas until game starts
canvas.style.display = 'none';

// Load best score and total gold from localStorage
function loadBestScore() {
    const bestScore = localStorage.getItem('towerDefenseBestScore') || 0;
    document.getElementById('bestScore').textContent = bestScore;
    document.getElementById('totalGold').textContent = saveManager.data.totalGold;
}

// Save best score
function saveBestScore() {
    const currentBest = parseInt(localStorage.getItem('towerDefenseBestScore') || 0);
    if (gameState.score > currentBest) {
        localStorage.setItem('towerDefenseBestScore', gameState.score);
    }
}

// Game loop
let lastTime = 0;
let accumulator = 0;
const frameTime = 1000 / 60; // 60 FPS

function gameLoop(currentTime) {
    if (!gameState.gameRunning) return;
    
    // Calculate delta time
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Apply game speed (only if not paused)
    if (!gameState.isPaused && gameState.phase === 'combat') {
        accumulator += deltaTime * gameState.gameSpeed;
    }
    
    // Update game at fixed timestep (only if not paused and in combat phase)
    while (accumulator >= frameTime && !gameState.isPaused && gameState.phase === 'combat') {
        updateGame();
        accumulator -= frameTime;
    }
    
    // Always update towers for targeting visualization (even when paused)
    gameState.towers.forEach(tower => {
        // Update targeting
        tower.target = null;
        let closestDistance = tower.config.range;
        
        for (let enemy of gameState.enemies) {
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
    
    // Always render everything
    renderer.render(gameState);
    
    // Always update UI
    gameState.updateUI();
    
    requestAnimationFrame(gameLoop);
}

function updateGame() {
    // Update wave manager
    waveManager.update(gameState);
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        const reachedEnd = enemy.update();
        
        if (reachedEnd) {
            gameState.lives--;
            gameState.enemies.splice(i, 1);
            
            if (gameState.lives <= 0) {
                gameState.showGameOver();
                saveBestScore();
                return;
            }
        }
    }
    
    // Update hero
    if (gameState.hero && !gameState.hero.isDead) {
        gameState.hero.update(gameState.enemies);
    }
    
    // Update towers
    gameState.towers.forEach(tower => {
        tower.update(gameState.enemies, gameState.projectiles);
    });
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        if (projectile.update(gameState.enemies, gameState.particles, gameState)) {
            gameState.projectiles.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Tower selection buttons
document.querySelectorAll('.tower-btn[data-tower]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const towerType = e.currentTarget.dataset.tower;
        
        document.querySelectorAll('.tower-btn[data-tower]').forEach(b => b.classList.remove('selected'));
        
        if (gameState.selectedTower === towerType) {
            gameState.selectedTower = null;
        } else {
            gameState.selectedTower = towerType;
            e.currentTarget.classList.add('selected');
        }
    });
});

// Canvas click handler (works for both mouse and touch)
function handleCanvasInteraction(e) {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get position from either mouse or touch
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // Calculate actual position considering scale
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    // Check if clicking on hero first
    if (gameState.hero && !gameState.hero.isDead) {
        const heroDistance = Math.hypot(gameState.hero.x - x, gameState.hero.y - y);
        if (heroDistance < 20) {
            // Hero is selected, next click will move hero
            gameState.selectedHero = true;
            gameState.selectedTower = null;
            gameState.selectedTowerObj = null;
            document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('towerInfo').style.display = 'none';
            return;
        }
    }
    
    // If hero is selected, move hero to clicked position
    if (gameState.selectedHero) {
        gameState.hero.setTarget(x, y);
        gameState.selectedHero = false;
        return;
    }
    
    // Check if clicking on existing tower
    for (const tower of gameState.towers) {
        if (Math.hypot(tower.x - x, tower.y - y) < 30) {
            gameState.selectedTowerObj = tower;
            gameState.selectedTower = null;
            document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
            showTowerInfo(tower);
            return;
        }
    }
    
    // Try to place new tower
    if (gameState.selectedTower && gameState.isValidTowerPosition(x, y)) {
        const cost = towerTypes[gameState.selectedTower].cost;
        if (gameState.gold >= cost) {
            gameState.towers.push(new Tower(x, y, gameState.selectedTower));
            gameState.gold -= cost;
            gameState.selectedTower = null;
            document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        }
    } else {
        gameState.selectedTowerObj = null;
        document.getElementById('towerInfo').style.display = 'none';
    }
}

canvas.addEventListener('click', handleCanvasInteraction);
canvas.addEventListener('touchstart', handleCanvasInteraction);

// Tower info display
function showTowerInfo(tower) {
    document.getElementById('towerName').textContent = towerTypes[tower.type].name;
    document.getElementById('towerLevel').textContent = tower.level + 1;
    document.getElementById('towerDamage').textContent = tower.config.damage;
    document.getElementById('towerRange').textContent = tower.config.range;
    document.getElementById('towerFireRate').textContent = (tower.config.fireRate / 1000).toFixed(1) + 's';
    
    const upgradeBtn = document.getElementById('upgradeBtn');
    const sellBtn = document.getElementById('sellBtn');
    
    if (tower.canUpgrade()) {
        upgradeBtn.textContent = `Upgrade (💰${tower.getUpgradeCost()})`;
        upgradeBtn.disabled = gameState.gold < tower.getUpgradeCost();
    } else {
        upgradeBtn.textContent = 'MAX LEVEL';
        upgradeBtn.disabled = true;
    }
    
    sellBtn.textContent = `Sell (💰${tower.getSellValue()})`;
    document.getElementById('towerInfo').style.display = 'block';
}

// Upgrade and sell buttons
document.getElementById('upgradeBtn').addEventListener('click', () => {
    if (gameState.selectedTowerObj && gameState.selectedTowerObj.upgrade(gameState)) {
        showTowerInfo(gameState.selectedTowerObj);
    }
});

document.getElementById('sellBtn').addEventListener('click', () => {
    if (gameState.selectedTowerObj) {
        gameState.selectedTowerObj.sell(gameState);
    }
});

document.getElementById('respawnHero').addEventListener('click', () => {
    if (gameState.hero && gameState.hero.isDead && gameState.gold >= 100) {
        gameState.respawnHero();
    }
});

// Retry level function
window.retryLevel = function() {
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    
    // Reset the game state but keep the same map
    gameState.reset();
    gameState.hideScreens();
    
    // Apply map-specific settings again
    if (window.currentMap) {
        gameState.gold = window.currentMap.startingGold;
        gameState.lives = window.currentMap.startingLives;
        gameState.maxWave = window.currentMap.waves;
        gameConfig.path = window.currentMap.paths[0];
    }
    
    // Restart the game loop
    lastTime = performance.now();
    accumulator = 0;
    requestAnimationFrame(gameLoop);
};

// Restart function (for victory screen)
window.restartGame = function() {
    retryLevel(); // Just use the same retry logic
};

// Pause button
document.getElementById('pauseBtn').addEventListener('click', () => {
    if (gameState.gameRunning) {
        gameState.togglePause();
    }
});

// Speed button
document.getElementById('speedBtn').addEventListener('click', () => {
    if (gameState.gameRunning && !gameState.isPaused && gameState.phase === 'combat') {
        gameState.cycleSpeed();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!gameState.gameRunning) return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'p':
            e.preventDefault();
            gameState.togglePause();
            break;
        case 'f':
            e.preventDefault();
            if (!gameState.isPaused && gameState.phase === 'combat') {
                gameState.cycleSpeed();
            }
            break;
    }
});

// Menu functions
window.showHeroSelect = function() {
    hideAllScreens();
    document.getElementById('heroSelect').classList.remove('hide');
    
    // Update hero levels from save data
    const warriorLevel = saveManager.data.heroes.warrior.level;
    document.querySelector('.hero-card[data-hero="warrior"] .hero-level').textContent = warriorLevel;
};

window.backToMainMenu = function() {
    hideAllScreens();
    document.getElementById('mainMenu').classList.remove('hide');
};

window.showMapSelect = function() {
    hideAllScreens();
    // Show world map instead of old map select
    worldMap.show();
};

window.backToHeroSelect = function() {
    hideAllScreens();
    worldMap.hide();
    document.getElementById('heroSelect').classList.remove('hide');
};

function generateMapCards() {
    const mapGrid = document.getElementById('mapGrid');
    mapGrid.innerHTML = '';
    
    const difficulty = document.getElementById('difficulty').value;
    
    maps.forEach((map, index) => {
        const isUnlocked = saveManager.isMapUnlocked(map.id);
        const stars = saveManager.getMapStars(map.id, difficulty);
        
        const mapCard = document.createElement('div');
        mapCard.className = `map-card ${isUnlocked ? '' : 'locked'}`;
        mapCard.dataset.mapId = map.id;
        
        mapCard.innerHTML = `
            <div class="map-thumbnail">${map.thumbnail}</div>
            <h3>${map.name}</h3>
            <p>${map.description}</p>
            <div class="map-stars">
                ${[1, 2, 3].map(i => `<span class="star ${i <= stars ? 'earned' : ''}">⭐</span>`).join('')}
            </div>
            <div class="map-difficulty">
                <span class="diff-indicator ${stars > 0 ? 'completed' : ''}">
                    ${difficulty.toUpperCase()} ${stars > 0 ? '✓' : ''}
                </span>
            </div>
        `;
        
        if (isUnlocked) {
            mapCard.onclick = () => selectMap(map.id);
        }
        
        mapGrid.appendChild(mapCard);
    });
}

function selectMap(mapId) {
    currentMap = getMapById(mapId);
    if (!currentMap) return;
    
    // Hide map select and start game with selected map
    document.getElementById('mapSelect').classList.add('hide');
    startGameWithMap();
}

window.startGameWithMap = function() {
    const difficulty = document.getElementById('difficulty').value;
    gameState.setDifficulty(difficulty);
    gameState.currentMapId = window.currentMap.id;
    gameState.reset();
    gameState.hideScreens();
    
    // Apply map-specific settings
    if (window.currentMap) {
        gameState.gold = window.currentMap.startingGold;
        gameState.lives = window.currentMap.startingLives;
        gameState.maxWave = window.currentMap.waves;
        gameConfig.path = window.currentMap.paths[0];
    }
    
    // Show game
    canvas.style.display = 'block';
    document.getElementById('gameControls').style.display = 'flex';
    showGameHUD(); // THIS IS THE IMPORTANT LINE - Make sure it's called!
    resizeCanvas();
    
    // Reset speed button
    const speedBtn = document.getElementById('speedBtn');
    speedBtn.textContent = '⏩';
    speedBtn.classList.remove('active');
    
    // Reset pause button
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.textContent = '⏸️';
    pauseBtn.classList.remove('active');
    
    lastTime = performance.now();
    accumulator = 0;
    requestAnimationFrame(gameLoop);
};

// Set current map globally for WorldMap to use
window.currentMap = currentMap;

// Legacy function for backwards compatibility
window.startNewGame = function() {
    showHeroSelect();
};

window.showInstructions = function() {
    hideAllScreens();
    document.getElementById('instructions').classList.remove('hide');
};

window.hideInstructions = function() {
    hideAllScreens();
    document.getElementById('mainMenu').classList.remove('hide');
};

window.backToMenu = function() {
    gameState.gameRunning = false;
    gameState.hideScreens();
    saveBestScore();
    
    // Hide game and show world map
    canvas.style.display = 'none';
    hideGameHUD();
    worldMap.show();
    loadBestScore();
};

// Shop, Achievements, and Daily Challenge functions
window.showShop = function() {
    hideAllScreens();
    worldMap.hide();
    document.getElementById('shopScreen').classList.remove('hide');
};

window.hideShop = function() {
    document.getElementById('shopScreen').classList.add('hide');
    worldMap.show();
};

window.showAchievements = function() {
    hideAllScreens();
    worldMap.hide();
    document.getElementById('achievementsScreen').classList.remove('hide');
};

window.hideAchievements = function() {
    document.getElementById('achievementsScreen').classList.add('hide');
    worldMap.show();
};

window.showDailyChallenge = function() {
    hideAllScreens();
    worldMap.hide();
    document.getElementById('dailyChallengeScreen').classList.remove('hide');
};

window.hideDailyChallenge = function() {
    document.getElementById('dailyChallengeScreen').classList.add('hide');
    worldMap.show();
};

// Initialize
loadBestScore();

// Hero selection
document.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', (e) => {
        const heroId = e.currentTarget.dataset.hero;
        if (!e.currentTarget.classList.contains('locked')) {
            // Remove selected from all cards
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
            // Add selected to clicked card
            e.currentTarget.classList.add('selected');
            // Save selected hero
            saveManager.selectHero(heroId);
        }
    });
});