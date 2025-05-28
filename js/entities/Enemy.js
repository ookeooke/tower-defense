// js/entities/Enemy.js
import { enemyTypes } from '../config/enemyTypes.js';
import { gameConfig } from '../config/gameConfig.js';

export class Enemy {
    constructor(type, pathIndex = 0, difficulty = 'normal', wave = 1) {
        const enemyType = enemyTypes[type];
        const diffConfig = gameConfig.difficulty[difficulty];
        
        this.type = type;
        
        // Apply difficulty modifiers
        let healthMultiplier = diffConfig.enemyHealthMultiplier;
        let speedMultiplier = diffConfig.enemySpeedMultiplier;
        
        // Apply wave scaling for endless mode
        if (difficulty === 'endless' && wave > 1) {
            const waveMultiplier = Math.pow(diffConfig.waveScaling, wave - 1);
            healthMultiplier *= waveMultiplier;
        }
        
        this.maxHp = Math.floor(enemyType.hp * healthMultiplier);
        this.hp = this.maxHp;
        this.speed = enemyType.speed * speedMultiplier;
        this.gold = Math.floor(enemyType.gold * diffConfig.goldMultiplier);
        this.score = enemyType.score;
        this.color = enemyType.color;
        this.size = enemyType.size;
        this.pathIndex = pathIndex;
        
        // Get the current path (from current map or default)
        this.currentPath = window.currentMap?.paths[0] || gameConfig.path;
        
        this.x = this.currentPath[0].x;
        this.y = this.currentPath[0].y;
        this.slowUntil = 0;
    }
    
    update() {
        const currentSpeed = Date.now() < this.slowUntil ? this.speed * 0.3 : this.speed;
        
        if (this.pathIndex < this.currentPath.length - 1) {
            const target = this.currentPath[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                this.pathIndex++;
                
                // Check if enemy reached the last path point
                if (this.pathIndex >= this.currentPath.length - 1) {
                    // Move to the exact final position
                    this.x = this.currentPath[this.currentPath.length - 1].x;
                    this.y = this.currentPath[this.currentPath.length - 1].y;
                    return true; // Enemy reached the end
                }
            } else {
                this.x += (dx / distance) * currentSpeed;
                this.y += (dy / distance) * currentSpeed;
            }
        } else {
            // Enemy is at the last path segment, check if it went past the screen
            const finalPoint = this.currentPath[this.currentPath.length - 1];
            const dx = finalPoint.x - this.x;
            const dy = finalPoint.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5 || this.x > 930) {
                // Enemy has reached the end or gone off screen
                return true;
            } else {
                // Continue moving toward the final point
                this.x += (dx / distance) * currentSpeed;
                this.y += (dy / distance) * currentSpeed;
            }
        }
        
        return false; // Enemy has not reached the end yet
    }
    
    draw(ctx) {
        // Enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = this.y - this.size - 8;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(this.x - barWidth/2, barY, (this.hp / this.maxHp) * barWidth, barHeight);
        
        // Slow effect
        if (Date.now() < this.slowUntil) {
            ctx.strokeStyle = '#67e8f9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        return this.hp <= 0;
    }
    
    applySlow(duration) {
        this.slowUntil = Math.max(this.slowUntil, Date.now() + duration);
    }
}