class Pellets {
  constructor(worldWidth, worldHeight, count = 300) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.count = count;
    this.list = [];

    this.init();
  }

  init() {
    this.list = [];
    for (let i = 0; i < this.count; i++) {
      this.list.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        radius: 3,
        hue: Math.floor(Math.random() * 360), // HSL hue
      });
    }
  }

  update() {
    // Pellets are static
  }

  render(ctx, camera, scale) {
    ctx.save();
    this.list.forEach((pellet) => {
      const screenX = (pellet.x - camera.x) * scale + camera.offsetX;
      const screenY = (pellet.y - camera.y) * scale + camera.offsetY;
      ctx.beginPath();
      ctx.fillStyle = `hsl(${pellet.hue}, 100%, 50%)`;
      ctx.arc(screenX, screenY, pellet.radius * scale, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.restore();
  }

  checkCollisions(entity) {
    // 'entity' can be a single cell or multi-cells, so we handle that in main
    // Typically, we'll pass each cell to checkCollisions.
    let eatenCount = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const pellet = this.list[i];
      const distSq = (pellet.x - entity.x) ** 2 + (pellet.y - entity.y) ** 2;
      const radSum = entity.radius + pellet.radius;
      if (distSq < radSum * radSum) {
        eatenCount++;
        this.list.splice(i, 1);
      }
    }
    return eatenCount;
  }
}
