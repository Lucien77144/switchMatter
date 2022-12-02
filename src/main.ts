import * as Matter from 'matter-js'

import 'pathseg'

import losangeSVG from './svg/losange.svg';
import vert from './svg/vert.svg';
import rouge from './svg/rouge.svg';
import violet from './svg/violet.svg';

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
      wireframes: false,
      showVelocity: true,
    }
  });

  render.canvas.width = sizes.x;
  render.canvas.height = sizes.y;

  // create two boxes and a ground

  const bw = 20000;
  const wallTop = Bodies.rectangle(sizes.x/2+(bw/2), -(bw/2), sizes.x+bw, bw, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallBottom = Bodies.rectangle(sizes.x/2+(bw/2), sizes.y+(bw/2), sizes.x+bw, bw, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallLeft = Bodies.rectangle(-(bw/2), sizes.y/2+(bw/2), bw, sizes.y+bw, { isStatic:true, render: { fillStyle: 'transparent' } });
  const wallRight = Bodies.rectangle(sizes.x+(bw/2), sizes.y/2+(bw/2), bw, sizes.y+bw, { isStatic:true, render: { fillStyle: 'transparent' } });

  let indexLosanges = 0;
  const createLosange = (x=500, y=500, type=vert, scale = {x: .4, y: .4}, action = 4, health=Math.floor(Math.random()*10+1)) => {
    const select = (root: any, selector:any) => {
      return Array.prototype.slice.call(root.querySelectorAll(selector));
    };
    const loadSvg = (url: string) => {
      return fetch(url)
        .then(function(response) { return response.text(); })
        .then(function(raw) { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
    };
  
    let result;
    loadSvg(losangeSVG).then((root) => {
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
              texture: type,
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
        scale: action,
        health: health,
      };
      indexLosanges++;
    });
  }
  for (let i = 0; i < 4; i++) {
    const scale = Math.random()*.4+.4;
    createLosange(Math.random()*sizes.x, Math.random()*sizes.y, vert, {x: scale, y: scale}, Math.random()*3+1);
  }
  for (let i = 0; i < 7; i++) {
    const scale = Math.random()*.4+.3;
    createLosange(Math.random()*sizes.x, Math.random()*sizes.y, rouge, {x: scale, y: scale}, -3);
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
        health: sizes.players.base,
        secure: false,
        prevScale: 1,
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

    if(e1.game.type === 'life' && e1.game.health < 1) {
      Composite.remove(engine.world, e1);
    } else if (e2.game.type === 'life' && e2.game.health < 1) {
      Composite.remove(engine.world, e2);
    }

    if(e2.game.type === 'player' && e1.game.type === 'life' && e1.game.health > 0) {
      e2.game.health += e1.game.scale; 
      if(e1.game.scale > 0) {
        e1.game.health--;
        playPositiveCollisionSound();
      } else {
        createLosange(e2.position.x, e2.position.y, violet, {x: .5, y: .5}, 3, 1);
        playNegativeCollisionSound();
      }
      scalePlayer(e2);
    } else if (e1.game.type === 'player' && e2.game.type === 'life' && e2.game.health > 0) {
      e1.game.health += e2.game.scale;
      if(e2.game.scale > 0) {
        e2.game.health--;
        playPositiveCollisionSound();
      } else {
        createLosange(e1.position.x, e1.position.y, violet, {x: .5, y: .5}, 3, 1);
        playNegativeCollisionSound();
      }
      scalePlayer(e1);
    }

    if(e2.game.type === 'player' && e1.game.type === 'player') {
      if(e2.game.health > e1.game.health) {
        if(!e1.game.secure) {
          e1.game.health = e1.game.health-8;
          scalePlayer(e1);
        }
      } else if (e2.game.health < e1.game.health) {
        if(!e2.game.secure) {
          e2.game.health = e2.game.health-8;
          scalePlayer(e2);
        }
      }
    }
    console.log(e1.game.health);
  });

  function scalePlayer(p) {
    if (p.game.health <= 0) {
      window.alert('le joueur ' + p.game.id + ' est mort');
      window.location.reload();
    }

    p.game.secure = true;
    setTimeout(() => {
      p.game.secure = false;
    }, 1000);
    
    Body.scale(p, (1/p.game.prevScale), (1/p.game.prevScale));
    p.game.prevScale = p.game.health/sizes.players.base;
    Body.scale(p, p.game.prevScale, p.game.prevScale);
    Body.setDensity(p, p.game.health/sizes.players.base);
  }

  
  const BaseAudioContext = window.AudioContext || window.webkitAudioContext
  const context = new BaseAudioContext();
  
  function playNegativeCollisionSound() {
    // piano do : 
    const freq = 261.63;
    const gain = 0.5;
    const attack = 0.01;
    const decay = 0.1;
    const sustain = 0.5;
    const release = 0.1;

    const osc = context.createOscillator();
    const gainNode = context.createGain();
    osc.connect(gainNode);
    gainNode.connect(context.destination);
    osc.frequency.value = freq;
    gainNode.gain.value = 0;
    osc.start(0);
    gainNode.gain.linearRampToValueAtTime(gain, context.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(gain * sustain, context.currentTime + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + attack + decay + release);
    osc.stop(context.currentTime + attack + decay + release);
  }

  function playPositiveCollisionSound() {
    // piano la : 
    const freq = 440;
    const gain = 0.5;
    const attack = 0.01;
    const decay = 0.1;
    const sustain = 0.5;
    const release = 0.1;

    const osc = context.createOscillator();
    const gainNode = context.createGain();
    osc.connect(gainNode);
    gainNode.connect(context.destination);
    osc.frequency.value = freq;
    gainNode.gain.value = 0;
    osc.start(0);
    gainNode.gain.linearRampToValueAtTime(gain, context.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(gain * sustain, context.currentTime + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + attack + decay + release);
    osc.stop(context.currentTime + attack + decay + release);
  }

  // run the engine
  Runner.run(runner, engine)
});