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
        this.particleSystem = new ParticleSystem();
        
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
        
        // Sound system simulation
        this.soundEffects = {
            swordSlash: '⚔️',
            enemyHit: '💥',
            itemCollect: '✨',
            heartPickup: '❤️',
            rupeeCollect: '💎',
            levelComplete: '🎉'
        };
        this.currentSoundEffect = null;
        this.soundEffectTimer = 0;
        
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
        
        // Update particle system
        this.particleSystem.update(deltaTime);
        
        // Handle collisions
        this.handleCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Update UI and messages
        this.updateMessages(deltaTime);
        
        // Update sound effects
        this.updateSoundEffects(deltaTime);
        
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
                    
                    // Play collection sound
                    if (item.type.includes('rupee')) {
                        this.playSound('rupeeCollect');
                    } else if (item.type === 'heart') {
                        this.playSound('heartPickup');
                    } else {
                        this.playSound('itemCollect');
                    }
                    
                    // Add collection particle effect
                    this.particleSystem.addBurst(
                        item.x + item.width / 2, 
                        item.y + item.height / 2, 
                        10, 
                        item.type === 'rupee' ? 'energy' : 'magic'
                    );
                    
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
                    
                    // Play sound effects
                    this.playSound(killed ? 'enemyHit' : 'swordSlash');
                    
                    // Add combat particle effects
                    this.particleSystem.addBurst(
                        enemy.x + enemy.width / 2, 
                        enemy.y + enemy.height / 2, 
                        8, 
                        killed ? 'blood' : 'spark'
                    );
                    
                    if (killed) {
                        const drop = enemy.die();
                        if (drop) {
                            this.level.addItem(new Item(drop.x, drop.y, drop.type, drop.value));
                        }
                        // Victory particles
                        this.particleSystem.addBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15, 'energy');
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
                    
                    // Add boss combat effects
                    this.particleSystem.addBurst(
                        boss.x + boss.width / 2, 
                        boss.y + boss.height / 2, 
                        12, 
                        'magic'
                    );
                    
                    if (killed) {
                        this.showMessage(`${boss.bossType} defeated!`, 3000);
                        // Epic victory effect
                        this.particleSystem.addBurst(boss.x + boss.width / 2, boss.y + boss.height / 2, 25, 'energy');
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
    
    updateSoundEffects(deltaTime) {
        if (this.soundEffectTimer > 0) {
            this.soundEffectTimer -= deltaTime;
            if (this.soundEffectTimer <= 0) {
                this.currentSoundEffect = null;
            }
        }
    }
    
    playSound(soundName) {
        if (this.soundEffects[soundName]) {
            this.currentSoundEffect = this.soundEffects[soundName];
            this.soundEffectTimer = 500; // Display for 500ms
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
        this.playSound('levelComplete');
        
        // Epic completion effect
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.particleSystem.addBurst(
                    Math.random() * this.width,
                    Math.random() * this.height,
                    5,
                    'energy'
                );
            }, i * 100);
        }
        
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
        
        // Render particle effects
        this.particleSystem.render(this.ctx);
        
        // Restore context
        this.ctx.restore();
        
        // Render UI overlays with advanced HUD
        this.renderAdvancedHUD();
        this.renderUI();
    }

    renderAdvancedHUD() {
        if (!this.player) return;
        
        this.ctx.save();
        
        // Advanced HUD Background
        const hudHeight = 80;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, hudHeight);
        gradient.addColorStop(0, 'rgba(0, 20, 40, 0.95)');
        gradient.addColorStop(1, 'rgba(0, 10, 20, 0.98)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, hudHeight);
        
        // HUD Border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, hudHeight);
        
        // Heart Containers (Left side)
        this.renderHeartContainers();
        
        // Magic Meter
        this.renderMagicMeter();
        
        // Rupee Counter with animated effect
        this.renderAdvancedRupeeCounter();
        
        // Mini Map (Top Right)
        this.renderMiniMap();
        
        // Current Item (Bottom Left)
        this.renderCurrentItem();
        
        // Level Progress Bar
        this.renderLevelProgress();
        
        // Experience/Score Display
        this.renderExperienceDisplay();
        
        // Sound Effect Display
        this.renderSoundEffect();
        
        this.ctx.restore();
    }
    
    renderHeartContainers() {
        const heartSize = 16;
        const startX = 20;
        const startY = 20;
        
        for (let i = 0; i < this.player.maxHealth; i++) {
            const x = startX + (i * (heartSize + 4));
            const y = startY;
            
            // Heart container background
            this.ctx.fillStyle = '#8B0000';
            this.ctx.beginPath();
            this.ctx.arc(x + 4, y + 4, 3, 0, Math.PI, true);
            this.ctx.arc(x + 12, y + 4, 3, 0, Math.PI, true);
            this.ctx.moveTo(x + 1, y + 4);
            this.ctx.lineTo(x + 8, y + 12);
            this.ctx.lineTo(x + 15, y + 4);
            this.ctx.fill();
            
            // Filled heart if player has health
            if (i < this.player.health) {
                this.ctx.fillStyle = '#FF1493';
                this.ctx.beginPath();
                this.ctx.arc(x + 4, y + 4, 3, 0, Math.PI, true);
                this.ctx.arc(x + 12, y + 4, 3, 0, Math.PI, true);
                this.ctx.moveTo(x + 1, y + 4);
                this.ctx.lineTo(x + 8, y + 12);
                this.ctx.lineTo(x + 15, y + 4);
                this.ctx.fill();
                
                // Heart glow effect
                this.ctx.shadowColor = '#FF69B4';
                this.ctx.shadowBlur = 5;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            
            // Heart border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(x + 4, y + 4, 3, 0, Math.PI, true);
            this.ctx.arc(x + 12, y + 4, 3, 0, Math.PI, true);
            this.ctx.moveTo(x + 1, y + 4);
            this.ctx.lineTo(x + 8, y + 12);
            this.ctx.lineTo(x + 15, y + 4);
            this.ctx.stroke();
        }
    }
    
    renderMagicMeter() {
        const meterWidth = 100;
        const meterHeight = 8;
        const x = 20;
        const y = 50;
        
        // Magic meter background
        this.ctx.fillStyle = '#000080';
        this.ctx.fillRect(x, y, meterWidth, meterHeight);
        
        // Magic meter fill (simulate magic points)
        const magicPercent = 0.7; // 70% magic for demo
        this.ctx.fillStyle = '#00BFFF';
        this.ctx.fillRect(x, y, meterWidth * magicPercent, meterHeight);
        
        // Animated sparkle effect
        const time = Date.now() / 200;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time) * 0.3})`;
        this.ctx.fillRect(x + 2, y + 2, meterWidth * magicPercent - 4, meterHeight - 4);
        
        // Border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, meterWidth, meterHeight);
        
        // Label
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 10px Courier New';
        this.ctx.fillText('MAGIC', x, y - 2);
    }
    
    renderAdvancedRupeeCounter() {
        const x = this.width - 120;
        const y = 25;
        
        // Rupee icon with glow effect
        this.ctx.save();
        this.ctx.shadowColor = '#00FF00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        const centerX = x;
        const centerY = y;
        const size = 8;
        this.ctx.moveTo(centerX, centerY - size);
        this.ctx.lineTo(centerX + size, centerY);
        this.ctx.lineTo(centerX, centerY + size);
        this.ctx.lineTo(centerX - size, centerY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
        
        // Rupee count with fancy styling
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`× ${this.player.rupees}`, x + 15, y + 5);
        
        // Add outline to text
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(`× ${this.player.rupees}`, x + 15, y + 5);
        this.ctx.fillText(`× ${this.player.rupees}`, x + 15, y + 5);
    }
    
    renderMiniMap() {
        const mapSize = 60;
        const x = this.width - mapSize - 10;
        const y = 10;
        
        // Mini map background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, mapSize, mapSize);
        
        // Map border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, mapSize, mapSize);
        
        // Draw simplified level layout
        if (this.level) {
            const scale = mapSize / (this.level.width * this.level.tileSize);
            
            // Draw walls on minimap
            this.ctx.fillStyle = '#666666';
            for (let ty = 0; ty < this.level.height; ty++) {
                for (let tx = 0; tx < this.level.width; tx++) {
                    if (this.level.getTile(tx, ty) === this.level.tileTypes.WALL) {
                        this.ctx.fillRect(
                            x + tx * this.level.tileSize * scale,
                            y + ty * this.level.tileSize * scale,
                            this.level.tileSize * scale,
                            this.level.tileSize * scale
                        );
                    }
                }
            }
            
            // Draw player position
            if (this.player) {
                this.ctx.fillStyle = '#FF0000';
                const playerMapX = x + (this.player.x * scale);
                const playerMapY = y + (this.player.y * scale);
                this.ctx.fillRect(playerMapX - 1, playerMapY - 1, 3, 3);
                
                // Player pulse effect
                const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5;
                this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
                this.ctx.fillRect(playerMapX - 2, playerMapY - 2, 5, 5);
            }
            
            // Draw enemies on minimap
            this.ctx.fillStyle = '#FF4444';
            this.level.enemies.forEach(enemy => {
                if (enemy.isAlive) {
                    const enemyMapX = x + (enemy.x * scale);
                    const enemyMapY = y + (enemy.y * scale);
                    this.ctx.fillRect(enemyMapX, enemyMapY, 2, 2);
                }
            });
        }
        
        // Map label
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 8px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('MAP', x + mapSize/2, y + mapSize + 10);
    }
    
    renderCurrentItem() {
        const itemSize = 24;
        const x = 150;
        const y = 35;
        
        // Item slot background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, itemSize, itemSize);
        
        // Item slot border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, itemSize, itemSize);
        
        // Draw current item (sword for demo)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(x + 8, y + 4, 3, 16);
        this.ctx.fillRect(x + 6, y + 20, 7, 2);
        
        // Item glow effect
        this.ctx.shadowColor = '#FFFFFF';
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(x + 8, y + 4, 3, 16);
        this.ctx.shadowBlur = 0;
        
        // Label
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 8px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SWORD', x + itemSize/2, y + itemSize + 10);
    }
    
    renderLevelProgress() {
        const barWidth = 200;
        const barHeight = 6;
        const x = (this.width - barWidth) / 2;
        const y = 65;
        
        // Progress bar background
        this.ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Calculate progress (enemies defeated / total enemies)
        let totalEnemies = this.level ? this.level.enemies.length : 1;
        let defeatedEnemies = this.level ? this.level.enemies.filter(e => !e.isAlive).length : 0;
        if (this.level && this.level.boss && !this.level.boss.isAlive) defeatedEnemies++;
        if (this.level && this.level.boss) totalEnemies++;
        
        const progress = totalEnemies > 0 ? defeatedEnemies / totalEnemies : 0;
        
        // Progress fill with gradient
        const gradient = this.ctx.createLinearGradient(x, y, x + barWidth * progress, y);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        // Progress bar border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Progress text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 10px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LEVEL PROGRESS: ${Math.floor(progress * 100)}%`, x + barWidth/2, y - 2);
    }
    
    renderExperienceDisplay() {
        const x = this.width - 180;
        const y = 55;
        
        // Experience points (simulated)
        const exp = this.completedLevels.length * 1000 + (this.player ? this.player.rupees * 10 : 0);
        
        // EXP label and value
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = 'bold 12px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`EXP: ${exp}`, x, y);
        
        // Add glow effect
        this.ctx.shadowColor = '#00FF00';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(`EXP: ${exp}`, x, y);
        this.ctx.shadowBlur = 0;
    }
    
    renderSoundEffect() {
        if (this.currentSoundEffect) {
            const x = this.width / 2;
            const y = 25;
            
            // Sound effect bubble
            this.ctx.save();
            this.ctx.globalAlpha = Math.min(1, this.soundEffectTimer / 200);
            
            // Background circle
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Sound effect emoji
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(this.currentSoundEffect, x, y + 8);
            
            this.ctx.restore();
        }
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
        
        // Render advanced pause screen with menu options
        if (this.state === 'paused') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 30, 60, 0.95)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Pause menu background
            const menuWidth = 300;
            const menuHeight = 200;
            const menuX = (this.width - menuWidth) / 2;
            const menuY = (this.height - menuHeight) / 2;
            
            // Menu background with gradient
            const gradient = this.ctx.createLinearGradient(menuX, menuY, menuX, menuY + menuHeight);
            gradient.addColorStop(0, 'rgba(0, 50, 100, 0.9)');
            gradient.addColorStop(1, 'rgba(0, 20, 60, 0.9)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
            
            // Menu border
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
            
            // Title
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 28px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('GAME PAUSED', this.width / 2, menuY + 40);
            this.ctx.fillText('GAME PAUSED', this.width / 2, menuY + 40);
            
            // Menu options
            const menuOptions = [
                '↵ Resume Game',
                '🎮 Controls',
                '📊 Statistics',
                '🔊 Audio: ON'
            ];
            
            this.ctx.font = '16px Courier New';
            this.ctx.fillStyle = '#D3D3D3';
            menuOptions.forEach((option, index) => {
                this.ctx.fillText(option, this.width / 2, menuY + 80 + (index * 25));
            });
            
            // Controls hint
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '14px Courier New';
            this.ctx.fillText('Press ESC to resume', this.width / 2, menuY + menuHeight - 20);
            
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