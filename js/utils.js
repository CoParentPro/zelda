// Utility functions for the Zelda game

// Math utilities
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rectangle collision detection
function rectangleCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Point in rectangle check
function pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
}

// Direction vectors
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Convert direction to angle
function directionToAngle(direction) {
    switch(direction) {
        case 'UP': return -Math.PI / 2;
        case 'DOWN': return Math.PI / 2;
        case 'LEFT': return Math.PI;
        case 'RIGHT': return 0;
        default: return 0;
    }
}

// Create a simple 2D vector
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    normalize() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length === 0) return new Vector2(0, 0);
        return new Vector2(this.x / length, this.y / length);
    }
}

// Animation frame helper
function createAnimation(frames, duration) {
    return {
        frames: frames,
        duration: duration,
        currentFrame: 0,
        timer: 0,
        loop: true
    };
}

function updateAnimation(animation, deltaTime) {
    animation.timer += deltaTime;
    if (animation.timer >= animation.duration) {
        animation.timer = 0;
        animation.currentFrame++;
        if (animation.currentFrame >= animation.frames.length) {
            if (animation.loop) {
                animation.currentFrame = 0;
            } else {
                animation.currentFrame = animation.frames.length - 1;
            }
        }
    }
    return animation.frames[animation.currentFrame];
}

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Simple tilemap utilities
function worldToTile(worldPos, tileSize) {
    return {
        x: Math.floor(worldPos.x / tileSize),
        y: Math.floor(worldPos.y / tileSize)
    };
}

function tileToWorld(tilePos, tileSize) {
    return {
        x: tilePos.x * tileSize,
        y: tilePos.y * tileSize
    };
}

// Particle System for visual effects
class Particle {
    constructor(x, y, type = 'spark') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.size = Math.random() * 3 + 1;
        this.type = type;
        this.color = this.getColorForType(type);
        this.gravity = 0.1;
        this.friction = 0.98;
    }
    
    getColorForType(type) {
        switch(type) {
            case 'spark': return '#FFD700';
            case 'magic': return '#00BFFF';
            case 'blood': return '#FF0000';
            case 'dust': return '#D2B48C';
            case 'energy': return '#00FF00';
            default: return '#FFFFFF';
        }
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= deltaTime / 1000;
        return this.life > 0;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addParticle(x, y, type = 'spark') {
        this.particles.push(new Particle(x, y, type));
    }
    
    addBurst(x, y, count = 10, type = 'spark') {
        for (let i = 0; i < count; i++) {
            this.addParticle(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, type);
        }
    }
    
    update(deltaTime) {
        this.particles = this.particles.filter(particle => particle.update(deltaTime));
    }
    
    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }
    
    clear() {
        this.particles = [];
    }
}