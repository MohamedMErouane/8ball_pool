import { Ball, Pocket, Rail } from "./Physics";
import { Util } from "./Util";

export const STYLES = {
  "black": { fill: "#000000", stroke: "#ffffff" },
  "white": { fill: "#ffffff", stroke: "#000000" },
  "yellow-solid": { fill: "#ffdd00", stroke: "#000000" },
  "yellow-stripe": { fill: "#ffdd00", stroke: "#ffffff" },
  "red-solid": { fill: "#ff3300", stroke: "#000000" },
  "red-stripe": { fill: "#ff3300", stroke: "#ffffff" },
  "burgundy-solid": { fill: "#662200", stroke: "#000000" },
  "burgundy-stripe": { fill: "#662200", stroke: "#ffffff" },
  "orange-solid": { fill: "#ff8800", stroke: "#000000" },
  "orange-stripe": { fill: "#ff8800", stroke: "#ffffff" },
  "green-solid": { fill: "#00bb11", stroke: "#000000" },
  "green-stripe": { fill: "#00bb11", stroke: "#ffffff" },
  "purple-solid": { fill: "#9900ff", stroke: "#000000" },
  "purple-stripe": { fill: "#9900ff", stroke: "#ffffff" },
  "blue-solid": { fill: "#0077ff", stroke: "#000000" },
  "blue-stripe": { fill: "#0077ff", stroke: "#ffffff" },
};

export const BLACK = "black";
export const WHITE = "white";
export const COLORS = [
  "yellow-solid",
  "yellow-stripe",
  "red-solid",
  "red-stripe",
  "burgundy-solid",
  "burgundy-stripe",
  "orange-solid",
  "orange-stripe",
  "green-solid",
  "green-stripe",
  "purple-solid",
  "purple-stripe",
  "blue-solid",
  "blue-stripe",
];

// table data
export class BilliardTableData {
  tableWidth = 8.0;
  tableHeight = 4.0;

  ballRadius = 0.12;
  pocketRadius = 0.2;

  getRails(): Rail[] {
    const SPI4 = Math.sin(Math.PI / 4);

    const topLeftRail = [
      {
        x: this.pocketRadius,
        y: this.tableHeight * 0.5,
      },
      {
        x: this.pocketRadius,
        y: this.tableHeight * 0.5 + this.pocketRadius,
      },
      {
        x: this.tableWidth * 0.5 - this.pocketRadius / SPI4 + this.pocketRadius,
        y: this.tableHeight * 0.5 + this.pocketRadius,
      },
      {
        x: this.tableWidth * 0.5 - this.pocketRadius / SPI4,
        y: this.tableHeight * 0.5,
      },
    ];

    const leftRail = [
      {
        x: this.tableWidth * 0.5,
        y: -(this.tableHeight * 0.5 - this.pocketRadius / SPI4),
      },
      {
        x: this.tableWidth * 0.5 + this.pocketRadius,
        y: -(this.tableHeight * 0.5 - this.pocketRadius / SPI4 + this.pocketRadius),
      },
      {
        x: this.tableWidth * 0.5 + this.pocketRadius,
        y: this.tableHeight * 0.5 - this.pocketRadius / SPI4 + this.pocketRadius,
      },
      {
        x: this.tableWidth * 0.5,
        y: this.tableHeight * 0.5 - this.pocketRadius / SPI4,
      },
    ];
    return [
      {
        type: "rail",
        key: "rail-1",
        vertices: leftRail,
      },
      {
        type: "rail",
        key: "rail-2",
        vertices: leftRail.map((v) => ({ x: -v.x, y: +v.y })),
      },
      {
        type: "rail",
        key: "rail-3",
        vertices: topLeftRail,
      },
      {
        type: "rail",
        key: "rail-4",
        vertices: topLeftRail.map((v) => ({ x: -v.x, y: +v.y })),
      },
      {
        type: "rail",
        key: "rail-5",
        vertices: topLeftRail.map((v) => ({ x: +v.x, y: -v.y })),
      },
      {
        type: "rail",
        key: "rail-6",
        vertices: topLeftRail.map((v) => ({ x: -v.x, y: -v.y })),
      },
    ];
  }

  getPockets(): Pocket[] {
    return [
      {
        type: "pocket",
        key: "pocket-1",
        radius: this.pocketRadius,
        position: {
          x: 0,
          y: -this.tableHeight * 0.5 - this.pocketRadius * 1.5,
        },
      },
      {
        type: "pocket",
        key: "pocket-2",
        radius: this.pocketRadius,
        position: {
          x: 0,
          y: +this.tableHeight * 0.5 + this.pocketRadius * 1.5,
        },
      },
      {
        type: "pocket",
        key: "pocket-3",
        radius: this.pocketRadius,
        position: {
          x: +this.tableWidth * 0.5 + this.pocketRadius * 0.7,
          y: +this.tableHeight * 0.5 + this.pocketRadius * 0.7,
        },
      },
      {
        type: "pocket",
        key: "pocket-4",
        radius: this.pocketRadius,
        position: {
          x: -this.tableWidth * 0.5 - this.pocketRadius * 0.7,
          y: +this.tableHeight * 0.5 + this.pocketRadius * 0.7,
        },
      },
      {
        type: "pocket",
        key: "pocket-5",
        radius: this.pocketRadius,
        position: {
          x: +this.tableWidth * 0.5 + this.pocketRadius * 0.7,
          y: -this.tableHeight * 0.5 - this.pocketRadius * 0.7,
        },
      },
      {
        type: "pocket",
        key: "pocket-6",
        radius: this.pocketRadius,
        position: {
          x: -this.tableWidth * 0.5 - this.pocketRadius * 0.7,
          y: -this.tableHeight * 0.5 - this.pocketRadius * 0.7,
        },
      },
    ];
  }

  rackBalls() {
    const r = this.ballRadius;
    const cx = this.tableWidth / 4;
    const cy = 0;

    const SPI3 = Math.sin(Math.PI / 3);

    Util.shuffleArray(COLORS);

    const n = 5;
    const balls: Ball[] = [];
    const d = r * 2;
    const l = SPI3 * d;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        balls.push({
          type: "ball",
          key: "ball-" + Math.random(),
          position: {
            x: cx + i * l /*- (n - 1) * 0.5 * l*/ + Math.random() * r * 0.02,
            y: cy + (j - i * 0.5) * d + Math.random() * r * 0.02,
          },
          radius: this.ballRadius,
          color: COLORS[balls.length],
        });
      }
    }

    balls[14].color = balls[4].color;
    balls[4].color = BLACK;

    balls.push(this.cueBall());

    return balls;
  }

  cueBall(): Ball {
    return {
      type: "ball",
      key: "ball-" + Math.random(),
      position: {
        x: -this.tableWidth / 4,
        y: 0,
      },

      radius: this.ballRadius,
      color: WHITE,
    };
  }
}
