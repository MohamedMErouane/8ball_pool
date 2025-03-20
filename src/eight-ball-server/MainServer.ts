import { Middleware, Runtime } from "polymatic";
import { Namespace } from "socket.io";

import { BilliardContext, type Player } from "../eight-ball/BilliardContext";

import { PoolTable } from "../eight-ball/PoolTable";
import { EightBall2P } from "../eight-ball/EightBall2P";
import { NodeFrameLoop } from "./FixedLoop";
import { CueShot } from "../eight-ball/CueShot";
import { Physics } from "../eight-ball/Physics";
import { TurnBased } from "../eight-ball/TurnBased";

import { RoomServer, type Auth } from "./RoomServer";
import { type Room } from "../lobby-server/LobbyServer";
import { Rack } from "../eight-ball/Rack";

export class ServerBilliardContext extends BilliardContext {
  io: Namespace;
  room?: Room;

  auths: Auth[] = [];
}

/**
 * Main class for the billiard game server.
 */
export class MainServer extends Middleware<ServerBilliardContext> {
  constructor() {
    super();

    this.use(new NodeFrameLoop());
    this.use(new PoolTable());
    this.use(new Rack());
    this.use(new EightBall2P());
    this.use(new Physics());
    this.use(new CueShot());

    this.use(new RoomServer());
    this.use(new TurnBased());

    this.on("terminate-room", () => Runtime.deactivate(this));
  }
}
