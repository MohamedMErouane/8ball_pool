import { Runtime, Middleware } from "polymatic";
import { io, type Socket } from "socket.io-client";

import { MainClient } from "../eight-ball-client/MainClient";
import { MainOffline } from "../eight-ball-client/MainOffline";
import { nanoid } from "nanoid";
import { isValidRoomId, normalizeRoomId } from "../lobby/RoomId";

class LobbyClientContext {
  player?: string;
  token?: string;
}

export class LobbyClient extends Middleware<LobbyClientContext> {
  playOfflineButton: HTMLElement;
  createRoomButton: HTMLElement;
  joinRoomButton: HTMLElement;
  leaveRoomButton: HTMLElement;

  io: Socket;

  room: MainOffline | MainClient;

  constructor() {
    super();

    this.on("activate", this.handleActivate);
  }

  handleActivate() {
    // set up buttons
    this.playOfflineButton = document.getElementById("play-offline");
    this.createRoomButton = document.getElementById("create-room");
    this.joinRoomButton = document.getElementById("join-room");
    this.leaveRoomButton = document.getElementById("leave-room");

    this.playOfflineButton.addEventListener("click", this.handlePlayOffline);
    this.createRoomButton.addEventListener("click", this.handleCreateRoom);
    this.joinRoomButton.addEventListener("click", this.handleJoinRoom);
    this.leaveRoomButton.addEventListener("click", this.handleLeaveRoom);

    // set up player and token
    // player is public will be shared by other users, token is private
    this.context.player = localStorage.getItem("eight-ball-player");
    this.context.token = localStorage.getItem("eight-ball-token");
    if (!this.context.player || !this.context.token) {
      this.context.player = nanoid();
      this.context.token = nanoid();
      localStorage.setItem("eight-ball-player", this.context.player);
      localStorage.setItem("eight-ball-token", this.context.token);
    }

    // set up io connection and listeners
    this.io = io();
    this.io.on("connect", () => console.log("connected to lobby"));
    this.io.on("room-ready", this.handleRoomReady);
  }

  handlePlayOffline = () => {
    if (this.room) {
      Runtime.deactivate(this.room);
      this.room = null;
    }
    Runtime.activate((this.room = new MainOffline()), {});
  };

  handleCreateRoom = () => {
    this.io.emit("create-room");
  };

  handleRoomReady = ({ id }: { id: string }) => {
    if (this.room) {
      Runtime.deactivate(this.room);
      this.room = null;
    }

    localStorage.setItem("eight-ball-room", id);
    Runtime.activate((this.room = new MainClient()), {
      room: id,
    });
  };

  handleJoinRoom = () => {
    const input = window.prompt("Please enter room id:");
    if (!input) return;

    const id = normalizeRoomId(input);

    if (!isValidRoomId(id)) {
      window.alert("Invalid room id: '" + input.substring(0, 12) + "' \nRoom id format is 'xxx-xxx-xxx'.");
      return;
    }

    localStorage.setItem("eight-ball-room", id);
    Runtime.activate((this.room = new MainClient()), {
      room: id,
    });
  };

  handleLeaveRoom = () => {
    // localStorage.removeItem("eight-ball-room");
  };
}
