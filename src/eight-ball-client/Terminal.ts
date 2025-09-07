import { Dataset, Driver, Memo, Middleware } from "polymatic";

import { CueStick, Ball, Pocket, Rail, Table, type BilliardContext } from "../eight-ball/BilliardContext";

const SVG_NS = "http://www.w3.org/2000/svg";

const STROKE_WIDTH = 0.006 / 2;

/**
 * Implements rendering and collecting user-input
 */
export class Terminal extends Middleware<BilliardContext> {
  container: SVGGElement;

  scorecardGroup: SVGGElement;
  ballsGroup: SVGGElement;
  tableGroup: SVGGElement;
  cueGroup: SVGGElement;

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-loop", this.handleFrameLoop);
    this.on("main-start", this.handleStart);

    this.dataset.addDriver(this.tableDriver);
    this.dataset.addDriver(this.railDriver);
    this.dataset.addDriver(this.pocketDriver);

    this.dataset.addDriver(this.ballDriver);

    this.dataset.addDriver(this.cueDriver);

    this.scorecardGroup = document.createElementNS(SVG_NS, "g");
    this.ballsGroup = document.createElementNS(SVG_NS, "g");
    this.tableGroup = document.createElementNS(SVG_NS, "g");
    this.cueGroup = document.createElementNS(SVG_NS, "g");

    this.container = document.createElementNS(SVG_NS, "g");
    this.container.classList.add("billiards");

    this.container.appendChild(this.tableGroup);
    this.container.appendChild(this.ballsGroup);
    this.container.appendChild(this.scorecardGroup);
    this.container.appendChild(this.cueGroup);
  }

  handleActivate() {
    const svg = document.getElementById("polymatic-eight-ball");
    if (svg && svg instanceof SVGSVGElement) {
      svg.appendChild(this.container);
      this.container.parentElement?.addEventListener("pointerdown", this.handlePointerDown);
      this.container.parentElement?.addEventListener("pointermove", this.handlePointerMove);
      this.container.parentElement?.addEventListener("pointerup", this.handlePointerUp);
      window.addEventListener("resize", this.handleWindowResize);
      window.addEventListener("orientationchange", this.handleWindowResize);
      this.handleWindowResize();
    } else {
      console.error("Container SVG element not found");
    }
  }

  handleDeactivate() {
    window.removeEventListener("resize", this.handleWindowResize);
    window.removeEventListener("orientationchange", this.handleWindowResize);
    this.container.parentElement?.removeEventListener("pointerdown", this.handlePointerDown);
    this.container.parentElement?.removeEventListener("pointermove", this.handlePointerMove);
    this.container.parentElement?.removeEventListener("pointerup", this.handlePointerUp);
    this.container.remove();
  }

  handleStart() {}

  tableConfigMemo = Memo.init();
  handleWindowResize = () => {
    const table = this.context?.table;
    if (!this.container || !table) return;
    if (this.tableConfigMemo.update(table.width, table.height, window.innerWidth, window.innerHeight)) {
      const width = table.width * 1.3;
      const height = table.height * 1.3;
      const isPortrait = window.innerWidth < window.innerHeight;
      if (isPortrait) {
        this.container.classList.add("portrait");
        this.container.parentElement?.setAttribute("viewBox", `-${height * 0.5} -${width * 0.5} ${height} ${width}`);
      } else {
        this.container.classList.remove("portrait");
        this.container.parentElement?.setAttribute("viewBox", `-${width * 0.5} -${height * 0.5} ${width} ${height}`);
      }
    }
  };

  getSvgPoint = (event: PointerEvent) => {
    if (!this.container) return;
    const domPoint = new DOMPoint(event.clientX, event.clientY);
    const transform = this.container.getScreenCTM();
    if (!transform) return;
    const svgPoint = domPoint.matrixTransform(transform.inverse());
    return svgPoint;
  };

  pointerDown = false;

  handlePointerDown = (event: PointerEvent) => {
    this.pointerDown = true;
    const point = this.getSvgPoint(event);
    if (!point) return;
    this.emit("user-pointer-start", point);
  };

  handlePointerMove = (event: PointerEvent) => {
    // if (!this.context.next) return;
    if (!this.pointerDown) return;
    event.preventDefault();
    const point = this.getSvgPoint(event);
    if (!point) return;
    this.emit("user-pointer-move", point);
  };

  handlePointerUp = (event: PointerEvent) => {
    this.pointerDown = false;
    const point = this.getSvgPoint(event);
    if (!point) return;
    this.emit("user-pointer-end", point);
  };

  handleFrameLoop = () => {
    if (!this.context.balls || !this.context.rails || !this.context.pockets) return;

    this.dataset.data([
      this.context.table,
      ...this.context.rails,
      ...this.context.pockets,
      ...this.context.balls,
      this.context.cue,
    ]);
  };

  ballDriver = Driver.create<Ball, Element>({
    filter: (data) => data.type == "ball",
    enter: (data) => {
      const element = document.createElementNS(SVG_NS, "image");
      element.classList.add("ball");
      element.classList.add(data.color);
      
      // Set the image source based on ball color
      let imageSrc = "";
      switch(data.color) {
        case "white":
          imageSrc = "./assets/sprites/spr_ball2.png";
          break;
        case "black":
          imageSrc = "./assets/sprites/spr_blackBall2.png";
          break;
        case "red":
          imageSrc = "./assets/sprites/spr_redBall2.png";
          break;
        case "yellow":
          imageSrc = "./assets/sprites/spr_yellowBall2.png";
          break;
        default:
          imageSrc = "./assets/sprites/spr_ball2.png";
      }
      
      element.setAttribute("href", imageSrc);
      element.setAttribute("width", String(data.radius * 2));
      element.setAttribute("height", String(data.radius * 2));
      element.setAttribute("x", String(-data.radius));
      element.setAttribute("y", String(-data.radius));
      
      this.ballsGroup.appendChild(element);
      return element;
    },
    update: (data, element) => {
      element.setAttribute("x", String(data.position.x - data.radius));
      element.setAttribute("y", String(data.position.y - data.radius));
    },
    exit: (data, element) => {
      element.remove();
    },
  });

  tableDriver = Driver.create<Table, Element>({
    filter: (data) => data.type == "table",
    enter: (data) => {
      const element = document.createElementNS(SVG_NS, "rect");
      const w = data.width + data.pocketRadius * 1.5;
      const h = data.height + data.pocketRadius * 1.5;
      element.setAttribute("x", String(-w * 0.5 - STROKE_WIDTH));
      element.setAttribute("y", String(-h * 0.5 - STROKE_WIDTH));
      element.setAttribute("width", String(w + STROKE_WIDTH * 2));
      element.setAttribute("height", String(h + STROKE_WIDTH * 2));
      element.classList.add("table");
      this.tableGroup.appendChild(element);

      this.handleWindowResize();
      return element;
    },
    update: (data, element) => {},
    exit: (data, element) => {
      element.remove();
    },
  });

  railDriver = Driver.create<Rail, Element>({
    filter: (data) => data.type == "rail",
    enter: (data) => {
      const element = document.createElementNS(SVG_NS, "polygon");
      element.setAttribute("points", String(data.vertices?.map((v) => `${v.x},${v.y}`).join(" ")));
      element.classList.add("rail");
      this.tableGroup.appendChild(element);
      return element;
    },
    update: (data, element) => {},
    exit: (data, element) => {
      element.remove();
    },
  });

  pocketDriver = Driver.create<Pocket, Element>({
    filter: (data) => data.type == "pocket",
    enter: (data) => {
      const element = document.createElementNS(SVG_NS, "circle");
      element.setAttribute("cx", String(data.position.x));
      element.setAttribute("cy", String(data.position.y));
      element.setAttribute("r", String(data.radius));
      element.classList.add("pocket");
      this.tableGroup.appendChild(element);
      return element;
    },
    update: (data, element) => {},
    exit: (data, element) => {
      element.remove();
    },
  });

  cueDriver = Driver.create<CueStick, Element>({
    filter: (data) => data.type == "cue",
    enter: (data) => {
      const element = document.createElementNS(SVG_NS, "image");
      element.classList.add("cue");
      element.setAttribute("href", "./assets/sprites/spr_stick.png");
      element.setAttribute("width", "70");
      element.setAttribute("height", "16");
      element.setAttribute("x", "0");
      element.setAttribute("y", "-8"); // Center vertically
      element.setAttribute("preserveAspectRatio", "none");
      this.cueGroup.appendChild(element);
      return element;
    },
    update: (data, element) => {
      const stickLength = 70;
      const stickHeight = 16;
      // Vector from cue ball to pointer (drag direction)
      const dx = data.start.x - data.end.x;
      const dy = data.start.y - data.end.y;
      const pullDist = Math.sqrt(dx * dx + dy * dy);
      const dirX = dx / (pullDist || 1);
      const dirY = dy / (pullDist || 1);
      const gap = data.ball ? data.ball.radius : 10;
      // The tip of the stick is just behind the cue ball, in the direction of the drag
      const tipX = data.start.x + dirX * gap;
      const tipY = data.start.y + dirY * gap;
      // The base (butt) of the stick is further away in the same direction
      const baseX = tipX + dirX * stickLength;
      const baseY = tipY + dirY * stickLength;
      // Place the image so its left edge (x) is at the base, and rotate toward the tip
      const angle = Math.atan2(tipY - baseY, tipX - baseX) * 180 / Math.PI;
      element.setAttribute("width", String(stickLength));
      element.setAttribute("height", String(stickHeight));
      element.setAttribute("x", String(baseX));
      element.setAttribute("y", String(baseY - stickHeight / 2));
      element.setAttribute("transform", `rotate(${angle} ${baseX} ${baseY})`);
    },
    exit: (data, element) => {
      element.remove();
    },
  });

  dataset = Dataset.create<Ball | Rail | Pocket | CueStick | Table>({
    key: (data) => data.key,
  });
}
