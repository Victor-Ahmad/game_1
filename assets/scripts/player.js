class Player {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Start near the center
    this.x = worldWidth / 2;
    this.y = worldHeight / 2;

    // Player radius
    this.radius = 15;
    this.targetRadius = this.radius; // for smooth growth/shrink
    this.radiusSmoothing = 0.1; // how fast we interpolate radius

    this.color = "#ff3b3b";

    // Movement parameters
    this.maxSpeed = 1;
    this.accelerationFactor = 0.01;

    this.targetX = this.x;
    this.targetY = this.y;
  }

  update() {
    // Smoothly interpolate radius to targetRadius
    this.radius += this.radiusSmoothing * (this.targetRadius - this.radius);

    // Move continuously toward (this.targetX, this.targetY)
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.5) {
      const actualMaxSpeed = Math.max(0.3, this.maxSpeed - this.radius * 0.01);
      const angle = Math.atan2(dy, dx);
      // Move fractionally to smoothly approach
      this.x +=
        Math.cos(angle) * distance * this.accelerationFactor * actualMaxSpeed;
      this.y +=
        Math.sin(angle) * distance * this.accelerationFactor * actualMaxSpeed;
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
    ctx.arc(screenX, screenY, this.radius * scale, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
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

  // Setting target coordinates for movement
  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  // Set the new target radius for the player
  setTargetRadius(newRadius) {
    this.targetRadius = newRadius;
    if (this.targetRadius < 0) {
      this.targetRadius = 0;
    }
  }

  grow(amount) {
    // Increase target radius by 'amount'
    this.setTargetRadius(this.targetRadius + amount);
  }
}
