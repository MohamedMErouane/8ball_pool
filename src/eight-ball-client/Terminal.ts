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
      const group = document.createElementNS(SVG_NS, "g");
      group.classList.add("cue-group");
      
      // Real 8 Ball Pool cue stick - proper proportions
      const cueImage = document.createElementNS(SVG_NS, "image");
      cueImage.classList.add("cue-stick-image");
      cueImage.setAttribute("href", "./assets/sprites/spr_stick.png");
      cueImage.setAttribute("width", "1.2"); // Slightly shorter like in real game
      cueImage.setAttribute("height", "0.025"); // Thinner
      cueImage.setAttribute("preserveAspectRatio", "none");
      
      // Single trajectory line - just like 8 Ball Pool
      const trajectoryLine = document.createElementNS(SVG_NS, "line");
      trajectoryLine.classList.add("trajectory-line");
      trajectoryLine.setAttribute("stroke", "#FFFFFF");
      trajectoryLine.setAttribute("stroke-width", "0.008");
      trajectoryLine.setAttribute("opacity", "0.9");
      trajectoryLine.setAttribute("stroke-linecap", "round");
      
      // Trajectory line shadow/glow
      const trajectoryGlow = document.createElementNS(SVG_NS, "line");
      trajectoryGlow.classList.add("trajectory-glow");
      trajectoryGlow.setAttribute("stroke", "#FFFFFF");
      trajectoryGlow.setAttribute("stroke-width", "0.015");
      trajectoryGlow.setAttribute("opacity", "0.3");
      trajectoryGlow.setAttribute("stroke-linecap", "round");
      trajectoryGlow.setAttribute("filter", "blur(0.008)");
      
      // Target circle - shows where ball will hit
      const targetCircle = document.createElementNS(SVG_NS, "circle");
      targetCircle.classList.add("target-circle");
      targetCircle.setAttribute("r", "0.032");
      targetCircle.setAttribute("fill", "none");
      targetCircle.setAttribute("stroke", "#FFFFFF");
      targetCircle.setAttribute("stroke-width", "0.004");
      targetCircle.setAttribute("opacity", "0.6");
      
      // Ghost ball preview (like in real 8 Ball Pool)
      const ghostBall = document.createElementNS(SVG_NS, "circle");
      ghostBall.classList.add("ghost-ball");
      ghostBall.setAttribute("r", "0.031");
      ghostBall.setAttribute("fill", "rgba(255,255,255,0.15)");
      ghostBall.setAttribute("stroke", "#FFFFFF");
      ghostBall.setAttribute("stroke-width", "0.003");
      ghostBall.setAttribute("opacity", "0.5");
      
      // Add elements in correct order (background to foreground)
      group.appendChild(trajectoryGlow);
      group.appendChild(trajectoryLine);
      group.appendChild(ghostBall);
      group.appendChild(targetCircle);
      group.appendChild(cueImage);
      
      this.cueGroup.appendChild(group);
      return group;
    },
    
    update: (data, element) => {
      const dx = data.end.x - data.start.x;
      const dy = data.end.y - data.start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) return;
      
      // Direction vector (normalized) - AIM DIRECTION
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // Angle for rotation
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Power calculation - more sensitive like real 8 Ball Pool
      const maxPullDistance = 0.25; // Shorter pull distance
      const power = Math.min(distance / maxPullDistance, 1);
      
      const ballRadius = data.ball ? data.ball.radius : 0.031;
      const cueLength = 1.2;
      const cueThickness = 0.025;
      
      // Real 8 Ball Pool positioning - very close to ball
      const minGap = ballRadius + 0.008; // Almost touching
      const maxPullback = 0.06; // Very short pullback
      const currentGap = minGap + (maxPullback * power);
      
      // Cue tip position - close behind the ball
      const tipX = data.start.x - (dirX * currentGap);
      const tipY = data.start.y - (dirY * currentGap);
      
      // Update cue stick - Real 8 Ball Pool style
      const cueImage = element.querySelector('.cue-stick-image') as SVGImageElement;
      if (cueImage) {
        // Position cue so its tip is at the contact point
        const cueStartX = tipX - cueLength;
        const cueStartY = tipY - (cueThickness / 2);
        
        cueImage.setAttribute("x", String(cueStartX));
        cueImage.setAttribute("y", String(cueStartY));
        cueImage.setAttribute("transform", `rotate(${angle} ${tipX} ${tipY})`);
        
        // Subtle power feedback
        const opacity = 0.95;
        cueImage.style.opacity = String(opacity);
        cueImage.style.filter = `drop-shadow(0 0 ${0.003 + power * 0.002} rgba(139,69,19,0.4))`;
      }
      
      // Update trajectory line - Single line like real 8 Ball Pool
      const line = element.querySelector('.trajectory-line') as SVGLineElement;
      const glow = element.querySelector('.trajectory-glow') as SVGLineElement;
      
      if (line && glow) {
        // Line starts from ball edge in aim direction
        const lineStartX = data.start.x + (dirX * ballRadius);
        const lineStartY = data.start.y + (dirY * ballRadius);
        
        // Line length based on power - longer with more power
        const baseLength = 0.4;
        const powerLength = power * 0.5;
        const totalLength = baseLength + powerLength;
        
        const lineEndX = lineStartX + (dirX * totalLength);
        const lineEndY = lineStartY + (dirY * totalLength);
        
        // Update both line and glow
        [line, glow].forEach(l => {
          l.setAttribute("x1", String(lineStartX));
          l.setAttribute("y1", String(lineStartY));
          l.setAttribute("x2", String(lineEndX));
          l.setAttribute("y2", String(lineEndY));
        });
        
        // Power-based opacity
        line.setAttribute("opacity", String(0.8 + power * 0.2));
        glow.setAttribute("opacity", String(0.2 + power * 0.2));
      }
      
      // Update target circle - shows contact point on target ball
      const targetCircle = element.querySelector('.target-circle') as SVGCircleElement;
      if (targetCircle && power > 0.05) {
        // Position at trajectory end (simplified)
        const targetDistance = 0.5 + (power * 0.4);
        const targetX = data.start.x + (dirX * targetDistance);
        const targetY = data.start.y + (dirY * targetDistance);
        
        targetCircle.setAttribute("cx", String(targetX));
        targetCircle.setAttribute("cy", String(targetY));
        targetCircle.setAttribute("opacity", String(0.4 + power * 0.3));
        
        // Subtle pulsing effect
        const time = Date.now() * 0.003;
        const pulse = 1 + Math.sin(time) * 0.1;
        targetCircle.setAttribute("transform", `scale(${pulse})`);
      } else if (targetCircle) {
        targetCircle.setAttribute("opacity", "0");
      }
      
      // Update ghost ball - preview of cue ball position
      const ghostBall = element.querySelector('.ghost-ball') as SVGCircleElement;
      if (ghostBall && power > 0.1) {
        // Show where cue ball might end up after contact
        const ghostDistance = 0.2 + (power * 0.3);
        const ghostX = data.start.x + (dirX * ghostDistance);
        const ghostY = data.start.y + (dirY * ghostDistance);
        
        ghostBall.setAttribute("cx", String(ghostX));
        ghostBall.setAttribute("cy", String(ghostY));
        ghostBall.setAttribute("opacity", String(0.3 + power * 0.2));
        
        // Subtle breathing effect
        const time = Date.now() * 0.002;
        const breathe = 1 + Math.sin(time) * 0.05;
        ghostBall.setAttribute("transform", `scale(${breathe})`);
      } else if (ghostBall) {
        ghostBall.setAttribute("opacity", "0");
      }
    },
    
    exit: (data, element) => {
      element.remove();
    },
  });

  dataset = Dataset.create<Ball | Rail | Pocket | CueStick | Table>({
    key: (data) => data.key,
  });
}
