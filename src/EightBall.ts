import { Middleware } from "polymatic";

import { Ball, Pocket, Color } from "./Data";
import { MainContext } from "./Main";

/**
 * 8-ball rules and gameplay.
 */
export class EightBall extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("ball-in-pocket", this.handleBallInPocket);
  }

  handleActivate() {
    this.emit("init-table");
    this.emit("init-balls");
  }

  handleBallInPocket(event: { ball: Ball; pocket: Pocket }) {
    const index = this.context.balls.indexOf(event.ball);
    if (index !== -1) this.context.balls.splice(index, 1);

    if (event.ball.color ===Color. black) {
      this.context.balls = [];
      setTimeout(() => this.emit("init-balls"), 400);
    } else if (event.ball.color === Color.white) {
      setTimeout(() => this.emit("init-cue-ball"), 400);
    }
    this.emit("update");
  }
}
