import * as Matter from 'matter-js'

const {
  Events,
  Body,
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
} = Matter

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app')
  if (!app) throw new Error("app wasn't found in dom")

  window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
  });

  const sizes = {
      x: window.innerWidth,
      y: window.innerHeight,

      players: {
          base: 40,
          big: 60,
          little: 20,
      },
  };

  // create an engine
  const engine = Engine.create()

  // create a renderer
  const render = Render.create({
    element: app,
    engine: engine,
    options: {
      wireframes: true,
      showVelocity: true,
    }
  });

  render.canvas.width = sizes.x;
  render.canvas.height = sizes.y;

  // create two boxes and a ground
  const boxA = Bodies.rectangle(400, 200, 80, 80);
  const boxB = Bodies.rectangle(450, 50, 80, 80);
  // const polygon1 = Bodies.polygon(100, 100, 4, 50);
  const polygon1 = Bodies.trapezoid(100, 100, 50, 50, 0.5);
  const player = Bodies.circle(100, 100, sizes.players.base);

  const borderWidth = 2000;
  const wallTop = Bodies.rectangle(sizes.x/2+(borderWidth/2), -(borderWidth/2), sizes.x+borderWidth, borderWidth, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallBottom = Bodies.rectangle(sizes.x/2+(borderWidth/2), sizes.y+(borderWidth/2), sizes.x+borderWidth, borderWidth, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallLeft = Bodies.rectangle(-(borderWidth/2), sizes.y/2+(borderWidth/2), borderWidth, sizes.y+borderWidth, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallRight = Bodies.rectangle(sizes.x+(borderWidth/2), sizes.y/2+(borderWidth/2), borderWidth, sizes.y+borderWidth, { isStatic:true, render: { fillStyle: 'transparent' } });

  engine.gravity.y = 0;
  console.log(engine)
  
  Composite.add(engine.world, [boxA, boxB, player, polygon1, wallBottom, wallTop, wallLeft, wallRight]);


  window.addEventListener('gamepadconnected', function() {
    console.log('gamepad connected');
  });

  // run the renderer
  Render.run(render);

  // create runner
  const runner = Runner.create();

  Events.on(runner, 'afterTick', (event) => {
    const speedfactor = 15;
    const pad = navigator.getGamepads() && navigator.getGamepads()[0];
    const [padX, padY] = pad?.axes || [0,0];
    
    Body.setVelocity(player, { x: padX*speedfactor, y: padY*speedfactor });
  });

  // run the engine
  Runner.run(runner, engine)
});