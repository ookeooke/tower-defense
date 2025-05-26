// js/config/mapConfig.js
export const maps = [
    {
        id: 'grasslands',
        name: 'Grasslands',
        description: 'A peaceful meadow under attack!',
        thumbnail: '🌳',
        waves: 10,
        startingGold: 100,
        startingLives: 20,
        paths: [
            // Simple S-curve path
            [
                {x: -30, y: 300}, {x: 150, y: 300}, {x: 150, y: 200},
                {x: 300, y: 200}, {x: 300, y: 400}, {x: 450, y: 400},
                {x: 450, y: 100}, {x: 600, y: 100}, {x: 600, y: 300},
                {x: 750, y: 300}, {x: 930, y: 300}
            ]
        ],
        enemyTypes: ['basic', 'fast', 'tank'],
        bossWave: 10,
        rewards: {
            gold: 500,
            heroXP: 100
        }
    },
    {
        id: 'desert',
        name: 'Desert Fortress',
        description: 'Defend the oasis from desert raiders!',
        thumbnail: '🏜️',
        waves: 15,
        startingGold: 75,
        startingLives: 15,
        paths: [
            // More complex path with crossroads
            [
                {x: -30, y: 150}, {x: 150, y: 150}, {x: 150, y: 300},
                {x: 300, y: 300}, {x: 300, y: 100}, {x: 450, y: 100},
                {x: 450, y: 400}, {x: 600, y: 400}, {x: 600, y: 200},
                {x: 750, y: 200}, {x: 750, y: 350}, {x: 930, y: 350}
            ]
        ],
        enemyTypes: ['basic', 'fast', 'tank', 'boss'],
        bossWave: 15,
        specialEnemies: {
            sandstorm: { // Special enemy for this map
                hp: 80,
                speed: 1.5,
                gold: 12,
                score: 20,
                color: '#f59e0b',
                size: 10
            }
        },
        rewards: {
            gold: 750,
            heroXP: 150
        }
    }
];

export const getMapById = (id) => maps.find(map => map.id === id);