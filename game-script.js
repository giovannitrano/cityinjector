const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const gravity = 0.6;
const friction = 0.8;
let score = 0;
let lives = 3;
let gameOver = false;
let levelComplete = false;

// Player object
const player = {
    x: 50,
    y: 400,
    width: 30,
    height: 40,
    velocityY: 0,
    velocityX: 0,
    speed: 5,
    jumpPower: 12,
    isJumping: false,
    color: '#ff0000'
};

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Platform class
class Platform {
    constructor(x, y, width, height, color = '#8B4513') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Add border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    collidesWith(obj) {
        return obj.x < this.x + this.width &&
               obj.x + obj.width > this.x &&
               obj.y + obj.height >= this.y &&
               obj.y + obj.height <= this.y + this.height + 10 &&
               obj.velocityY >= 0;
    }
}

// Coin class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.collected = false;
    }

    draw() {
        if (this.collected) return;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    collidesWith(obj) {
        return !this.collected &&
               obj.x < this.x + this.width &&
               obj.x + obj.width > this.x &&
               obj.y < this.y + this.height &&
               obj.y + obj.height > this.y;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, width = 30, height = 30) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 2;
        this.minX = x - 100;
        this.maxX = x + 100;
        this.color = '#00AA00';
    }

    update() {
        this.x += this.velocityX;
        if (this.x <= this.minX || this.x >= this.maxX) {
            this.velocityX *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
        ctx.fillRect(this.x + 16, this.y + 8, 6, 6);
    }

    collidesWith(obj) {
        return obj.x < this.x + this.width &&
               obj.x + obj.width > this.x &&
               obj.y < this.y + this.height &&
               obj.y + obj.height > this.y;
    }
}

// Goal flag
class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 60;
    }

    draw() {
        // Pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 8, this.y, 4, this.height);
        // Flag
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y + 10);
        ctx.lineTo(this.x + 12, this.y + 30);
        ctx.lineTo(this.x + 32, this.y + 20);
        ctx.closePath();
        ctx.fill();
    }

    collidesWith(obj) {
        return obj.x < this.x + this.width + 20 &&
               obj.x + obj.width > this.x &&
               obj.y < this.y + this.height &&
               obj.y + obj.height > this.y;
    }
}

// Initialize level
let platforms = [];
let coins = [];
let enemies = [];
let goal = null;

function initLevel() {
    platforms = [
        // Ground
        new Platform(0, 550, 800, 50, '#228B22'),
        // Level platforms
        new Platform(150, 480, 150, 20),
        new Platform(400, 430, 150, 20),
        new Platform(250, 350, 150, 20),
        new Platform(550, 380, 150, 20),
        new Platform(200, 250, 200, 20),
        new Platform(500, 280, 200, 20),
        new Platform(300, 150, 200, 20),
    ];

    coins = [
        new Coin(200, 450),
        new Coin(450, 400),
        new Coin(300, 320),
        new Coin(600, 350),
        new Coin(250, 220),
        new Coin(550, 250),
        new Coin(350, 120),
    ];

    enemies = [
        new Enemy(450, 390),
        new Enemy(300, 310),
        new Enemy(600, 340),
    ];

    goal = new Goal(700, 470);
    gameOver = false;
    levelComplete = false;
}

// Update player
function updatePlayer() {
    // Horizontal movement
    if (keys['a'] || keys['ArrowLeft']) {
        player.velocityX = -player.speed;
    } else if (keys['d'] || keys['ArrowRight']) {
        player.velocityX = player.speed;
    } else {
        player.velocityX *= friction;
    }

    player.x += player.velocityX;

    // Boundary check
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Apply gravity
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Jump
    if ((keys[' '] || keys['w'] || keys['ArrowUp']) && !player.isJumping) {
        player.velocityY = -player.jumpPower;
        player.isJumping = true;
    }

    // Platform collision
    let onPlatform = false;
    platforms.forEach(platform => {
        if (platform.collidesWith(player)) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            onPlatform = true;
        }
    });

    // Fall detection
    if (player.y > canvas.height) {
        loseLife();
    }

    // Coin collection
    coins.forEach(coin => {
        if (coin.collidesWith(player)) {
            coin.collected = true;
            score += 10;
        }
    });

    // Enemy collision
    enemies.forEach(enemy => {
        if (enemy.collidesWith(player)) {
            loseLife();
        }
    });

    // Goal collision
    if (goal.collidesWith(player)) {
        levelComplete = true;
        score += 100;
    }
}

// Update enemies
function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.update();
    });
}

// Draw player
function drawPlayer() {
    // Body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Head
    ctx.fillRect(player.x + 5, player.y - 15, 20, 15);
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 8, player.y - 12, 4, 4);
    ctx.fillRect(player.x + 18, player.y - 12, 4, 4);
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    platforms.forEach(platform => platform.draw());

    // Draw coins
    coins.forEach(coin => coin.draw());

    // Draw enemies
    enemies.forEach(enemy => enemy.draw());

    // Draw goal
    goal.draw();

    // Draw player
    drawPlayer();

    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;

    // Game status
    const statusEl = document.getElementById('gameStatus');
    if (gameOver) {
        statusEl.textContent = 'GAME OVER! Refresh to restart.';
    } else if (levelComplete) {
        statusEl.textContent = 'LEVEL COMPLETE! Refresh to play again.';
    } else {
        statusEl.textContent = '';
    }
}

// Lose life
function loseLife() {
    lives--;
    if (lives <= 0) {
        gameOver = true;
    } else {
        // Reset player position
        player.x = 50;
        player.y = 400;
        player.velocityY = 0;
        player.velocityX = 0;
        player.isJumping = false;
    }
}

// Game loop
function gameLoop() {
    if (!gameOver && !levelComplete) {
        updatePlayer();
        updateEnemies();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
initLevel();
gameLoop();