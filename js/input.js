// Enhanced input manager for 3D first-person/third-person controls
class InputManager {
    constructor(canvas) {
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            locked: false
        };
        
        this.canvas = canvas;
        
        // Key mappings (enhanced for 3D)
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
            'ShiftLeft': 'run',
            'ShiftRight': 'run',
            'Enter': 'start',
            'Escape': 'menu',
            
            // 3D specific
            'KeyC': 'crouch',
            'KeyF': 'flashlight',
            'KeyR': 'reload'
        };

        // Mouse sensitivity for camera control
        this.mouseSensitivity = 0.002;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            const action = this.keyMap[e.code];
            if (action && !this.keys[action]) {
                this.keysJustPressed[action] = true;
            }
            if (action) {
                this.keys[action] = true;
            }
            
            // Prevent browser shortcuts for game keys
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            const action = this.keyMap[e.code];
            if (action) {
                this.keys[action] = false;
                this.keysJustReleased[action] = true;
            }
        });

        // Enhanced mouse controls for 3D camera
        if (this.canvas) {
            this.canvas.addEventListener('click', () => {
                this.requestPointerLock();
            });

            document.addEventListener('pointerlockchange', () => {
                this.mouse.locked = document.pointerLockElement === this.canvas;
            });

            document.addEventListener('mousemove', (event) => {
                if (this.mouse.locked) {
                    this.mouse.deltaX = event.movementX * this.mouseSensitivity;
                    this.mouse.deltaY = event.movementY * this.mouseSensitivity;
                }
            });

            // Prevent context menu
            this.canvas.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
        }
    }

    requestPointerLock() {
        if (this.canvas) {
            this.canvas.requestPointerLock();
        }
    }

    update() {
        // Clear just pressed/released states
        this.keysJustPressed = {};
        this.keysJustReleased = {};
    }

    // Legacy compatibility methods
    isKeyDown(action) {
        return !!this.keys[action];
    }

    wasKeyJustPressed(action) {
        return !!this.keysJustPressed[action];
    }

    wasKeyJustReleased(action) {
        return !!this.keysJustReleased[action];
    }

    // 3D Movement controls
    isMovingForward() {
        return this.keys['up'];
    }

    isMovingBackward() {
        return this.keys['down'];
    }

    isMovingLeft() {
        return this.keys['left'];
    }

    isMovingRight() {
        return this.keys['right'];
    }

    isRunning() {
        return this.keys['run'];
    }

    isAttacking() {
        return this.keys['attack'];
    }

    isCrouching() {
        return this.keys['crouch'];
    }

    // Camera mouse look
    getMouseDelta() {
        const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }

    isMouseLocked() {
        return this.mouse.locked;
    }

    // 2D Legacy compatibility
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

    // Alternative interface for backward compatibility
    isKeyPressed(key) {
        const actionMap = {
            'up': 'up',
            'down': 'down', 
            'left': 'left',
            'right': 'right',
            'attack': 'attack',
            'interact': 'interact',
            'menu': 'menu',
            'start': 'start'
        };
        
        const action = actionMap[key] || key;
        return this.isKeyDown(action);
    }
}