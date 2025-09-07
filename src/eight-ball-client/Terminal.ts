import { Dataset, Driver, Memo, Middleware } from "polymatic";
import { CueStick, Ball, Pocket, Rail, Table, type BilliardContext } from "../eight-ball/BilliardContext";

// Import wallet button - this will add the button to your page
import '../crypto/wallet-button';

// Remove these old imports if they exist:
// import { BettingSystem } from '../crypto/BettingSystem';
// import '../crypto/simple-test';

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
    this.on("activate", this.handleActivate.bind(this));
    this.on("deactivate", this.handleDeactivate.bind(this));
    this.on("frame-loop", this.handleFrameLoop.bind(this));
    this.on("main-start", this.handleStart.bind(this));

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
  handleActivate(ev: any) {
    const svg = document.querySelector("svg");
    if (svg) {
      svg.addEventListener("pointerdown", this.handlePointerDown);
      svg.addEventListener("pointermove", this.handlePointerMove);
      svg.addEventListener("pointerup", this.handlePointerUp);
      svg.appendChild(this.container);
      window.addEventListener("resize", this.handleWindowResize);
      this.handleWindowResize();
    }
  }
  handleDeactivate(ev: any) {
    const svg = document.querySelector("svg");
    if (svg) {
      svg.removeEventListener("pointerdown", this.handlePointerDown);
      svg.removeEventListener("pointermove", this.handlePointerMove);
      svg.removeEventListener("pointerup", this.handlePointerUp);
      if (this.container.parentElement) {
        this.container.remove();
      }
      window.removeEventListener("resize", this.handleWindowResize);
    }
  }
  handleStart(ev: any) {
    // Initialize game start logic
    console.log('🎱 Game started');
    console.log('💰 Wallet button available in top-right corner');
  }

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
      
      // Real 8 Ball Pool cue stick
      const cueImage = document.createElementNS(SVG_NS, "image");
      cueImage.classList.add("cue-stick-image");
      cueImage.setAttribute("href", "./assets/sprites/spr_stick.png");
      cueImage.setAttribute("width", "1.2");
      cueImage.setAttribute("height", "0.025");
      cueImage.setAttribute("preserveAspectRatio", "none");
      
      // Single trajectory line - just like 8 Ball Pool
      const trajectoryLine = document.createElementNS(SVG_NS, "line");
      trajectoryLine.classList.add("trajectory-line");
      trajectoryLine.setAttribute("stroke", "#FFFFFF");
      trajectoryLine.setAttribute("stroke-width", "0.008");
      trajectoryLine.setAttribute("opacity", "0.9");
      trajectoryLine.setAttribute("stroke-linecap", "round");
      
      // Trajectory line glow
      const trajectoryGlow = document.createElementNS(SVG_NS, "line");
      trajectoryGlow.classList.add("trajectory-glow");
      trajectoryGlow.setAttribute("stroke", "#FFFFFF");
      trajectoryGlow.setAttribute("stroke-width", "0.015");
      trajectoryGlow.setAttribute("opacity", "0.3");
      trajectoryGlow.setAttribute("stroke-linecap", "round");
      trajectoryGlow.setAttribute("filter", "blur(0.008)");
      
      // SINGLE smart target circle - adapts to target ball
      const targetCircle = document.createElementNS(SVG_NS, "circle");
      targetCircle.classList.add("smart-target-circle");
      targetCircle.setAttribute("r", "0.032");
      targetCircle.setAttribute("fill", "none");
      targetCircle.setAttribute("stroke", "#FFFFFF");
      targetCircle.setAttribute("stroke-width", "0.004");
      targetCircle.setAttribute("opacity", "0");
      targetCircle.setAttribute("stroke-dasharray", "0.02 0.01");
      
      // Add elements in correct order
      group.appendChild(trajectoryGlow);
      group.appendChild(trajectoryLine);
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
      
      // Direction vector (normalized)
      const dirX = dx / distance;
      const dirY = dy / distance;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      const maxPullDistance = 0.25;
      const power = Math.min(distance / maxPullDistance, 1);
      
      const ballRadius = data.ball ? data.ball.radius : 0.031;
      const cueLength = 1.2;
      const cueThickness = 0.025;
      
      // Cue positioning
      const minGap = ballRadius + 0.008;
      const maxPullback = 0.06;
      const currentGap = minGap + (maxPullback * power);
      
      const tipX = data.start.x - (dirX * currentGap);
      const tipY = data.start.y - (dirY * currentGap);
      
      // Update cue stick
      const cueImage = element.querySelector('.cue-stick-image') as SVGImageElement;
      if (cueImage) {
        const cueStartX = tipX - cueLength;
        const cueStartY = tipY - (cueThickness / 2);
        
        cueImage.setAttribute("x", String(cueStartX));
        cueImage.setAttribute("y", String(cueStartY));
        cueImage.setAttribute("transform", `rotate(${angle} ${tipX} ${tipY})`);
        cueImage.style.opacity = "0.95";
        cueImage.style.filter = `drop-shadow(0 0 ${0.003 + power * 0.002} rgba(139,69,19,0.4))`;
      }
      
      // Update trajectory line
      const line = element.querySelector('.trajectory-line') as SVGLineElement;
      const glow = element.querySelector('.trajectory-glow') as SVGLineElement;
      
      if (line && glow) {
        const lineStartX = data.start.x + (dirX * ballRadius);
        const lineStartY = data.start.y + (dirY * ballRadius);
        
        // SMART TARGETING: Check for ball collision along trajectory
        const maxTrajectoryLength = 1.5;
        let trajectoryLength = 0.4 + (power * 0.5);
        let targetBall = null;
        let targetDistance = trajectoryLength;
        
        // Check all balls for potential collision
        if (this.context?.balls) {
          for (const ball of this.context.balls) {
            if (ball === data.ball) continue; // Skip cue ball
            
            // Calculate distance from ball to trajectory line
            const ballDx = ball.position.x - lineStartX;
            const ballDy = ball.position.y - lineStartY;
            
            // Project ball position onto trajectory line
            const projection = (ballDx * dirX + ballDy * dirY);
            
            // Check if projection is in trajectory direction and within range
            if (projection > 0 && projection < maxTrajectoryLength) {
              // Calculate perpendicular distance to line
              const perpX = ballDx - projection * dirX;
              const perpY = ballDy - projection * dirY;
              const perpDistance = Math.sqrt(perpX * perpX + perpY * perpY);
              
              // Check if ball is close enough to trajectory (collision detection)
              const collisionThreshold = ball.radius + ballRadius + 0.02; // Add some tolerance
              if (perpDistance < collisionThreshold && projection < targetDistance) {
                targetBall = ball;
                targetDistance = projection;
              }
            }
          }
        }
        
        // Set trajectory length based on target
        if (targetBall) {
          trajectoryLength = Math.min(targetDistance - ballRadius, trajectoryLength);
        }
        
        const lineEndX = lineStartX + (dirX * trajectoryLength);
        const lineEndY = lineStartY + (dirY * trajectoryLength);
        
        [line, glow].forEach(l => {
          l.setAttribute("x1", String(lineStartX));
          l.setAttribute("y1", String(lineStartY));
          l.setAttribute("x2", String(lineEndX));
          l.setAttribute("y2", String(lineEndY));
        });
        
        line.setAttribute("opacity", String(0.8 + power * 0.2));
        glow.setAttribute("opacity", String(0.2 + power * 0.2));
      }
      
      // SMART TARGET CIRCLE - Shows on target ball like 8 Ball Pool
      const targetCircle = element.querySelector('.smart-target-circle') as SVGCircleElement;
      if (targetCircle && power > 0.05) {
        // Find the closest ball in trajectory path
        let closestBall = null;
        let closestDistance = Infinity;
        
        if (this.context?.balls) {
          for (const ball of this.context.balls) {
            if (ball === data.ball) continue; // Skip cue ball
            
            // Calculate if ball is in trajectory path
            const ballDx = ball.position.x - data.start.x;
            const ballDy = ball.position.y - data.start.y;
            const ballDistance = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
            
            // Check if ball is roughly in aim direction
            const ballDirX = ballDx / ballDistance;
            const ballDirY = ballDy / ballDistance;
            const alignment = ballDirX * dirX + ballDirY * dirY; // Dot product
            
            // If ball is in aim direction and closer than previous
            if (alignment > 0.8 && ballDistance < closestDistance && ballDistance < 1.0) {
              closestBall = ball;
              closestDistance = ballDistance;
            }
          }
        }
        
        if (closestBall) {
          // Show circle on target ball
          targetCircle.setAttribute("cx", String(closestBall.position.x));
          targetCircle.setAttribute("cy", String(closestBall.position.y));
          targetCircle.setAttribute("r", String(closestBall.radius + 0.01));
          targetCircle.setAttribute("opacity", String(0.6 + power * 0.3));
          
          // Animated rotation around target ball
          const time = Date.now() * 0.002;
          const rotation = (time % 1) * 360;
          targetCircle.setAttribute("transform", `rotate(${rotation} ${closestBall.position.x} ${closestBall.position.y})`);
          
          // Change color based on ball type
          let strokeColor = "#FFFFFF";
          if (closestBall.color === "black") {
            strokeColor = "#FFD700"; // Gold for 8-ball
          } else if (closestBall.color.includes("solid")) {
            strokeColor = "#00FF00"; // Green for solids
          } else if (closestBall.color.includes("stripe")) {
            strokeColor = "#FF8C00"; // Orange for stripes
          }
          
          targetCircle.setAttribute("stroke", strokeColor);
          targetCircle.setAttribute("stroke-width", "0.005");
        } else {
          // No target ball - hide circle
          targetCircle.setAttribute("opacity", "0");
        }
      } else if (targetCircle) {
        targetCircle.setAttribute("opacity", "0");
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
