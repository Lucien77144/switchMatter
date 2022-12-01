const pianoNotes = [
    261.63,
    293.66,
    329.63,
    349.23,
    392.00,
    440.00,
    493.88,
    523.25,
    587.33,
    659.25,
    698.46,
    783.99,
    880.00,
    987.77,
    1046.50,
    1174.66,
    1318.51,
    1396.91,
    1567.98,
];

document.addEventListener('DOMContentLoaded', function() {
    let gamepad;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const sizes = {
        x: window.innerWidth * devicePixelRatio,
        y: window.innerHeight * devicePixelRatio,

        players: {
            base: 40,
            big: 60,
            little: 20,
        },
    };
    const player = {
        x: sizes.x / 2,
        y: sizes.y / 2,
        size: 40,
        sizeState: 0,
        speed: 20,
    }
    let canvas = document.createElement('canvas');
    canvas.width = sizes.x;
    canvas.height = sizes.y;
    let ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    window.addEventListener('gamepadconnected', function() {
        window.requestAnimationFrame(updateJoycon);
    });

    // const BaseAudioContext = window.AudioContext || window.webkitAudioContext
    // const context = new BaseAudioContext()


    // const osc = context.createOscillator()
    // osc.type = 'sine'
    // osc.frequency.value = 430
  
    // const amp = context.createGain()
    // amp.gain.setValueAtTime(1, context.currentTime)
  
    // let lfo = context.createOscillator()
    // lfo.type = 'sine'
    // lfo.frequency.value = 4
  
    // lfo.connect(amp.gain)
    // osc.connect(amp).connect(context.destination)
    // // lfo.start()
    // // osc.start()

    
    // const gradient = ctx.createRadialGradient(110, 90, 30, 100, 100, 70);
    const gradient = ctx.createRadialGradient(sizes.x/2, sizes.y/2, sizes.x/sizes.y, sizes.x/2, sizes.y/2, sizes.y);
    gradient.addColorStop(1, '#000000');
    gradient.addColorStop(0, '#222222');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, sizes.x, sizes.y);

    let flag = true;
    function updateJoycon() {
        let gamepads = navigator.getGamepads();
        console.log(gamepads);
        gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads[0] : []);

        if (flag) {
            flag = false;
            if (gamepad.buttons[0].pressed) {
                player.sizeState = player.sizeState === 0 ? -1 : player.sizeState === 1 ? -1 : 0;
            }
            if (gamepad.buttons[3].pressed) {
                player.sizeState = player.sizeState === 0 ? 1 : player.sizeState === -1 ? 1 : 0;
            }
        }
        if (!flag && !gamepad.buttons[3].pressed && !gamepad.buttons[0].pressed) {
            flag = true;
        }
        
        if (player.sizeState === 1 && player.size < sizes.players.big) {
            player.size = player.size+2;
        }
        if (player.sizeState === -1 && player.size > sizes.players.little) {
            player.size = player.size-2;
        }
        if (player.sizeState === 0) {
            if (player.size < sizes.players.base) {
                player.size = player.size+2;
            } else {
                player.size = player.size-2;
            }
        }

        player.speed = (gamepad.buttons[1].pressed ? 40 : 20) - (player.sizeState * 5);
        console.log(player.speed);

        ctx.clearRect(0, 0, sizes.x, sizes.y);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, sizes.x, sizes.y);

        let circle = new Path2D();
        let newPos = {
            x: player.x + gamepad.axes[0] * player.speed,
            y: player.y + gamepad.axes[1] * player.speed,
        }
        player.x = newPos.x < sizes.x && newPos.x > 0 ? newPos.x : player.x;
        player.y = newPos.y < sizes.y && newPos.y > 0 ? newPos.y : player.y;

        circle.arc(player.x, player.y, player.size, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill(circle);

        window.requestAnimationFrame(updateJoycon);
    }
});