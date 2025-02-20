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

export interface Ball {
  type: "ball";
  key: string;
  position: { x: number; y: number };
  radius: number;
  color: string;
}

export interface Rail {
  type: "rail";
  key: string;
  vertices: Point[] | undefined;
}

export interface Table {
  type: "table";
  key: string;
  width: number;
  height: number;
  ballRadius: number;
  pocketRadius: number;
}

export interface Pocket {
  type: "pocket";
  key: string;
  position: { x: number; y: number };
  radius: number;
}

export class CueStick {
  key = "cue-" + Date.now();
  type = "cue" as const;
  ball: Ball;
  start = { x: 0, y: 0 };
  end = { x: 0, y: 0 };
}
