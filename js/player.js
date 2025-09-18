// Player character (Link) class

class Player {
    constructor(x, y) {
        this.sprite = new LinkSprite(x, y);
        this.x = x;
        this.y = y;
        this.speed = 100; // pixels per second
        this.direction = 'DOWN';
        this.isMoving = false;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.damageCooldown = 0; // Prevent rapid damage
        
        // Player stats
        this.maxHealth = 3;
        this.health = 3;
        this.rupees = 0;
        this.items = [];
        this.hasMap = false;
        this.hasCompass = false;
        
        // Inventory
        this.inventory = {
            sword: true,
            shield: false,
            bow: false,
            boomerang: false,
            hookshot: false,
            bombs: 0,
            arrows: 0,
            keys: 0
        };
        
        // Attack properties
        this.attackRange = 20;
        this.attackDamage = 1;
    }

    update(deltaTime, input, level) {
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        if (this.damageCooldown > 0) {
            this.damageCooldown -= deltaTime;
        }
        
        // Handle attack input
        if (input.wasKeyJustPressed('attack') && this.attackCooldown <= 0 && !this.isAttacking) {
            this.attack();
        }
        
        // Update attack state
        if (this.isAttacking) {
            this.attackCooldown = 300; // ms
            if (this.attackCooldown <= 200) {
                this.isAttacking = false;
            }
        }

        // Handle movement
        const movement = input.getMovementDirection();
        this.isMoving = movement.x !== 0 || movement.y !== 0;
        
        if (this.isMoving && !this.isAttacking) {
            // Update direction
            const lastDir = input.getLastDirection();
            if (lastDir) {
                this.direction = lastDir;
                this.sprite.setDirection(this.direction);
            }
            
            // Calculate new position
            let newX = this.x + movement.x * this.speed * deltaTime / 1000;
            let newY = this.y + movement.y * this.speed * deltaTime / 1000;
            
            // Check collision with level boundaries and obstacles
            if (level) {
                const bounds = level.getBounds();
                newX = clamp(newX, bounds.x, bounds.x + bounds.width - this.sprite.width);
                newY = clamp(newY, bounds.y, bounds.y + bounds.height - this.sprite.height);
                
                // Check collision with solid tiles
                if (!level.isPassable(newX, this.y, this.sprite.width, this.sprite.height)) {
                    newX = this.x;
                }
                if (!level.isPassable(this.x, newY, this.sprite.width, this.sprite.height)) {
                    newY = this.y;
                }
            }
            
            // Update position
            this.x = newX;
            this.y = newY;
            this.sprite.x = this.x;
            this.sprite.y = this.y;
        }
        
        // Update animations
        this.updateAnimations();
        this.sprite.update(deltaTime);
    }

    updateAnimations() {
        let animationName = 'idle_' + this.direction.toLowerCase();
        
        if (this.isAttacking) {
            animationName = 'attack_' + this.direction.toLowerCase();
        } else if (this.isMoving) {
            animationName = 'walk_' + this.direction.toLowerCase();
        }
        
        this.sprite.playAnimation(animationName);
    }

    attack() {
        if (!this.inventory.sword) return;
        
        this.isAttacking = true;
        this.attackCooldown = 300;
        
        // Calculate attack position based on direction
        const attackPos = this.getAttackPosition();
        
        return {
            x: attackPos.x,
            y: attackPos.y,
            width: this.attackRange,
            height: this.attackRange,
            damage: this.attackDamage
        };
    }

    getAttackPosition() {
        const centerX = this.x + this.sprite.width / 2;
        const centerY = this.y + this.sprite.height / 2;
        
        switch(this.direction) {
            case 'UP':
                return { x: centerX - this.attackRange / 2, y: centerY - this.attackRange };
            case 'DOWN':
                return { x: centerX - this.attackRange / 2, y: centerY };
            case 'LEFT':
                return { x: centerX - this.attackRange, y: centerY - this.attackRange / 2 };
            case 'RIGHT':
                return { x: centerX, y: centerY - this.attackRange / 2 };
            default:
                return { x: centerX, y: centerY };
        }
    }

    takeDamage(amount) {
        if (this.damageCooldown > 0) return; // Immunity period
        
        this.health = Math.max(0, this.health - amount);
        this.damageCooldown = 1000; // 1 second immunity
        
        if (this.health === 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addRupees(amount) {
        this.rupees += amount;
    }

    addItem(itemName) {
        if (!this.items.includes(itemName)) {
            this.items.push(itemName);
        }
    }

    hasItem(itemName) {
        return this.items.includes(itemName) || this.inventory[itemName];
    }

    useKey() {
        if (this.inventory.keys > 0) {
            this.inventory.keys--;
            return true;
        }
        return false;
    }

    addKey() {
        this.inventory.keys++;
    }

    die() {
        // Handle player death
        console.log('Link has fallen!');
        // Reset to last save point or restart level
    }

    render(ctx) {
        this.sprite.render(ctx);
        
        // Render attack effect if attacking
        if (this.isAttacking && this.attackCooldown > 200) {
            const attackPos = this.getAttackPosition();
            ctx.save();
            
            // Sword slash effect
            const gradient = ctx.createRadialGradient(
                attackPos.x + this.attackRange / 2, 
                attackPos.y + this.attackRange / 2, 0,
                attackPos.x + this.attackRange / 2, 
                attackPos.y + this.attackRange / 2, 
                this.attackRange / 2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0.2)');
            
            ctx.fillStyle = gradient;
            
            // Draw sword arc based on direction
            ctx.beginPath();
            const centerX = attackPos.x + this.attackRange / 2;
            const centerY = attackPos.y + this.attackRange / 2;
            
            switch(this.direction) {
                case 'DOWN':
                    ctx.arc(centerX, centerY - 5, this.attackRange / 2, 0.2, Math.PI - 0.2);
                    break;
                case 'UP':
                    ctx.arc(centerX, centerY + 5, this.attackRange / 2, Math.PI + 0.2, 2 * Math.PI - 0.2);
                    break;
                case 'LEFT':
                    ctx.arc(centerX + 5, centerY, this.attackRange / 2, Math.PI/2 + 0.2, 3*Math.PI/2 - 0.2);
                    break;
                case 'RIGHT':
                    ctx.arc(centerX - 5, centerY, this.attackRange / 2, -Math.PI/2 + 0.2, Math.PI/2 - 0.2);
                    break;
            }
            ctx.fill();
            
            ctx.restore();
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.sprite.width,
            height: this.sprite.height
        };
    }

    getCenter() {
        return {
            x: this.x + this.sprite.width / 2,
            y: this.y + this.sprite.height / 2
        };
    }

    // Serialize player state for saving
    serialize() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            rupees: this.rupees,
            items: [...this.items],
            inventory: {...this.inventory}
        };
    }

    // Load player state
    deserialize(data) {
        this.x = data.x || this.x;
        this.y = data.y || this.y;
        this.health = data.health || this.health;
        this.maxHealth = data.maxHealth || this.maxHealth;
        this.rupees = data.rupees || this.rupees;
        this.items = data.items || [];
        this.inventory = {...this.inventory, ...data.inventory};
        
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }
}