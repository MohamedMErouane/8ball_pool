import { Middleware } from "polymatic";

import { Color, Ball, type BilliardContext } from "./BilliardContext";

/**
 * 8-ball rules and gameplay.
 */
export class EightBall1P extends Middleware<BilliardContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("game-start", this.handleInitGame);
    this.on("shot-end", this.handleShotEnd);
  }

  handleActivate() {
    this.emit("init-table");
    this.emit("rack-balls");
  }

  handleInitGame() {
    this.emit("init-cue-ball");
  }

  handleShotEnd = (data: { pocketed: Ball[] }) => {
    const isCueBall = data.pocketed.some((ball) => ball.color === Color.white);
    const isEightBall = data.pocketed.some((ball) => ball.color === Color.black);

    if (isEightBall) {
      this.context.gameOver = true;
      this.emit("game-over");
    } else if (isCueBall) {
      setTimeout(() => this.emit("init-cue-ball"), 400);
    }
    this.emit("update");
  };
}
