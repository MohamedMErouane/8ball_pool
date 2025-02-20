import { Middleware } from "polymatic";

import { MainContext } from "./Main";
import { CueStick, Point } from "./Data";

/**
 * Implements cue stick shot. It listens to user pointer input events from Terminal, and updates the cue object in the context, and sends cue-shot events.
 */
export class CueShot extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("user-pointer-start", this.handlePointerStart);
    this.on("user-pointer-move", this.handlePointerMove);
    this.on("user-pointer-end", this.handlePointerUp);
    this.on("frame-loop", this.handleFrameLoop);
  }

  handleFrameLoop() {
    if (!this.context.cue) return;
    const cue = this.context.cue;
    cue.start.x = cue.ball.position.x;
    cue.start.y = cue.ball.position.y;
  }

  handlePointerStart(point: Point) {
    const ball = this.context.balls.find((ball) => ball.color === "white");
    if (!ball) return;
    const cue = new CueStick();
    cue.ball = ball;
    cue.start.x = ball.position.x;
    cue.start.y = ball.position.y;
    const dx = point.x - cue.start.x;
    const dy = point.y - cue.start.y;
    cue.end.x = cue.start.x - 1.5 * dx;
    cue.end.y = cue.start.y - 1.5 * dy;
    this.context.cue = cue;
  }

  handlePointerMove(point: Point) {
    if (!this.context.cue) return;
    const cue = this.context.cue;
    const dx = point.x - cue.start.x;
    const dy = point.y - cue.start.y;
    cue.end.x = cue.start.x - 1.5 * dx;
    cue.end.y = cue.start.y - 1.5 * dy;
  }

  handlePointerUp(point: Point) {
    if (!this.context.cue) return;
    const cue = this.context.cue;
    const dx = point.x - cue.start.x;
    const dy = point.y - cue.start.y;
    cue.end.x = cue.start.x - 1.5 * dx;
    cue.end.y = cue.start.y - 1.5 * dy;
    const shot = { x: dx * -0.05, y: dy * -0.05 };
    const ball = cue.ball;
    this.context.cue = null;

    this.emit("cue-shot", { ball, shot });
  }
}
