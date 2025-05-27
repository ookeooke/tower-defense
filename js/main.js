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
    if (!gameState.isPaused) {
        accumulator += deltaTime * gameState.gameSpeed;
    }
    
    // Update game at fixed timestep (only if not paused)
    while (accumulator >= frameTime && !gameState.isPaused) {
        updateGame();
        accumulator -= frameTime;
    }
    
    // Always update towers (even when paused) for targeting
    if (gameState.isPaused) {
        gameState.towers.forEach(tower => {
            // Just update targeting, don't fire
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
    }
    
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
document.querySelectorAll('.tower-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const towerType = e.currentTarget.dataset.tower;
        
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        
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

// Restart function
window.restartGame = function() {
    gameState.reset();
    gameState.hideScreens();
    lastTime = performance.now();
    accumulator = 0;
    requestAnimationFrame(gameLoop);
};

// Pause button
document.getElementById('pauseBtn').addEventListener('click', () => {
    if (gameState.gameRunning) {
        gameState.togglePause();
    }
});

// Speed button
document.getElementById('speedBtn').addEventListener('click', () => {
    if (gameState.gameRunning && !gameState.isPaused) {
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
            if (!gameState.isPaused) {
                gameState.cycleSpeed();
            }
            break;
    }
});

// Menu functions
window.showHeroSelect = function() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('heroSelect').classList.remove('hide');
    
    // Update hero levels from save data
    const warriorLevel = saveManager.data.heroes.warrior.level;
    document.querySelector('.hero-card[data-hero="warrior"] .hero-level').textContent = warriorLevel;
};

window.backToMainMenu = function() {
    document.getElementById('heroSelect').classList.add('hide');
    document.getElementById('mapSelect').classList.add('hide');
    document.getElementById('mainMenu').style.display = 'block';
};

window.showMapSelect = function() {
    document.getElementById('heroSelect').classList.add('hide');
    // Show world map instead of old map select
    worldMap.show();
};

window.backToHeroSelect = function() {
    document.getElementById('mapSelect').classList.add('hide');
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
    gameState.currentMapId = window.currentMap.id;  // Use window.currentMap
    gameState.reset();
    gameState.hideScreens();
    
    // Apply map-specific settings
    if (window.currentMap) {  // Use window.currentMap
        gameState.gold = window.currentMap.startingGold;
        gameState.lives = window.currentMap.startingLives;
        gameState.maxWave = window.currentMap.waves;
        // Update path in gameConfig (temporarily)
        gameConfig.path = window.currentMap.paths[0];
    }
    
    // Show game
    canvas.style.display = 'block';
    document.getElementById('gameControls').style.display = 'flex';
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
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('instructions').classList.remove('hide');
    document.getElementById('instructions').style.display = 'block';
};

window.hideInstructions = function() {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'block';
};

window.backToMenu = function() {
    gameState.gameRunning = false;
    gameState.hideScreens();
    saveBestScore();
    
    // Hide game and show world map
    canvas.style.display = 'none';
    document.getElementById('gameControls').style.display = 'none';
    worldMap.show();
    loadBestScore();
};

// Shop, Achievements, and Daily Challenge functions
window.showShop = function() {
    worldMap.hide();
    document.getElementById('shopScreen').classList.remove('hide');
};

window.hideShop = function() {
    document.getElementById('shopScreen').classList.add('hide');
    worldMap.show();
};

window.showAchievements = function() {
    worldMap.hide();
    document.getElementById('achievementsScreen').classList.remove('hide');
};

window.hideAchievements = function() {
    document.getElementById('achievementsScreen').classList.add('hide');
    worldMap.show();
};

window.showDailyChallenge = function() {
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