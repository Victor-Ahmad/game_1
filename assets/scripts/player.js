class Player {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Start near the center
    this.x = worldWidth / 2;
    this.y = worldHeight / 2;

    // Player radius
    this.radius = 15;
    this.targetRadius = this.radius; // smooth changes
    this.radiusSmoothing = 0.1;

    // Player color (let's pick a hue = 0 => red)
    this.hue = 0;

    // Movement parameters
    this.baseMaxSpeed = 1; // base max speed
    this.accelerationFactor = 0.01;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(halfScreenWidth) {
    // Smoothly interpolate radius
    this.radius += this.radiusSmoothing * (this.targetRadius - this.radius);

    // Distance to mouse
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Speed depends on distance from player -> mouse, up to halfScreenWidth
    // and also decreases with bigger radius
    // Example: finalMaxSpeed = baseMaxSpeed / (1 + radius*0.01)
    // Then scale it by the ratio of (distance / halfScreenWidth), capped at 1
    let radiusFactor = 1 + this.radius * 0.01;
    let rawMaxSpeed = this.baseMaxSpeed / radiusFactor;

    const ratio = Math.min(distance / halfScreenWidth, 1);
    let finalSpeed = ratio * rawMaxSpeed;

    // Move the player
    if (distance > 0.5) {
      const angle = Math.atan2(dy, dx);
      this.x +=
        Math.cos(angle) * distance * this.accelerationFactor * finalSpeed;
      this.y +=
        Math.sin(angle) * distance * this.accelerationFactor * finalSpeed;
    }

    // Keep inside world boundaries
    if (this.x < this.radius) this.x = this.radius;
    if (this.y < this.radius) this.y = this.radius;
    if (this.x > this.worldWidth - this.radius)
      this.x = this.worldWidth - this.radius;
    if (this.y > this.worldHeight - this.radius)
      this.y = this.worldHeight - this.radius;
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

    // White stroke
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Optional label
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(10, this.radius / 1.5) * scale}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOU", screenX, screenY);

    ctx.restore();
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  setTargetRadius(newRadius) {
    this.targetRadius = Math.max(0, newRadius);
  }

  grow(amount) {
    this.setTargetRadius(this.targetRadius + amount);
  }
}
