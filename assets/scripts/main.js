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

// Handle "game over"
let gameOver = false;

// Scores
let currentMass = 0;
let maxMass = 0;

// Timer (countdown from 30:00 => 1800 seconds)
let timeLimit = 30 * 60 * 1000; // in ms
let startTime = 0; // set on init

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

  // Reset mass scores
  currentMass = getMassFromRadius(player.radius);
  maxMass = currentMass;

  // Reset timer
  startTime = Date.now();
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
  if (gameOver) return; // stop updates if game is over

  // Countdown logic
  const elapsed = Date.now() - startTime;
  let timeLeft = timeLimit - elapsed;
  if (timeLeft <= 0) {
    timeLeft = 0;
    // Times up => game over
    gameOver = true;
  }

  // Convert mouse coords => world coords
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const targetWorldX = player.x + (mouseScreenX - centerX) / scale;
  const targetWorldY = player.y + (mouseScreenY - centerY) / scale;
  player.setTarget(targetWorldX, targetWorldY);

  // Update player with half screen width as the speed-limiting circle
  const halfScreenWidth = canvas.width / 2;
  player.update(halfScreenWidth);

  // Adjust camera to center on player
  camera.x = player.x - canvas.width / (2 * scale);
  camera.y = player.y - canvas.height / (2 * scale);

  // Zoom scales with player size
  scale = Math.max(0.3, 1.5 - player.radius * 0.01);

  // Update pellets, bots, viruses
  pellets.update();
  bots.update();
  // viruses.update() is empty

  // Player eats pellets
  let eatenPellets = pellets.checkCollisions(player);
  if (eatenPellets > 0) {
    player.grow(eatenPellets * 0.5);
  }

  // Check collision with viruses
  let virusIndex = viruses.checkCollision(player);
  if (virusIndex >= 0) {
    if (player.radius > viruses.list[virusIndex].radius) {
      // pop player
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

  // Bots vs viruses
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
      if (player.radius > bot.radius) {
        // Player eats bot
        player.grow(bot.radius * 0.3);
        bots.list.splice(i, 1);
      } else {
        // Bot eats player => game over
        gameOver = true;
        break;
      }
    }
  }

  // Bot vs bot
  for (let i = 0; i < bots.list.length; i++) {
    for (let j = i + 1; j < bots.list.length; j++) {
      const botA = bots.list[i];
      const botB = bots.list[j];
      const distSq = (botA.x - botB.x) ** 2 + (botA.y - botB.y) ** 2;
      const radSum = botA.radius + botB.radius;
      if (distSq < radSum * radSum) {
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

  // Update current mass and max mass
  currentMass = getMassFromRadius(player.radius);
  if (currentMass > maxMass) maxMass = currentMass;
}

function draw() {
  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fill background
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  drawWorldGrid();
  drawWorldBoundary();

  // Render game objects
  pellets.render(ctx, camera, scale);
  viruses.render(ctx, camera, scale);
  bots.render(ctx, camera, scale);
  player.render(ctx, camera, scale);

  // Render minimap (only shows player & cell names)
  miniMap.render(ctx, player);

  // Draw scores at top-left
  drawScores();

  // Draw countdown at top-center
  drawTimer();

  // If game over, show overlay
  if (gameOver) {
    drawGameOver();
  }
}

// Helpers

function drawScores() {
  // Current mass + highest mass at top-left
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Current Mass: ${Math.round(currentMass)}`, 10, 10);
  ctx.fillText(`Max Mass: ${Math.round(maxMass)}`, 10, 40);
  ctx.restore();
}

function drawTimer() {
  // Show countdown from 30:00 at top center
  const elapsed = Date.now() - startTime;
  let timeLeft = timeLimit - elapsed;
  if (timeLeft < 0) timeLeft = 0;

  // Convert ms -> mm:ss
  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const timeStr = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(timeStr, canvas.width / 2, 10);
  ctx.restore();
}

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

  // Label cells: A1..F6
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

function getMassFromRadius(radius) {
  // Simple approach: area = π * r^2
  return Math.PI * radius * radius;
}
