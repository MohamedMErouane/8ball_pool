import { Middleware } from "polymatic";

export interface Turn {
  turns: string[];
  current?: string;
}

export interface TurnPlayer {
  id: string;
  turn?: string;
}

export interface TurnBasedContext {
  turn: Turn;
  players: TurnPlayer[];
}

export class TurnBased extends Middleware<TurnBasedContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("pass-turn", this.handlePassTurn);
    this.on("init-game", this.handleInitGame);
  }

  handleActivate = () => {
    this.context.turn = { turns: ["turn-one", "turn-two"] };
  };

  handleDeactivate = () => {};

  handlePassTurn() {
    const turn = this.context.turn;
    const currentIndex = turn.turns.indexOf(turn.current);
    const nextIndex = (currentIndex + 1) % turn.turns.length;
    turn.current = turn.turns[nextIndex];
  }

  handleInitGame = () => {
    this.context.turn.current = this.context.turn.turns[0];
    // todo: randomize turns
    // todo: re-assign turns
    for (let i = 0; i < this.context.turn.turns.length; i++) {
      const turn = this.context.turn.turns[i];
      const player = this.context.players[i];
      player.turn = turn;
    }
  };
}
