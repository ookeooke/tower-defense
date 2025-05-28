import { Game } from './Game.js';
import { SaveManager } from './systems/SaveManager.js';
import { WorldMap } from './systems/WorldMap.js';
import { ScreenManager } from './screens/ScreenManager.js';
import { MainMenuScreen } from './screens/MainMenuScreen.js';
import { maps, getMapById } from './config/mapConfig.js';
import { gameConfig } from './config/gameConfig.js';

// Initialize core managers
const saveManager = new SaveManager();
const worldMap = new WorldMap(saveManager);
const screenManager = new ScreenManager();

// Make them globally available for compatibility
window.saveManager = saveManager;
window.maps = maps;
window.worldMap = worldMap;
window.screenManager = screenManager;

// Get canvas and create game instance
const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas, saveManager, worldMap);

// Initialize screens
const mainMenuScreen = new MainMenuScreen(screenManager, saveManager);

// Register all screens with the manager
screenManager.register('mainMenu', document.getElementById('mainMenu'), mainMenuScreen);
screenManager.register('heroSelect', document.getElementById('heroSelect'));
screenManager.register('worldMap', document.getElementById('worldMap'));
screenManager.register('instructions', document.getElementById('instructions'));
screenManager.register('shopScreen', document.getElementById('shopScreen'));
screenManager.register('achievementsScreen', document.getElementById('achievementsScreen'));
screenManager.register('dailyChallengeScreen', document.getElementById('dailyChallengeScreen'));
screenManager.register('mapSelect', document.getElementById('mapSelect'));

// Special handling for game HUD elements
const gameHUD = {
    towers: document.getElementById('towers'),
    controls: document.getElementById('gameControls'),
    
    show() {
        this.towers.classList.remove('hide');
        this.towers.style.display = 'flex';
        this.controls.classList.remove('hide');
    },
    
    hide() {
        this.towers.classList.add('hide');
        this.controls.classList.add('hide');
    }
};

// Handle responsive canvas sizing
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const rect = container.getBoundingClientRect();
    
    canvas.width = gameConfig.canvas.width;
    canvas.height = gameConfig.canvas.height;
    
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initially hide the canvas
canvas.style.display = 'none';

// Menu Navigation Functions (for backwards compatibility)
window.showHeroSelect = function() {
    screenManager.show('heroSelect');
    
    // Update hero levels from save data
    const warriorLevel = saveManager.data.heroes.warrior.level;
    document.querySelector('.hero-card[data-hero="warrior"] .hero-level').textContent = warriorLevel;
};

window.backToMainMenu = function() {
    screenManager.show('mainMenu');
};

window.showMapSelect = function() {
    screenManager.hideAll();
    worldMap.show();
};

window.backToHeroSelect = function() {
    worldMap.hide();
    screenManager.show('heroSelect');
};

window.startGameWithMap = function() {
    const difficulty = document.getElementById('difficulty').value;
    
    screenManager.hideAll();
    game.gameState.hideScreens();
    
    // Show game canvas and HUD
    canvas.style.display = 'block';
    document.getElementById('gameControls').style.display = 'flex';
    gameHUD.show();
    resizeCanvas();
    
    // Start the game with selected map
    game.start(window.currentMap, difficulty);
};

window.startNewGame = function() {
    screenManager.show('heroSelect');
};

window.showInstructions = function() {
    screenManager.show('instructions');
};

window.hideInstructions = function() {
    screenManager.show('mainMenu');
};

window.backToMenu = function() {
    game.stop();
    game.gameState.hideScreens();
    
    // Hide game and show world map
    canvas.style.display = 'none';
    gameHUD.hide();
    worldMap.show();
    
    // Update stats
    mainMenuScreen.updateStats();
};

// Level retry functions
window.retryLevel = function() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    
    // Restart with same map and difficulty
    const difficulty = document.getElementById('difficulty').value;
    game.start(window.currentMap, difficulty);
};

window.restartGame = function() {
    retryLevel();
};

// Shop, Achievements, and Daily Challenge functions
window.showShop = function() {
    worldMap.hide();
    screenManager.show('shopScreen');
};

window.hideShop = function() {
    screenManager.hide('shopScreen');
    worldMap.show();
};

window.showAchievements = function() {
    worldMap.hide();
    screenManager.show('achievementsScreen');
};

window.hideAchievements = function() {
    screenManager.hide('achievementsScreen');
    worldMap.show();
};

window.showDailyChallenge = function() {
    worldMap.hide();
    screenManager.show('dailyChallengeScreen');
};

window.hideDailyChallenge = function() {
    screenManager.hide('dailyChallengeScreen');
    worldMap.show();
};

// Hero selection
document.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', (e) => {
        const heroId = e.currentTarget.dataset.hero;
        if (!e.currentTarget.classList.contains('locked')) {
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            saveManager.selectHero(heroId);
        }
    });
});

// Initialize - show main menu
screenManager.show('mainMenu');