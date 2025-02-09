class MiniMap {
  constructor(worldWidth, worldHeight, width = 200, height = 200) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.width = width;
    this.height = height;

    // Position in bottom-right corner
    this.x = window.innerWidth - this.width - 20;
    this.y = window.innerHeight - this.height - 20;
  }

  resize() {
    // Called on window resize
    this.x = window.innerWidth - this.width - 20;
    this.y = window.innerHeight - this.height - 20;
  }

  render(ctx, player, bots, pellets, viruses) {
    ctx.save();

    // 1) Minimap background
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.globalAlpha = 1.0;

    // 2) Red boundary (world boundary representation)
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // 3) 6×6 grid
    const rows = 6;
    const cols = 6;
    const cellWidth = this.width / cols;
    const cellHeight = this.height / rows;

    // Grid lines
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    // Horizontal lines
    for (let r = 1; r < rows; r++) {
      const lineY = this.y + r * cellHeight;
      ctx.beginPath();
      ctx.moveTo(this.x, lineY);
      ctx.lineTo(this.x + this.width, lineY);
      ctx.stroke();
    }
    // Vertical lines
    for (let c = 1; c < cols; c++) {
      const lineX = this.x + c * cellWidth;
      ctx.beginPath();
      ctx.moveTo(lineX, this.y);
      ctx.lineTo(lineX, this.y + this.height);
      ctx.stroke();
    }

    // Labels (A1..A6, B1..B6, ... F6)
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellName = String.fromCharCode(65 + row) + (col + 1);
        const centerX = this.x + (col + 0.5) * cellWidth;
        const centerY = this.y + (row + 0.5) * cellHeight;
        ctx.fillText(cellName, centerX, centerY);
      }
    }

    // 4) Pellets
    ctx.fillStyle = "#ccc";
    pellets.list.forEach((p) => {
      const px = this.x + (p.x / this.worldWidth) * this.width;
      const py = this.y + (p.y / this.worldHeight) * this.height;
      ctx.fillRect(px, py, 1, 1);
    });

    // 5) Viruses
    ctx.fillStyle = "#39a85a";
    viruses.list.forEach((v) => {
      const vx = this.x + (v.x / this.worldWidth) * this.width;
      const vy = this.y + (v.y / this.worldHeight) * this.height;
      ctx.beginPath();
      ctx.arc(vx, vy, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 6) Bots
    ctx.fillStyle = "#dddd00";
    bots.list.forEach((b) => {
      const bx = this.x + (b.x / this.worldWidth) * this.width;
      const by = this.y + (b.y / this.worldHeight) * this.height;
      ctx.beginPath();
      ctx.arc(bx, by, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 7) Player
    ctx.fillStyle = "#ff3b3b";
    const px = this.x + (player.x / this.worldWidth) * this.width;
    const py = this.y + (player.y / this.worldHeight) * this.height;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }
}
