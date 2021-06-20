const globals = {
    screenWidth: 100,
    screenHeight: 100,
    frameTime: 0,
    width: 1920,
    height: 1080
};

const ship = {
    x: 200,
    y: 200,
    angle: 45,
    thrust: false,
    dx: 0,
    dy: 0,
    dAngle: 0,
    maxSpeed: 10,
    shootWait: 0
};

const bullets = [];
const rocks = [];

function speed(dx, dy) {
    return Math.sqrt(dx*dx + dy*dy);
}

const degToRad = Math.PI / 180;

function cos(angle) {
    return Math.cos(angle * degToRad);
}

function sin(angle) {
    return Math.sin(angle * degToRad);
}

function moveShip() {
    const {width, height} = globals;
    ship.angle += ship.dAngle;
    if (ship.angle < 0) {
        ship.angle += 360;
    } else if (ship.angle > 360) {
        ship.angle -= 360;
    }

    if (ship.thrust) {
        const newdx = ship.dx + cos(ship.angle) * 0.25;
        const newdy = ship.dy - sin(ship.angle) * 0.25;
        if (speed(newdx, newdy) < ship.maxSpeed) {
            ship.dx = newdx;
            ship.dy = newdy;
        }
    }
    ship.x += ship.dx;
    ship.y += ship.dy;
    if (ship.x > width) {
        ship.x -= width;
    } else if (ship.x < 0){
        ship.x += width;
    }
    if (ship.y > height) {
        ship.y -= height;
    } else if (ship.y < 0){
        ship.y += height;
    }
}

function moveBullet(bullet) {
    bullet.life--;
    if (bullet.life <= 0) {
        bullet.remove = true;
        return;
    }
    const {width, height} = globals;
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
    if (bullet.x > width) {
        bullet.x -= width;
    } else if (bullet.x < 0){
        bullet.x += width;
    }
    if (bullet.y > height) {
        bullet.y -= height;
    } else if (bullet.y < 0){
        bullet.y += height;
    }
}
function moveBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        moveBullet(bullet);
        if (bullet.remove) {
            bullets.splice(i, 1);
        }
    }
}
function moveRocks() {}


function drawShip(ctx) {
    const {x,
           y,
           angle,
           thrust} = ship;

    const radius = 30;

    const noseX = x + cos(angle) * radius;
    const noseY = y - sin(angle) * radius;

    const bX = x + cos(angle + 135) * radius;
    const bY = y - sin(angle + 135) * radius;

    const cX = x + cos(angle + 225) * radius;
    const cY = y - sin(angle + 225) * radius;


    ctx.beginPath();
    ctx.moveTo(noseX, noseY);
    ctx.lineTo(bX, bY);
    ctx.lineTo(cX, cY);
    ctx.fillStyle = "#77aaff";
    ctx.fill();
}
function drawBullet(bullet, ctx) {
     ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffff00';
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x + bullet.dx * 10, bullet.y + bullet.dy * 10);
    ctx.stroke();

}
function drawBullets(ctx) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        drawBullet(bullet, ctx);
    }
}
function drawRocks(ctx) {}

function drawBackground(ctx) {
    const {width, height} = globals;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(globals.frameTime, 10, 30);
}

function main() {
    const t0 = performance.now();

    // canvas element in DOM
    const {canvas, bufferCanvas, width, height, screenWidth, screenHeight} = globals;

    // buffer canvas

    const ctx = bufferCanvas.getContext('2d');

    ship.shootWait = Math.max(ship.shootWait - 1, 0);

    moveShip();
    moveBullets();
    moveRocks();

    drawBackground(ctx);

    drawShip(ctx);
    drawBullets(ctx);
    drawRocks(ctx);

    //render the buffered canvas onto the original canvas element
    canvas.getContext('2d').drawImage(bufferCanvas, 0, 0, screenWidth, screenHeight);

    const t1 = performance.now();
    globals.frameTime = t1 - t0;
}

function shoot() {
    if (ship.shootWait > 0) return;
    const newdx = ship.dx + cos(ship.angle) * 3;
    const newdy = ship.dy - sin(ship.angle) * 3;
    const bullet = {
        x: ship.x,
        y: ship.y,
        dx: ship.dx + newdx,
        dy: ship.dy + newdy,
        life: 900 // bullet lasts 90 frames
    }
    bullets.push(bullet);
    console.log(bullets);
}

function keyDown(e) {
    switch (e.keyCode) {
    case 37: // left
        ship.dAngle = 6; break;
    case 39: // right
        ship.dAngle = -6; break;

    case 38: // up
        ship.thrust = true;  break;

    case 32: // space
        shoot();  break;

    }
}

function keyUp(e) {
    switch (e.keyCode) {
    case 37: //left
        ship.dAngle =0 ; break;
    case 39: //right
        ship.dAngle =0 ; break;

    case 38: //right
        ship.thrust = false;  break;

    case 32: // space
        shoot();  break;

    }
}


function initAsteroids() {
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
    globals.canvas = document.getElementById('canvas');
    globals.body = document.querySelector("body")
    globals.bufferCanvas = document.createElement('canvas');
    resize();
    setInterval(main, 17);
}

window.onload = initAsteroids;

const resize = function() {
    const {body, canvas, bufferCanvas} = globals;
    globals.screenWidth = body.clientWidth;
    globals.screenHeight = body.clientHeight;
    canvas.width = globals.screenWidth;
    canvas.height = globals.screenHeight;
    bufferCanvas.width = globals.width;
    bufferCanvas.height = globals.height;
};

window.onresize = resize;
