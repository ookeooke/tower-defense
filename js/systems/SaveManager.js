// js/systems/SaveManager.js
export class SaveManager {
    constructor() {
        this.saveKey = 'towerDefenseSave';
        this.loadSave();
    }
    
    loadSave() {
        const savedData = localStorage.getItem(this.saveKey);
        if (savedData) {
            this.data = JSON.parse(savedData);
        } else {
            this.data = this.createNewSave();
        }
    }
    
    createNewSave() {
        return {
            unlockedMaps: ['grasslands'], // First map always unlocked
            mapProgress: {
                // mapId: { bestScore, stars, timesCompleted, difficulty }
            },
            heroes: {
                warrior: {
                    unlocked: true,
                    level: 1,
                    experience: 0,
                    upgrades: {}
                }
            },
            selectedHero: 'warrior',
            totalGold: 0,
            settings: {
                soundEnabled: true,
                musicEnabled: true
            }
        };
    }
    
    save() {
        localStorage.setItem(this.saveKey, JSON.stringify(this.data));
    }
    
    unlockMap(mapId) {
        if (!this.data.unlockedMaps.includes(mapId)) {
            this.data.unlockedMaps.push(mapId);
            this.save();
        }
    }
    
    isMapUnlocked(mapId) {
        return this.data.unlockedMaps.includes(mapId);
    }
    
    updateMapProgress(mapId, score, lives, difficulty) {
        const stars = this.calculateStars(lives);
        const key = `${mapId}_${difficulty}`;
        
        if (!this.data.mapProgress[key] || score > this.data.mapProgress[key].bestScore) {
            this.data.mapProgress[key] = {
                bestScore: score,
                stars: stars,
                timesCompleted: (this.data.mapProgress[key]?.timesCompleted || 0) + 1,
                difficulty: difficulty
            };
            this.save();
        }
    }
    
    calculateStars(livesLeft) {
        if (livesLeft >= 18) return 3;
        if (livesLeft >= 10) return 2;
        if (livesLeft >= 1) return 1;
        return 0;
    }
    
    getMapStars(mapId, difficulty) {
        const key = `${mapId}_${difficulty}`;
        return this.data.mapProgress[key]?.stars || 0;
    }
    
    addGold(amount) {
        this.data.totalGold += amount;
        this.save();
    }
    
    spendGold(amount) {
        if (this.data.totalGold >= amount) {
            this.data.totalGold -= amount;
            this.save();
            return true;
        }
        return false;
    }
    
    selectHero(heroId) {
        if (this.data.heroes[heroId]?.unlocked) {
            this.data.selectedHero = heroId;
            this.save();
        }
    }
    
    getSelectedHero() {
        return this.data.selectedHero;
    }
    
    addHeroExperience(heroId, xp) {
        if (this.data.heroes[heroId]) {
            this.data.heroes[heroId].experience += xp;
            // Simple level up system: 100 XP per level
            const newLevel = Math.floor(this.data.heroes[heroId].experience / 100) + 1;
            if (newLevel > this.data.heroes[heroId].level) {
                this.data.heroes[heroId].level = newLevel;
            }
            this.save();
        }
    }
    
    resetProgress() {
        this.data = this.createNewSave();
        this.save();
    }
}