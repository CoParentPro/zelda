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

        // Draw the sprite as a colored rectangle for now
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Add a simple border for visibility
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();
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
        // Override to add Link-specific visual elements
        ctx.save();
        
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale * (this.flipHorizontal ? -1 : 1), 
                  this.scale * (this.flipVertical ? -1 : 1));

        // Body (green tunic)
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Hat (darker green)
        ctx.fillStyle = '#006600';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height / 3);
        
        // Face (pink)
        ctx.fillStyle = '#ffcc99';
        ctx.fillRect(-this.width / 4, -this.height / 4, this.width / 2, this.height / 3);
        
        // Simple direction indicator
        ctx.fillStyle = '#ffffff';
        switch(this.direction) {
            case 'UP':
                ctx.fillRect(-2, -this.height / 2 + 2, 4, 2);
                break;
            case 'DOWN':
                ctx.fillRect(-2, this.height / 2 - 4, 4, 2);
                break;
            case 'LEFT':
                ctx.fillRect(-this.width / 2 + 2, -2, 2, 4);
                break;
            case 'RIGHT':
                ctx.fillRect(this.width / 2 - 4, -2, 2, 4);
                break;
        }

        ctx.restore();
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
        
        // Enemy body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Simple eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-this.width / 3, -this.height / 4, 3, 3);
        ctx.fillRect(this.width / 6, -this.height / 4, 3, 3);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(-this.width / 3 + 1, -this.height / 4 + 1, 1, 1);
        ctx.fillRect(this.width / 6 + 1, -this.height / 4 + 1, 1, 1);

        ctx.restore();
    }
}