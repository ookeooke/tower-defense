// js/entities/Projectile.js
import { towerTypes } from '../config/towerTypes.js';

export class Projectile {
    constructor(x, y, targetX, targetY, damage, color, speed, towerType, level = 0) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.color = color;
        this.speed = speed;
        this.towerType = towerType;
        this.level = level;
        
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / distance) * speed;
        this.vy = (dy / distance) * speed;
    }
    
    update(enemies, particles, gameState) {
        this.x += this.vx;
        this.y += this.vy;
        
        // Check collision with enemies
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.size + 5) {
                this.hit(enemy, i, enemies, particles, gameState);
                return true;
            }
        }
        
        // Remove if out of bounds
        return this.x < 0 || this.x > 900 || this.y < 0 || this.y > 600;
    }
    
    hit(enemy, enemyIndex, enemies, particles, gameState) {
        // Apply damage
        const killed = enemy.takeDamage(this.damage);
        
        // Special effects
        if (this.towerType === 'ice') {
            const slowDuration = towerTypes.ice.levels[this.level].slowDuration;
            enemy.applySlow(slowDuration);
        }
        
        if (this.towerType === 'cannon') {
            // Splash damage with level-based radius
            const splashRadius = towerTypes.cannon.levels[this.level].splashRadius;
            for (let otherEnemy of enemies) {
                const dx = otherEnemy.x - this.x;
                const dy = otherEnemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= splashRadius && otherEnemy !== enemy) {
                    const splashDamage = this.damage * (0.5 + this.level * 0.1);
                    const splashKilled = otherEnemy.takeDamage(splashDamage);
                    
                    if (splashKilled) {
                        gameState.gold += otherEnemy.gold;
                        gameState.score += otherEnemy.score;
                        const idx = enemies.indexOf(otherEnemy);
                        if (idx > -1) enemies.splice(idx, 1);
                    }
                }
            }
            
            // Explosion particles (more with higher level)
            const particleCount = 8 + this.level * 4;
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: this.x,
                    y: this.y,
                    vx: (Math.random() - 0.5) * (6 + this.level * 2),
                    vy: (Math.random() - 0.5) * (6 + this.level * 2),
                    life: 30 + this.level * 10,
                    color: '#fbbf24'
                });
            }
        }
        
        if (killed) {
            gameState.gold += enemy.gold;
            gameState.score += enemy.score;
            enemies.splice(enemyIndex, 1);
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3 + this.level, 0, Math.PI * 2);
        ctx.fill();
    }
}