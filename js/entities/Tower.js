// js/entities/Tower.js
import { towerTypes } from '../config/towerTypes.js';
import { Projectile } from './Projectile.js';

export class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 0;
        this.baseConfig = towerTypes[type];
        this.lastFire = 0;
        this.target = null;
        this.angle = 0;
        this.totalCost = this.baseConfig.cost;
    }
    
    get config() {
        return this.baseConfig.levels[this.level];
    }
    
    get color() {
        return this.baseConfig.color;
    }
    
    get projectileColor() {
        return this.baseConfig.projectileColor;
    }
    
    get speed() {
        return this.baseConfig.speed;
    }
    
    canUpgrade() {
        return this.level < this.baseConfig.levels.length - 1;
    }
    
    getUpgradeCost() {
        return this.canUpgrade() ? this.config.upgradeCost : null;
    }
    
    getSellValue() {
        return Math.floor(this.totalCost * 0.7);
    }
    
    upgrade(gameState) {
        if (this.canUpgrade() && gameState.gold >= this.getUpgradeCost()) {
            gameState.gold -= this.getUpgradeCost();
            this.totalCost += this.getUpgradeCost();
            this.level++;
            return true;
        }
        return false;
    }
    
    sell(gameState) {
        const sellValue = this.getSellValue();
        gameState.gold += sellValue;
        
        // Remove from towers array
        const index = gameState.towers.indexOf(this);
        if (index > -1) {
            gameState.towers.splice(index, 1);
        }
        
        // Clear selection if this tower was selected
        if (gameState.selectedTowerObj === this) {
            gameState.selectedTowerObj = null;
            document.getElementById('towerInfo').style.display = 'none';
        }
    }
    
    update(enemies, projectiles) {
        // Find target
        this.target = null;
        let closestDistance = this.config.range;
        
        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.config.range && distance < closestDistance) {
                this.target = enemy;
                closestDistance = distance;
            }
        }
        
        // Fire at target
        if (this.target && Date.now() - this.lastFire > this.config.fireRate) {
            this.fire(projectiles);
            this.lastFire = Date.now();
        }
        
        // Update angle to target
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.angle = Math.atan2(dy, dx);
        }
    }
    
    fire(projectiles) {
        if (!this.target) return;
        
        const projectile = new Projectile(
            this.x, this.y, this.target.x, this.target.y,
            this.config.damage, this.projectileColor,
            this.speed, this.type, this.level
        );
        projectiles.push(projectile);
    }
    
    draw(ctx, isSelected) {
        // Tower base (size increases with level)
        const baseSize = 15 + this.level * 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Level indicator
        if (this.level > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(this.level + 1, this.x, this.y + 3);
        }
        
        // Tower barrel
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4 + this.level;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + Math.cos(this.angle) * (20 + this.level * 3),
            this.y + Math.sin(this.angle) * (20 + this.level * 3)
        );
        ctx.stroke();
        
        // Range indicator when selected
        if (isSelected) {
            ctx.strokeStyle = this.color + '40';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}