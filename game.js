var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

//potrebne varijable
var PADDLE_WIDTH = 100;
var PADDLE_HEIGHT = 15;
var PADDLE_COLOR = "#ebebeb";
var BALL_SIZE = 10;
var BALL_COLOR = "#e9e9e9";
var BALL_SPEED = 4;
var ROWS = 5;
var COLS = 10;
var BRICK_WIDTH = 80;
var BRICK_HEIGHT = 25;
var BRICK_PADDING_HORIZONTAL = 30; 
var BRICK_PADDING_VERTICAL = 15;
var BRICK_OFFSET_TOP = 70;
var BRICK_OFFSET_LEFT = 30;
var SCORE = 0;
var HIGH_SCORE = localStorage.getItem("breakoutHighScore") || 0; //čuva se high_score u localstorageu
var game_started = false; // Igra počinje tek nakon SPACE
var game_over = false;
// Zvukovi
var sound_brick = new Audio("sounds/brick.wav");
var sound_paddle = new Audio("sounds/wall_padle.wav");
var sound_wall = new Audio("sounds/wall_padle.wav");
var sound_start = new Audio("sounds/start.wav");
var sound_gameover = new Audio("sounds/game-over.wav");
var sound_milestone = new Audio("sounds/milestone.wav");
var sound_winner = new Audio("sounds/win-game.wav");

// RGB boje cigli 
var brick_colors = [
    "rgb(153,51,0)",
    "rgb(255,0,0)",
    "rgb(255,153,204)",
    "rgb(0,255,0)",
    "rgb(255,255,153)"
];

//postavljenja cigle u 5 redova i 10 stupaca po bojama koje su bile tražene
var bricks = [];
for (var r = 0; r < ROWS; r++) {
    bricks[r] = [];
    for (var c = 0; c < COLS; c++) {
        bricks[r][c] = { x: 0, y: 0, status: 1, color: brick_colors[r] };
    }
}

var paddle_x = (canvas.width - PADDLE_WIDTH) / 2; //pozicija paddla
//koristimo ove 2 varijable za desnu i lijevu strelicu
var right_pressed = false; 
var left_pressed = false;

//pozicija lopte
var ball_x = canvas.width / 2;
var ball_y = canvas.height - PADDLE_HEIGHT - BALL_SIZE;
var ball_dx = Math.random() < 0.5 ? BALL_SPEED : -BALL_SPEED;//random da se kreće u desnu ili lijevu stranu
var ball_dy = -BALL_SPEED;

document.addEventListener("keydown", key_down_action, false);
document.addEventListener("keyup", key_up_action, false);

function key_down_action(e) {
    if (e.code === "ArrowRight" || e.key === "Right") right_pressed = true;//kad je stisnuta desna strelica pokrece se paddle desno
    if (e.code === "ArrowLeft" || e.key === "Left") left_pressed = true;//kad je stisnuta lijeva strelica pokrece se paddle lijevo
    //kad se stisne Space pokreće se igra i možemo čuti zvuk kojeg sam stavio za početak igrice
    if (!game_started && e.code === "Space") {
        e.preventDefault();
        game_started = true;
        sound_start.play();
    }
}

//kad nisu stisnute desna i lijeva tipka onda neće se pokrenut ni paddle
function key_up_action(e) {
    if (e.code === "ArrowRight" || e.key === "Right") right_pressed = false;
    if (e.code === "ArrowLeft" || e.key === "Left") left_pressed = false;
}

// crtanje paddla, boja, sijena i velicina
function draw_paddle_action() {
    ctx.fillStyle = PADDLE_COLOR;
    ctx.shadowColor = "white";
    ctx.shadowBlur = 5;
    ctx.fillRect(paddle_x, canvas.height - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);
}
// crtanje lopte, boja, sijena i velicina
function draw_ball_action() {
    ctx.fillStyle = BALL_COLOR;
    ctx.shadowColor = "white";
    ctx.shadowBlur = 5;
    ctx.fillRect(ball_x, ball_y, BALL_SIZE, BALL_SIZE);
}

//crtanje blokova, boja, sijena,veličina i offset koji je razmak medusobno opisan u zadatku
function draw_bricks_action() {
    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
            if (bricks[r][c].status == 1) {
                var brick_x = c * (BRICK_WIDTH + BRICK_PADDING_HORIZONTAL) + BRICK_OFFSET_LEFT;
                var brick_y = r * (BRICK_HEIGHT + BRICK_PADDING_VERTICAL) + BRICK_OFFSET_TOP;
                bricks[r][c].x = brick_x;
                bricks[r][c].y = brick_y;
                ctx.fillStyle = bricks[r][c].color;
                ctx.shadowColor = "white";
                ctx.shadowBlur = 5;
                ctx.fillRect(brick_x, brick_y, BRICK_WIDTH, BRICK_HEIGHT);
            }
        }
    }
}
//detekcija sudara lopte
function collision_detection_action() {
    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
            var b = bricks[r][c];
            if (b.status == 1) {
                // Detekcija sudara
                if (ball_x + BALL_SIZE > b.x && ball_x < b.x + BRICK_WIDTH &&
                    ball_y + BALL_SIZE > b.y && ball_y < b.y + BRICK_HEIGHT) {

                    // Provjeri udar u kut cigle u 2px
                    var hit_left = ball_x < b.x + 2; // lijevi kut
                    var hit_right = ball_x + BALL_SIZE > b.x + BRICK_WIDTH - 2; // desni kut
                    var hit_top = ball_y < b.y + 2; // gornji kut
                    var hit_bottom = ball_y + BALL_SIZE > b.y + BRICK_HEIGHT - 2; // donji kut

                    var hit_corner = (hit_left || hit_right) && (hit_top || hit_bottom);

                    if (hit_corner) {
                        // Ubrzanje loptice za 1%
                        ball_dx *= 1.01;
                        ball_dy *= 1.01;
                    }

                    // Promjena smjera
                    ball_dy = -ball_dy;

                    // Cigla uništena i score update
                    b.status = 0;
                    sound_brick.play();
                    SCORE++;
                    //provjerava jesmo imali novi rekord
                    if (SCORE > HIGH_SCORE) {
                        HIGH_SCORE = SCORE;
                        localStorage.setItem("breakoutHighScore", HIGH_SCORE);
                    }
                    //završi se igra
                    if (SCORE == ROWS * COLS) {
                        game_over = true;
                    }
                    //u svakom milestonu score:10,20,30,40,50 je dodan zvuk
                    if (SCORE % 10 === 0) sound_milestone.play();
                }
            }
        }
    }
}
//crtanje teksta za score i highscore kako je treženo u zadatku
function draw_score_action() {
    ctx.font = "20px Helvetica";
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";

    // Trenutni broj bodova – lijevo poravnanje
    ctx.textAlign = "left"; // lijevo poravnanje
    ctx.fillText("Score: " + SCORE, 20, 20); // 20px od lijevog i 20px od vrha

    // Maksimalni broj bodova – desno poravnanje
    ctx.textAlign = "right"; // desno poravnanje
    ctx.fillText("High Score: " + HIGH_SCORE, canvas.width - 100, 20); // 100px od desnog ruba i 20px od vrha
}
//funkcija koja se koristi kasnije za crtanje gameover ili you win
function draw_text_center_action(text, size, color) {
    ctx.font = `bold ${size}px Helvetica`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function draw_action() {
    //počistimo sve da ne bi došlo do neke nepotrebne greške
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //ovdje provjerimo jel počela igra ako nije onda se izvršava kod u if-u
    if (!game_started) {

        //prije početka igrice moralo se pisati na sredinu riječ BREAKOUT, veličine 36px, boldano, Helvetic ili Vedrana i bijele boje
        
        ctx.font = "bold 36px Helvetica";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("BREAKOUT", canvas.width / 2, canvas.height / 2);

        //ovdje je traženo da tekst press space to begin bude bijle boje,bold italic i Helvetica ili Vedrana
        //također da bude 10 px ispod gornjeg tekst BREAKOUT, gornji tekst je velicine 36px zato sam koristio 36 + 10
        
        ctx.font = "bold italic 18px Helvetica";
        ctx.fillText("Press SPACE to begin", canvas.width / 2, canvas.height / 2 + 36 + 10);

        //funkcija koja stalno pozove draw_action
        requestAnimationFrame(draw_action);
        return;
    }
    //pozovemo funkcije za crtanje
    draw_bricks_action();
    draw_ball_action();
    draw_paddle_action();
    collision_detection_action();
    draw_score_action();

    // provjeravamo sudar lopte sa zidovima i paddle
    //prvo se provjerava za desni i lijevi zid
    if (ball_x + ball_dx > canvas.width - BALL_SIZE || ball_x + ball_dx < 0) {
        ball_dx = -ball_dx;
        sound_wall.play();
    }
    //provjera za gornji zid
    if (ball_y + ball_dy < 0) {
        ball_dy = -ball_dy;
        sound_wall.play();
    } else if (ball_y + ball_dy > canvas.height - BALL_SIZE) {
        if (ball_x > paddle_x && ball_x < paddle_x + PADDLE_WIDTH) {//provjera za paddle
            ball_dy = -ball_dy;
            sound_paddle.play();
        } else {//ako nije paddle onda sigurno će biti donji zid a to znači da je igra izgubljena
            game_over = true;
            sound_gameover.play();
        }
    }
    //ovdje je pomicanje paddla s desnom i lijevom strelicom
    if (right_pressed && paddle_x < canvas.width - PADDLE_WIDTH) {
        paddle_x += 7;
    }
    if (left_pressed && paddle_x > 0) {
        paddle_x -= 7;
    }
    //pokretanje lopte
    ball_x += ball_dx;
    ball_y += ball_dy;
    //ako smo izgubili ili pobjedili onda pozovemo funkciju što smo gore napravili za upis teksta na sredinu
    if (game_over) {
        draw_text_center_action(SCORE == ROWS * COLS ? "YOU WIN!" : "GAME OVER", 40, "yellow");
        return;
    }
    //opet koristimo funkciju koja traži da se pozove draw_action funkcija
    requestAnimationFrame(draw_action);
}

draw_action();


