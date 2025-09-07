import { Middleware } from "polymatic";

import { CueStick, type BilliardContext } from "./BilliardContext";
import { isMyTurn } from "../eight-ball-client/ClientContext";

/**
 * Implements cue and shot:
 * - Listens to user pointer input events (from Terminal)
 * - Updates the cue stick object in the context
 * - Emits cue-shot events
 */
export class CueShot extends Middleware<BilliardContext> {
  constructor() {
    super();
    this.on("user-pointer-start", this.handlePointerStart);
    this.on("user-pointer-move", this.handlePointerMove);
    this.on("user-pointer-end", this.handlePointerUp);
    this.on("frame-loop", this.handleFrameLoop);
  }

  handleFrameLoop() {
    const cue = this.context.cue;
    if (!cue || !cue.ball) return;
    cue.start.x = cue.ball.position.x;
    cue.start.y = cue.ball.position.y;
  }

  handlePointerStart(point: { x: number; y: number }) {
    if (!isMyTurn(this.context)) return;
    const ball = this.context.balls.find((ball) => ball.color === "white");
    if (!ball) return;
    
    const cue = new CueStick();
    cue.ball = ball;
    cue.start.x = ball.position.x;
    cue.start.y = ball.position.y;
    cue.end.x = point.x;
    cue.end.y = point.y;
    
    this.context.cue = cue;
  }

  handlePointerMove(point: { x: number; y: number }) {
    const cue = this.context.cue;
    if (!cue) return;
    
    // Update the end position to current pointer position
    cue.end.x = point.x;
    cue.end.y = point.y;
  }

  handlePointerUp(point: { x: number; y: number }) {
    const cue = this.context.cue;
    if (!cue) return;
    
    // Calculate shot direction and power
    const dx = point.x - cue.start.x;
    const dy = point.y - cue.start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only shoot if there's enough distance (minimum power)
    const minShotDistance = 0.05;
    if (distance < minShotDistance) {
      this.context.cue = null;
      return;
    }
    
    // Calculate power (0 to 1) and apply shot force multiplier
    const maxDistance = 0.3;
    const power = Math.min(distance / maxDistance, 1);
    const shotForce = power * 0.1; // Adjust this multiplier for desired shot strength
    
    const shot = { 
      x: (dx / distance) * shotForce, 
      y: (dy / distance) * shotForce 
    };
    
    const ball = cue.ball;
    this.context.cue = null;

    if (!isMyTurn(this.context)) return;
    this.emit("cue-shot", { ball, shot });
  }
}
