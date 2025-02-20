import { Middleware } from "polymatic";
import { MainContext } from "./Main";
import { Ball, Color } from "./Data";

/**
 * Pool table geometrical configuration (rails, pockets, etc.)
 */
export class PoolTable extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("init-table", this.initTable);
    this.on("init-balls", this.initBalls);
    this.on("init-cue-ball", this.initCueBall);
  }

  width = 2.24;
  height = 1.12;

  ballRadius = 0.031;
  pocketRadius = 0.05;

  initTable() {
    this.context.table = {
      type: "table",
      key: "table-1",
      width: this.width,
      height: this.height,
      ballRadius: 0.03,
      pocketRadius: 0.05,
    };

    const SPI4 = Math.sin(Math.PI / 4);

    const pr = this.pocketRadius;
    const w = this.width;
    const h = this.height;
    const rw = 1.5 * pr;

    const hrail = [
      { x: pr, y: h * 0.5 },
      { x: pr, y: h * 0.5 + rw },
      { x: w * 0.5 - pr / SPI4 + rw, y: h * 0.5 + rw },
      { x: w * 0.5 - pr / SPI4, y: h * 0.5 },
    ];

    const vrail = [
      { x: w * 0.5, y: -(h * 0.5 - pr / SPI4) },
      { x: w * 0.5 + rw, y: -(h * 0.5 - pr / SPI4 + rw) },
      { x: w * 0.5 + rw, y: h * 0.5 - pr / SPI4 + rw },
      { x: w * 0.5, y: h * 0.5 - pr / SPI4 },
    ];

    this.context.rails = [
      {
        type: "rail",
        key: "rail-left",
        vertices: vrail,
      },
      {
        type: "rail",
        key: "rail-right",
        vertices: vrail.map((v) => ({ x: -v.x, y: +v.y })),
      },
      {
        type: "rail",
        key: "rail-bottom-right",
        vertices: hrail,
      },
      {
        type: "rail",
        key: "rail-bottom-left",
        vertices: hrail.map((v) => ({ x: -v.x, y: +v.y })),
      },
      {
        type: "rail",
        key: "rail-top-right",
        vertices: hrail.map((v) => ({ x: +v.x, y: -v.y })),
      },
      {
        type: "rail",
        key: "rail-top-left",
        vertices: hrail.map((v) => ({ x: -v.x, y: -v.y })),
      },
    ];

    this.context.pockets = [
      {
        type: "pocket",
        key: "pocket-top-center",
        radius: pr,
        position: { x: 0, y: -h * 0.5 - pr * 1.1 },
      },
      {
        type: "pocket",
        key: "pocket-bottom-center",
        radius: pr,
        position: { x: 0, y: +h * 0.5 + pr * 1.1 },
      },
      {
        type: "pocket",
        key: "pocket-bottom-right",
        radius: pr,
        position: { x: +w * 0.5 + pr * 0.2, y: +h * 0.5 + pr * 0.2 },
      },
      {
        type: "pocket",
        key: "pocket-bottom-left",
        radius: pr,
        position: { x: -w * 0.5 - pr * 0.2, y: +h * 0.5 + pr * 0.2 },
      },
      {
        type: "pocket",
        key: "pocket-top-right",
        radius: pr,
        position: { x: +w * 0.5 + pr * 0.2, y: -h * 0.5 - pr * 0.2 },
      },
      {
        type: "pocket",
        key: "pocket--top-left",
        radius: pr,
        position: { x: -w * 0.5 - pr * 0.2, y: -h * 0.5 - pr * 0.2 },
      },
    ];
  }

  initBalls() {
    const r = this.ballRadius;
    const cx = this.width / 4;
    const cy = 0;

    const SPI3 = Math.sin(Math.PI / 3);

    shuffleArray(Color.all);

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
          color: Color.all[balls.length],
        });
      }
    }

    balls[14].color = balls[4].color;
    balls[4].color = Color.black;

    this.context.balls = balls;

    this.initCueBall();
  }

  initCueBall() {
    this.context.balls.push({
      type: "ball",
      key: "cue-" + Math.random(),
      position: {
        x: -this.width / 4,
        y: 0,
      },

      radius: this.ballRadius,
      color: Color.white,
    });
  }
}

function shuffleArray<T>(array: T[]) {
  // http://stackoverflow.com/a/12646864/483728
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
