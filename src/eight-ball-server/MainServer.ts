import { Middleware, Runtime } from "polymatic";
import { Namespace } from "socket.io";

import { BilliardContext } from "../eight-ball/Data";

import { PoolTable } from "../eight-ball/PoolTable";
import { EightBall } from "../eight-ball/EightBall";
import { NodeFrameLoop } from "./FixedLoop";
import { CueShot } from "../eight-ball/CueShot";
import { Physics } from "../eight-ball/Physics";

import { RoomServer } from "./RoomServer";
import { type Room } from "../lobby-server/LobbyServer";

export class ServerBilliardContext extends BilliardContext {
  io: Namespace;
  room?: Room;
}

/**
 * Main class for the billiard game server.
 */
export class MainServer extends Middleware<ServerBilliardContext> {
  constructor() {
    super();

    this.use(new NodeFrameLoop());
    this.use(new PoolTable());
    this.use(new EightBall());
    this.use(new Physics());
    this.use(new CueShot());

    this.use(new RoomServer());

    this.on("terminate-room", () => Runtime.deactivate(this));
  }
}
