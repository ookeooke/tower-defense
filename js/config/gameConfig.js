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
    }
};