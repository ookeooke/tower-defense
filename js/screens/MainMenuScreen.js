// js/screens/MainMenuScreen.js
import { Screen } from './Screen.js';

export class MainMenuScreen extends Screen {
    constructor(screenManager, saveManager) {
        super('mainMenu');
        this.screenManager = screenManager;
        this.saveManager = saveManager;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Start game button
        this.getElement('button[onclick="showHeroSelect()"]').onclick = () => {
            this.screenManager.show('heroSelect');
        };
        
        // Instructions button
        this.getElement('button[onclick="showInstructions()"]').onclick = () => {
            this.screenManager.show('instructions');
        };
    }
    
    onShow() {
        // Update stats when showing main menu
        this.updateStats();
    }
    
    updateStats() {
        const bestScore = localStorage.getItem('towerDefenseBestScore') || 0;
        document.getElementById('bestScore').textContent = bestScore;
        document.getElementById('totalGold').textContent = this.saveManager.data.totalGold;
    }
}