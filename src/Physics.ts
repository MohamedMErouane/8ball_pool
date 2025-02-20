import { World, Circle, Polygon, Vec2Value, Contact, Body, Settings } from "planck";

import { Dataset, Driver, Middleware } from "polymatic";

import { MainContext } from "./Main";
import { FrameLoopEvent } from "./FrameLoop";
import { Ball, Pocket, Rail } from "./Data";

export type Entity = Ball | Rail | Pocket;

/**
 * Billiards physics simulation. This doesn't include any game rules, or table geometry.
 */
export class Physics extends Middleware<MainContext> {
  world: World;

  time: number = 0;
  timeStep = 1000 / 60;

  constructor() {
    super();
    this.on("activate", this.setup);
    this.on("frame-loop", this.handleFrameLoop);
    this.on("cue-shot", this.handleCueShot);

    this.dataset.addDriver(this.ballDriver);
    this.dataset.addDriver(this.railDriver);
    this.dataset.addDriver(this.pocketDriver);
  }

  handleCueShot(data: { ball: Ball; shot: Vec2Value }) {
    const body = this.ballDriver.ref(data.ball.key);
    if (!body) return;
    body.applyLinearImpulse(data.shot, body.getPosition());
  }

  setup() {
    Settings.velocityThreshold = 0;
    this.world = new World();
    this.world.on("begin-contact", this.collide);
  }

  handleFrameLoop(ev: FrameLoopEvent) {
    this.dataset.data([...this.context.balls, ...this.context.rails, ...this.context.pockets]);
    this.time += ev.dt;
    while (this.time >= this.timeStep) {
      this.time -= this.timeStep;
      this.world.step(this.timeStep / 1000);
    }
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
      body.createFixture({
        shape: new Circle(data.radius),
        friction: 0.1,
        restitution: 0.99,
        density: 1,
        userData: data,
      });
      return body;
    },
    update: (data, body) => {
      const p = body.getPosition();
      data.position.x = p.x;
      data.position.y = p.y;
    },
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
