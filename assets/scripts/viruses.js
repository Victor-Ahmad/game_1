class Viruses {
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
      this.list.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        radius: 40 + Math.random() * 15,
        // Let's make viruses always appear greenish hue ~120
        hue: 120,
      });
    }
  }

  update() {
    // Viruses do not move
  }

  render(ctx, camera, scale) {
    ctx.save();
    this.list.forEach((virus) => {
      const screenX = (virus.x - camera.x) * scale + camera.offsetX;
      const screenY = (virus.y - camera.y) * scale + camera.offsetY;
      ctx.beginPath();
      this.drawSpikyCircle(ctx, screenX, screenY, virus.radius * scale, 20);
      const color = `hsl(${virus.hue}, 100%, 50%)`;
      ctx.fillStyle = color;
      ctx.fill();
    });
    ctx.restore();
  }

  drawSpikyCircle(ctx, x, y, radius, spikes) {
    const step = Math.PI / spikes;
    let rot = (Math.PI / 2) * 3;
    let outerRadius = radius;
    let innerRadius = radius * 0.8;

    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
      const mx = x + Math.cos(rot) * outerRadius;
      const my = y + Math.sin(rot) * outerRadius;
      ctx.lineTo(mx, my);
      rot += step;

      const mx2 = x + Math.cos(rot) * innerRadius;
      const my2 = y + Math.sin(rot) * innerRadius;
      ctx.lineTo(mx2, my2);
      rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
  }

  checkCollision(entity) {
    // Return index of virus if collision, else -1
    for (let i = 0; i < this.list.length; i++) {
      const virus = this.list[i];
      const distSq = (virus.x - entity.x) ** 2 + (virus.y - entity.y) ** 2;
      const radSum = entity.radius + virus.radius;

      if (distSq < radSum * radSum) {
        return i;
      }
    }
    return -1;
  }
}
