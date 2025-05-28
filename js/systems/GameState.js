// js/systems/GameState.js
import { gameConfig } from '../config/gameConfig.js';


export class GameState {
    constructor() {
        /** 'build' = before first wave, enemies frozen
         *  'combat' = normal play
         */
        this.phase = 'build';
        this.difficulty = 'normal';
        this.isPaused = true;  // only used after combat starts
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
   this.phase = 'build';
   this.isPaused = true;  // build phase is technically "paused"
   this.gameSpeed = 1; // Reset game speed
   this.enemies = [];
   this.towers = [];
   this.projectiles = [];
   this.particles = [];
   this.waveTimer = 0;
   this.enemiesSpawned = 0;
   this.enemiesInWave = gameConfig.waves.enemiesBase;
   
   // Initialize hero at spawn point
   this.hero = new Hero(100, 300, 'warrior');
   
   // Show build phase overlay
   const overlay = document.getElementById('pauseOverlay');
   const pauseBtn = document.getElementById('pauseBtn');
   const pauseMessage = document.getElementById('pauseMessage');
   
   overlay.style.display = 'flex';
pauseMessage.innerHTML = '<h2>PREPARE YOUR DEFENSES!</h2><p style="margin-top:10px; font-size: 16px;">Place towers and position your hero</p><p style="margin-top:10px; color: #64748b;">Press ▶️ or SPACE to begin</p>';
   pauseBtn.classList.add('active');
   
   // Disable speed button initially
   const speedBtn = document.getElementById('speedBtn');
   speedBtn.disabled = true;
   speedBtn.style.opacity = '0.5';
   speedBtn.style.cursor = 'not-allowed';
   
   // Show hero health initially
   document.getElementById('heroHealth').style.display = 'block';
   document.getElementById('heroHp').textContent = this.hero.hp;
   document.getElementById('respawnHero').style.display = 'none';
}
    
    togglePause() {
        // FIRST click = start the game
        if (this.phase === 'build') {
            this.phase = 'combat';
            this.isPaused = false;
            document.getElementById('pauseOverlay').style.display = 'none';
            document.getElementById('pauseBtn').textContent = '⏸️';
            document.getElementById('pauseBtn').classList.remove('active');
            document.body.classList.remove('paused');
            
            // Enable speed button
            const speedBtn = document.getElementById('speedBtn');
            speedBtn.disabled = false;
            speedBtn.style.opacity = '1';
            speedBtn.style.cursor = 'pointer';
            return;
        }
        
        // Mid-game pause/resume
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        const speedBtn = document.getElementById('speedBtn');
        
        pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';
        pauseBtn.classList.toggle('active', this.isPaused);
        
        // We do **not** bring back the overlay – the screen just freezes.
        // But we do add a subtle dimming effect
        document.body.classList.toggle('paused', this.isPaused);
        
        // Disable/enable speed button
        if (this.isPaused) {
            speedBtn.disabled = true;
            speedBtn.style.opacity = '0.5';
            speedBtn.style.cursor = 'not-allowed';
        } else {
            speedBtn.disabled = false;
            speedBtn.style.opacity = '1';
            speedBtn.style.cursor = 'pointer';
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
        
        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (this.phase === 'build') {
            statusElement.textContent = 'BUILD PHASE';
            statusElement.style.color = '#22c55e';
        } else {
            statusElement.textContent = '';
        }
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