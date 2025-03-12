import { type Server, type Socket } from "socket.io";
import { Middleware, Runtime } from "polymatic";
import { ServerBilliardContext, MainServer } from "../eight-ball-server/MainServer";
import { randomRoomId } from "../lobby/RoomId";

export const lobby = (io: Server) => {
  Runtime.activate(new LobbyServer(), { io });
};

export class Room {
  id = randomRoomId();
  tokens = new Map<string, string>();
  players: string[] = [];
}

interface LobbyContext {
  io: Server;
}

class LobbyServer extends Middleware<LobbyContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
  }

  handleActivate() {
    const io = this.context.io;

    // set up connection and disconnect listeners
    io.on("connection", (socket) => {
      // socket.on("disconnect", (reason) => this.handleSocketDisconnect({ socket, reason }));
      socket.on("create-room", () => this.handleCreateRoomRequest({ socket }));
      // this.handleSocketConnect({ socket });
    });
  }

  // handleSocketConnect = ({ socket }: { socket: Socket }) => {};

  // handleSocketDisconnect = ({ socket, reason }: { socket: Socket; reason: DisconnectReason }) => {};

  handleCreateRoomRequest = ({ socket }: { socket: Socket }) => {
    const room = new Room();

    // for (let i = 0; i < sockets.length; i++) {
    //   const player = "player-" + nanoid();
    //   const token = "token-" + nanoid();
    //   room.players.push(player);
    //   room.tokens.set(player, token);
    // }

    this.activateRoom(room);

    socket.emit("room-ready", {
      id: room.id,
    });

    // for (let i = 0; i < sockets.length; i++) {
    //   const socket = sockets[i];
    //   const player = room.players[i];
    //   const token = room.tokens.get(player);
    //   socket.emit("join-room", { room: room.id, token: token, player: player });
    // }
  };

  activateRoom = (room: Room) => {
    // create a socket.io namespace for each room
    const namespace = this.context.io.of("/room/" + room.id);

    // create and activate a server-side game instance
    // create context
    const context = new ServerBilliardContext();
    context.room = room;
    context.io = namespace;
    Runtime.activate(new MainServer(), context);
  };
}
