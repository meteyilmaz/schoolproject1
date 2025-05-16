import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const laser_sound = "./sounds/laser_shot-1.mp3";
const explosion_sound = "./sounds/explosion-1.mp3";
const audioPlayer1 = document.getElementById("audioPlayer1");
const audioPlayer2 = document.getElementById("audioPlayer2");
audioPlayer1.src = laser_sound; audioPlayer1.load();
audioPlayer2.src = explosion_sound; audioPlayer2.load();

const enemys = [];

let lastShootTime = 0;
const shootInterval = 500;

async function SetupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            }
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                video.play();
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Kamera Erişimi Reddedildi: ", error);
    }
}

async function LoadHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    return await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.9,
        numHands: 1
    });
}

function CreatePlayer() {
    const gameContainer = document.querySelector(".game-container");
    const player = document.createElement("div");
    const playerImage = document.createElement("img");

    player.style.position = "absolute";
    player.style.bottom = "20px";
    player.style.left = "50%";
    player.style.width = "60px";
    player.style.height = "80px";
    player.style.transform = "translateX(-50%)";

    playerImage.src = "./images/spaceship.png";
    playerImage.style.width = "100%";
    playerImage.style.height = "100%";

    player.appendChild(playerImage);
    gameContainer.appendChild(player);

    return player;
}

const player = CreatePlayer();

function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShootTime < shootInterval) return;

    lastShootTime = currentTime;

    const bullet = document.createElement("img");
    bullet.src = "./images/spaceshipbullet.png";

    bullet.style.position = "absolute";
    bullet.style.left = `${player.offsetLeft + player.offsetWidth / 2 - 34}px`;
    bullet.style.top = `${player.offsetTop + 10}px`;
    bullet.style.width = "10px";
    bullet.style.height = "30px";

    document.querySelector(".game-container").appendChild(bullet);    

    function MoveBullet() {
        const bulletTop = parseInt(bullet.style.top);

        if (bulletTop <= 0) {
            bullet.remove();
        } else {
            bullet.style.top = `${bulletTop - 50}px`;
            CheckCollision(bullet);
            requestAnimationFrame(MoveBullet);
        }
    }

    MoveBullet();
}

function CheckCollision(bullet) {
    const bulletRect = bullet.getBoundingClientRect();

    enemys.forEach((enemy, index) => {
        const enemyRect = enemy.getBoundingClientRect();

        if (
            bulletRect.left < enemyRect.right &&
            bulletRect.right > enemyRect.left &&
            bulletRect.top < enemyRect.bottom &&
            bulletRect.bottom > enemyRect.top
        ) {
            enemy.remove();
            bullet.remove();
            enemys.splice(index, 1);
            audioPlayer2.play();
        }
    });
}

async function Main() {
    await SetupCamera();
    const handLandmarker = await LoadHandLandmarker();
    const drawingUtils = new DrawingUtils(ctx);

    function DetectHands() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const results = handLandmarker.detectForVideo(video, performance.now());

        if (results.landmarks) {
            results.landmarks.forEach((landmarks) => {
                const middleFingerTip = landmarks[12];
                const ringFingerTip = landmarks[16];

                const palmCenterX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x) / 4;
                const palmCenterY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y) / 4;
                player.style.left = `${(1 - palmCenterX) * 100}%`;

                const middleFingerDistance = Math.sqrt(
                    Math.pow(middleFingerTip.x - palmCenterX, 2) +
                    Math.pow(middleFingerTip.y - palmCenterY, 2)
                );

                const ringFingerTipDistance = Math.sqrt(
                    Math.pow(ringFingerTip.x - palmCenterX, 2) +
                    Math.pow(ringFingerTip.y - palmCenterY, 2)
                );

                if (middleFingerDistance < 0.07 && ringFingerTipDistance < 0.07) {                    
                    shoot();
                    audioPlayer1.play();
                }
            });
        }

        if (enemys.length <= 0) {
            CreateEnemys();
        }

        requestAnimationFrame(DetectHands);
    }

    DetectHands();
}

Main();

function CreateEnemys() {
    const gameContainer = document.querySelector(".game-container");
    const padding = 60;
    let enemyCount = 5;

    const placedEnemys = [];

    function isOverlapping(x, y, width, height) {
        return placedEnemys.some(({ left, top, w, h }) =>
            x < left + w &&
            x + width > left &&
            y < top + h &&
            y + height > top
        );
    }

    function CreateEnemy() {
        const enemy = document.createElement("div");
        const enemyImage = document.createElement("img");
    
        let left, top;
        do {
            left = Math.random() * (gameContainer.offsetWidth - padding * 2 - 50) + padding;
            top = Math.random() * (gameContainer.offsetHeight / 3 - padding * 2 - 70) + padding;
        } while (isOverlapping(left, top, 50, 70));
    
        enemy.style.position = "absolute";
        enemy.style.left = `${left}px`;
        enemy.style.top = `${top}px`;
        enemy.style.width = "70px";
        enemy.style.height = "70px";
    
        enemyImage.src = "./images/meteorite-" + randomNumber(1,2) + ".png";
        enemyImage.style.width = "100%";
        enemyImage.style.height = "100%";
        
        enemy.appendChild(enemyImage);
        
        placedEnemys.push({ left, top, w: 50, h: 70 });
        enemys.push(enemy);
        gameContainer.appendChild(enemy);
    }

    for (let i = 0; i < enemyCount; i++) {
        CreateEnemy();
    }
}

CreateEnemys();

function randomNumber(min, max) {
  return Math.floor(Math.random() * max + min);
}