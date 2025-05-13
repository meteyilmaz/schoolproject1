import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let isTouching = false;
let canShoot = true;
let hitCount = 0;
let upgradeLevel = 0;
const maxUpgradeLevel = 2;
const upgradeImages = [
    "./Images/ship_upgrade_1.png",
    "./Images/ship_upgrade_2.png",
    "./Images/ship_upgrade_3.png"
];


const enemys = [];

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
        numHands: 1,
    });
}

function CreatePlayer() {
    const gameContainer = document.querySelector(".game-container");
    const player = document.createElement("div");
    const playerImage = document.createElement("img");

    player.classList.add("player"); // class ekledik ki sonradan kolay erişelim
    playerImage.classList.add("player-image");

    player.style.position = "absolute";
    player.style.bottom = "12px";
    player.style.left = "50%";
    player.style.width = "80px";
    player.style.height = "120px";
    player.style.transform = "translateX(-50%)";

    playerImage.src = upgradeImages[upgradeLevel];
    playerImage.style.width = "100%";
    playerImage.style.height = "100%";

    player.appendChild(playerImage);
    gameContainer.appendChild(player);

    return player;
}


const player = CreatePlayer();

function Shoot() {
    if (!canShoot) return;
    canShoot = false;

    const playerRect = player.getBoundingClientRect();
    const bulletPositions = [];

    if (upgradeLevel === 0) {
        bulletPositions.push(playerRect.left + playerRect.width / 2 - 465);
    } else if (upgradeLevel === 1) {
        bulletPositions.push(playerRect.left + 10 - 465); // sol
        bulletPositions.push(playerRect.right - 10 - 465); // sağ
    } else if (upgradeLevel === 2) {
        bulletPositions.push(playerRect.left + 5 - 465); // dış sol
        bulletPositions.push(playerRect.left + 20 - 465); // iç sol
        bulletPositions.push(playerRect.right - 20 - 465); // iç sağ
        bulletPositions.push(playerRect.right - 5 - 465); // dış sağ
    }

    bulletPositions.forEach((pos) => {
        const bullet = document.createElement("img");
        bullet.src = "./Images/spaceshipbullet.png";

        bullet.style.position = "absolute";
        bullet.style.left = `${pos}px`;
        bullet.style.top = `${playerRect.top - 30}px`;
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
    });
}

function ExplodeEnemy(enemy) {
    const explosion = document.createElement("img");
    explosion.src = "./Images/explosion.gif";
    explosion.style.position = "absolute";
    explosion.style.left = enemy.style.left;
    explosion.style.top = enemy.style.top;
    explosion.style.width = enemy.style.width;
    explosion.style.height = enemy.style.height;
    document.querySelector(".game-container").appendChild(explosion);

    // Patlama birkaç saniye sonra silinsin
    setTimeout(() => {
        explosion.remove();
    }, 500);

    enemy.remove(); // düşmanı yok et
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
            ExplodeEnemy(enemy);
            enemy.remove();
            bullet.remove();
            enemys.splice(index, 1);

            hitCount++;
            if (hitCount % 5 === 0 && upgradeLevel < maxUpgradeLevel) {
                upgradeLevel++;
                const playerImage = document.querySelector(".player-image");
                playerImage.src = upgradeImages[upgradeLevel];
            }
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
                const thumbFingerTip = landmarks[4];
                const indexFingerTip = landmarks[14];

                const palmCenterX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x) / 4;
                player.style.left = `${(1 - palmCenterX) * 100}%`;

                const distance = Math.sqrt(
                    Math.pow(indexFingerTip.x - thumbFingerTip.x, 2) +
                    Math.pow(indexFingerTip.y - thumbFingerTip.y, 2)
                );

                if (distance < 0.08) {
                    isTouching = true;
                } else {
                    isTouching = false;
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

setInterval(() => {
    if (isTouching) {
        Shoot();
    }
},200);


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
    
        enemyImage.src = "./Images/Enemy.png";
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