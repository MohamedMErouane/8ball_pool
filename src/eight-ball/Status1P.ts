import { Memo, Middleware } from "polymatic";

import { type ClientBilliardContext } from "../eight-ball-client/MainClient";

export class StatusOffline extends Middleware<ClientBilliardContext> {
  gameStatusElement: HTMLElement;
  roomStatusElement: HTMLElement;
  memo = Memo.init();

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-loop", this.handleFrameLoop);
  }

  handleActivate() {
    this.gameStatusElement = document.getElementById("game-status");
    this.roomStatusElement = document.getElementById("room-status");
    this.roomStatusElement.innerText = "Offline Mode";
  }

  handleDeactivate() {
    this.memo.clear();
    this.gameStatusElement.innerText = null;
    this.roomStatusElement.innerText = null;
  }

  handleFrameLoop = () => {
    const context = this.context;
    if (this.memo.update(context.shotInProgress, context.gameOver)) {
      const status = [];
      if (context.shotInProgress) {
        status.push("Shot in progress");
      } else if (context.gameOver) {
        status.push("Game over");
      }
      this.gameStatusElement.innerText = status.join(" | ");
    }
  };
}
