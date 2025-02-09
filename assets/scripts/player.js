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

    // Player color (hue=0 => red)
    this.hue = 0;

    // Movement parameters
    this.baseMaxSpeed = 1; // base max speed
    this.accelerationFactor = 0.01;
    this.targetX = this.x;
    this.targetY = this.y;

    // Decay
    this.decayRate = 0.0005; // fraction of radius lost per second
    this.lastUpdateTime = Date.now();
  }

  update(halfScreenWidth) {
    // Smoothly interpolate radius
    this.radius += this.radiusSmoothing * (this.targetRadius - this.radius);

    // Mass decay
    const now = Date.now();
    const deltaMs = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    const deltaSec = deltaMs / 1000;
    const radiusLoss = this.radius * this.decayRate * deltaSec;
    this.setTargetRadius(this.targetRadius - radiusLoss);

    // Movement logic
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Speed depends on radius => slower if bigger
    let radiusFactor = 1 + this.radius * 0.01;
    let rawMaxSpeed = this.baseMaxSpeed / radiusFactor;

    // Limit by distance ratio
    const ratio = Math.min(distance / halfScreenWidth, 1);
    let finalSpeed = ratio * rawMaxSpeed;

    if (distance > 0.5) {
      const angle = Math.atan2(dy, dx);
      this.x +=
        Math.cos(angle) * distance * this.accelerationFactor * finalSpeed;
      this.y +=
        Math.sin(angle) * distance * this.accelerationFactor * finalSpeed;
    }

    // Boundaries (like bots)
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
