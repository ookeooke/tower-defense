// js/config/gameConfig.js
export const gameConfig = {
    canvas: {
        width: 900,
        height: 600
    },
    initialState: {
        gold: 100,
        lives: 20,
        wave: 1,
        score: 0
    },
    waves: {
        enemiesBase: 8,
        enemiesPerWave: 2,
        maxEnemies: 20,
        spawnDelay: 60,
        maxWave: 15
    },
    path: [
        {x: -30, y: 150}, {x: 150, y: 150}, {x: 150, y: 300},
        {x: 300, y: 300}, {x: 300, y: 100}, {x: 450, y: 100},
        {x: 450, y: 400}, {x: 600, y: 400}, {x: 600, y: 200},
        {x: 750, y: 200}, {x: 750, y: 350}, {x: 930, y: 350}
    ],
    towers: {
        minPlacementDistance: 40,  // Min distance from path
        minTowerDistance: 35       // Min distance between towers
    },
    difficulty: {
        easy: {
            startGold: 150,
            startLives: 30,
            maxWave: 10,
            enemyHealthMultiplier: 0.8,
            enemySpeedMultiplier: 0.8,
            goldMultiplier: 1.2
        },
        normal: {
            startGold: 100,
            startLives: 20,
            maxWave: 15,
            enemyHealthMultiplier: 1,
            enemySpeedMultiplier: 1,
            goldMultiplier: 1
        },
        hard: {
            startGold: 75,
            startLives: 15,
            maxWave: 20,
            enemyHealthMultiplier: 1.3,
            enemySpeedMultiplier: 1.2,
            goldMultiplier: 0.8
        },
        endless: {
            startGold: 100,
            startLives: 20,
            maxWave: Infinity,
            enemyHealthMultiplier: 1,
            enemySpeedMultiplier: 1,
            goldMultiplier: 1,
            waveScaling: 1.1  // Enemies get 10% stronger each wave
        }
    }
};