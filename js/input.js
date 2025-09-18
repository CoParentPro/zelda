// Input handling for the Zelda game

class InputManager {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        
        // Key mappings
        this.keyMap = {
            // Movement
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            
            // Actions
            'Space': 'attack',
            'KeyE': 'interact',
            'KeyQ': 'item',
            'KeyX': 'run',
            'Enter': 'start',
            'Escape': 'menu'
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            const action = this.keyMap[e.code];
            if (action && !this.keys[action]) {
                this.keysJustPressed[action] = true;
            }
            if (action) {
                this.keys[action] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            e.preventDefault();
            const action = this.keyMap[e.code];
            if (action) {
                this.keys[action] = false;
                this.keysJustReleased[action] = true;
            }
        });

        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    update() {
        // Clear just pressed/released states
        this.keysJustPressed = {};
        this.keysJustReleased = {};
    }

    isKeyDown(action) {
        return !!this.keys[action];
    }

    wasKeyJustPressed(action) {
        return !!this.keysJustPressed[action];
    }

    wasKeyJustReleased(action) {
        return !!this.keysJustReleased[action];
    }

    getMovementDirection() {
        let x = 0;
        let y = 0;

        if (this.isKeyDown('left')) x -= 1;
        if (this.isKeyDown('right')) x += 1;
        if (this.isKeyDown('up')) y -= 1;
        if (this.isKeyDown('down')) y += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return { x, y };
    }

    getLastDirection() {
        if (this.wasKeyJustPressed('up') || this.isKeyDown('up')) return 'UP';
        if (this.wasKeyJustPressed('down') || this.isKeyDown('down')) return 'DOWN';
        if (this.wasKeyJustPressed('left') || this.isKeyDown('left')) return 'LEFT';
        if (this.wasKeyJustPressed('right') || this.isKeyDown('right')) return 'RIGHT';
        return null;
    }
}