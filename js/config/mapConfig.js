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
        // Position on world map (percentage based)
        position: { x: 20, y: 70 },
        // Which maps this unlocks when completed
        unlocks: ['desert', 'forest'],
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
        position: { x: 40, y: 50 },
        unlocks: ['mountains'],
        requiresCompletion: ['grasslands'],
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
    },
    {
        id: 'forest',
        name: 'Dark Forest',
        description: 'Navigate the twisted paths of the enchanted forest!',
        thumbnail: '🌲',
        waves: 12,
        startingGold: 90,
        startingLives: 18,
        position: { x: 35, y: 80 },
        unlocks: ['swamp'],
        requiresCompletion: ['grasslands'],
        paths: [
            [
                {x: -30, y: 200}, {x: 100, y: 200}, {x: 100, y: 400},
                {x: 250, y: 400}, {x: 250, y: 150}, {x: 400, y: 150},
                {x: 400, y: 350}, {x: 550, y: 350}, {x: 550, y: 250},
                {x: 700, y: 250}, {x: 700, y: 450}, {x: 850, y: 450},
                {x: 850, y: 300}, {x: 930, y: 300}
            ]
        ],
        enemyTypes: ['basic', 'fast', 'tank'],
        bossWave: 12,
        rewards: {
            gold: 600,
            heroXP: 120
        }
    },
    {
        id: 'mountains',
        name: 'Mountain Pass',
        description: 'Defend the narrow mountain passages!',
        thumbnail: '⛰️',
        waves: 18,
        startingGold: 80,
        startingLives: 15,
        position: { x: 60, y: 35 },
        unlocks: ['volcano'],
        requiresCompletion: ['desert'],
        isBossLevel: true,
        paths: [
            [
                {x: -30, y: 100}, {x: 200, y: 100}, {x: 200, y: 300},
                {x: 100, y: 300}, {x: 100, y: 500}, {x: 300, y: 500},
                {x: 300, y: 200}, {x: 500, y: 200}, {x: 500, y: 400},
                {x: 700, y: 400}, {x: 700, y: 150}, {x: 930, y: 150}
            ]
        ],
        enemyTypes: ['basic', 'fast', 'tank', 'boss'],
        bossWave: 18,
        rewards: {
            gold: 1000,
            heroXP: 200
        }
    },
    {
        id: 'swamp',
        name: 'Mystic Swamp',
        description: 'Beware the murky waters!',
        thumbnail: '🌿',
        waves: 14,
        startingGold: 85,
        startingLives: 17,
        position: { x: 50, y: 85 },
        unlocks: ['castle'],
        requiresCompletion: ['forest'],
        paths: [
            [
                {x: -30, y: 300}, {x: 150, y: 300}, {x: 150, y: 450},
                {x: 300, y: 450}, {x: 300, y: 200}, {x: 450, y: 200},
                {x: 450, y: 350}, {x: 600, y: 350}, {x: 600, y: 100},
                {x: 750, y: 100}, {x: 750, y: 300}, {x: 930, y: 300}
            ]
        ],
        enemyTypes: ['basic', 'fast', 'tank'],
        bossWave: 14,
        rewards: {
            gold: 700,
            heroXP: 140
        }
    },
    {
        id: 'volcano',
        name: 'Volcanic Lair',
        description: 'The final challenge awaits in the volcano!',
        thumbnail: '🌋',
        waves: 20,
        startingGold: 70,
        startingLives: 12,
        position: { x: 80, y: 20 },
        requiresCompletion: ['mountains', 'castle'],
        isBossLevel: true,
        isFinalLevel: true,
        paths: [
            [
                {x: -30, y: 300}, {x: 100, y: 300}, {x: 100, y: 100},
                {x: 300, y: 100}, {x: 300, y: 500}, {x: 500, y: 500},
                {x: 500, y: 200}, {x: 700, y: 200}, {x: 700, y: 400},
                {x: 850, y: 400}, {x: 850, y: 300}, {x: 930, y: 300}
            ]
        ],
        enemyTypes: ['basic', 'fast', 'tank', 'boss'],
        bossWave: 20,
        rewards: {
            gold: 2000,
            heroXP: 500
        }
    },
    {
        id: 'castle',
        name: 'Royal Castle',
        description: 'Protect the kingdom\'s last stronghold!',
        thumbnail: '🏰',
        waves: 16,
        startingGold: 95,
        startingLives: 18,
        position: { x: 70, y: 60 },
        unlocks: ['volcano'],
        requiresCompletion: ['swamp'],
        paths: [
            [
                {x: -30, y: 200}, {x: 150, y: 200}, {x: 150, y: 400},
                {x: 350, y: 400}, {x: 350, y: 100}, {x: 550, y: 100},
                {x: 550, y: 300}, {x: 750, y: 300}, {x: 750, y: 200},
                {x: 930, y: 200}
            ]
        ],
        enemyTypes: ['basic', 'fast', 'tank', 'boss'],
        bossWave: 16,
        rewards: {
            gold: 900,
            heroXP: 180
        }
    }
];

// Get connections between maps for drawing paths
export const getMapConnections = () => {
    const connections = [];
    maps.forEach(map => {
        if (map.requiresCompletion) {
            map.requiresCompletion.forEach(reqId => {
                const reqMap = maps.find(m => m.id === reqId);
                if (reqMap) {
                    connections.push({
                        from: reqMap.position,
                        to: map.position,
                        fromId: reqId,
                        toId: map.id
                    });
                }
            });
        }
    });
    return connections;
};

export const getMapById = (id) => maps.find(map => map.id === id);