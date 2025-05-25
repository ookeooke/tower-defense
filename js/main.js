// js/main.js
import { GameState } from './systems/GameState.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { WaveManager } from './systems/WaveManager.js';
import { Tower } from './entities/Tower.js';
import { towerTypes } from './config/towerTypes.js';
import { gameConfig } from './config/gameConfig.js';

// Initialize game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = gameConfig.canvas.width;
canvas.height = gameConfig.canvas.height;

const gameState = new GameState();
const renderer = new RenderSystem(ctx);
const waveManager = new WaveManager();

// Game loop
function gameLoop() {
    if (!gameState.gameRunning) return;
    
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
    
    // Render everything
    renderer.render(gameState);
    
    // Update UI
    gameState.updateUI();
    
    requestAnimationFrame(gameLoop);
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

// Canvas click handler
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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
});

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
    gameLoop();
};

// Start the game
gameLoop();