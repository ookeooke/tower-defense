// js/entities/Hero.js - Save this file as js/entities/Hero.js
export class Hero {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.maxHp = 200;
        this.hp = this.maxHp;
        this.damage = 25;
        this.attackRange = 40;
        this.moveSpeed = 2;
        this.size = 12;
        this.color = '#22c55e';
        this.targetX = x;
        this.targetY = y;
        this.attackCooldown = 0;
        this.isDead = false;
    }
    
    update(enemies) {
        if (this.isDead) return;
        
        // Move towards target position
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            this.x += (dx / distance) * this.moveSpeed;
            this.y += (dy / distance) * this.moveSpeed;
        }
        
        // Attack nearby enemies
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        if (this.attackCooldown === 0) {
            for (let enemy of enemies) {
                const enemyDist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                if (enemyDist <= this.attackRange) {
                    enemy.takeDamage(this.damage);
                    this.attackCooldown = 60; // 1 second at 60fps
                    break;
                }
            }
        }
    }
    
    draw(ctx) {
        if (this.isDead) return;
        
        // Draw hero
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sword icon
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', this.x, this.y);
        
        // Health bar
        const barWidth = this.size * 3;
        const barHeight = 4;
        const barY = this.y - this.size - 10;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(this.x - barWidth/2, barY, (this.hp / this.maxHp) * barWidth, barHeight);
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }
    
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
}