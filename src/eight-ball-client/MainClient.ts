import { Middleware } from "polymatic";

import { Terminal } from "./Terminal";
import { FrameLoop } from "./FrameLoop";
import { CueShot } from "../eight-ball/CueShot";
import { RoomClient } from "./RoomClient";
import { BilliardContext } from "../eight-ball/Data";

export class ClientBilliardContext extends BilliardContext {
  room?: string;
  player?: string;
  token?: string;
}

/**
 * Main class for the billiard game client.
 */
export class MainClient extends Middleware<ClientBilliardContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new CueShot());
    this.use(new Terminal());
    this.use(new RoomClient());
  }
}
