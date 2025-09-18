// Main game class for the Zelda game

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.state = 'playing'; // playing, paused, menu, gameover
        this.currentLevel = 1;
        this.gameStartTime = Date.now();
        this.lastFrameTime = 0;
        this.fps = 60;
        
        // Game objects
        this.player = null;
        this.level = null;
        this.input = new InputManager();
        this.camera = { x: 0, y: 0 };
        
        // Level data
        this.levels = {};
        this.levelNames = {
            1: 'Light World - Eastern Palace',
            2: 'Light World - Desert Palace',
            3: 'Light World - Tower of Hera',
            4: 'Dark World - Palace of Darkness',
            5: 'Dark World - Swamp Palace',
            6: 'Dark World - Skull Woods',
            7: 'Dark World - Thieves\' Town',
            8: 'Dark World - Ice Palace',
            9: 'Dark World - Misery Mire',
            10: 'Dark World - Turtle Rock',
            11: 'Dark World - Ganon\'s Tower',
            12: 'Dark World - Final Boss'
        };
        
        // Game progression
        this.completedLevels = [];
        this.gameCompleted = false;
        
        // UI elements
        this.showDebugInfo = false;
        this.messageQueue = [];
        this.currentMessage = null;
        this.messageTimer = 0;
        
        this.initialize();
    }

    initialize() {
        // Initialize the first level
        this.loadLevel(this.currentLevel);
        
        // Create player at spawn point
        const spawnPoint = this.level.getSpawnPoint();
        this.player = new Player(spawnPoint.x, spawnPoint.y);
        
        // Update UI
        this.updateUI();
        
        console.log('Game initialized - Welcome to The Legend of Zelda: A Link to the Past!');
        this.showMessage('Welcome to The Legend of Zelda: A Link to the Past!', 3000);
    }

    loadLevel(levelId) {
        // Create level if it doesn't exist
        if (!this.levels[levelId]) {
            const world = levelId <= 3 ? 'light' : 'dark';
            this.levels[levelId] = new Level(levelId, this.levelNames[levelId], world);
        }
        
        this.level = this.levels[levelId];
        this.currentLevel = levelId;
        
        // Reset camera
        this.camera.x = 0;
        this.camera.y = 0;
        
        console.log(`Loaded level ${levelId}: ${this.levelNames[levelId]}`);
        this.updateUI();
    }

    update(deltaTime) {
        // Always update input manager first
        this.input.update();
        
        if (this.state !== 'playing') return;

        // Handle input
        this.handleInput();
        
        // Update game objects
        if (this.player) {
            this.player.update(deltaTime, this.input, this.level);
        }
        
        if (this.level) {
            this.level.update(deltaTime, this.player);
        }
        
        // Handle collisions
        this.handleCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Update UI and messages
        this.updateMessages(deltaTime);
        
        // Check level completion
        this.checkLevelCompletion();
    }

    handleInput() {
        // Handle menu/pause
        if (this.input.wasKeyJustPressed('menu')) {
            this.togglePause();
        }
        
        // Handle interaction
        if (this.input.wasKeyJustPressed('interact')) {
            this.handleInteraction();
        }
        
        // Debug toggle
        if (this.input.wasKeyJustPressed('start')) {
            this.showDebugInfo = !this.showDebugInfo;
        }
        
        // Level switching for testing (remove in final version)
        if (this.showDebugInfo) {
            for (let i = 1; i <= 12; i++) {
                if (this.input.wasKeyJustPressed('Digit' + i) || 
                    this.input.wasKeyJustPressed('Numpad' + i)) {
                    this.switchToLevel(i);
                    break;
                }
            }
        }
    }

    handleInteraction() {
        if (!this.player || !this.level) return;
        
        const playerBounds = this.player.getBounds();
        const interactionRange = 20;
        
        // Expand interaction area
        const interactionBounds = {
            x: playerBounds.x - interactionRange,
            y: playerBounds.y - interactionRange,
            width: playerBounds.width + interactionRange * 2,
            height: playerBounds.height + interactionRange * 2
        };
        
        // Check chest interactions
        this.level.chests.forEach(chest => {
            if (!chest.isOpen && rectangleCollision(interactionBounds, chest.getBounds())) {
                const item = chest.tryOpen(this.player);
                if (item) {
                    this.level.addItem(item);
                    this.showMessage(`Found ${item.type}!`, 2000);
                } else if (chest.requiresKey) {
                    this.showMessage('This chest requires a key!', 2000);
                }
            }
        });
    }

    handleCollisions() {
        if (!this.player || !this.level) return;
        
        const playerBounds = this.player.getBounds();
        
        // Item collection
        this.level.items.forEach((item, index) => {
            if (!item.isCollected && item.collidesWith(this.player)) {
                if (item.collect(this.player)) {
                    this.showMessage(`Collected ${item.type}!`, 1500);
                    this.updateUI();
                }
            }
        });
        
        // Enemy collisions
        this.level.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;
            
            // Player hit by enemy
            if (enemy.collidesWith(this.player)) {
                this.player.takeDamage(enemy.attackDamage);
                this.updateUI();
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
            
            // Player attacks enemy
            if (this.player.isAttacking) {
                const attackPos = this.player.getAttackPosition();
                const attackBounds = {
                    x: attackPos.x,
                    y: attackPos.y,
                    width: this.player.attackRange,
                    height: this.player.attackRange
                };
                
                if (rectangleCollision(attackBounds, enemy.getBounds())) {
                    const killed = enemy.takeDamage(this.player.attackDamage);
                    if (killed) {
                        const drop = enemy.die();
                        if (drop) {
                            this.level.addItem(new Item(drop.x, drop.y, drop.type, drop.value));
                        }
                    }
                }
            }
        });
        
        // Boss collisions
        if (this.level.boss && this.level.boss.isAlive) {
            const boss = this.level.boss;
            
            // Player hit by boss
            if (boss.collidesWith(this.player)) {
                this.player.takeDamage(boss.attackDamage);
                this.updateUI();
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
            
            // Player attacks boss
            if (this.player.isAttacking) {
                const attackPos = this.player.getAttackPosition();
                const attackBounds = {
                    x: attackPos.x,
                    y: attackPos.y,
                    width: this.player.attackRange,
                    height: this.player.attackRange
                };
                
                if (rectangleCollision(attackBounds, boss.getBounds())) {
                    const killed = boss.takeDamage(this.player.attackDamage);
                    if (killed) {
                        this.showMessage(`${boss.bossType} defeated!`, 3000);
                    }
                }
            }
        }
    }

    updateCamera() {
        if (!this.player) return;
        
        const playerCenter = this.player.getCenter();
        
        // Center camera on player
        this.camera.x = playerCenter.x - this.width / 2;
        this.camera.y = playerCenter.y - this.height / 2;
        
        // Clamp camera to level bounds
        const levelBounds = this.level.getBounds();
        this.camera.x = clamp(this.camera.x, 0, levelBounds.width - this.width);
        this.camera.y = clamp(this.camera.y, 0, levelBounds.height - this.height);
    }

    updateMessages(deltaTime) {
        if (this.currentMessage) {
            this.messageTimer -= deltaTime;
            if (this.messageTimer <= 0) {
                this.currentMessage = null;
                if (this.messageQueue.length > 0) {
                    const next = this.messageQueue.shift();
                    this.currentMessage = next.text;
                    this.messageTimer = next.duration;
                }
            }
        } else if (this.messageQueue.length > 0) {
            const next = this.messageQueue.shift();
            this.currentMessage = next.text;
            this.messageTimer = next.duration;
        }
    }

    checkLevelCompletion() {
        if (!this.level || this.level.completed) return;
        
        // Check if boss is defeated
        if (this.level.boss && !this.level.boss.isAlive && !this.completedLevels.includes(this.currentLevel)) {
            this.completeLevel();
        }
    }

    completeLevel() {
        this.completedLevels.push(this.currentLevel);
        this.level.completed = true;
        
        this.showMessage(`Level ${this.currentLevel} completed!`, 3000);
        
        // Check if this was the final level
        if (this.currentLevel === 12) {
            this.completeGame();
        } else {
            // Auto-advance to next level after a delay
            setTimeout(() => {
                if (this.currentLevel < 12) {
                    this.switchToLevel(this.currentLevel + 1);
                }
            }, 4000);
        }
    }

    completeGame() {
        this.gameCompleted = true;
        this.state = 'completed';
        this.showMessage('Congratulations! You have completed The Legend of Zelda: A Link to the Past!', 5000);
        console.log('Game completed!');
    }

    switchToLevel(levelId) {
        if (levelId >= 1 && levelId <= 12) {
            this.loadLevel(levelId);
            
            // Move player to spawn point
            const spawnPoint = this.level.getSpawnPoint();
            this.player.x = spawnPoint.x;
            this.player.y = spawnPoint.y;
            this.player.sprite.x = spawnPoint.x;
            this.player.sprite.y = spawnPoint.y;
            
            this.showMessage(`Entered ${this.levelNames[levelId]}`, 2000);
        }
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
        } else if (this.state === 'paused') {
            this.state = 'playing';
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.showMessage('Game Over! Press R to restart', 0); // 0 = permanent message
        console.log('Game Over');
    }

    restart() {
        // Reset game state
        this.state = 'playing';
        this.currentLevel = 1;
        this.completedLevels = [];
        this.gameCompleted = false;
        this.messageQueue = [];
        this.currentMessage = null;
        
        // Reload first level
        this.loadLevel(1);
        
        // Reset player
        const spawnPoint = this.level.getSpawnPoint();
        this.player = new Player(spawnPoint.x, spawnPoint.y);
        
        this.updateUI();
        this.showMessage('Game restarted!', 2000);
    }

    showMessage(text, duration) {
        if (this.currentMessage) {
            this.messageQueue.push({ text, duration });
        } else {
            this.currentMessage = text;
            this.messageTimer = duration;
        }
    }

    updateUI() {
        // Update HTML UI elements
        const healthElement = document.getElementById('health');
        const rupeesElement = document.getElementById('rupees');
        const levelElement = document.getElementById('level');
        
        if (healthElement && this.player) {
            healthElement.textContent = `${this.player.health}/${this.player.maxHealth}`;
        }
        
        if (rupeesElement && this.player) {
            rupeesElement.textContent = this.player.rupees;
        }
        
        if (levelElement) {
            levelElement.textContent = this.levelNames[this.currentLevel] || 'Unknown Level';
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Save context for camera transform
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render level
        if (this.level) {
            this.level.render(this.ctx);
        }
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Restore context
        this.ctx.restore();
        
        // Render UI overlays
        this.renderUI();
    }

    renderUI() {
        // Render current message with Zelda-style message box
        if (this.currentMessage) {
            this.ctx.save();
            
            // Message box background
            this.ctx.fillStyle = 'rgba(0, 30, 60, 0.95)';
            this.ctx.fillRect(20, this.height - 80, this.width - 40, 60);
            
            // Border
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(20, this.height - 80, this.width - 40, 60);
            
            // Inner border
            this.ctx.strokeStyle = '#8B7D6B';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(22, this.height - 78, this.width - 44, 56);
            
            // Message text
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 14px Courier New';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(this.currentMessage, 35, this.height - 45);
            this.ctx.restore();
        }
        
        // Render pause screen with Zelda styling
        if (this.state === 'paused') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 30, 60, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Title
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 28px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('PAUSED', this.width / 2, this.height / 2);
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
            
            // Instruction
            this.ctx.fillStyle = '#D3D3D3';
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('Press ESC to resume', this.width / 2, this.height / 2 + 40);
            this.ctx.restore();
        }
        
        // Render game over screen with dramatic Zelda styling
        if (this.state === 'gameover') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(139, 0, 0, 0.9)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Dramatic red glow effect
            const gradient = this.ctx.createRadialGradient(
                this.width / 2, this.height / 2, 0,
                this.width / 2, this.height / 2, 200
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0.1)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Game Over text with shadow effect
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 36px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2 + 2, this.height / 2 - 18);
            
            this.ctx.fillStyle = '#FF4444';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 20);
            
            // Restart instruction
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 18px Courier New';
            this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 30);
            this.ctx.restore();
        }
        
        // Render completion screen
        if (this.state === 'completed') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = '28px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CONGRATULATIONS!', this.width / 2, this.height / 2 - 40);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('You have completed', this.width / 2, this.height / 2 - 10);
            this.ctx.fillText('The Legend of Zelda: A Link to the Past!', this.width / 2, this.height / 2 + 10);
            this.ctx.fillText('Press R to play again', this.width / 2, this.height / 2 + 40);
            this.ctx.restore();
        }
        
        // Debug info
        if (this.showDebugInfo) {
            this.renderDebugInfo();
        }
    }

    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 250, 120);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px Courier New';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        this.ctx.fillText(`Level: ${this.currentLevel}`, 10, y);
        y += 15;
        this.ctx.fillText(`Player: (${Math.round(this.player?.x || 0)}, ${Math.round(this.player?.y || 0)})`, 10, y);
        y += 15;
        this.ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 10, y);
        y += 15;
        this.ctx.fillText(`Enemies: ${this.level?.enemies?.filter(e => e.isAlive).length || 0}`, 10, y);
        y += 15;
        this.ctx.fillText(`Items: ${this.level?.items?.filter(i => !i.isCollected).length || 0}`, 10, y);
        y += 15;
        this.ctx.fillText(`State: ${this.state}`, 10, y);
        y += 15;
        this.ctx.fillText('Press 1-9,0,-,= for levels 1-12', 10, y);
        
        this.ctx.restore();
    }

    // Handle special key inputs for game over/restart
    handleSpecialInput() {
        if ((this.state === 'gameover' || this.state === 'completed')) {
            if (this.input.wasKeyJustPressed('KeyR') || this.input.wasKeyJustPressed('Enter')) {
                this.restart();
            }
        }
    }

    // Main game loop method
    run(currentTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Handle special inputs (always check these regardless of game state)
        this.handleSpecialInput();
        
        // Update game
        this.update(deltaTime);
        
        // Render game
        this.render();
        
        // Continue game loop
        requestAnimationFrame((time) => this.run(time));
    }
}