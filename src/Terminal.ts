import { Settings, Testbed } from "planck/with-testbed";

import { Middleware } from "polymatic";

import { MainContext } from "./Main";

export class Terminal extends Middleware<MainContext> {
  testbed: Testbed;

  constructor() {
    super();
    this.on("activate", this.setup);
  }

  setup() {
    if (this.testbed) return;

    Settings.velocityThreshold = 0;

    this.testbed = Testbed.mount();
    this.testbed.x = 0;
    this.testbed.y = 0;
    this.testbed.width = this.context.table.tableWidth * 1.2;
    this.testbed.height = this.context.table.tableHeight * 1.2;
    this.testbed.mouseForce = -20;
    this.testbed.start(this.context.world);
  }
}
