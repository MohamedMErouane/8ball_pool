import { World } from "planck/with-testbed";

import { Middleware } from "polymatic";

import { Ball, Physics, Pocket, Rail } from "./Physics";
import { BilliardTableData, BLACK, WHITE } from "./Table";
import { Terminal } from "./Terminal";
import { EightBall } from "./EightBall";

export interface MainContext {
  // game data
  balls: Ball[];
  rails: Rail[];
  pockets: Pocket[];

  // physics world
  world: World;

  // table geometry
  table: BilliardTableData;
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new EightBall());
    this.use(new Physics());
    this.use(new Terminal());
  }
}
