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
    this.x = window.innerWidth - this.width - 20;
    this.y = window.innerHeight - this.height - 20;
  }

  render(ctx, player) {
    ctx.save();

    // Dark background
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.globalAlpha = 1.0;

    // 6×6 grid lines
    const rows = 6;
    const cols = 6;
    const cellWidth = this.width / cols;
    const cellHeight = this.height / rows;

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

    // Cell names (A1..F6)
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

    // Only the player dot
    const px = this.x + (player.x / this.worldWidth) * this.width;
    const py = this.y + (player.y / this.worldHeight) * this.height;
    ctx.fillStyle = `hsl(${player.hue}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }
}
