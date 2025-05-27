// js/systems/GameState.js
import { gameConfig } from '../config/gameConfig.js';

export class GameState {
    constructor() {
        this.difficulty = 'normal';
        this.isPaused = false;
        this.gameSpeed = 1; // 1 = normal, 2 = fast, 3 = faster
        this.currentMapId = null;
        this.reset();
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        const diffConfig = gameConfig.difficulty[difficulty];
        this.maxWave = diffConfig.maxWave;
    }
    
    reset() {
   const diffConfig = gameConfig.difficulty[this.difficulty] || gameConfig.difficulty.normal;
   
   this.gold = diffConfig.startGold;
   this.lives = diffConfig.startLives;
   this.wave = gameConfig.initialState.wave;
   this.score = gameConfig.initialState.score;
   this.maxWave = diffConfig.maxWave;
   this.selectedTower = null;
   this.selectedTowerObj = null;
   this.gameRunning = true;
   this.isPaused = true;  // Start paused instead of false
   this.gameSpeed = 1;
   this.enemies = [];
   this.towers = [];
   this.projectiles = [];
   this.particles = [];
   this.waveTimer = 0;
   this.enemiesSpawned = 0;
   this.enemiesInWave = gameConfig.waves.enemiesBase;
   
   // Show pause overlay initially
   const overlay = document.getElementById('pauseOverlay');
   const pauseBtn = document.getElementById('pauseBtn');
   overlay.style.display = 'flex';
   pauseBtn.textContent = '▶️';
   pauseBtn.classList.add('active');
}
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('pauseOverlay');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            overlay.style.display = 'flex';
            pauseBtn.textContent = '▶️';
            pauseBtn.classList.add('active');
        } else {
            overlay.style.display = 'none';
            pauseBtn.textContent = '⏸️';
            pauseBtn.classList.remove('active');
        }
    }
    
    cycleSpeed() {
        this.gameSpeed = this.gameSpeed >= 3 ? 1 : this.gameSpeed + 1;
        const speedBtn = document.getElementById('speedBtn');
        
        switch(this.gameSpeed) {
            case 1:
                speedBtn.textContent = '⏩';
                speedBtn.classList.remove('active');
                break;
            case 2:
                speedBtn.textContent = '⏩⏩';
                speedBtn.classList.add('active');
                break;
            case 3:
                speedBtn.textContent = '⏩⏩⏩';
                speedBtn.classList.add('active');
                break;
        }
    }
    
    updateUI() {
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('score').textContent = this.score;
    }
    
    nextWave() {
        this.wave++;
        this.enemiesSpawned = 0;
        this.enemiesInWave = Math.min(
            gameConfig.waves.maxEnemies, 
            gameConfig.waves.enemiesBase + this.wave * gameConfig.waves.enemiesPerWave
        );
        this.waveTimer = 0;
    }
    
    isValidTowerPosition(x, y) {
        // Check distance from path
        for (let point of gameConfig.path) {
            const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            if (distance < gameConfig.towers.minPlacementDistance) {
                return false;
            }
        }
        
        // Check distance from other towers
        for (let tower of this.towers) {
            const distance = Math.sqrt((tower.x - x) ** 2 + (tower.y - y) ** 2);
            if (distance < gameConfig.towers.minTowerDistance) {
                return false;
            }
        }
        
        return true;
    }
    
     showVictory() {
        document.getElementById('victoryScore').textContent = this.score;
        document.getElementById('victory').style.display = 'block';
        this.gameRunning = false;
        
        // Save progress
        const currentBest = parseInt(localStorage.getItem('towerDefenseBestScore') || 0);
        if (this.score > currentBest) {
            localStorage.setItem('towerDefenseBestScore', this.score);
        }
        
        // Save map progress
        if (this.currentMapId && window.saveManager) {
            window.saveManager.updateMapProgress(this.currentMapId, this.score, this.lives, this.difficulty);
            
            // Add gold reward
            const map = window.maps.find(m => m.id === this.currentMapId);
            if (map && map.rewards) {
                window.saveManager.addGold(map.rewards.gold);
                
                // Add hero XP
                if (map.rewards.heroXP) {
                    const selectedHero = window.saveManager.getSelectedHero();
                    window.saveManager.addHeroExperience(selectedHero, map.rewards.heroXP);
                }
            }
        }
    }
    
    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
        this.gameRunning = false;
    }
    
    hideScreens() {
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('victory').style.display = 'none';
        document.getElementById('towerInfo').style.display = 'none';
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    }
}