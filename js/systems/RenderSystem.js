// js/systems/RenderSystem.js
import { gameConfig } from '../config/gameConfig.js';

export class RenderSystem {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    clear() {
        this.ctx.fillStyle = '#0e1b2e';
        this.ctx.fillRect(0, 0, gameConfig.canvas.width, gameConfig.canvas.height);
    }
    
    drawPath() {
        // Get the current path (from current map or default)
        const path = window.currentMap?.paths[0] || gameConfig.path;
        
        // Draw main path
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 30;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();
        
        // Path glow/inner line
        this.ctx.strokeStyle = '#4b5563';
        this.ctx.lineWidth = 20;
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();
    }
    
    drawEnemies(enemies) {
        enemies.forEach(enemy => enemy.draw(this.ctx));
    }
    
    drawTowers(towers, selectedTower) {
        towers.forEach(tower => {
            const isSelected = tower === selectedTower;
            tower.draw(this.ctx, isSelected);
        });
    }
    
    drawProjectiles(projectiles) {
        projectiles.forEach(projectile => projectile.draw(this.ctx));
    }
    
    drawParticles(particles) {
        particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawHero(hero) {
        if (hero && !hero.isDead) {
            hero.draw(this.ctx);
        }
    }
    
    render(gameState) {
        this.clear();
        this.drawPath();
        this.drawEnemies(gameState.enemies);
        this.drawHero(gameState.hero);
        this.drawTowers(gameState.towers, gameState.selectedTowerObj);
        this.drawProjectiles(gameState.projectiles);
        this.drawParticles(gameState.particles);
    }
}