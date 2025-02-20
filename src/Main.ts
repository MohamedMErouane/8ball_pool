import { Middleware } from "polymatic";

import { Ball, CueStick, Pocket, Rail, Table } from "./Data";
import { PoolTable } from "./PoolTable";
import { EightBall } from "./EightBall";
import { Terminal } from "./Terminal";
import { FrameLoop } from "./FrameLoop";
import { CueShot } from "./CueShot";
import { Physics } from "./Physics";

export class MainContext {
  cue: CueStick | null;
  balls: Ball[];
  rails: Rail[];
  pockets: Pocket[];

  table: Table;
}

export class Main extends Middleware<MainContext> {
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
