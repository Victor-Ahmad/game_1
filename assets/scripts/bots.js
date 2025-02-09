class Bot {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Random spawn
    this.x = Math.random() * worldWidth;
    this.y = Math.random() * worldHeight;

    // Bot radius
    this.radius = 15 + Math.random() * 10;
    this.targetRadius = this.radius; // for smooth growth/shrink
    this.smoothing = 0.15; // how fast to interpolate radius

    // Bot velocity / direction
    this.angle = Math.random() * 2 * Math.PI;
    this.speed = 2;
    this.color = this.getRandomColor();
  }

  getRandomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  update() {
    // Smoothly interpolate radius to targetRadius
    this.radius += this.smoothing * (this.targetRadius - this.radius);

    // Small random-walk AI
    if (Math.random() < 0.01) {
      this.angle += (Math.random() - 0.5) * 1.0;
    }

    // Move
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // Keep in bounds
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
    ctx.fillStyle = this.color;
    ctx.arc(screenX, screenY, this.radius * scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  // Called when we want the bot to grow or shrink
  setTargetRadius(newRadius) {
    this.targetRadius = newRadius;
    if (this.targetRadius < 0) {
      this.targetRadius = 0;
    }
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
