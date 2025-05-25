// js/config/towerTypes.js
export const towerTypes = {
    basic: {
        name: 'Basic Tower',
        cost: 25,
        levels: [
            { damage: 20, range: 80, fireRate: 1000, upgradeCost: 25 },
            { damage: 35, range: 90, fireRate: 800, upgradeCost: 40 },
            { damage: 55, range: 100, fireRate: 600, upgradeCost: 60 },
            { damage: 80, range: 110, fireRate: 400, upgradeCost: null }
        ],
        color: '#0ea5e9',
        projectileColor: '#38bdf8',
        speed: 5
    },
    sniper: {
        name: 'Sniper Tower',
        cost: 50,
        levels: [
            { damage: 60, range: 150, fireRate: 2000, upgradeCost: 50 },
            { damage: 90, range: 180, fireRate: 1600, upgradeCost: 75 },
            { damage: 140, range: 220, fireRate: 1200, upgradeCost: 100 },
            { damage: 200, range: 260, fireRate: 800, upgradeCost: null }
        ],
        color: '#8b5cf6',
        projectileColor: '#a78bfa',
        speed: 8
    },
    cannon: {
        name: 'Cannon Tower',
        cost: 75,
        levels: [
            { damage: 40, range: 90, fireRate: 1500, upgradeCost: 60, splashRadius: 50 },
            { damage: 65, range: 100, fireRate: 1200, upgradeCost: 90, splashRadius: 60 },
            { damage: 100, range: 110, fireRate: 900, upgradeCost: 120, splashRadius: 70 },
            { damage: 150, range: 120, fireRate: 600, upgradeCost: null, splashRadius: 80 }
        ],
        color: '#f59e0b',
        projectileColor: '#fbbf24',
        speed: 4,
        splash: true
    },
    ice: {
        name: 'Ice Tower',
        cost: 60,
        levels: [
            { damage: 15, range: 70, fireRate: 800, upgradeCost: 50, slowDuration: 2000 },
            { damage: 25, range: 85, fireRate: 650, upgradeCost: 70, slowDuration: 2500 },
            { damage: 40, range: 100, fireRate: 500, upgradeCost: 90, slowDuration: 3000 },
            { damage: 60, range: 115, fireRate: 350, upgradeCost: null, slowDuration: 3500 }
        ],
        color: '#06b6d4',
        projectileColor: '#67e8f9',
        speed: 6,
        slow: true
    }
};