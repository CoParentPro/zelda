// Sprite system for the Zelda game

class Sprite {
    constructor(x, y, width, height, color = '#00ff00') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.visible = true;
        this.animations = {};
        this.currentAnimation = null;
        this.frame = 0;
        this.frameTimer = 0;
        this.flipHorizontal = false;
        this.flipVertical = false;
        this.rotation = 0;
        this.scale = 1;
    }

    addAnimation(name, frames, duration, loop = true) {
        this.animations[name] = {
            frames: frames,
            duration: duration,
            currentFrame: 0,
            timer: 0,
            loop: loop
        };
    }

    playAnimation(name) {
        if (this.animations[name] && this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.animations[name].currentFrame = 0;
            this.animations[name].timer = 0;
        }
    }

    update(deltaTime) {
        if (this.currentAnimation && this.animations[this.currentAnimation]) {
            const anim = this.animations[this.currentAnimation];
            anim.timer += deltaTime;
            
            if (anim.timer >= anim.duration) {
                anim.timer = 0;
                anim.currentFrame++;
                
                if (anim.currentFrame >= anim.frames.length) {
                    if (anim.loop) {
                        anim.currentFrame = 0;
                    } else {
                        anim.currentFrame = anim.frames.length - 1;
                    }
                }
            }
            
            this.frame = anim.frames[anim.currentFrame];
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        // Apply transformations
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale * (this.flipHorizontal ? -1 : 1), 
                  this.scale * (this.flipVertical ? -1 : 1));

        // Use pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        
        // Draw pixel art style sprite
        this.drawPixelSprite(ctx);

        ctx.restore();
    }

    drawPixelSprite(ctx) {
        // Override in subclasses for specific sprite rendering
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    overlaps(other) {
        return rectangleCollision(this.getBounds(), other.getBounds());
    }
}

// Specialized sprite for Link (the player character)
class LinkSprite extends Sprite {
    constructor(x, y) {
        super(x, y, 16, 16, '#00aa00');
        this.direction = 'DOWN';
        this.setupAnimations();
    }

    setupAnimations() {
        // Simple frame-based animations (we'll use frame numbers)
        this.addAnimation('idle_down', [0], 500);
        this.addAnimation('walk_down', [0, 1], 200);
        this.addAnimation('idle_up', [2], 500);
        this.addAnimation('walk_up', [2, 3], 200);
        this.addAnimation('idle_left', [4], 500);
        this.addAnimation('walk_left', [4, 5], 200);
        this.addAnimation('idle_right', [6], 500);
        this.addAnimation('walk_right', [6, 7], 200);
        this.addAnimation('attack_down', [8], 100, false);
        this.addAnimation('attack_up', [9], 100, false);
        this.addAnimation('attack_left', [10], 100, false);
        this.addAnimation('attack_right', [11], 100, false);
        
        this.playAnimation('idle_down');
    }

    setDirection(direction) {
        this.direction = direction;
        this.flipHorizontal = (direction === 'LEFT');
    }

    render(ctx) {
        // Override to add Link-specific visual elements with authentic Zelda style
        ctx.save();
        
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale * (this.flipHorizontal ? -1 : 1), 
                  this.scale * (this.flipVertical ? -1 : 1));

        // Disable smoothing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        
        this.drawLinkSprite(ctx);

        ctx.restore();
    }

    drawLinkSprite(ctx) {
        const w = this.width;
        const h = this.height;
        const x = -w / 2;
        const y = -h / 2;
        
        // Zelda Link color palette
        const colors = {
            tunic: '#00AA00',      // Green tunic
            tunicDark: '#006600',  // Darker green for shading
            hat: '#228B22',        // Green hat
            skin: '#FFDBAC',       // Skin color
            hair: '#8B4513',       // Brown hair
            belt: '#8B4513',       // Brown belt
            shoes: '#654321',      // Brown shoes
            sword: '#C0C0C0',      // Silver sword
            shield: '#8B0000'      // Dark red shield
        };

        // Draw Link based on direction
        switch(this.direction) {
            case 'DOWN':
                this.drawLinkDown(ctx, x, y, w, h, colors);
                break;
            case 'UP':
                this.drawLinkUp(ctx, x, y, w, h, colors);
                break;
            case 'LEFT':
                this.drawLinkSide(ctx, x, y, w, h, colors, true);
                break;
            case 'RIGHT':
                this.drawLinkSide(ctx, x, y, w, h, colors, false);
                break;
        }
    }

    drawLinkDown(ctx, x, y, w, h, colors) {
        // Hat
        ctx.fillStyle = colors.hat;
        ctx.fillRect(x + 4, y + 1, 8, 6);
        ctx.fillRect(x + 2, y + 2, 12, 4);
        
        // Hair
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x + 3, y + 6, 2, 2);
        ctx.fillRect(x + 11, y + 6, 2, 2);
        
        // Face
        ctx.fillStyle = colors.skin;
        ctx.fillRect(x + 5, y + 6, 6, 4);
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 8, 1, 1);
        ctx.fillRect(x + 9, y + 8, 1, 1);
        
        // Tunic body
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(x + 3, y + 10, 10, 4);
        
        // Belt
        ctx.fillStyle = colors.belt;
        ctx.fillRect(x + 3, y + 12, 10, 1);
        
        // Arms
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(x + 1, y + 10, 2, 3);
        ctx.fillRect(x + 13, y + 10, 2, 3);
        
        // Hands
        ctx.fillStyle = colors.skin;
        ctx.fillRect(x + 1, y + 13, 2, 1);
        ctx.fillRect(x + 13, y + 13, 2, 1);
        
        // Legs
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(x + 5, y + 14, 2, 1);
        ctx.fillRect(x + 9, y + 14, 2, 1);
        
        // Shoes
        ctx.fillStyle = colors.shoes;
        ctx.fillRect(x + 4, y + 15, 3, 1);
        ctx.fillRect(x + 9, y + 15, 3, 1);
    }

    drawLinkUp(ctx, x, y, w, h, colors) {
        // Hat back
        ctx.fillStyle = colors.hat;
        ctx.fillRect(x + 4, y + 1, 8, 6);
        
        // Hair back
        ctx.fillStyle = colors.hair;
        ctx.fillRect(x + 3, y + 6, 10, 2);
        
        // Tunic back
        ctx.fillStyle = colors.tunicDark;
        ctx.fillRect(x + 3, y + 8, 10, 6);
        
        // Arms
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(x + 1, y + 8, 2, 4);
        ctx.fillRect(x + 13, y + 8, 2, 4);
        
        // Legs
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(x + 5, y + 14, 2, 1);
        ctx.fillRect(x + 9, y + 14, 2, 1);
        
        // Shoes
        ctx.fillStyle = colors.shoes;
        ctx.fillRect(x + 4, y + 15, 3, 1);
        ctx.fillRect(x + 9, y + 15, 3, 1);
    }

    drawLinkSide(ctx, x, y, w, h, colors, facingLeft) {
        const flip = facingLeft ? 1 : -1;
        const centerX = x + w / 2;
        
        // Hat
        ctx.fillStyle = colors.hat;
        ctx.fillRect(centerX - 4 * flip, y + 1, 8, 6);
        
        // Hair
        ctx.fillStyle = colors.hair;
        ctx.fillRect(centerX - 2 * flip, y + 6, 4, 2);
        
        // Face profile
        ctx.fillStyle = colors.skin;
        ctx.fillRect(centerX + (facingLeft ? -6 : 2), y + 6, 4, 4);
        
        // Eye
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX + (facingLeft ? -4 : 3), y + 8, 1, 1);
        
        // Tunic
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(centerX - 5 * flip, y + 10, 10, 4);
        
        // Belt
        ctx.fillStyle = colors.belt;
        ctx.fillRect(centerX - 5 * flip, y + 12, 10, 1);
        
        // Arms
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(centerX - 6 * flip, y + 10, 2, 3);
        ctx.fillRect(centerX + 4 * flip, y + 10, 2, 3);
        
        // Legs
        ctx.fillStyle = colors.tunic;
        ctx.fillRect(centerX - 3 * flip, y + 14, 2, 1);
        ctx.fillRect(centerX + 1 * flip, y + 14, 2, 1);
        
        // Shoes
        ctx.fillStyle = colors.shoes;
        ctx.fillRect(centerX - 4 * flip, y + 15, 3, 1);
        ctx.fillRect(centerX + 1 * flip, y + 15, 3, 1);
    }
}

// Enemy sprite base class
class EnemySprite extends Sprite {
    constructor(x, y, width, height, color = '#ff0000') {
        super(x, y, width, height, color);
        this.health = 1;
        this.speed = 30;
        this.direction = 'DOWN';
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.imageSmoothingEnabled = false;
        
        this.drawEnemySprite(ctx);

        ctx.restore();
    }

    drawEnemySprite(ctx) {
        const w = this.width;
        const h = this.height;
        const x = -w / 2;
        const y = -h / 2;

        // Different enemy types get different sprites
        if (this.color === '#cc3333') { // Soldier
            this.drawSoldier(ctx, x, y, w, h);
        } else if (this.color === '#33cc33') { // Archer
            this.drawArcher(ctx, x, y, w, h);
        } else if (this.color === '#3333cc') { // Wizard
            this.drawWizard(ctx, x, y, w, h);
        } else if (this.color === '#660066') { // Boss
            this.drawBoss(ctx, x, y, w, h);
        } else {
            // Default enemy
            this.drawDefaultEnemy(ctx, x, y, w, h);
        }
    }

    drawSoldier(ctx, x, y, w, h) {
        // Soldier with armor and spear
        // Helmet
        ctx.fillStyle = '#8C7853';
        ctx.fillRect(x + 2, y + 1, 12, 6);
        
        // Face
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 4, y + 6, 8, 4);
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 7, 1, 1);
        ctx.fillRect(x + 9, y + 7, 1, 1);
        
        // Armor
        ctx.fillStyle = '#8C7853';
        ctx.fillRect(x + 3, y + 10, 10, 4);
        
        // Arms
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 1, y + 10, 2, 3);
        ctx.fillRect(x + 13, y + 10, 2, 3);
        
        // Spear (right hand)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 14, y + 5, 1, 8);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x + 14, y + 4, 1, 2);
        
        // Legs
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 5, y + 14, 2, 2);
        ctx.fillRect(x + 9, y + 14, 2, 2);
    }

    drawArcher(ctx, x, y, w, h) {
        // Archer with bow
        // Hat
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x + 3, y + 1, 10, 5);
        
        // Face
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 4, y + 6, 8, 4);
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 7, 1, 1);
        ctx.fillRect(x + 9, y + 7, 1, 1);
        
        // Tunic
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x + 3, y + 10, 10, 4);
        
        // Arms
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 1, y + 10, 2, 3);
        ctx.fillRect(x + 13, y + 10, 2, 3);
        
        // Bow
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y + 8, 1, 6);
        ctx.fillRect(x, y + 8, 3, 1);
        ctx.fillRect(x, y + 13, 3, 1);
        
        // Legs
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 5, y + 14, 2, 2);
        ctx.fillRect(x + 9, y + 14, 2, 2);
    }

    drawWizard(ctx, x, y, w, h) {
        // Wizard with robe and hat
        // Pointed hat
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(x + 6, y, 4, 2);
        ctx.fillRect(x + 5, y + 2, 6, 2);
        ctx.fillRect(x + 4, y + 4, 8, 2);
        
        // Face
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 4, y + 6, 8, 4);
        
        // Eyes (glowing)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 6, y + 7, 1, 1);
        ctx.fillRect(x + 9, y + 7, 1, 1);
        
        // Beard
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x + 5, y + 9, 6, 2);
        
        // Robe
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(x + 2, y + 10, 12, 6);
        
        // Staff
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 15, y + 6, 1, 8);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 14, y + 5, 3, 2);
    }

    drawBoss(ctx, x, y, w, h) {
        // Large boss enemy
        // Head
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(x + 6, y + 2, 20, 12);
        
        // Eyes (red glowing)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 10, y + 6, 3, 3);
        ctx.fillRect(x + 19, y + 6, 3, 3);
        
        // Horns
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 8, y, 2, 4);
        ctx.fillRect(x + 22, y, 2, 4);
        
        // Body
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(x + 4, y + 14, 24, 14);
        
        // Arms
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(x, y + 16, 4, 8);
        ctx.fillRect(x + 28, y + 16, 4, 8);
        
        // Claws
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y + 24, 2, 3);
        ctx.fillRect(x + 2, y + 24, 2, 3);
        ctx.fillRect(x + 28, y + 24, 2, 3);
        ctx.fillRect(x + 30, y + 24, 2, 3);
    }

    drawDefaultEnemy(ctx, x, y, w, h) {
        // Default enemy sprite
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, w, h);
        
        // Simple eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + w/4, y + h/4, 2, 2);
        ctx.fillRect(x + 3*w/4 - 2, y + h/4, 2, 2);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + w/4 + 1, y + h/4 + 1, 1, 1);
        ctx.fillRect(x + 3*w/4 - 1, y + h/4 + 1, 1, 1);
    }
}