import { Middleware } from "polymatic";

import { Color, Ball, Pocket, type BilliardContext } from "./Data";

/**
 * 8-ball rules and gameplay.
 */
export class EightBall extends Middleware<BilliardContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("ball-in-pocket", this.handleBallInPocket);
    this.on("cue-shot", this.handleCueShot);
  }

  handleActivate() {
    this.emit("init-table");
    this.emit("init-balls");
  }

  handleCueShot() {
    this.emit("next-turn");
  }

  handleBallInPocket(event: { ball: Ball; pocket: Pocket }) {
    const index = this.context.balls.indexOf(event.ball);
    if (index !== -1) this.context.balls.splice(index, 1);

    if (event.ball.color === Color.black) {
      this.context.balls.length = 0;
      setTimeout(() => this.emit("init-balls"), 400);
    } else if (event.ball.color === Color.white) {
      setTimeout(() => this.emit("init-cue-ball"), 400);
    }
    this.emit("update");
  }
}
