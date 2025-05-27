// js/systems/WorldMap.js
import { maps, getMapConnections } from '../config/mapConfig.js';

export class WorldMap {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodesContainer = document.getElementById('mapNodes');
        this.selectedDifficulty = 'normal';
        
        // Don't resize in constructor - wait until show()
        window.addEventListener('resize', () => {
            if (!document.getElementById('worldMap').classList.contains('hide')) {
                this.resize();
            }
        });
    }
    
    resize() {
        const container = document.getElementById('worldMapCanvas');
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    show() {
        document.getElementById('worldMap').classList.remove('hide');
        this.selectedDifficulty = document.getElementById('difficulty').value;
        
        // Important: resize AFTER making visible
        setTimeout(() => {
            this.resize();
            this.render();
            this.updateStats();
        }, 0);
    }
    
    hide() {
        document.getElementById('worldMap').classList.add('hide');
    }
    
    updateStats() {
        // Update gold display
        document.getElementById('worldMapGold').textContent = this.saveManager.data.totalGold;
        
        // Calculate total stars
        let totalStars = 0;
        Object.values(this.saveManager.data.mapProgress).forEach(progress => {
            totalStars += progress.stars || 0;
        });
        document.getElementById('totalStars').textContent = totalStars;
    }
    
    render() {
        // Clear previous nodes
        this.nodesContainer.innerHTML = '';
        
        // Draw background
        this.drawBackground();
        
        // Draw connections between maps
        this.drawConnections();
        
        // Create map nodes
        this.createMapNodes();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(1, '#0e1b2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw some stars in the background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawConnections() {
        const connections = getMapConnections();
        
        connections.forEach(conn => {
            const fromX = (conn.from.x / 100) * this.canvas.width;
            const fromY = (conn.from.y / 100) * this.canvas.height;
            const toX = (conn.to.x / 100) * this.canvas.width;
            const toY = (conn.to.y / 100) * this.canvas.height;
            
            // Check if path should be active (unlocked)
            const isUnlocked = this.saveManager.isMapUnlocked(conn.toId);
            
            // Draw path
            this.ctx.strokeStyle = isUnlocked ? '#0ea5e9' : '#334155';
            this.ctx.lineWidth = isUnlocked ? 4 : 2;
            this.ctx.setLineDash(isUnlocked ? [] : [5, 5]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromX, fromY);
            
            // Create a curved path
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const curve = 30;
            const dx = toX - fromX;
            const dy = toY - fromY;
            const normal = { x: -dy / Math.sqrt(dx * dx + dy * dy), y: dx / Math.sqrt(dx * dx + dy * dy) };
            
            this.ctx.quadraticCurveTo(
                midX + normal.x * curve,
                midY + normal.y * curve,
                toX,
                toY
            );
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        });
    }
    
    createMapNodes() {
        maps.forEach(map => {
            const isUnlocked = this.saveManager.isMapUnlocked(map.id);
            const stars = this.saveManager.getMapStars(map.id, this.selectedDifficulty);
            
            // Create node element
            const node = document.createElement('div');
            node.className = 'map-node';
            if (!isUnlocked) node.classList.add('locked');
            if (stars > 0) node.classList.add('completed');
            if (map.isBossLevel) node.classList.add('boss');
            
            // Position node
            const x = (map.position.x / 100) * this.canvas.width;
            const y = (map.position.y / 100) * this.canvas.height;
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            
            // Add icon
            node.innerHTML = isUnlocked ? map.thumbnail : '🔒';
            
            // Add info below node
            const info = document.createElement('div');
            info.className = 'map-node-info';
            info.innerHTML = `
                <div class="map-node-name">${map.name}</div>
                <div class="map-node-stars">
                    ${[1, 2, 3].map(i => `<span class="star ${i <= stars ? 'earned' : ''}">⭐</span>`).join('')}
                </div>
            `;
            node.appendChild(info);
            
            // Add click handler
            if (isUnlocked) {
                node.onclick = () => this.selectMap(map);
            }
            
            // Add hover effect
            node.onmouseenter = () => {
                if (isUnlocked) {
                    this.showMapPreview(map, x, y);
                }
            };
            
            node.onmouseleave = () => {
                this.hideMapPreview();
            };
            
            this.nodesContainer.appendChild(node);
        });
    }
    
    selectMap(map) {
        // Store selected map and start game
        window.currentMap = map;
        this.hide();
        window.startGameWithMap();
    }
    
    showMapPreview(map, x, y) {
        // You can implement a tooltip preview here
        // For now, we'll just log the map info
        console.log(`Preview: ${map.name} - ${map.description}`);
    }
    
    hideMapPreview() {
        // Hide preview tooltip
    }
}