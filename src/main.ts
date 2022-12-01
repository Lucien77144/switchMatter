import * as Matter from 'matter-js'

import 'pathseg'

import losangeSVG from './svg/losange.svg';
import vert from './svg/vert.svg';
import rouge from './svg/rouge.svg';

const {
  Common,
  Vertices,
  Vector,
  Svg,
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

  const sizes = {
      x: window.innerWidth,
      y: window.innerHeight,

      players: {
          base: 40,
          big: 60,
          little: 20,
      },
  };
  let players: {}[] = [];

  window.addEventListener('resize', () => {
    render.canvas.width = sizes.x;
    render.canvas.height = sizes.y;
  });

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

  const bw = 2000;
  const wallTop = Bodies.rectangle(sizes.x/2+(bw/2), -(bw/2), sizes.x+bw, bw, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallBottom = Bodies.rectangle(sizes.x/2+(bw/2), sizes.y+(bw/2), sizes.x+bw, bw, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallLeft = Bodies.rectangle(-(bw/2), sizes.y/2+(bw/2), bw, sizes.y+bw, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallRight = Bodies.rectangle(sizes.x+(bw/2), sizes.y/2+(bw/2), bw, sizes.y+bw, { isStatic:true, render: { fillStyle: 'transparent' } });

  let indexLosanges = 0;
  const createLosange = (x=500, y=500, type=vert, scale = {x: .4, y: .4}) => {
    const select = (root: any, selector:any) => {
      return Array.prototype.slice.call(root.querySelectorAll(selector));
    };
    const loadSvg = (url: string) => {
      return fetch(url)
        .then(function(response) { return response.text(); })
        .then(function(raw) { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
    };
  
    let result;
    return loadSvg(losangeSVG).then((root) => {
      const vertexSets = select(root, 'path').map(function(path) {
        return Vertices.scale(
          Svg.pathToVertices(path, 30),
          scale.x,
          scale.y,
          Vector.create(100, 100)
        );
      });
      result = Bodies.fromVertices(
        x, // x 
        y, // y
        vertexSets,   
        {
          frictionAir: .1,
          restitution: .25,
          render: {
            sprite: {
              texture: vert,
              xScale: scale.x,
              yScale: scale.y,
            },
          }
        },
        true,
      )
      Composite.add(
        engine.world,
        result
      );
      result.game = {
        id: indexLosanges,
        type: 'life',
        scale: 1,
      };
      indexLosanges++;
      return result;
    });
  }
  for (let i = 0; i < 10; i++) {
    createLosange(Math.random()*sizes.x, Math.random()*sizes.y, vert, {x: .4, y: .4});
  }

  engine.gravity.y = 0;
  
  Composite.add(engine.world, [wallBottom, wallTop, wallLeft, wallRight]);

  window.addEventListener('gamepadconnected', function(e) {

    for (let i = 0; i < 2; i++) {
      const newPlayer = Bodies.circle(
        sizes.x/2,
        sizes.y/2,
        sizes.players.base,
        {
          restitution: .75,
        }
      );

      players.push(newPlayer);
      newPlayer.game = {
        id: i,
        type: 'player',
        health: 10,
        secure: false,
      }
      
      Composite.add(engine.world, [newPlayer]);
    }
    console.log('gamepads connected');
  });

  // run the renderer
  Render.run(render);

  // create runner
  const runner = Runner.create();

  Events.on(runner, 'afterTick', (event) => {
    const speedfactor = 15;
    const pad = navigator.getGamepads() && navigator.getGamepads()[0];
    const [padXJ1, padYJ1, padXJ2, padYJ2] = pad?.axes || [0,0];
    
    if(players.length > 0) {
      Body.setVelocity(players[0], { x: padYJ1*speedfactor, y: -padXJ1*speedfactor });
      Body.setVelocity(players[1], { x: -padYJ2*speedfactor, y: padXJ2*speedfactor });
    }
  });

  Events.on(engine, 'collisionStart', (event) => {
    const e1 = event.pairs[0].bodyA;
    const e2 = event.pairs[0].bodyB;

    if(!e1.game || !e2.game) return;

    if(e2.game.type === 'player' && e1.game.type === 'life') {
      console.log(`player${e2.game.id} get ${e1.game.scale} life points`);
      e2.game.health += e1.game.scale;
      console.log(e2.game);
      
    } else if (e1.game.type === 'player' && e2.game.type === 'life') {
      console.log(`player${e1.game.id} get ${e2.game.scale} life points`);
      e1.game.health += e2.game.scale;
    }

    if(e2.game.type === 'player' && e1.game.type === 'player') {
      if(e2.game.health > e1.game.health) {
        if(!e1.game.secure) {
          e1.game.health = e1.game.health-1;
          e1.game.secure = true;
          setTimeout(() => {
            e1.game.secure = false;
          }, 1000);
        }
      } else if (e2.game.health < e1.game.health) {
        if(!e2.game.secure) {
          e2.game.health = e2.game.health-1;
          e2.game.secure = true;
          setTimeout(() => {
            e2.game.secure = false;
          }, 1000);
        }
      }
    }
    e2.circleRadius = e2.game.health * 4;
    e1.circleRadius = e1.game.health * 4;

  });

  // run the engine
  Runner.run(runner, engine)
});