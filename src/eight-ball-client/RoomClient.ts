import { Middleware } from "polymatic";
import { io, type Socket } from "socket.io-client";

import { type ClientBilliardContext } from "./MainClient";

export class RoomClient extends Middleware<ClientBilliardContext> {
  io: Socket;
  statusElement: HTMLElement;
  connectionError: string;

  constructor() {
    super();

    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("cue-shot", this.handleCueShot);
  }

  handleActivate = () => {
    this.statusElement = document.getElementById("room-status");
    this.printRoomStatus();

    const room = this.context.room;

    this.io = io("/room/" + room, {
      auth: {
        player: this.context.player,
        token: this.context.token,
      },
    });

    this.io.on("connect_error", (err) => {
      console.log("connect_error", err.message, err.message === "Invalid namespace");
      if (err.message === "Invalid namespace") {
        this.connectionError = "Room not found!";
      } else {
        this.connectionError = "Connection error";
      }
      this.printRoomStatus();
    });

    this.io.on("connect_failed", (err) => {
      console.log("connect_failed", err);
      this.connectionError = "Connection failed";
    });

    this.io.on("connect", () => {
      console.log("connected to room", room);
      this.connectionError = null;
      this.printRoomStatus();
    });
    this.io.on("room-update", this.handleServerRoomState);
    this.io.on("player-update", this.handleServerPlayerState);
  };

  handleDeactivate = () => {
    this.io?.disconnect();
  };

  handleServerRoomState = (data: object) => {
    Object.assign(this.context, data);
  };

  handleServerPlayerState = (data: object) => {
    Object.assign(this.context, data);
  };

  handleCueShot = (data: object) => {
    this.io?.emit("cue-shot", data);
  };

  printRoomStatus = () => {
    const id = this.context.room ?? "";
    this.statusElement.innerText = id;
    if (this.connectionError) {
      this.statusElement.innerText += " " + this.connectionError;
    }
  };
}
