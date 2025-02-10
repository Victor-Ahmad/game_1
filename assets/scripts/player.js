class Player {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Single hue for all sub-cells
    this.hue = 0; // red
    this.baseMaxSpeed = 1; // normal speed scaling
    this.accelerationFactor = 0.01;

    // Decay
    this.decayRate = 0.0005; // fraction of radius lost per second

    // The player's sub-cells
    this.cells = [];

    // Create a single cell initially
    const initialRadius = 15;
    this.cells.push(
      this.createCell(worldWidth / 2, worldHeight / 2, initialRadius)
    );
  }

  createCell(x, y, radius) {
    const now = Date.now();
    return {
      x,
      y,
      radius,
      targetRadius: radius,
      vx: 0,
      vy: 0,
      hue: this.hue,
      mergeTimer: now + 15000, // can't merge for 15s after creation
      lastUpdateTime: now,
      // friction for after splitting ejection
      friction: 0.85,
    };
  }

  update(halfScreenWidth, mouseX, mouseY) {
    // Move & update each cell
    for (let cell of this.cells) {
      const now = Date.now();
      const deltaMs = now - cell.lastUpdateTime;
      cell.lastUpdateTime = now;

      // 1) Smooth radius changes
      cell.radius += 0.1 * (cell.targetRadius - cell.radius);

      // 2) Mass decay
      const deltaSec = deltaMs / 1000;
      const radiusLoss = cell.radius * this.decayRate * deltaSec;
      cell.targetRadius = Math.max(0, cell.targetRadius - radiusLoss);

      // 3) Move cell by its current velocity (if it was just split)
      cell.x += cell.vx;
      cell.y += cell.vy;

      // Apply friction to that velocity
      cell.vx *= cell.friction;
      cell.vy *= cell.friction;

      // 4) Then also move cell toward mouse
      //    Speed is limited by cell radius
      const dx = mouseX - cell.x;
      const dy = mouseY - cell.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Speed is inversely proportional to radius
      let radiusFactor = 1 + cell.radius * 0.01;
      let rawMaxSpeed = this.baseMaxSpeed / radiusFactor;

      // If dist is bigger than halfScreenWidth, it won't go faster
      const ratio = Math.min(dist / halfScreenWidth, 1);
      let finalSpeed = ratio * rawMaxSpeed;

      if (dist > 0.5) {
        const angle = Math.atan2(dy, dx);
        cell.x += Math.cos(angle) * dist * this.accelerationFactor * finalSpeed;
        cell.y += Math.sin(angle) * dist * this.accelerationFactor * finalSpeed;
      }

      // 5) Clamp boundaries
      if (cell.x < 0) cell.x = 0;
      if (cell.y < 0) cell.y = 0;
      if (cell.x > this.worldWidth) cell.x = this.worldWidth;
      if (cell.y > this.worldHeight) cell.y = this.worldHeight;
    }

    // Next step: prevent overlap if not mergeable
    this.preventOverlapIfNoMerge();

    // Finally, handle merges (if mergeTimers are expired & overlapping)
    this.handleMerges();
  }

  // If two cells overlap but are NOT allowed to merge yet, push them apart.
  preventOverlapIfNoMerge() {
    const now = Date.now();
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const c1 = this.cells[i];
        const c2 = this.cells[j];

        // Are they able to merge? (both have mergeTimer < now)
        const canMerge = c1.mergeTimer < now && c2.mergeTimer < now;

        // Calculate overlap
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const distSq = dx * dx + dy * dy;
        const rSum = c1.radius + c2.radius;

        if (distSq < rSum * rSum) {
          // Overlap
          const dist = Math.sqrt(distSq) || 0.0001; // avoid /0
          if (!canMerge) {
            // Push them apart
            const overlap = (rSum - dist) / 2;
            // Move each cell proportionally away from each other
            const nx = dx / dist;
            const ny = dy / dist;
            // c2 moves out
            c2.x += nx * overlap;
            c2.y += ny * overlap;
            // c1 moves opposite
            c1.x -= nx * overlap;
            c1.y -= ny * overlap;
          }
        }
      }
    }
  }

  handleMerges() {
    const now = Date.now();
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const c1 = this.cells[i];
        const c2 = this.cells[j];

        // Both must be merge-eligible
        if (c1.mergeTimer > now || c2.mergeTimer > now) {
          continue;
        }

        // Check overlap
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distSq = dx * dx + dy * dy;
        const radSum = c1.radius + c2.radius;
        if (distSq < radSum * radSum) {
          // Merge
          const area1 = Math.PI * c1.radius * c1.radius;
          const area2 = Math.PI * c2.radius * c2.radius;
          const total = area1 + area2;
          const newRadius = Math.sqrt(total / Math.PI);
          // Weighted center
          const centerX = (c1.x * area1 + c2.x * area2) / total;
          const centerY = (c1.y * area1 + c2.y * area2) / total;

          c1.x = centerX;
          c1.y = centerY;
          c1.radius = newRadius;
          c1.targetRadius = newRadius;
          c1.mergeTimer = now + 5000; // new cooldown
          // remove c2
          this.cells.splice(j, 1);
          j--;
        }
      }
    }
  }

  render(ctx, camera, scale) {
    ctx.save();
    for (let cell of this.cells) {
      const screenX = (cell.x - camera.x) * scale + camera.offsetX;
      const screenY = (cell.y - camera.y) * scale + camera.offsetY;
      ctx.beginPath();
      ctx.fillStyle = `hsl(${cell.hue}, 100%, 50%)`;
      ctx.arc(screenX, screenY, cell.radius * scale, 0, 2 * Math.PI);
      ctx.fill();

      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
    ctx.restore();

    // Label the largest cell "YOU"
    let largest = this.getLargestCell();
    if (largest) {
      ctx.save();
      const sx = (largest.x - camera.x) * scale + camera.offsetX;
      const sy = (largest.y - camera.y) * scale + camera.offsetY;
      ctx.fillStyle = "#fff";
      ctx.font = `${Math.max(10, largest.radius / 1.5) * scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("YOU", sx, sy);
      ctx.restore();
    }
  }

  // Attempt to split on space press
  // We'll handle maximum sub‑cells and a separate space cooldown in main.js
  split(mouseX, mouseY) {
    // Find largest cell
    let largestIndex = -1;
    let largestArea = -1;
    for (let i = 0; i < this.cells.length; i++) {
      const area = Math.PI * this.cells[i].radius * this.cells[i].radius;
      if (area > largestArea) {
        largestArea = area;
        largestIndex = i;
      }
    }
    if (largestIndex === -1) return;

    const cell = this.cells[largestIndex];
    if (largestArea < 1000) {
      // not large enough to bother
      return;
    }

    // Halve mass
    const newArea = largestArea / 2;
    const newRadius = Math.sqrt(newArea / Math.PI);

    cell.radius = newRadius;
    cell.targetRadius = newRadius;
    // new cooldown for merging
    cell.mergeTimer = Date.now() + 15000;

    // create new cell for the other half
    const newCell = this.createCell(cell.x, cell.y, newRadius);
    // Eject it toward the mouse
    const dx = mouseX - cell.x;
    const dy = mouseY - cell.y;
    const angle = Math.atan2(dy, dx);
    const pushSpeed = 15; // initial velocity
    newCell.vx = Math.cos(angle) * pushSpeed;
    newCell.vy = Math.sin(angle) * pushSpeed;

    this.cells.push(newCell);
  }

  getLargestCell() {
    if (!this.cells.length) return null;
    let largest = this.cells[0];
    let largestArea = Math.PI * largest.radius * largest.radius;
    for (let i = 1; i < this.cells.length; i++) {
      let area = Math.PI * this.cells[i].radius * this.cells[i].radius;
      if (area > largestArea) {
        largest = this.cells[i];
        largestArea = area;
      }
    }
    return largest;
  }

  // Add mass to a specific cell
  growCell(cell, amount) {
    cell.targetRadius += amount;
  }

  // Sum of areas
  getTotalMass() {
    let totalArea = 0;
    for (let c of this.cells) {
      totalArea += Math.PI * c.radius * c.radius;
    }
    return totalArea;
  }
}
