import { Middleware } from "polymatic";

import { PoolTable } from "../eight-ball/PoolTable";
import { EightBall } from "../eight-ball/EightBall";
import { Terminal } from "./Terminal";
import { FrameLoop } from "./FrameLoop";
import { CueShot } from "../eight-ball/CueShot";
import { Physics } from "../eight-ball/Physics";
import { type BilliardContext } from "../eight-ball/Data";

/**
 * Main class for the offline billiard game.
 */
export class MainOffline extends Middleware<BilliardContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new PoolTable());
    this.use(new EightBall());
    this.use(new Physics());
    this.use(new CueShot());
    this.use(new Terminal());
  }
}
