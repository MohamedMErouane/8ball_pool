import { World, Circle, Polygon, Vec2Value, Contact, Body } from "planck/with-testbed";

import { STYLES } from "./Table";

import { Dataset, Driver, Middleware } from "polymatic";
import { MainContext } from "./Main";

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
  vertices: Vec2Value[] | undefined;
}

export interface Pocket {
  type: "pocket";
  key: string;
  position: { x: number; y: number };
  radius: number;
}

export type Entity = Ball | Rail | Pocket;

export class Physics extends Middleware<MainContext> {
  world: World;

  constructor() {
    super();
    this.on("activate", this.setup);
    this.on("update", this.update);
    this.dataset.addDriver(this.ballDriver);
    this.dataset.addDriver(this.railDriver);
    this.dataset.addDriver(this.pocketDriver);
  }

  setup() {
    this.world = new World();
    this.world.on("begin-contact", this.collide);
    this.context.world = this.world;
  }

  update() {
    this.dataset.data([...this.context.balls, ...this.context.rails, ...this.context.pockets]);
  }

  collide = (contact: Contact) => {
    const fA = contact.getFixtureA();
    const bA = fA.getBody();
    const fB = contact.getFixtureB();
    const bB = fB.getBody();

    const dataA = bA.getUserData() as Entity;
    const dataB = bB.getUserData() as Entity;

    if (!dataA || !dataB) return;

    const ball = dataA.type === "ball" ? dataA : dataB.type === "ball" ? dataB : null;
    const pocket = dataA.type === "pocket" ? dataA : dataB.type === "pocket" ? dataB : null;

    if (ball && pocket) {
      // do not change world immediately
      this.world.queueUpdate(() => this.emit("ball-in-pocket", { ball, pocket }));
    }
  };

  dataset = Dataset.create<Entity>({
    key: (data) => data.key,
  });

  ballDriver = Driver.create<Ball, Body>({
    filter: (data) => data.type === "ball",
    enter: (data) => {
      const body = this.world.createBody({
        type: "dynamic",
        bullet: true,
        position: data.position,
        linearDamping: 1.5,
        angularDamping: 1,
        userData: data,
      });
      const color = data.color;
      const style = color && STYLES[color];
      body.createFixture({
        shape: new Circle(data.radius),
        friction: 0.1,
        restitution: 0.99,
        density: 1,
        userData: data,
        style,
      });
      return body;
    },
    update: (data, body) => {},
    exit: (data, body) => {
      this.world.destroyBody(body);
    },
  });

  railDriver = Driver.create<Rail, Body>({
    filter: (data) => data.type === "rail",
    enter: (data) => {
      const body = this.world.createBody({
        type: "static",
        userData: data,
      });
      const fixture = body.createFixture({
        shape: new Polygon(data.vertices),
        friction: 0.1,
        restitution: 0.9,
        userData: data,
      });
      return body;
    },
    update: (data, body) => {},
    exit: (data, body) => {
      this.world.destroyBody(body);
    },
  });

  pocketDriver = Driver.create<Pocket, Body>({
    filter: (data) => data.type === "pocket",
    enter: (data) => {
      const body = this.world.createBody({
        type: "static",
        position: data.position,
        userData: data,
      });
      const fixture = body.createFixture({
        shape: new Circle(data.radius),
        userData: data,
        isSensor: true,
      });
      return body;
    },
    update: (data, body) => {},
    exit: (data, body) => {
      this.world.destroyBody(body);
    },
  });
}
