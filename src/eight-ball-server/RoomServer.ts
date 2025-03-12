import { Middleware } from "polymatic";

import type { ServerBilliardContext } from "./MainServer";

export class RoomServer extends Middleware<ServerBilliardContext> {
  roomTimeout: any;

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("next-turn", this.handleNextTurn);
    this.on("frame-loop", this.handleFrameLoop);
  }

  handleActivate() {
    this.extendRoomLease();

    this.context.turn = this.context.room?.players[0];
    this.context.io.on("connection", (socket) => {
      const auth = socket.handshake.auth;

      const room = this.context.room;
      if (!room) return;
      if (room.tokens.get(auth.player) !== auth.token) return;

      socket.on("cue-shot", (data) => {
        if (!auth || this.context.turn !== auth.player) return;
        this.emit("cue-shot", data);

        this.extendRoomLease();
      });

      // socket.emit("player-update", { token: socket.id });
    });
  }

  handleDeactivate = () => {
    clearTimeout(this.roomTimeout);

    const io = this.context.io;
    if (io) {
      this.context.io = null;
      io.removeAllListeners("connection");
      io.local.disconnectSockets();
      io.server._nsps.delete(io.name);
    }
  };

  extendRoomLease = () => {
    clearTimeout(this.roomTimeout);
    this.roomTimeout = setTimeout(this.expireRoomLease, 30 * 60 * 1000);
  };

  expireRoomLease = () => {
    this.emit("terminate-room");
  };

  handleNextTurn() {
    if (!this.context.room) return;
    const players = this.context.room.players;
    if (!this.context.turn) {
      this.context.turn = players[0];
    } else {
      const index = players.indexOf(this.context.turn);
      const next = (index + 1) % players.length;
      this.context.turn = players[next];
    }
  }

  handleFrameLoop() {
    const { balls, rails, pockets, table, turn } = this.context;
    // if (this.context.sleep) return;
    this.context.io.emit("room-update", {
      turn: turn,
      players: this.context.room?.players,
      balls: balls,
      rails: rails,
      pockets: pockets,
      table: table,
    });
  }
}
