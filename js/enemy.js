// Enemy system for the Zelda game

class Enemy {
    constructor(x, y, type = 'soldier') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = 1;
        this.maxHealth = 1;
        this.speed = 50;
        this.direction = 'DOWN';
        this.isAlive = true;
        this.canMove = true;
        this.attackDamage = 1;
        this.attackRange = 16;
        this.attackCooldown = 0;
        this.lastAttack = 0;
        
        // AI properties
        this.detectionRange = 100;
        this.moveTimer = 0;
        this.moveDirection = { x: 0, y: 0 };
        this.state = 'patrol'; // patrol, chase, attack, stunned
        this.stateTimer = 0;
        
        this.setupEnemyType();
        this.sprite = new EnemySprite(x, y, this.width, this.height, this.color);
    }

    setupEnemyType() {
        switch(this.type) {
            case 'soldier':
                this.health = 2;
                this.maxHealth = 2;
                this.speed = 40;
                this.attackDamage = 1;
                this.detectionRange = 80;
                this.width = 16;
                this.height = 16;
                this.color = '#cc3333';
                break;
            case 'archer':
                this.health = 1;
                this.maxHealth = 1;
                this.speed = 30;
                this.attackDamage = 1;
                this.detectionRange = 120;
                this.attackRange = 100;
                this.width = 16;
                this.height = 16;
                this.color = '#33cc33';
                break;
            case 'wizard':
                this.health = 3;
                this.maxHealth = 3;
                this.speed = 20;
                this.attackDamage = 2;
                this.detectionRange = 100;
                this.attackRange = 80;
                this.width = 16;
                this.height = 16;
                this.color = '#3333cc';
                break;
            case 'boss':
                this.health = 10;
                this.maxHealth = 10;
                this.speed = 60;
                this.attackDamage = 2;
                this.detectionRange = 150;
                this.attackRange = 30;
                this.width = 32;
                this.height = 32;
                this.color = '#660066';
                break;
        }
    }

    update(deltaTime, player, level) {
        if (!this.isAlive) return;

        // Update timers
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        this.stateTimer += deltaTime;

        // Calculate distance to player
        const playerDistance = distance(
            this.x + this.width / 2,
            this.y + this.height / 2,
            player.x + player.sprite.width / 2,
            player.y + player.sprite.height / 2
        );

        // State machine
        switch(this.state) {
            case 'patrol':
                this.updatePatrol(deltaTime);
                if (playerDistance <= this.detectionRange) {
                    this.state = 'chase';
                    this.stateTimer = 0;
                }
                break;
            case 'chase':
                this.updateChase(deltaTime, player, level);
                if (playerDistance > this.detectionRange * 1.5) {
                    this.state = 'patrol';
                    this.stateTimer = 0;
                } else if (playerDistance <= this.attackRange && this.attackCooldown <= 0) {
                    this.state = 'attack';
                    this.stateTimer = 0;
                }
                break;
            case 'attack':
                this.updateAttack(deltaTime, player);
                if (this.stateTimer >= 500) { // Attack duration
                    this.state = 'chase';
                    this.stateTimer = 0;
                    this.attackCooldown = 1000; // 1 second cooldown
                }
                break;
            case 'stunned':
                if (this.stateTimer >= 500) {
                    this.state = 'chase';
                    this.stateTimer = 0;
                }
                break;
        }

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.update(deltaTime);
    }

    updatePatrol(deltaTime) {
        // Simple random movement pattern
        this.moveTimer += deltaTime;
        
        if (this.moveTimer >= 2000) { // Change direction every 2 seconds
            this.moveTimer = 0;
            const directions = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, 
                { x: -1, y: 0 }, { x: 1, y: 0 },
                { x: 0, y: 0 } // Sometimes stand still
            ];
            this.moveDirection = directions[Math.floor(Math.random() * directions.length)];
        }

        if (this.canMove) {
            this.x += this.moveDirection.x * this.speed * deltaTime / 1000;
            this.y += this.moveDirection.y * this.speed * deltaTime / 1000;
        }
    }

    updateChase(deltaTime, player, level) {
        if (!this.canMove) return;

        // Calculate direction to player
        const dx = (player.x + player.sprite.width / 2) - (this.x + this.width / 2);
        const dy = (player.y + player.sprite.height / 2) - (this.y + this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const moveX = (dx / dist) * this.speed * deltaTime / 1000;
            const moveY = (dy / dist) * this.speed * deltaTime / 1000;

            let newX = this.x + moveX;
            let newY = this.y + moveY;

            // Check collision with level if provided
            if (level) {
                if (!level.isPassable(newX, this.y, this.width, this.height)) {
                    newX = this.x;
                }
                if (!level.isPassable(this.x, newY, this.width, this.height)) {
                    newY = this.y;
                }
            }

            this.x = newX;
            this.y = newY;

            // Update facing direction
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'RIGHT' : 'LEFT';
            } else {
                this.direction = dy > 0 ? 'DOWN' : 'UP';
            }
        }
    }

    updateAttack(deltaTime, player) {
        // Different attack patterns based on enemy type
        switch(this.type) {
            case 'soldier':
                // Melee attack - already handled by collision detection
                break;
            case 'archer':
                // Ranged attack - could spawn projectiles
                break;
            case 'wizard':
                // Magic attack - could spawn spell effects
                break;
            case 'boss':
                // Special boss attack patterns
                break;
        }
    }

    takeDamage(amount) {
        if (!this.isAlive) return false;

        this.health = Math.max(0, this.health - amount);
        
        // Knockback and stun effect
        this.state = 'stunned';
        this.stateTimer = 0;

        if (this.health <= 0) {
            this.die();
            return true; // Enemy was killed
        }
        
        return false;
    }

    die() {
        this.isAlive = false;
        this.canMove = false;
        this.sprite.visible = false;
        
        // Drop items occasionally
        if (Math.random() < 0.3) { // 30% chance
            // Could return dropped item info
            return {
                type: 'rupee',
                value: 1,
                x: this.x + this.width / 2,
                y: this.y + this.height / 2
            };
        }
        
        return null;
    }

    render(ctx) {
        if (!this.isAlive) return;

        this.sprite.render(ctx);

        // Render health bar for bosses
        if (this.type === 'boss' && this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
            ctx.strokeStyle = '#000000';
            ctx.strokeRect(this.x, this.y - 8, barWidth, barHeight);
        }

        // Debug: render detection range (remove in final version)
        if (false) { // Set to true for debugging
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.detectionRange,
                0,
                2 * Math.PI
            );
            ctx.stroke();
        }
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

    // Check if this enemy collides with another object
    collidesWith(other) {
        return rectangleCollision(this.getBounds(), other.getBounds());
    }
}

// Specialized boss enemy
class BossEnemy extends Enemy {
    constructor(x, y, bossType = 'eastern_palace') {
        super(x, y, 'boss');
        this.bossType = bossType;
        this.phase = 1;
        this.maxPhases = 3;
        this.specialAttackTimer = 0;
        this.isVulnerable = true;
        
        this.setupBossType();
    }

    setupBossType() {
        switch(this.bossType) {
            case 'eastern_palace':
                this.health = 15;
                this.maxHealth = 15;
                this.attackDamage = 1;
                this.color = '#8B4513'; // Brown
                break;
            case 'desert_palace':
                this.health = 20;
                this.maxHealth = 20;
                this.attackDamage = 2;
                this.color = '#DAA520'; // Gold
                break;
            case 'tower_hera':
                this.health = 25;
                this.maxHealth = 25;
                this.attackDamage = 2;
                this.color = '#4169E1'; // Blue
                break;
        }
    }

    update(deltaTime, player, level) {
        super.update(deltaTime, player, level);
        
        // Check for phase transitions
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent <= 0.66 && this.phase === 1) {
            this.phase = 2;
            this.speed *= 1.2;
        } else if (healthPercent <= 0.33 && this.phase === 2) {
            this.phase = 3;
            this.speed *= 1.3;
        }

        // Special attack patterns
        this.specialAttackTimer += deltaTime;
        if (this.specialAttackTimer >= 3000) { // Every 3 seconds
            this.performSpecialAttack(player);
            this.specialAttackTimer = 0;
        }
    }

    performSpecialAttack(player) {
        // Different special attacks based on boss type and phase
        switch(this.bossType) {
            case 'eastern_palace':
                // Charge attack
                break;
            case 'desert_palace':
                // Sand attack
                break;
            case 'tower_hera':
                // Magic orbs
                break;
        }
    }

    render(ctx) {
        super.render(ctx);
        
        // Render boss-specific effects
        if (this.phase >= 2) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.restore();
        }
    }
}