import { Middleware } from "polymatic";

import { Color, Ball, type BilliardContext, Table, Rail, Pocket } from "./Data";

/**
 * Pool table geometrical configuration (rails, pockets, etc.)
 */
export class PoolTable extends Middleware<BilliardContext> {
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
    const table = new Table();
    table.width = this.width;
    table.height = this.height;
    table.ballRadius = this.ballRadius;
    table.pocketRadius = this.pocketRadius;

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

    const rails = [];
    // rail-left
    rails.push(new Rail(vrail));
    // rail-right
    rails.push(new Rail(vrail.map((v) => ({ x: -v.x, y: +v.y }))));
    // rail-bottom-right
    rails.push(new Rail(hrail));
    // rail-bottom-left
    rails.push(new Rail(hrail.map((v) => ({ x: -v.x, y: +v.y }))));
    // rail-top-right
    rails.push(new Rail(hrail.map((v) => ({ x: +v.x, y: -v.y }))));
    // rail-top-left
    rails.push(new Rail(hrail.map((v) => ({ x: -v.x, y: -v.y }))));

    const pockets = [];
    // pocket-top-center
    pockets.push(new Pocket(pr, { x: 0, y: -h * 0.5 - pr * 1.1 }));
    //pocket-bottom-center
    pockets.push(new Pocket(pr, { x: 0, y: +h * 0.5 + pr * 1.1 }));
    //pocket-bottom-right
    pockets.push(new Pocket(pr, { x: +w * 0.5 + pr * 0.2, y: +h * 0.5 + pr * 0.2 }));
    //pocket-bottom-left
    pockets.push(new Pocket(pr, { x: -w * 0.5 - pr * 0.2, y: +h * 0.5 + pr * 0.2 }));
    //pocket-top-right
    pockets.push(new Pocket(pr, { x: +w * 0.5 + pr * 0.2, y: -h * 0.5 - pr * 0.2 }));
    //pocket--top-left
    pockets.push(new Pocket(pr, { x: -w * 0.5 - pr * 0.2, y: -h * 0.5 - pr * 0.2 }));

    this.context.table = table;
    this.context.rails = rails;
    this.context.pockets = pockets;
  }

  initBalls() {
    const r = this.ballRadius;
    const cx = this.width / 4;
    const cy = 0;

    const SPI3 = Math.sin(Math.PI / 3);

    const colors = [...Color.all].sort((a, b) => 0.5 - Math.random());
    colors.splice(4, 0, Color.black);

    const balls = [];

    const n = 5;
    const d = r * 2;
    const l = SPI3 * d;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        balls.push(
          new Ball(
            {
              x: cx + i * l /*- (n - 1) * 0.5 * l*/ + Math.random() * r * 0.02,
              y: cy + (j - i * 0.5) * d + Math.random() * r * 0.02,
            },
            this.ballRadius,
            colors.shift()
          )
        );
      }
    }

    this.context.balls = balls;

    this.initCueBall();
  }

  initCueBall() {
    this.context.balls.push(
      new Ball(
        {
          x: -this.width / 4,
          y: 0,
        },
        this.ballRadius,
        Color.white
      )
    );
  }
}
