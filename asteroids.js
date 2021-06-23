const global = {
    screenWidth: 100,
    screenHeight: 100,
    frameTime: 0,
    width: 1920,
    height: 1080,
    ships: 5,
    level: 1,
    smartBombs: 0
};

function click(e) {
    console.log(e);
    
}

function initAsteroids() {
    global.smallestRock = 100;
    ship.x = global.width / 2;
    ship.y = global.height / 2;
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
    document.addEventListener('click', click);
    global.canvas = document.getElementById('canvas');
    global.body = document.querySelector("body")
    global.bufferCanvas = document.createElement('canvas');
    resize();
    global.level = 0;
    nextLevel();
    setInterval(main, 17);
}

const ship = {
    x: 200,
    y: 200,
    angle: 45,
    thrust: false,
    dx: 0,
    dy: 0,
    dAngle: 0,
    maxSpeed: 10,
    shoot: false,
    shootWait: 0
};
const bullets = [];
const rocks = [];
const enemies = []
const particles = [];
const messages = [];


function addEnemy(x, y) {
    const {width, height} = global;
    const size = 100;
    const noPoints = 18;
    const points = [];
    const halfSize = Math.floor(size / 2);
    const anglePerPoint = 360 / 18;
    for(let i = 0; i < noPoints; i++) {
        points.push({
            r: halfSize + Math.random() * halfSize,
            theta: i * anglePerPoint
        })
    }
    x = x == null ? Math.random() * width : x;
    y = y == null ? Math.random() * height : y;
    const dx = 2 * (Math.random() - 0.5);
    const dy = 2 * (Math.random() - 0.5);
    const dAngle = (Math.random() - 0.5) / 4;
    const h = Math.random() * 360;
    const fillStyle =  `hsl(${h},100%,50%)`;
    const enemy = {points, x, y, dAngle, angle: 0, dx, dy, fillStyle, size};
    moveEnemy(enemy);
    enemies.push(enemy);
}

function moveEnemy(enemy) {
    const {width, height} = global;
    enemy.angle += enemy.dAngle;
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
    if (enemy.x > width) {
        enemy.x -= width;
    } else if (enemy.x < 0){
        enemy.x += width;
    }
    if (enemy.y > height) {
        enemy.y -= height;
    } else if (enemy.y < 0){
        enemy.y += height;
    }
    // need to convert to cartesian
    enemy.coords = enemy.points.map(({r, theta}) => {
        theta += enemy.angle
        const x = enemy.x + cos(theta) * r;
        const y = enemy.y - sin(theta) * r;
        return {x, y};
    });
}

function moveEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        moveEnemy(enemy);
        if (enemy.remove) {
            enemies.splice(i, 1);
        }
    }
    if (enemies.length == 0) {
        nextLevel();
    } else if (enemies.length > 10000) {
        enemies.splice(10000)
    }
}

function drawEnemies(ctx) {
    enemies.forEach(r => drawEnemy(r, ctx));
}

function drawEnemy(enemy, ctx) {
    // enemy is a bunch of polar coordinates
    const {width, height} = global;
    const {coords, angle, fillStyle} = enemy;
    let repeatRight = false;
    let repeatLeft = false;
    let repeatBottom = false;
    let repeatTop = false;
    for (let i = 0; i < coords.length; i++) {
        let {x, y} = coords[i];
        if (x < 0) repeatRight = true;
        else if (x > width) repeatLeft = true;
        if (y < 0) repeatBottom = true;
        else if (y> height) repeatTop = true;
    }
    const oxs = [0];
    const oys = [0];
    if (repeatRight) oxs.push(width);
    if (repeatLeft) oxs.push(-width);
    if (repeatTop) oys.push(-height);
    if (repeatBottom) oys.push(height);
    for (let ox of oxs) {
        for (let oy of oys) {
            ctx.beginPath();
            for (let i = 0; i < coords.length; i++) {
        let {x, y} = coords[i];
        if (i == 0) {
            ctx.moveTo(x + ox, y + oy);
        } else {
            ctx.lineTo(x + ox, y + oy);
        }
    }
    ctx.lineTo(coords[0].x + ox, coords[0].y + oy);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    }
    }
}


function moveMessage(message) {
    message.life--;
    if (message.life <= 0) {
        message.remove = true;
        return;
    }
    const {width, height} = global;
    message.x += message.dx;
    message.y += message.dy;
    if (message.x > width) {
        message.x -= width;
    } else if (message.x < 0){
        message.x += width;
    }
    if (message.y > height) {
        message.y -= height;
    } else if (message.y < 0){
        message.y += height;
    }
}

function moveMessages() {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        moveMessage(message);
        if (message.remove) {
            messages.splice(i, 1);
        }
    }
}

function drawMessage(message, ctx) {
    ctx.fillStyle = `rgb(255,${message.life},0)`;
    ctx.lineTo(message.x + message.ox, message.y + message.oy);
    ctx.font = message.font
    ctx.fillText(message.text, message.x, message.y);
}

function drawMessages(ctx) {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        drawMessage(message, ctx);
    }
}

function moveParticle(particle) {
    particle.life--;
    if (particle.life <= 0) {
        particle.remove = true;
        return;
    }
    const {width, height} = global;
    particle.x += particle.dx;
    particle.y += particle.dy;
    if (particle.x > width) {
        particle.x -= width;
    } else if (particle.x < 0){
        particle.x += width;
    }
    if (particle.y > height) {
        particle.y -= height;
    } else if (particle.y < 0){
        particle.y += height;
    }
}

function moveParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        moveParticle(particle);
        if (particle.remove) {
            particles.splice(i, 1);
        }
    }
}

function drawParticle(particle, ctx) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgb(255,${particle.life},0)`;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x + particle.ox, particle.y + particle.oy);
    ctx.stroke();
}

function drawParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        drawParticle(particle, ctx);
    }
}

function speed(dx, dy) {
    return Math.sqrt(dx*dx + dy*dy);
}
const degToRad = Math.PI / 180;

function shipCollision() {
    for (const r of rocks) {
        if (inside(ship, r.coords)) {
            return true;
        }
    }
    return false;
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function hitShip() {
    global.ships--;
    explosion(ship.x, ship.y, 30);
    if (global.ships == 0) {
        ship.remove = true;
            messages.push({
                text: "Game Over :-(",
        x:800,
                  y:600,
                  dx:0,
                  dy:0.5,
                  font: '100px serif',
                  life: 200});
    }


    ship.dx = 0;
    ship.dy = 0;
    while(shipCollision()) {
        ship.x = Math.random() * global.width;
        ship.y = Math.random() * global.height;
    }

    for(let r of rocks) {
        if (distance(r, ship) < 1000) {
            r.dx = r.x - ship.x
            r.dy = r.y - ship.y
            const s = speed(r.dx, r.dy);
            if (s > 1) {
                r.dx /= s;
                r.dy /= s;
            }
        }
    }
}

function cos(angle) {
    return Math.cos(angle * degToRad);
}

function sin(angle) {
    return Math.sin(angle * degToRad);
}

function addThrustParticle() {
    const thrustAngle = 180 + ship.angle + (Math.random()-0.5) * 15;
    const ox =  cos(thrustAngle) * 5
    const oy = -sin(thrustAngle) * 5;
    const dx = ship.dx + ox;
    const dy = ship.dy + oy;
    particles.push({x: ship.x,
                    y: ship.y,
                    dx,
                    dy,
                    ox,
                    oy,
                    angle: thrustAngle,
                    life: 100});
}

function explosion(x, y, size) {
    if (global.frameTime > 16) {
        return;
    }
    const angleIncrement = 5 + global.frameTime;
    for (let angle = 0; angle < 360; angle += angleIncrement) {
        const r = Math.random()*20;
        const ox =  cos(angle) * r
        const oy = -sin(angle) * r;
            particles.push({x,
                    y,
                            dx: ox,
                            dy: oy,
                    ox,
                    oy,
                    angle,
                    life: size});
    }
}

function moveShip() {
    if (ship.remove) {
        return;
    }
    const {width, height} = global;
    if (shipCollision()) {
            hitShip();
        return;
    }
    ship.angle += ship.dAngle;
    if (ship.angle < 0) {
        ship.angle += 360;
    } else if (ship.angle > 360) {
        ship.angle -= 360;
    }
    if (ship.thrust) {
        const newdx = ship.dx + cos(ship.angle) * 0.25;
        const newdy = ship.dy - sin(ship.angle) * 0.25;
        addThrustParticle();
        if (speed(newdx, newdy) <= ship.maxSpeed) {
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

function hitRock(rock) {
    rock.remove = true;
    explosion(rock.x, rock.y, rock.size/10);
    const newRockSize = rock.size / 2;
    if (newRockSize < global.smallestRock || rocks.length > 500) return;
    for(let i = 0; i< 3; i++){
        addRock(newRockSize, rock.x, rock.y);
    }
}

function moveBullet(bullet) {
    bullet.life--;
    if (bullet.life <= 0) {
        bullet.remove = true;
        return;
    }
    const {width, height} = global;
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
    for(let i = 0; i < rocks.length; i++) {
        const r = rocks[i];
        if (inside(bullet, r.coords)) {
            hitRock(r);
            bullet.remove = true;
            break;
        }
    }
}

function inside(bullet, coords) {
    if (coords == null) return;
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    const {x, y} = bullet;
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        let xi = coords[i].x, yi = coords[i].y;
        let xj = coords[j].x, yj = coords[j].y;
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

function moveBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        moveBullet(bullet);
        if (bullet.remove) {
            bullets.splice(i, 1);
        }
    }
}

function addRock(size, x, y) {
    const {width, height} = global;
    const noPoints = 18;
    const points = [];
    const halfSize = Math.floor(size / 2);
    const anglePerPoint = 360 / 18;
    for(let i = 0; i < noPoints; i++) {
        points.push({
            r: halfSize + Math.random() * halfSize,
            theta: i * anglePerPoint
        })
    }
    x = x == null ? Math.random() * width : x;
    y = y == null ? Math.random() * height : y;
    const dx = 2 * (Math.random() - 0.5);
    const dy = 2 * (Math.random() - 0.5);
    const dAngle = (Math.random() - 0.5) / 4;
    const h = Math.random() * 360;
    const fillStyle =  `hsl(${h},100%,50%)`;
    const rock = {points, x, y, dAngle, angle: 0, dx, dy, fillStyle, size};
    moveRock(rock);
    rocks.push(rock);
}

function moveRock(rock) {
    const {width, height} = global;
    rock.angle += rock.dAngle;
    rock.x += rock.dx;
    rock.y += rock.dy;
    if (rock.x > width) {
        rock.x -= width;
    } else if (rock.x < 0){
        rock.x += width;
    }
    if (rock.y > height) {
        rock.y -= height;
    } else if (rock.y < 0){
        rock.y += height;
    }
    // need to convert to cartesian
    rock.coords = rock.points.map(({r, theta}) => {
        theta += rock.angle
        const x = rock.x + cos(theta) * r;
        const y = rock.y - sin(theta) * r;
        return {x, y};
    });
}

function moveRocks() {
    for (let i = rocks.length - 1; i >= 0; i--) {
        const rock = rocks[i];
        moveRock(rock);
        if (rock.remove) {
            rocks.splice(i, 1);
        }
    }
    if (rocks.length == 0) {
        nextLevel();
    } else if (rocks.length > 10000) {
        rocks.splice(10000)
    }
}

function drawRocks(ctx) {
    rocks.forEach(r => drawRock(r, ctx));
}

function drawRock(rock, ctx) {
    // rock is a bunch of polar coordinates
    const {width, height} = global;
    const {coords, angle, fillStyle} = rock;
    let repeatRight = false;
    let repeatLeft = false;
    let repeatBottom = false;
    let repeatTop = false;
    for (let i = 0; i < coords.length; i++) {
        let {x, y} = coords[i];
        if (x < 0) repeatRight = true;
        else if (x > width) repeatLeft = true;
        if (y < 0) repeatBottom = true;
        else if (y> height) repeatTop = true;
    }
    const oxs = [0];
    const oys = [0];
    if (repeatRight) oxs.push(width);
    if (repeatLeft) oxs.push(-width);
    if (repeatTop) oys.push(-height);
    if (repeatBottom) oys.push(height);
    for (let ox of oxs) {
        for (let oy of oys) {
            ctx.beginPath();
            for (let i = 0; i < coords.length; i++) {
        let {x, y} = coords[i];
        if (i == 0) {
            ctx.moveTo(x + ox, y + oy);
        } else {
            ctx.lineTo(x + ox, y + oy);
        }
    }
    ctx.lineTo(coords[0].x + ox, coords[0].y + oy);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    }
    }
}

function drawShip(ctx) {
    if (ship.remove) {
        return;
    }
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
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgb(255,${bullet.life},0)`;
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x + bullet.ox, bullet.y + bullet.oy);
    ctx.stroke();
}

function drawBullets(ctx) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        drawBullet(bullet, ctx);
    }
}

function drawBackground(ctx) {
    const {width, height} = global;
    ctx.fillStyle = "#001122";
    ctx.fillRect(0, 0, width, height);
}

function drawForeground(ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.font = '10px serif';
    ctx.fillText(global.frameTime, 10, 30);
    ctx.font = '50px serif';
    ctx.fillText(global.ships, global.width - 500, 60);
    ctx.fillText("ZZZZZZZZZZ".substring(0, global.smartBombs), global.width - 200, 60);
}

function main() {
    const t0 = performance.now();
    const {canvas, bufferCanvas, width, height, screenWidth, screenHeight} = global;
    const ctx = bufferCanvas.getContext('2d');
    shoot();
    moveShip();
    moveBullets();
    moveRocks();
    moveParticles();
    moveMessages(ctx);
    drawBackground(ctx);
    drawBullets(ctx);
    drawParticles(ctx);
    drawShip(ctx);
    drawRocks(ctx);
    drawEnemies(ctx);
    drawMessages(ctx);
    drawForeground(ctx);
    //render the buffered canvas onto the original canvas element
    canvas.getContext('2d').drawImage(bufferCanvas, 0, 0, screenWidth, screenHeight);
    const t1 = performance.now();
    global.frameTime = t1 - t0;
}

function smartBomb() {
    if (ship.remove || ship.shootWait > 0 || global.smartBombs <=0 ) return;
    ship.shootWait = Math.max(ship.shootWait - 1, 0);
    ship.shootWait = 30;
    if (bullets.length > 5000) {
        return;
    }
    global.smartBombs--;
    for (let angle = 0; angle < 360; angle += 4){
        const ox =  cos(angle) * 3;
        const oy =  -sin(angle) * 3;
        const bullet = {
            ox: ox,
            oy: oy,
            x: ship.x + ox,
            y: ship.y + oy,
            dx: ship.dx + ox,
            dy: ship.dy + oy,
            life: 255 // bullet lasts 90 frames
        }
        bullets.push(bullet);
    }

}

function shoot() {
    ship.shootWait = Math.max(ship.shootWait - 1, 0);
    if (ship.remove || !ship.shoot || ship.shootWait > 0) return;
    ship.shootWait = 10;
    const ox =  cos(ship.angle) * 6;
    const oy =  -sin(ship.angle) * 6;
    const bullet = {
        ox: ox,
        oy: oy,
        x: ship.x + ox,
        y: ship.y + oy,
        dx: ship.dx + ox,
        dy: ship.dy + oy,
        life: 90 // bullet lasts 90 frames
    }
    bullets.push(bullet);
}

function keyDown(e) {
    console.log(e.keyCode);
    switch (e.keyCode) {
    case 37: // left
        ship.dAngle = 6; break;
    case 39: // right
        ship.dAngle = -6; break;
    case 38: // up
        ship.thrust = true;  break;
    case 32: // space
        ship.shoot = true;  break;
    case 90: // space
        smartBomb();  break;
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
        ship.shoot = false;  break;
    }
}

function nextLevel() {
    global.level++;
    global.smartBombs++;
    bullets.splice(0);
    global.smallestRock = Math.max(100 - global.level * 10, 50);
        messages.push({
        text: "Level "+global.level,
        x:500,
                  y:500,
                  dx:0,
                  dy:-1,
                  font: '100px serif',
                  life: 100});
    for(let i = 0; i< Math.min(global.level, 5); i++){
        addRock(100 * global.level, 0, 0);
    }
    addEnemy(500, 500);
    while(shipCollision()) {
        ship.x = Math.random() * global.width;
        ship.y = Math.random() * global.height;
    }
}



const resize = function() {
    const {body, canvas, bufferCanvas} = global;
    global.screenWidth = body.clientWidth;
    global.screenHeight = body.clientHeight;
    canvas.width = global.screenWidth;
    canvas.height = global.screenHeight;
    bufferCanvas.width = global.width;
    bufferCanvas.height = global.height;
};

window.onresize = resize;
window.onload = initAsteroids;
