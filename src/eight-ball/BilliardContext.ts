import { nanoid } from "nanoid";
import { type Turn } from "./TurnBased";

export class Color {
  static all = [
    "yellow-solid",
    "yellow-stripe",
    "red-solid",
    "red-stripe",
    "burgundy-solid",
    "burgundy-stripe",
    "orange-solid",
    "orange-stripe",
    "green-solid",
    "green-stripe",
    "purple-solid",
    "purple-stripe",
    "blue-solid",
    "blue-stripe",
  ];
  static white = "white";
  static black = "black";
}

export interface Point {
  x: number;
  y: number;
}

export class Ball {
  type = "ball" as const;
  key = "ball-" + nanoid(6);
  color: string;
  position: Point = { x: 0, y: 0 };
  radius: number;

  constructor(position: { x: number; y: number }, radius: number, color: string) {
    this.position.x = position.x;
    this.position.y = position.y;
    this.radius = radius;
    this.color = color;
  }
}

export class Rail {
  type = "rail" as const;
  key = "rail-" + nanoid(6);
  vertices: Point[] = [];

  constructor(vertices: { x: number; y: number }[]) {
    this.vertices = vertices;
  }
}

export class Table {
  type = "table" as const;
  key = "table-" + nanoid(6);
  width: number;
  height: number;
  ballRadius: number;
  pocketRadius: number;

  constructor() {
    this.width = 800;
    this.height = 400;
    this.ballRadius = 10;
    this.pocketRadius;
  }
}

export class Pocket {
  type = "pocket" as const;
  key = "pocket-" + nanoid(6);
  position: Point = { x: 0, y: 0 };
  radius: number;

  constructor(radius: number, position: { x: number; y: number }) {
    this.radius = radius;
    this.position.x = position.x;
    this.position.y = position.y;
  }
}

export class CueStick {
  type = "cue" as const;
  key = "cue-" + nanoid(6);
  ball: Ball;
  start: Point = { x: 0, y: 0 };
  end: Point = { x: 0, y: 0 };
}

export interface Player {
  id: string;
  name?: string;

  color?: "striped" | "solid";

  turn?: string;
}

export class BilliardContext {
  cue?: CueStick;
  balls?: Ball[] = [];
  rails?: Rail[] = [];
  pockets?: Pocket[] = [];
  table?: Table;

  sleep? = false;
  shotInProgress? = false;

  gameStarted? = false;
  gameOver? = false;
  winner?: string;

  turn?: Turn;

  // used in multiplayer client
  player?: Player;

  // used in multiplayer client and server
  players?: Player[] = [];
}
