class Bot {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Random spawn
    this.x = Math.random() * worldWidth;
    this.y = Math.random() * worldHeight;

    // Bot radius
    this.radius = 15 + Math.random() * 10;
    this.targetRadius = this.radius; // for smooth changes
    this.smoothing = 0.15;

    // Use HSL with random hue for bots
    this.hue = Math.floor(Math.random() * 360);

    // Movement
    this.angle = Math.random() * 2 * Math.PI;
    this.baseMaxSpeed = 2; // "base" top speed
    // We'll store any mass decay logic in `update()` calls
    this.decayRate = 0.001; // fraction of radius to lose per second
    this.lastUpdateTime = Date.now();
  }

  update() {
    // Smooth radius
    this.radius += this.smoothing * (this.targetRadius - this.radius);

    // Mass decay
    // We'll decay radius by (decayRate * (deltaTime in seconds) * radius)
    const now = Date.now();
    const deltaMs = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    const deltaSec = deltaMs / 1000;
    const radiusLoss = this.radius * this.decayRate * deltaSec;
    this.setTargetRadius(this.targetRadius - radiusLoss);

    // Speed depends on radius
    let finalMaxSpeed = this.baseMaxSpeed / (1 + this.radius * 0.01);

    // Random-walk AI
    if (Math.random() < 0.01) {
      this.angle += (Math.random() - 0.5) * 1.0;
    }

    // Move
    this.x += Math.cos(this.angle) * finalMaxSpeed;
    this.y += Math.sin(this.angle) * finalMaxSpeed;

    // Boundaries (no radius check, just clamp 0..worldWidth)
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x > this.worldWidth) this.x = this.worldWidth;
    if (this.y > this.worldHeight) this.y = this.worldHeight;
  }

  render(ctx, camera, scale) {
    ctx.save();
    const screenX = (this.x - camera.x) * scale + camera.offsetX;
    const screenY = (this.y - camera.y) * scale + camera.offsetY;
    ctx.beginPath();
    const color = `hsl(${this.hue}, 100%, 50%)`;
    ctx.fillStyle = color;
    ctx.arc(screenX, screenY, this.radius * scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  setTargetRadius(newRadius) {
    this.targetRadius = Math.max(0, newRadius);
  }
}

class Bots {
  constructor(worldWidth, worldHeight, count = 10) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.count = count;
    this.list = [];

    this.init();
  }

  init() {
    this.list = [];
    for (let i = 0; i < this.count; i++) {
      this.list.push(new Bot(this.worldWidth, this.worldHeight));
    }
  }

  update() {
    this.list.forEach((bot) => bot.update());
  }

  render(ctx, camera, scale) {
    this.list.forEach((bot) => bot.render(ctx, camera, scale));
  }
}
