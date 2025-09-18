// Main entry point for the Zelda game

let game = null;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting The Legend of Zelda: A Link to the Past...');
    
    // Get the canvas element
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Could not find game canvas!');
        return;
    }
    
    // Create and start the game
    try {
        game = new Game(canvas);
        
        // Start the game loop
        requestAnimationFrame((time) => game.run(time));
        
        console.log('Game started successfully!');
        
        // Add some helpful console commands for debugging
        window.game = game; // Make game accessible from console
        
        // Add keyboard shortcut info
        console.log('Controls:');
        console.log('- WASD or Arrow Keys: Move');
        console.log('- SPACE: Attack');
        console.log('- E: Interact');
        console.log('- ESC: Pause/Menu');
        console.log('- ENTER: Toggle debug info');
        console.log('- R: Restart (when game over)');
        
    } catch (error) {
        console.error('Failed to start game:', error);
        
        // Display error message on canvas
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.font = '20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Failed to load game', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 20);
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (game && game.canvas) {
        // You could implement canvas resizing here if needed
        // For now, we'll keep the fixed size
    }
});

// Handle page visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', function() {
    if (game) {
        if (document.hidden) {
            // Page is hidden, pause the game if it's playing
            if (game.state === 'playing') {
                game.togglePause();
            }
        }
        // Note: We don't auto-resume when page becomes visible
        // to avoid surprising the player
    }
});

// Error handling
window.addEventListener('error', function(event) {
    console.error('Game error:', event.error);
    
    if (game && game.canvas) {
        const ctx = game.canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('An error occurred', game.canvas.width / 2, game.canvas.height / 2 - 10);
        ctx.fillText('Please refresh the page', game.canvas.width / 2, game.canvas.height / 2 + 10);
    }
});

// Console helper functions for debugging
if (typeof window !== 'undefined') {
    window.debugZelda = {
        // Quick level switching
        gotoLevel: (levelId) => {
            if (game && levelId >= 1 && levelId <= 12) {
                game.switchToLevel(levelId);
                console.log(`Switched to level ${levelId}`);
            } else {
                console.log('Invalid level ID. Use 1-12.');
            }
        },
        
        // Give player items
        giveItem: (itemType, amount = 1) => {
            if (game && game.player) {
                switch(itemType) {
                    case 'health':
                        game.player.heal(amount);
                        break;
                    case 'rupees':
                        game.player.addRupees(amount);
                        break;
                    case 'keys':
                        for (let i = 0; i < amount; i++) {
                            game.player.addKey();
                        }
                        break;
                    case 'bombs':
                        game.player.inventory.bombs += amount;
                        break;
                    case 'arrows':
                        game.player.inventory.arrows += amount;
                        break;
                    default:
                        game.player.addItem(itemType);
                        break;
                }
                game.updateUI();
                console.log(`Gave ${amount} ${itemType} to player`);
            }
        },
        
        // Toggle debug mode
        toggleDebug: () => {
            if (game) {
                game.showDebugInfo = !game.showDebugInfo;
                console.log(`Debug info ${game.showDebugInfo ? 'enabled' : 'disabled'}`);
            }
        },
        
        // Show all levels status
        showProgress: () => {
            if (game) {
                console.log('=== Game Progress ===');
                console.log(`Current Level: ${game.currentLevel}`);
                console.log(`Completed Levels: [${game.completedLevels.join(', ')}]`);
                console.log(`Player Health: ${game.player.health}/${game.player.maxHealth}`);
                console.log(`Player Rupees: ${game.player.rupees}`);
                console.log(`Player Keys: ${game.player.inventory.keys}`);
                console.log('====================');
            }
        },
        
        // Complete current level (for testing)
        completeLevel: () => {
            if (game && game.level && game.level.boss) {
                game.level.boss.health = 0;
                game.level.boss.die();
                console.log('Current level marked as complete');
            }
        },
        
        // Heal player
        heal: () => {
            if (game && game.player) {
                game.player.heal(game.player.maxHealth);
                game.updateUI();
                console.log('Player fully healed');
            }
        },
        
        // Show help
        help: () => {
            console.log('=== Debug Commands ===');
            console.log('debugZelda.gotoLevel(1-12) - Switch to a specific level');
            console.log('debugZelda.giveItem(type, amount) - Give items to player');
            console.log('debugZelda.toggleDebug() - Toggle debug overlay');
            console.log('debugZelda.showProgress() - Show game progress');
            console.log('debugZelda.completeLevel() - Complete current level');
            console.log('debugZelda.heal() - Heal player to full');
            console.log('debugZelda.help() - Show this help');
            console.log('======================');
        }
    };
    
    // Show help on load
    setTimeout(() => {
        console.log('Type "debugZelda.help()" in console for debug commands');
    }, 1000);
}