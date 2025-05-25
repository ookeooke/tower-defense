// js/systems/WaveManager.js
import { Enemy } from '../entities/Enemy.js';
import { gameConfig } from '../config/gameConfig.js';

export class WaveManager {
    constructor() {
        this.spawnTimer = 0;
    }
    
    update(gameState) {
        // Check if we need to spawn enemies
        if (gameState.enemiesSpawned < gameState.enemiesInWave) {
            this.spawnTimer++;
            if (this.spawnTimer > gameConfig.waves.spawnDelay) {
                this.spawnEnemy(gameState);
                this.spawnTimer = 0;
            }
        } else if (gameState.enemies.length === 0) {
            // All enemies defeated, check for victory or next wave
            if (gameState.wave >= gameConfig.waves.maxWave) {
                gameState.showVictory();
            } else {
                gameState.nextWave();
            }
        }
    }
    
    spawnEnemy(gameState) {
        let enemyType = 'basic';
        
        // Determine enemy type based on wave
        if (gameState.wave >= 5 && Math.random() < 0.3) {
            enemyType = 'tank';
        } else if (gameState.wave >= 3 && Math.random() < 0.4) {
            enemyType = 'fast';
        } else if (gameState.wave >= 10 && gameState.enemiesSpawned === gameState.enemiesInWave - 1) {
            enemyType = 'boss';
        }
        
        gameState.enemies.push(new Enemy(enemyType));
        gameState.enemiesSpawned++;
    }
}