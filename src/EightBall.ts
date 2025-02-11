import { Middleware } from "polymatic";

import { Ball, Physics, Pocket, Rail } from "./Physics";
import { BilliardTableData, BLACK, WHITE } from "./Table";
import { Terminal } from "./Terminal";
import { MainContext } from "./Main";

export class EightBall extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("ball-in-pocket", this.handleBallInPocket);
    this.on("activate", this.handleActivate);

    this.use(new Physics());
    this.use(new Terminal());
  }

  handleActivate() {
    this.start();
  }

  // start a new game
  start() {
    this.context.table = new BilliardTableData();

    this.context.rails = this.context.table.getRails();
    this.context.pockets = this.context.table.getPockets();
    this.context.balls = this.context.table.rackBalls();

    this.emit("update");
  }

  // reset the cue ball
  resetCueBall() {
    this.context.balls.push(this.context.table.cueBall());

    this.emit("update");
  }

  handleBallInPocket(event: { ball: Ball; pocket: Pocket }) {
    const index = this.context.balls.indexOf(event.ball);
    if (index !== -1) this.context.balls.splice(index, 1);

    if (event.ball.color === BLACK) {
      this.context.balls = [];
      setTimeout(this.start.bind(this), 400);
    } else if (event.ball.color === WHITE) {
      setTimeout(this.resetCueBall.bind(this), 400);
    }
    this.emit("update");
  }
}
