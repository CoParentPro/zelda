// Level system for the Zelda game

class Level {
    constructor(id, name, world = 'light') {
        this.id = id;
        this.name = name;
        this.world = world; // 'light' or 'dark'
        this.width = 32; // tiles
        this.height = 28; // tiles
        this.tileSize = 16;
        this.tiles = [];
        this.enemies = [];
        this.items = [];
        this.chests = [];
        this.doors = [];
        this.switches = [];
        this.boss = null;
        this.completed = false;
        this.visited = false;
        
        // Level boundaries
        this.bounds = {
            x: 0,
            y: 0,
            width: this.width * this.tileSize,
            height: this.height * this.tileSize
        };

        // Tile types
        this.tileTypes = {
            EMPTY: 0,
            WALL: 1,
            FLOOR: 2,
            WATER: 3,
            PIT: 4,
            DOOR: 5,
            LOCKED_DOOR: 6,
            STAIRS_UP: 7,
            STAIRS_DOWN: 8,
            SWITCH: 9,
            BLOCK: 10,
            SPIKES: 11
        };

        this.initializeTiles();
        this.generateLevel();
    }

    initializeTiles() {
        // Initialize empty tile grid
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = this.tileTypes.EMPTY;
            }
        }
    }

    generateLevel() {
        // Generate level based on ID and world
        switch(this.id) {
            case 1: // Eastern Palace
                this.generateEasternPalace();
                break;
            case 2: // Desert Palace
                this.generateDesertPalace();
                break;
            case 3: // Tower of Hera
                this.generateTowerOfHera();
                break;
            case 4: // Palace of Darkness
                this.generatePalaceOfDarkness();
                break;
            case 5: // Swamp Palace
                this.generateSwampPalace();
                break;
            case 6: // Skull Woods
                this.generateSkullWoods();
                break;
            case 7: // Thieves' Town
                this.generateThievesTown();
                break;
            case 8: // Ice Palace
                this.generateIcePalace();
                break;
            case 9: // Misery Mire
                this.generateMiseryMire();
                break;
            case 10: // Turtle Rock
                this.generateTurtleRock();
                break;
            case 11: // Ganon's Tower
                this.generateGanonsTower();
                break;
            case 12: // Final Boss Area
                this.generateFinalBoss();
                break;
            default:
                this.generateDefaultLevel();
                break;
        }
    }

    generateEasternPalace() {
        // Create a simple dungeon layout
        this.fillBorder();
        this.createRooms();
        
        // Add entrance
        this.setTile(16, 26, this.tileTypes.DOOR);
        
        // Add some enemies - placed away from spawn area
        this.addEnemy(new Enemy(300, 150, 'soldier')); // Right side
        this.addEnemy(new Enemy(350, 200, 'soldier')); // Right side
        this.addEnemy(new Enemy(250, 100, 'archer'));   // Top area
        
        // Add items
        this.addChest(new Chest(250, 100, { type: 'key', value: 1 }));
        this.addChest(new Chest(400, 300, { type: 'map' }));
        this.addItem(new Item(180, 200, 'rupee')); // Near spawn but safe
        
        // Add boss
        this.boss = new BossEnemy(300, 80, 'eastern_palace');
    }

    generateDesertPalace() {
        this.fillBorder();
        this.createRooms();
        
        // Desert theme - add sand pits and different enemies
        this.addRandomPits(8);
        
        this.addEnemy(new Enemy(180, 120, 'soldier'));
        this.addEnemy(new Enemy(320, 180, 'wizard'));
        this.addEnemy(new Enemy(200, 280, 'archer'));
        this.addEnemy(new Enemy(350, 250, 'soldier'));
        
        this.addChest(new Chest(150, 150, { type: 'compass' }));
        this.addChest(new Chest(380, 120, { type: 'big_key' }, true));
        this.addItem(new Item(250, 200, 'rupee_blue'));
        
        this.boss = new BossEnemy(280, 60, 'desert_palace');
    }

    generateTowerOfHera() {
        this.fillBorder();
        this.createTowerLayout();
        
        // Tower has multiple levels connected by stairs
        this.setTile(8, 20, this.tileTypes.STAIRS_UP);
        this.setTile(24, 8, this.tileTypes.STAIRS_UP);
        
        this.addEnemy(new Enemy(160, 200, 'wizard'));
        this.addEnemy(new Enemy(280, 160, 'wizard'));
        this.addEnemy(new Enemy(220, 280, 'archer'));
        
        this.addChest(new Chest(200, 320, { type: 'heart_container' }, true));
        this.addItem(new Item(320, 280, 'rupee_red'));
        
        this.boss = new BossEnemy(260, 80, 'tower_hera');
    }

    generatePalaceOfDarkness() {
        this.fillBorder();
        this.createDarkRooms();
        
        // Dark world - more enemies, different layout
        this.addEnemy(new Enemy(150, 150, 'wizard'));
        this.addEnemy(new Enemy(250, 120, 'soldier'));
        this.addEnemy(new Enemy(350, 180, 'wizard'));
        this.addEnemy(new Enemy(180, 250, 'archer'));
        this.addEnemy(new Enemy(320, 280, 'soldier'));
        
        this.boss = new BossEnemy(290, 70, 'palace_darkness');
    }

    generateSwampPalace() {
        this.fillBorder();
        this.createSwampLayout();
        this.addRandomWater(12);
        
        this.addEnemy(new Enemy(200, 180, 'soldier'));
        this.addEnemy(new Enemy(300, 220, 'wizard'));
        this.addEnemy(new Enemy(160, 280, 'archer'));
        
        this.boss = new BossEnemy(270, 90, 'swamp_palace');
    }

    generateSkullWoods() {
        this.fillBorder();
        this.createForestLayout();
        
        // More complex enemy patterns
        for (let i = 0; i < 6; i++) {
            const x = 100 + Math.random() * 300;
            const y = 100 + Math.random() * 250;
            this.addEnemy(new Enemy(x, y, ['soldier', 'archer', 'wizard'][i % 3]));
        }
        
        this.boss = new BossEnemy(280, 80, 'skull_woods');
    }

    generateThievesTown() {
        this.fillBorder();
        this.createTownLayout();
        
        // Thieves theme
        for (let i = 0; i < 5; i++) {
            const x = 120 + Math.random() * 280;
            const y = 120 + Math.random() * 220;
            this.addEnemy(new Enemy(x, y, 'archer'));
        }
        
        this.boss = new BossEnemy(300, 90, 'thieves_town');
    }

    generateIcePalace() {
        this.fillBorder();
        this.createIceLayout();
        
        // Ice theme enemies
        for (let i = 0; i < 4; i++) {
            const x = 140 + Math.random() * 240;
            const y = 140 + Math.random() * 200;
            this.addEnemy(new Enemy(x, y, 'wizard'));
        }
        
        this.boss = new BossEnemy(280, 100, 'ice_palace');
    }

    generateMiseryMire() {
        this.fillBorder();
        this.createMireLayout();
        
        // Swamp/mire enemies
        for (let i = 0; i < 7; i++) {
            const x = 100 + Math.random() * 320;
            const y = 100 + Math.random() * 280;
            this.addEnemy(new Enemy(x, y, ['soldier', 'wizard'][i % 2]));
        }
        
        this.boss = new BossEnemy(290, 80, 'misery_mire');
    }

    generateTurtleRock() {
        this.fillBorder();
        this.createRockLayout();
        
        // Rock/cave enemies
        for (let i = 0; i < 5; i++) {
            const x = 120 + Math.random() * 280;
            const y = 120 + Math.random() * 240;
            this.addEnemy(new Enemy(x, y, 'soldier'));
        }
        
        this.boss = new BossEnemy(280, 90, 'turtle_rock');
    }

    generateGanonsTower() {
        this.fillBorder();
        this.createTowerLayout();
        
        // Ganon's tower - most difficult
        for (let i = 0; i < 8; i++) {
            const x = 100 + Math.random() * 320;
            const y = 100 + Math.random() * 280;
            this.addEnemy(new Enemy(x, y, ['wizard', 'soldier'][i % 2]));
        }
        
        this.boss = new BossEnemy(290, 70, 'ganons_tower');
    }

    generateFinalBoss() {
        this.fillBorder();
        this.createBossArena();
        
        // Final boss area
        this.boss = new BossEnemy(250, 150, 'ganon');
        this.boss.health = 50;
        this.boss.maxHealth = 50;
    }

    generateDefaultLevel() {
        this.fillBorder();
        this.createRooms();
        
        this.addEnemy(new Enemy(200, 200, 'soldier'));
        this.addItem(new Item(300, 150, 'rupee'));
    }

    // Layout helper methods
    fillBorder() {
        for (let x = 0; x < this.width; x++) {
            this.setTile(x, 0, this.tileTypes.WALL);
            this.setTile(x, this.height - 1, this.tileTypes.WALL);
        }
        for (let y = 0; y < this.height; y++) {
            this.setTile(0, y, this.tileTypes.WALL);
            this.setTile(this.width - 1, y, this.tileTypes.WALL);
        }
    }

    createRooms() {
        // Fill with floor
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                this.setTile(x, y, this.tileTypes.FLOOR);
            }
        }
        
        // Add some internal walls for room structure
        this.createRoomWalls();
    }

    createRoomWalls() {
        // Create a simple cross pattern
        const midX = Math.floor(this.width / 2);
        const midY = Math.floor(this.height / 2);
        
        // Horizontal wall with gaps
        for (let x = 4; x < this.width - 4; x++) {
            if (x < midX - 2 || x > midX + 2) {
                this.setTile(x, midY, this.tileTypes.WALL);
            }
        }
        
        // Vertical wall with gaps
        for (let y = 4; y < this.height - 4; y++) {
            if (y < midY - 2 || y > midY + 2) {
                this.setTile(midX, y, this.tileTypes.WALL);
            }
        }
    }

    createTowerLayout() {
        this.createRooms();
        // Towers have more vertical structure
        for (let y = 8; y < 20; y += 4) {
            for (let x = 8; x < 24; x += 8) {
                this.setTile(x, y, this.tileTypes.WALL);
                this.setTile(x + 1, y, this.tileTypes.WALL);
            }
        }
    }

    createDarkRooms() {
        this.createRooms();
        // Add more walls and complexity for dark world
        this.addRandomWalls(15);
    }

    createSwampLayout() {
        this.createRooms();
        // Swamp has water areas
    }

    createForestLayout() {
        this.createRooms();
        // Forest has scattered obstacles
        this.addRandomWalls(20);
    }

    createTownLayout() {
        this.createRooms();
        // Town layout with building-like structures
        this.createBuildings();
    }

    createIceLayout() {
        this.createRooms();
        // Ice palace might have slippery areas
    }

    createMireLayout() {
        this.createRooms();
        this.addRandomWater(10);
        this.addRandomPits(5);
    }

    createRockLayout() {
        this.createRooms();
        this.addRandomWalls(25);
    }

    createBossArena() {
        // Simple large open area for final boss
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                this.setTile(x, y, this.tileTypes.FLOOR);
            }
        }
    }

    createBuildings() {
        // Create building-like structures
        const buildings = [
            {x: 4, y: 4, w: 6, h: 8},
            {x: 22, y: 4, w: 6, h: 8},
            {x: 4, y: 16, w: 6, h: 8},
            {x: 22, y: 16, w: 6, h: 8}
        ];
        
        buildings.forEach(building => {
            for (let y = building.y; y < building.y + building.h; y++) {
                for (let x = building.x; x < building.x + building.w; x++) {
                    if (x === building.x || x === building.x + building.w - 1 ||
                        y === building.y || y === building.y + building.h - 1) {
                        this.setTile(x, y, this.tileTypes.WALL);
                    }
                }
            }
        });
    }

    addRandomWalls(count) {
        for (let i = 0; i < count; i++) {
            const x = 2 + Math.floor(Math.random() * (this.width - 4));
            const y = 2 + Math.floor(Math.random() * (this.height - 4));
            this.setTile(x, y, this.tileTypes.WALL);
        }
    }

    addRandomWater(count) {
        for (let i = 0; i < count; i++) {
            const x = 2 + Math.floor(Math.random() * (this.width - 4));
            const y = 2 + Math.floor(Math.random() * (this.height - 4));
            this.setTile(x, y, this.tileTypes.WATER);
        }
    }

    addRandomPits(count) {
        for (let i = 0; i < count; i++) {
            const x = 2 + Math.floor(Math.random() * (this.width - 4));
            const y = 2 + Math.floor(Math.random() * (this.height - 4));
            this.setTile(x, y, this.tileTypes.PIT);
        }
    }

    setTile(x, y, tileType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = tileType;
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return this.tileTypes.WALL;
    }

    isPassable(worldX, worldY, width, height) {
        // Check if a rectangle area is passable
        const startTileX = Math.floor(worldX / this.tileSize);
        const startTileY = Math.floor(worldY / this.tileSize);
        const endTileX = Math.floor((worldX + width - 1) / this.tileSize);
        const endTileY = Math.floor((worldY + height - 1) / this.tileSize);
        
        for (let ty = startTileY; ty <= endTileY; ty++) {
            for (let tx = startTileX; tx <= endTileX; tx++) {
                const tile = this.getTile(tx, ty);
                if (tile === this.tileTypes.WALL || 
                    tile === this.tileTypes.WATER || 
                    tile === this.tileTypes.PIT) {
                    return false;
                }
            }
        }
        return true;
    }

    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    addItem(item) {
        this.items.push(item);
    }

    addChest(chest) {
        this.chests.push(chest);
    }

    update(deltaTime, player) {
        this.visited = true;
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.update(deltaTime, player, this);
            }
        });
        
        // Update items
        this.items.forEach(item => {
            item.update(deltaTime);
        });
        
        // Update chests
        this.chests.forEach(chest => {
            chest.update(deltaTime);
        });
        
        // Update boss
        if (this.boss && this.boss.isAlive) {
            this.boss.update(deltaTime, player, this);
        }
        
        // Check if level is completed
        if (this.boss && !this.boss.isAlive && !this.completed) {
            this.completed = true;
            // Add completion reward
            this.addItem(new Item(this.boss.x, this.boss.y, 'heart_container'));
        }
    }

    render(ctx) {
        // Render tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.renderTile(ctx, x, y, this.tiles[y][x]);
            }
        }
        
        // Add dynamic lighting overlay
        this.renderDynamicLighting(ctx);
        
        // Render chests
        this.chests.forEach(chest => {
            chest.render(ctx);
        });
        
        // Render items
        this.items.forEach(item => {
            item.render(ctx);
        });
        
        // Render enemies
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.render(ctx);
            }
        });
        
        // Render boss
        if (this.boss && this.boss.isAlive) {
            this.boss.render(ctx);
        }
    }
    
    renderDynamicLighting(ctx) {
        if (this.world === 'dark') {
            // Create darkness overlay for dark world
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(60, 20, 80, 0.7)';
            ctx.fillRect(0, 0, this.bounds.width, this.bounds.height);
            ctx.restore();
            
            // Add light sources around player and torches
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            
            // Player light
            const playerLight = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
            playerLight.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
            playerLight.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = playerLight;
            
            // Light sources at various points
            const lightSources = [
                { x: 200, y: 150 },
                { x: 400, y: 300 },
                { x: 300, y: 200 }
            ];
            
            lightSources.forEach(light => {
                const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 80);
                gradient.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(light.x, light.y, 80, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
        }
    }

    renderTile(ctx, tileX, tileY, tileType) {
        const worldX = tileX * this.tileSize;
        const worldY = tileY * this.tileSize;
        const size = this.tileSize;
        
        ctx.imageSmoothingEnabled = false;
        
        switch(tileType) {
            case this.tileTypes.FLOOR:
                this.renderFloor(ctx, worldX, worldY, size);
                break;
            case this.tileTypes.WALL:
                this.renderWall(ctx, worldX, worldY, size);
                break;
            case this.tileTypes.WATER:
                this.renderWater(ctx, worldX, worldY, size);
                break;
            case this.tileTypes.PIT:
                this.renderPit(ctx, worldX, worldY, size);
                break;
            case this.tileTypes.DOOR:
                this.renderDoor(ctx, worldX, worldY, size);
                break;
            case this.tileTypes.LOCKED_DOOR:
                this.renderLockedDoor(ctx, worldX, worldY, size);
                break;
            case this.tileTypes.EMPTY:
                this.renderEmpty(ctx, worldX, worldY, size);
                break;
        }
    }

    renderFloor(ctx, x, y, size) {
        // Zelda-style stone floor with pattern
        const baseColor = this.world === 'dark' ? '#4A4A4A' : '#D3D3D3';
        const darkColor = this.world === 'dark' ? '#2F2F2F' : '#B8B8B8';
        const lightColor = this.world === 'dark' ? '#5F5F5F' : '#E8E8E8';
        
        // Base floor
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, size, size);
        
        // Stone pattern - checkered effect
        ctx.fillStyle = darkColor;
        if ((Math.floor(x/size) + Math.floor(y/size)) % 2 === 0) {
            ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        }
        
        // Highlight edges
        ctx.fillStyle = lightColor;
        ctx.fillRect(x, y, size, 1);
        ctx.fillRect(x, y, 1, size);
        
        // Shadow edges
        ctx.fillStyle = darkColor;
        ctx.fillRect(x, y + size - 1, size, 1);
        ctx.fillRect(x + size - 1, y, 1, size);
    }

    renderWall(ctx, x, y, size) {
        // Zelda-style dungeon wall
        const baseColor = this.world === 'dark' ? '#663366' : '#8B7D6B';
        const darkColor = this.world === 'dark' ? '#441144' : '#5D4E37';
        const lightColor = this.world === 'dark' ? '#885588' : '#A0916F';
        
        // Base wall
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, size, size);
        
        // Stone blocks pattern
        ctx.fillStyle = darkColor;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Highlight
        ctx.fillStyle = lightColor;
        ctx.fillRect(x, y, size, 2);
        ctx.fillRect(x, y, 2, size);
        
        // Inner highlight
        ctx.fillStyle = lightColor;
        ctx.fillRect(x + 3, y + 3, size - 6, 1);
        ctx.fillRect(x + 3, y + 3, 1, size - 6);
        
        // Shadow
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y + size - 1, size, 1);
        ctx.fillRect(x + size - 1, y, 1, size);
    }

    renderWater(ctx, x, y, size) {
        // Animated water effect
        const time = Date.now() / 500;
        const wave = Math.sin(time + x/20 + y/20) * 0.1 + 0.9;
        
        // Base water
        ctx.fillStyle = `rgba(0, 102, 204, ${wave})`;
        ctx.fillRect(x, y, size, size);
        
        // Water ripples
        ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
        const rippleOffset = Math.sin(time + x/10) * 2;
        ctx.fillRect(x + rippleOffset, y + size/4, size - Math.abs(rippleOffset), 2);
        ctx.fillRect(x + rippleOffset, y + 3*size/4, size - Math.abs(rippleOffset), 2);
        
        // Border
        ctx.strokeStyle = '#0055AA';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
    }

    renderPit(ctx, x, y, size) {
        // Dark pit with gradient effect
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, size, size);
        
        // Gradient effect
        const gradient = ctx.createRadialGradient(
            x + size/2, y + size/2, 0,
            x + size/2, y + size/2, size/2
        );
        gradient.addColorStop(0, 'rgba(64, 64, 64, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size, size);
        
        // Dark border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
    }

    renderDoor(ctx, x, y, size) {
        // Wooden door
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, size, size);
        
        // Wood grain
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + size - 4, y + size/2 - 1, 2, 2);
        
        // Door frame
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
    }

    renderLockedDoor(ctx, x, y, size) {
        this.renderDoor(ctx, x, y, size);
        
        // Lock symbol
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + size/2 - 2, y + size/2 - 2, 4, 4);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + size/2 - 1, y + size/2 - 1, 2, 2);
    }

    renderEmpty(ctx, x, y, size) {
        // Dark void
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, size, size);
    }

    getBounds() {
        return this.bounds;
    }

    getSpawnPoint() {
        // Return a safe spawn point for the player
        return {
            x: 8 * this.tileSize, // Left side, away from enemies
            y: (this.height - 5) * this.tileSize // Near bottom but not at edge
        };
    }
}