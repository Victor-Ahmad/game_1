// Main game script

let canvas, ctx;
let worldWidth = 3000;
let worldHeight = 3000;

// Game objects
let player;
let pellets;
let viruses;
let bots;
let miniMap;

// Camera
const camera = {
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
};

// Zoom scale
let scale = 1;

// Track the mouse position in screen coordinates
let mouseScreenX = 0;
let mouseScreenY = 0;

// Handle "game over" logic
let gameOver = false;

window.onload = function () {
  canvas = document.getElementById("canvas1");
  ctx = canvas.getContext("2d");

  resizeCanvas();
  initGame();

  // Handle resize
  window.addEventListener("resize", resizeCanvas);

  // Track mouse screen position
  canvas.addEventListener("mousemove", (e) => {
    mouseScreenX = e.clientX;
    mouseScreenY = e.clientY;
  });

  // Start game loop
  requestAnimationFrame(gameLoop);
};

function initGame() {
  gameOver = false;
  player = new Player(worldWidth, worldHeight);
  pellets = new Pellets(worldWidth, worldHeight, 400);
  viruses = new Viruses(worldWidth, worldHeight, 15);
  bots = new Bots(worldWidth, worldHeight, 15);
  miniMap = new MiniMap(worldWidth, worldHeight, 200, 200);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (miniMap) {
    miniMap.resize();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  if (gameOver) return; // Skip updates if game over

  // Convert mouse screen pos to world coordinates
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const targetWorldX = player.x + (mouseScreenX - centerX) / scale;
  const targetWorldY = player.y + (mouseScreenY - centerY) / scale;
  player.setTarget(targetWorldX, targetWorldY);

  // Update player
  player.update();

  // Adjust camera so it's centered on player
  camera.x = player.x - canvas.width / (2 * scale);
  camera.y = player.y - canvas.height / (2 * scale);

  // Adjust zoom based on player size (bigger player -> smaller scale)
  scale = Math.max(0.3, 1.5 - player.radius * 0.01);

  // Update pellets, bots, viruses (if needed)
  pellets.update();
  bots.update();
  // viruses.update(); // viruses are static, but you could call it anyway

  // Player eats pellets
  let eatenPellets = pellets.checkCollisions(player);
  if (eatenPellets > 0) {
    player.grow(eatenPellets * 0.5);
  }

  // Check collision with viruses
  let virusIndex = viruses.checkCollision(player);
  if (virusIndex >= 0) {
    // If player's bigger than virus, "pop" the player
    if (player.radius > viruses.list[virusIndex].radius) {
      player.setTargetRadius(player.radius / 2);
    }
  }

  // Bots eat pellets
  bots.list.forEach((bot) => {
    let eatenByBot = pellets.checkCollisions(bot);
    if (eatenByBot > 0) {
      bot.setTargetRadius(bot.targetRadius + eatenByBot * 0.5);
    }
  });

  // Bots and viruses
  bots.list.forEach((bot) => {
    let vIndex = viruses.checkCollision(bot);
    if (vIndex >= 0 && bot.radius > viruses.list[vIndex].radius) {
      bot.setTargetRadius(bot.radius / 2);
    }
  });

  // Player vs bots
  for (let i = bots.list.length - 1; i >= 0; i--) {
    const bot = bots.list[i];
    const distSq = (bot.x - player.x) ** 2 + (bot.y - player.y) ** 2;
    const radSum = bot.radius + player.radius;
    if (distSq < radSum * radSum) {
      // Check who is bigger
      if (player.radius > bot.radius) {
        // Player eats bot
        player.grow(bot.radius * 0.3);
        bots.list.splice(i, 1);
      } else {
        // Bot eats player -> game over
        // Instead of alert(), mark gameOver
        gameOver = true;
        return;
      }
    }
  }

  // Bot vs bot collisions
  for (let i = 0; i < bots.list.length; i++) {
    for (let j = i + 1; j < bots.list.length; j++) {
      const botA = bots.list[i];
      const botB = bots.list[j];
      const distSq = (botA.x - botB.x) ** 2 + (botA.y - botB.y) ** 2;
      const radSum = botA.radius + botB.radius;
      if (distSq < radSum * radSum) {
        // Collision: bigger one "eats" the smaller
        if (botA.radius > botB.radius) {
          botA.setTargetRadius(botA.targetRadius + botB.radius * 0.3);
          bots.list.splice(j, 1);
          j--;
        } else {
          botB.setTargetRadius(botB.targetRadius + botA.radius * 0.3);
          bots.list.splice(i, 1);
          i--;
          break;
        }
      }
    }
  }
}

function draw() {
  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fill black background
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Draw the 6×6 grid
  drawWorldGrid();

  // Draw boundary
  drawWorldBoundary();

  // Render game objects
  pellets.render(ctx, camera, scale);
  viruses.render(ctx, camera, scale);
  bots.render(ctx, camera, scale);
  player.render(ctx, camera, scale);

  // Render minimap
  miniMap.render(ctx, player, bots, pellets, viruses);

  // If game over, show overlay text
  if (gameOver) {
    drawGameOver();
  }
}

// Draw a red rectangle at the world boundary
function drawWorldBoundary() {
  ctx.save();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3 * scale;
  ctx.strokeRect(
    -camera.x * scale + camera.offsetX,
    -camera.y * scale + camera.offsetY,
    worldWidth * scale,
    worldHeight * scale
  );
  ctx.restore();
}

// Draw the 6×6 grid within the world
function drawWorldGrid() {
  const rows = 6;
  const cols = 6;
  const cellWidth = worldWidth / cols;
  const cellHeight = worldHeight / rows;

  ctx.save();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1 * scale;

  // Horizontal lines
  for (let r = 1; r < rows; r++) {
    const yPos = r * cellHeight;
    const screenY = (yPos - camera.y) * scale + camera.offsetY;
    ctx.beginPath();
    ctx.moveTo((0 - camera.x) * scale + camera.offsetX, screenY);
    ctx.lineTo((worldWidth - camera.x) * scale + camera.offsetX, screenY);
    ctx.stroke();
  }

  // Vertical lines
  for (let c = 1; c < cols; c++) {
    const xPos = c * cellWidth;
    const screenX = (xPos - camera.x) * scale + camera.offsetX;
    ctx.beginPath();
    ctx.moveTo(screenX, (0 - camera.y) * scale + camera.offsetY);
    ctx.lineTo(screenX, (worldHeight - camera.y) * scale + camera.offsetY);
    ctx.stroke();
  }

  // Label each cell: A1..A6, B1..B6, ... F6
  ctx.fillStyle = "#ffffff";
  const fontSize = 16 * scale;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellName = String.fromCharCode(65 + row) + (col + 1);
      const centerX = (col + 0.5) * cellWidth;
      const centerY = (row + 0.5) * cellHeight;
      const screenX = (centerX - camera.x) * scale + camera.offsetX;
      const screenY = (centerY - camera.y) * scale + camera.offsetY;
      ctx.fillText(cellName, screenX, screenY);
    }
  }

  ctx.restore();
}

// Simple "Game Over" text overlay
function drawGameOver() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "48px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);

  ctx.restore();
}
