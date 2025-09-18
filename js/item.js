// Item system for the Zelda game

class Item {
    constructor(x, y, type, value = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.value = value;
        this.width = 12;
        this.height = 12;
        this.isCollected = false;
        this.bobTimer = 0;
        this.originalY = y;
        this.bobAmount = 2;
        
        this.setupItemType();
        this.sprite = new Sprite(x, y, this.width, this.height, this.color);
    }

    setupItemType() {
        switch(this.type) {
            case 'rupee':
                this.color = '#00ff00';
                this.value = this.value || 1;
                break;
            case 'rupee_blue':
                this.color = '#0080ff';
                this.value = 5;
                break;
            case 'rupee_red':
                this.color = '#ff0000';
                this.value = 20;
                break;
            case 'heart':
                this.color = '#ff6666';
                this.value = 1;
                break;
            case 'heart_container':
                this.color = '#ff0000';
                this.value = 1; // Increases max health
                this.width = 16;
                this.height = 16;
                break;
            case 'key':
                this.color = '#ffff00';
                this.value = 1;
                break;
            case 'big_key':
                this.color = '#ffd700';
                this.value = 1;
                this.width = 16;
                this.height = 16;
                break;
            case 'map':
                this.color = '#8B4513';
                this.width = 16;
                this.height = 16;
                break;
            case 'compass':
                this.color = '#c0c0c0';
                this.width = 16;
                this.height = 16;
                break;
            case 'bomb':
                this.color = '#000000';
                this.value = this.value || 1;
                break;
            case 'arrow':
                this.color = '#8B4513';
                this.value = this.value || 5;
                break;
            case 'magic_potion':
                this.color = '#ff00ff';
                break;
            case 'triforce':
                this.color = '#ffd700';
                this.width = 20;
                this.height = 20;
                break;
        }
    }

    update(deltaTime) {
        if (this.isCollected) return;

        // Bobbing animation
        this.bobTimer += deltaTime;
        this.y = this.originalY + Math.sin(this.bobTimer / 300) * this.bobAmount;
        
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.update(deltaTime);
    }

    render(ctx) {
        if (this.isCollected) return;

        ctx.save();
        
        // Item-specific rendering
        switch(this.type) {
            case 'rupee':
            case 'rupee_blue':
            case 'rupee_red':
                this.renderRupee(ctx);
                break;
            case 'heart':
                this.renderHeart(ctx);
                break;
            case 'heart_container':
                this.renderHeartContainer(ctx);
                break;
            case 'key':
                this.renderKey(ctx);
                break;
            case 'big_key':
                this.renderBigKey(ctx);
                break;
            case 'map':
                this.renderMap(ctx);
                break;
            case 'compass':
                this.renderCompass(ctx);
                break;
            case 'bomb':
                this.renderBomb(ctx);
                break;
            case 'arrow':
                this.renderArrow(ctx);
                break;
            case 'triforce':
                this.renderTriforce(ctx);
                break;
            default:
                // Default rectangle rendering
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
        }
        
        ctx.restore();
    }

    renderRupee(ctx) {
        // Draw a diamond shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const size = this.width / 2;
        
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX + size, centerY);
        ctx.lineTo(centerX, centerY + size);
        ctx.lineTo(centerX - size, centerY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    renderHeart(ctx) {
        // Simple heart shape
        ctx.fillStyle = this.color;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const size = this.width / 3;
        
        // Draw heart as combination of rectangle and two circles
        ctx.beginPath();
        ctx.arc(centerX - size/2, centerY - size/2, size/2, 0, Math.PI, true);
        ctx.arc(centerX + size/2, centerY - size/2, size/2, 0, Math.PI, true);
        ctx.moveTo(centerX - size, centerY - size/2);
        ctx.lineTo(centerX, centerY + size/2);
        ctx.lineTo(centerX + size, centerY - size/2);
        ctx.fill();
    }

    renderHeartContainer(ctx) {
        this.renderHeart(ctx);
        // Add border to indicate it's a container
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    renderKey(ctx) {
        ctx.fillStyle = this.color;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Key body
        ctx.fillRect(centerX - 1, centerY - 4, 2, 6);
        // Key head
        ctx.beginPath();
        ctx.arc(centerX, centerY - 3, 3, 0, 2 * Math.PI);
        ctx.fill();
        // Key teeth
        ctx.fillRect(centerX + 1, centerY + 1, 2, 1);
    }

    renderBigKey(ctx) {
        this.renderKey(ctx);
        // Add glow effect for big key
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        this.renderKey(ctx);
        ctx.shadowBlur = 0;
    }

    renderMap(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some map-like details
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // Simple grid pattern
        for (let i = 1; i < 4; i++) {
            const lineX = this.x + (this.width / 4) * i;
            const lineY = this.y + (this.height / 4) * i;
            ctx.strokeStyle = '#654321';
            ctx.beginPath();
            ctx.moveTo(lineX, this.y + 2);
            ctx.lineTo(lineX, this.y + this.height - 2);
            ctx.moveTo(this.x + 2, lineY);
            ctx.lineTo(this.x + this.width - 2, lineY);
            ctx.stroke();
        }
    }

    renderCompass(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.arc(centerX, centerY, this.width / 2 - 1, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Compass needle
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - this.width / 3);
        ctx.stroke();
    }

    renderBomb(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.arc(centerX, centerY, this.width / 2 - 1, 0, 2 * Math.PI);
        ctx.fill();
        
        // Fuse
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, this.y);
        ctx.lineTo(centerX - 2, this.y - 3);
        ctx.stroke();
    }

    renderArrow(ctx) {
        ctx.fillStyle = this.color;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Arrow shaft
        ctx.fillRect(centerX - 1, centerY - 4, 2, 8);
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 6);
        ctx.lineTo(centerX - 3, centerY - 2);
        ctx.lineTo(centerX + 3, centerY - 2);
        ctx.closePath();
        ctx.fill();
        
        // Arrow fletching
        ctx.beginPath();
        ctx.moveTo(centerX - 2, centerY + 4);
        ctx.lineTo(centerX, centerY + 2);
        ctx.lineTo(centerX + 2, centerY + 4);
        ctx.stroke();
    }

    renderTriforce(ctx) {
        ctx.fillStyle = this.color;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const size = this.width / 3;
        
        // Draw three triangles
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            let offsetX = 0, offsetY = 0;
            
            if (i === 0) { // Top triangle
                offsetY = -size / 2;
            } else if (i === 1) { // Bottom left
                offsetX = -size / 2;
                offsetY = size / 2;
            } else { // Bottom right
                offsetX = size / 2;
                offsetY = size / 2;
            }
            
            ctx.moveTo(centerX + offsetX, centerY + offsetY - size / 2);
            ctx.lineTo(centerX + offsetX - size / 2, centerY + offsetY + size / 2);
            ctx.lineTo(centerX + offsetX + size / 2, centerY + offsetY + size / 2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    collect(player) {
        if (this.isCollected) return false;

        this.isCollected = true;
        
        switch(this.type) {
            case 'rupee':
            case 'rupee_blue':
            case 'rupee_red':
                player.addRupees(this.value);
                break;
            case 'heart':
                player.heal(this.value);
                break;
            case 'heart_container':
                player.maxHealth += this.value;
                player.heal(this.value);
                break;
            case 'key':
                player.addKey();
                break;
            case 'big_key':
                player.inventory.bigKey = true;
                break;
            case 'map':
                player.hasMap = true;
                break;
            case 'compass':
                player.hasCompass = true;
                break;
            case 'bomb':
                player.inventory.bombs += this.value;
                break;
            case 'arrow':
                player.inventory.arrows += this.value;
                break;
            case 'magic_potion':
                player.heal(player.maxHealth); // Full heal
                break;
            case 'triforce':
                // Special handling for triforce pieces
                player.addItem('triforce_' + this.value);
                break;
        }
        
        return true;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    collidesWith(other) {
        return rectangleCollision(this.getBounds(), other.getBounds());
    }
}

// Chest class that contains items
class Chest {
    constructor(x, y, item, requiresKey = false) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.item = item;
        this.isOpen = false;
        this.requiresKey = requiresKey;
        this.openTimer = 0;
        
        this.sprite = new Sprite(x, y, this.width, this.height, '#8B4513');
    }

    update(deltaTime) {
        if (this.openTimer > 0) {
            this.openTimer -= deltaTime;
        }
        this.sprite.update(deltaTime);
    }

    tryOpen(player) {
        if (this.isOpen) return null;
        
        if (this.requiresKey && !player.useKey()) {
            return null; // Couldn't open, no key
        }
        
        this.isOpen = true;
        this.openTimer = 1000; // Opening animation time
        
        // Create the item at chest location
        if (this.item) {
            const item = new Item(
                this.x,
                this.y - 10, // Slightly above chest
                this.item.type,
                this.item.value
            );
            return item;
        }
        
        return null;
    }

    render(ctx) {
        // Chest body
        ctx.fillStyle = this.isOpen ? '#CD853F' : '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Chest lid
        if (this.isOpen) {
            // Open lid
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x, this.y - 6, this.width, 6);
        } else {
            // Closed lid
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x, this.y, this.width, 4);
        }
        
        // Lock indicator
        if (this.requiresKey && !this.isOpen) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x + this.width / 2 - 2, this.y + 2, 4, 4);
        }
        
        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    collidesWith(other) {
        return rectangleCollision(this.getBounds(), other.getBounds());
    }
}