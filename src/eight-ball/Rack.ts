import { Middleware } from "polymatic";

import { Ball, type BilliardContext } from "./BilliardContext";

/**
 * Triangular rack for European 8-ball (7 red, 7 yellow, 1 black)
 */
export class Rack extends Middleware<BilliardContext> {
  constructor() {
    super();
    this.on("rack-balls", this.handleRackBalls);
  }

  handleRackBalls() {
    const r = this.context.table.ballRadius;
    const cx = this.context.table.width / 4;
    const cy = 0;

    // European 8-ball: 7 red, 7 yellow, 1 black (center)
    // Standard triangle order (positions 0-14)
    // Back corners: one red, one yellow
    const rackColors = [
      "yellow",         // 0 (apex)
      "red", "yellow",  // 1, 2
      "yellow", "black", "red", // 3, 4, 5
      "red", "yellow", "red", "yellow", // 6, 7, 8, 9
      "yellow", "red", "yellow", "red", "yellow"  // 10, 11, 12, 13, 14
    ];

    const points = triangle(r);
    const balls = rackColors.map((color, i) =>
      new Ball(
        {
          x: cx + points[i].x + Math.random() * r * 0.02,
          y: cy + points[i].y + Math.random() * r * 0.02,
        },
        r,
        color
      )
    );

    this.context.balls = balls;
    this.emit("update");
  }
}

const triangle = (r: number) => {
  const SPI3 = Math.sin(Math.PI / 3);
  const n = 5;
  const d = r * 2;
  const l = SPI3 * d;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      points.push({
        x: i * l + Math.random() * r * 0.02,
        y: (j - i * 0.5) * d + Math.random() * r * 0.02,
      });
    }
  }
  return points;
};
