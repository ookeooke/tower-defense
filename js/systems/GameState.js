// js/systems/GameState.js
import { gameConfig } from '../config/gameConfig.js';

export class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.gold = gameConfig.initialState.gold;
        this.lives = gameConfig.initialState.lives;
        this.wave = gameConfig.initialState.wave;
        this.score = gameConfig.initialState.score;
        this.selectedTower = null;
        this.selectedTowerObj = null;
        this.gameRunning = true;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.waveTimer = 0;
        this.enemiesSpawned = 0;
        this.enemiesInWave = gameConfig.waves.enemiesBase;
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