// Main game script

let canvas, ctx;
let worldWidth = 3000;
let worldHeight = 3000;

// Entities
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

let scale = 1;
let mouseScreenX = 0;
let mouseScreenY = 0;
let gameOver = false;

// Score
let currentMass = 0;
let maxMass = 0;

// Timer
let timeLimit = 30 * 60 * 1000;
let startTime = 0;

// Splitting
let lastSplitTime = 0; // track time of last space press
let splitCooldown = 1000; // 1s between splits
const maxCells = 10; // can't exceed 10 sub-cells

window.onload = function () {
  canvas = document.getElementById("canvas1");
  ctx = canvas.getContext("2d");

  resizeCanvas();
  initGame();

  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("mousemove", (e) => {
    mouseScreenX = e.clientX;
    mouseScreenY = e.clientY;
  });

  // Space key => attempt split
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !gameOver) {
      const now = Date.now();
      // Check cooldown
      if (now - lastSplitTime < splitCooldown) return;
      // Check if we already have 10 sub-cells
      if (player.cells.length >= maxCells) return;

      lastSplitTime = now;

      // Convert mouse to world coords for direction
      let largest = player.getLargestCell();
      if (!largest) return;
      let centerX = canvas.width / 2;
      let centerY = canvas.height / 2;
      let worldMouseX = largest.x + (mouseScreenX - centerX) / scale;
      let worldMouseY = largest.y + (mouseScreenY - centerY) / scale;

      player.split(worldMouseX, worldMouseY);
    }
  });

  requestAnimationFrame(gameLoop);
};

function initGame() {
  gameOver = false;
  player = new Player(worldWidth, worldHeight);
  pellets = new Pellets(worldWidth, worldHeight, 400);
  viruses = new Viruses(worldWidth, worldHeight, 15);
  bots = new Bots(worldWidth, worldHeight, 15);
  miniMap = new MiniMap(worldWidth, worldHeight, 200, 200);

  currentMass = getMassFromArea(player.getTotalMass());
  maxMass = currentMass;
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
  if (gameOver) return;

  const elapsed = Date.now() - startTime;
  let timeLeft = timeLimit - elapsed;
  if (timeLeft <= 0) {
    timeLeft = 0;
    gameOver = true;
  }

  // Convert mouse coords => world coords
  let largest = player.getLargestCell();
  if (!largest) {
    // no sub-cells => game over
    gameOver = true;
    return;
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const worldMouseX = largest.x + (mouseScreenX - centerX) / scale;
  const worldMouseY = largest.y + (mouseScreenY - centerY) / scale;

  // Update player
  const halfScreenWidth = canvas.width / 2;
  player.update(halfScreenWidth, worldMouseX, worldMouseY);

  // Camera on largest cell
  camera.x = largest.x - canvas.width / (2 * scale);
  camera.y = largest.y - canvas.height / (2 * scale);

  // Scale changes with largest radius
  let largestRadius = largest.radius;
  scale = Math.max(0.3, 1.5 - largestRadius * 0.01);

  // Update pellets, bots, viruses
  pellets.update();
  bots.update();
  // viruses.update(); // static

  // Collisions for each player cell
  for (let cIndex = 0; cIndex < player.cells.length; cIndex++) {
    const cell = player.cells[cIndex];

    // Pellets
    let eatenPellets = pellets.checkCollisions(cell);
    if (eatenPellets > 0) {
      player.growCell(cell, eatenPellets * 0.5);
    }

    // Viruses
    let virusIndex = viruses.checkCollision(cell);
    if (virusIndex >= 0) {
      // If bigger => pop, remove virus
      if (cell.radius > viruses.list[virusIndex].radius) {
        cell.targetRadius = cell.radius / 2;
        viruses.list.splice(virusIndex, 1);
      }
    }

    // Bots
    for (let i = bots.list.length - 1; i >= 0; i--) {
      const bot = bots.list[i];
      const distSq = (bot.x - cell.x) ** 2 + (bot.y - cell.y) ** 2;
      const radSum = bot.radius + cell.radius;
      if (distSq < radSum * radSum) {
        // collision
        if (cell.radius > bot.radius) {
          // player cell eats bot
          player.growCell(cell, bot.radius * 0.3);
          bots.list.splice(i, 1);
        } else {
          // bot eats cell
          player.cells.splice(cIndex, 1);
          cIndex--;
          if (player.cells.length === 0) {
            gameOver = true;
            return;
          }
          break; // done with this cell
        }
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
        // bigger eats smaller
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

  // Update scoreboard mass
  currentMass = getMassFromArea(player.getTotalMass());
  if (currentMass > maxMass) maxMass = currentMass;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  drawWorldGrid();
  drawWorldBoundary();

  pellets.render(ctx, camera, scale);
  viruses.render(ctx, camera, scale);
  bots.render(ctx, camera, scale);
  player.render(ctx, camera, scale);

  miniMap.render(ctx, player);

  drawScores();
  drawTimer();

  if (gameOver) {
    drawGameOver();
  }
}

// scoreboard, timer, boundary, etc.

function drawScores() {
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Current Mass: ${Math.round(currentMass)}`, 10, 10);
  ctx.fillText(`Max Mass: ${Math.round(maxMass)}`, 10, 40);
  ctx.restore();
}

function drawTimer() {
  const elapsed = Date.now() - startTime;
  let timeLeft = timeLimit - elapsed;
  if (timeLeft < 0) timeLeft = 0;

  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  ctx.save();
  ctx.fillStyle = "#fff";
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
  ctx.fillStyle = "#fff";
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

function getMassFromArea(area) {
  // We treat 'area' directly as "mass"
  return area;
}
