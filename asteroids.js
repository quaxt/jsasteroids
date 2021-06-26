const global = {
    screenWidth: 100,
    screenHeight: 100,
    frameTime: 0,
    width: 1920,
    height: 1080,
    ships: 5,
    level: 1,
    smartBombs: 0,
    enemyFrequency: 60,
    maxEnemies: 50
};

function initAsteroids() {
    global.smallestRock = 100;
    ship.x = global.width / 2;
    ship.y = global.height / 2;
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
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
    shootWait: 0,
    invulnerability: 0
};
const bullets = [];
const rocks = [];
const enemies = []
const particles = [];
const messages = [];

function coordsToPoints(cx, cy, coords) {
    return coords.map(({x, y}) => {
        const nx = x - cx;
        const ny = cy - y;
        const r = Math.sqrt(nx * nx + ny * ny);
        const theta = Math.atan2(ny, nx)*180/Math.PI
        return {r, theta}
    })
}
function addEnemy() {
    if (enemies.length >= Math.min(global.level, global.maxEnemies)) {
        return;
    }
    const x = global.width * Math.random();
    const y = 0;
    const points = [
    {r: 39.59797974644666, theta: -225},
    {r: 39.59797974644666, theta: 45},
    {r: 5.656854249492381, theta: 45},
    {r: 52.15361924162119, theta: 4.3987053549955135},
    {r: 52.15361924162119, theta: -4.3987053549955135},
    {r: 5.656854249492381, theta: -45},
    {r: 39.59797974644666, theta: -45},
    {r: 39.59797974644666, theta: -135},
    {r: 5.656854249492381, theta: -135},
        {r: 5.656854249492381, theta: -225},
        {r: 39.59797974644666, theta: -225}];
    const dx = 0;
    const dy = 0;
    const dAngle = 0;
    const h = Math.random() * 360;
    const fillStyle =  `hsl(${h},100%,50%)`;
    const maxSpeed = 2;
    const enemy = {points, x, y, dAngle, angle: 0, dx, dy, fillStyle, maxSpeed};
    moveEnemy(enemy);
    enemies.push(enemy);
}

function polarToCartesian(x, y, angle, points) {
    return points.map(({r, theta}) => {
        theta += angle
        return {x: x + cos(theta) * r, y: y - sin(theta) * r};
    });
}

function moveEnemy(enemy) {
    const {width, height} = global;
    enemy.angle += enemy.dAngle;
        if (enemy.angle < 0) {
        enemy.angle += 360;
    } else if (enemy.angle > 360) {
        enemy.angle -= 360;
    }

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
    if (!ship.remove && Math.random()<0.05) {
        enemyShoot(enemy);
    }

    const newdx = enemy.dx + cos(enemy.angle) * 0.50;
    const newdy = enemy.dy - sin(enemy.angle) * 0.50;

    if (speed(newdx, newdy) <= enemy.maxSpeed) {
        enemy.dx = newdx;
        enemy.dy = newdy;
    }

    enemy.x += enemy.dx;
    enemy.y += enemy.dy;

    enemy.coords = polarToCartesian(enemy.x, enemy.y, enemy.angle, enemy.points);
    controlEnemy(enemy);
}

function diff(a, b) {
    return Math.abs(a - b);
}


/** thrust or turn so as to get near player ship */
function controlEnemy(enemy) {
    if (!ship.remove) {
        const cx = enemy.x;
        const cy = enemy.y;
        const x = ship.x -cx;
        const y = cy - ship.y;
        const r = Math.sqrt(x * x + y * y);
        let theta = Math.atan2(y, x)*180/Math.PI;
        /// theta is where we want to point
        /// angle is where we are pointing
        // naively if theta > angle then dAngle should be positive
        // but because we're dealing with turns we need to make sure we
        // don't go the long way around
        let angle = enemy.angle;
        let dAngle = 0;
        if (theta < 0) {
            theta += 360;
        }
        if(diff(theta, angle) > 180) {
            if (angle < theta) {
                angle+=360;
            } else {
                theta+=360;
            }
        }
        enemy.dAngle = (!ship.remove) ? Math.sign(theta - angle) * 6 : 0
    } else {
        enemy.dAngle = 0;
    }
}

function moveEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        moveEnemy(enemy);
        if (enemy.remove) {
            enemies.splice(i, 1);
        }
    }
}

function drawEnemies(ctx) {
    enemies.forEach(r => drawEnemy(r, ctx));
}

function drawEnemy(enemy, ctx) {
    const {width, height} = global;
    const {coords, angle, fillStyle} = enemy;
    ctx.beginPath();
    for (let i = 0; i < coords.length; i++) {
        let {x, y} = coords[i];
        if (i == 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.fillStyle = fillStyle;
    ctx.fill();
    let {x, y} = enemy;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
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
    if (ship.invulnerability) {
        return false;
    }
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
    if(ship.remove || ship.invulnerability) {
        return;
    }
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
    } else {
        ship.invulnerability = 300;
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
    if (ship.invulnerability > 0) {
        ship.invulnerability--;
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
    const radius = 30;
    const {x, y, angle} = ship;
    ship.coords = [
        {x: x + cos(angle) * radius, y: y - sin(angle) * radius},
        {x: x + cos(angle + 135) * radius, y: y - sin(angle + 135) * radius},
        {x: x + cos(angle + 225) * radius, y: y - sin(angle + 225) * radius},
    ];
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

function moveBullet() {
    this.life--;
    if (this.life <= 0) {
        this.remove = true;
        return;
    }
    const {width, height} = global;
    this.x += this.dx;
    this.y += this.dy;
    if (this.x > width) {
        this.x -= width;
    } else if (this.x < 0){
        this.x += width;
    }
    if (this.y > height) {
        this.y -= height;
    } else if (this.y < 0){
        this.y += height;
    }
    for(const r of rocks) {
        if (inside(this, r.coords)) {
            hitRock(r);
            this.remove = true;
            break;
        }
    }
    for(const e of enemies) {
        if (inside(this, e.coords)) {
            e.remove = true;
            explosion(e.x, e.y, 50);
            this.remove = true;
            break;
        }
    }

}

function moveEnemyBullet() {
    this.life--;
    if (this.life <= 0) {
        this.remove = true;
        return;
    }
    const {width, height} = global;
    this.x += this.dx;
    this.y += this.dy;
    if (this.x > width) {
        this.x -= width;
    } else if (this.x < 0){
        this.x += width;
    }
    if (this.y > height) {
        this.y -= height;
    } else if (this.y < 0){
        this.y += height;
    }
    if (inside(this, ship.coords)) {
        hitShip()
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
        bullet.move();
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
    rock.coords = polarToCartesian(rock.x, rock.y, rock.angle, rock.points);
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

    ctx.beginPath();
    const coords = ship.coords;
    ctx.moveTo(coords[0].x, coords[0].y);
    ctx.lineTo(coords[1].x, coords[1].y);
    ctx.lineTo(coords[2].x, coords[2].y);
    ctx.fillStyle = "#77aaff";
    if (ship.invulnerability) {
        const hue = ship.invulnerability * 3.6;
        ctx.fillStyle=`hsl(${hue},100%,50%)`;
    }
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

function enemyShoot(enemy) {
    const ox =  cos(enemy.angle) * 6;
    const oy =  -sin(enemy.angle) * 6;
    const bullet = {
        ox: ox,
        oy: oy,
        x: enemy.x + ox,
        y: enemy.y + oy,
        dx: enemy.dx + ox,
        dy: enemy.dy + oy,
        life: 90,
        move: moveEnemyBullet
    }
    bullets.push(bullet);
}

function main() {
    const t0 = performance.now();
    const {canvas, bufferCanvas, width, height, screenWidth, screenHeight} = global;
    const ctx = bufferCanvas.getContext('2d');
    shoot();
    moveShip();
    moveBullets();
    moveRocks();
    moveEnemies();
    moveParticles();
    moveMessages(ctx);
    drawBackground(ctx);
    drawBullets(ctx);
    drawParticles(ctx);
    drawRocks(ctx);
    drawShip(ctx);
    drawEnemies(ctx);
    drawMessages(ctx);
    drawForeground(ctx);
    if (global.timeTillNextEnemy-- <= 0) {
        global.timeTillNextEnemy = global.enemyFrequency;
        addEnemy();
    }
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
            life: 255,
            move: moveBullet
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
        life: 90,
        move: moveBullet
    }
    bullets.push(bullet);
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
    global.timeTillNextEnemy = global.enemyFrequency;
    global.smartBombs++;
    bullets.splice(0);
    enemies.splice(0);
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
