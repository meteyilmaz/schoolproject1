import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const targetBalloonImage = document.getElementById("targetBalloonImage");
const scoreText = document.getElementById("scoreText");
const heartNumberText = document.getElementById("heartNumberText");
const highScoreText = document.getElementById("highScoreText");

const avatarBox = document.querySelector(".avatar-box");
const avatarImage = document.getElementById("avatarImage");
const avatarName = document.getElementById("avatarName");
const avatarMessage = document.getElementById("avatarLine");

const popSound = new Audio("./sounds/popSound.wav");
const transitionSound = new Audio("./sounds/transitionSound.wav");
const loseSound = new Audio("./sounds/loseSound.wav");

let isTouching = false;

const balloons = [];
let targetBalloonColor;
let score = 0;
let heartNumber = 10;
let highScore = 0;
let isGameOver = false;

const avatars = [
    {
        name: "Koç Taylan",
        image: "images/kocTaylanAvatar.png",
        messages: [
            "Helal! Böyle devam et, şampiyonluk yakın!",
            "Kazanmak yürek ister, sende o var!",
            "Yere düşsen bile, kalkar geçersin!"
        ]
    },
    {
        name: "Bilgin Bülent",
        image: "images/bilginBulentAvatar.png",
        messages: [
            "İstatistiklere göre başarı oranı %99!",
            "Zekân oyuna yansıyor, bravo!",
            "Bu hamleyle evrenin kurallarını değiştirdin!"
        ]
    },
    {
        name: "Emine Teyze",
        image: "images/emineTeyzeAvatar.png",
        messages: [
            "Aferin evladım, gözümde büyüdün!",
            "Sakın pes etme, yoksa oklavayı yer misin bilmem!",
            "Benim zamanımda böyle oynayan yoktu!"
        ]
    },
    {
        name: "Uzaylı Zortax",
        image: "images/uzayliZortaxAvatar.png",
        messages: [
            "Dünya seviyesini geçtin, galaksiler seni bekliyor!",
            "Bu performansla Mars’a kaptan olursun!",
            "İnsan mı, efsane mi? Kararsız kaldım."
        ]
    },
    {
        name: "Ergen Eren",
        image: "images/ergenErenAvatar.png",
        messages: [
            "İyi oynadın ha, story atmalık!",
            "Fena değildi… belki bir tık havalıydın.",
            "Hmm, like’lanır bu skor."
        ]
    },
    {
        name: "Trol Mehmet",
        image: "images/trolMehmetAvatar.png",
        messages: [
            "Hehehe KOMBOOOOOOO!",
            "Sen oyunu değil, oyunda bizi patlatıyorsun!",
            "Ben böyle başarıyı en son rüyamda gördüm!"
        ]
    },
];

highScore = localStorage.getItem("highScore");
highScoreText.textContent = "En yüksek skor: " + highScore;

function bgAnim() {
    const bgContainer = document.createElement("div");
    bgContainer.style.position = "fixed";
    bgContainer.style.top = "0";
    bgContainer.style.left = "0";
    bgContainer.style.width = "100vw";
    bgContainer.style.height = "100vh";
    bgContainer.style.overflow = "hidden";  
    bgContainer.style.zIndex = "-1";
    document.body.appendChild(bgContainer);

    const colors = ["#3CC157", "#2AA7FF", "#1B1B1B", "#FCBC0F", "#F85F36"];
    const numBalls = 50;
    const balls = [];

    for (let i = 0; i < numBalls; i++) {
        let ball = document.createElement("div");
        ball.classList.add("ball");
        ball.style.background = colors[Math.floor(Math.random() * colors.length)];
        let randomLeft = Math.random() * 100;   
        let randomTop  = Math.random() * 100;     
        ball.style.left = `${randomLeft}vw`;
        ball.style.top = `${randomTop}vh`;
        const scale = Math.random() * 0.8 + 0.4;  
        ball.style.transform = `scale(${scale})`;
        let size = Math.random() * 1.5 + 0.5;  
        ball.style.width = `${size}em`;
        ball.style.height = ball.style.width;
        balls.push(ball);
        bgContainer.appendChild(ball);
    }

    balls.forEach((el, i) => {
        let maxTranslateX = 5;
        let maxTranslateY = 3;
        let toX = (Math.random() * maxTranslateX) * (Math.random() < 0.5 ? -1 : 1);
        let toY = (Math.random() * maxTranslateY) * (Math.random() < 0.5 ? -1 : 1);
        const scaleMatch = el.style.transform.match(/scale\((.*?)\)/);
        const scaleValue = scaleMatch ? scaleMatch[1] : 1;
        el.animate(
            [
                { transform: `translate(0, 0) scale(${scaleValue})` },
                { transform: `translate(${toX}rem, ${toY}rem) scale(${scaleValue})` }
            ],
            {
                duration: (Math.random() + 1) * 2000,
                direction: "alternate",
                fill: "both",
                iterations: Infinity,
                easing: "ease-in-out"
            }
        );
    });
}

bgAnim();

async function setupCamera() {
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

async function loadHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    return await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.9,
        numHands: 3,
    });
}

function createParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.backgroundColor = color;
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.setProperty('--dx', (Math.random() * 40 - 20) + "px");
    particle.style.setProperty('--dy', (Math.random() * 40 - 20) + "px");
    document.querySelector(".game-container").appendChild(particle);
    
    particle.addEventListener("animationend", () => {
      particle.remove();
    });
  }
}

async function main() {
    await setupCamera();
    const handLandmarker = await loadHandLandmarker();
    const drawingUtils = new DrawingUtils(ctx);

    function detectHands() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const results = handLandmarker.detectForVideo(video, performance.now());

        if (results.landmarks) {
            results.landmarks.forEach((landmarks) => {
                const thumbFingerTip = landmarks[4];
                const indexFingerTip = landmarks[8];

                ctx.beginPath();
                ctx.arc(thumbFingerTip.x * canvas.width, thumbFingerTip.y * canvas.height, isTouching ? 20 : 10, 0, 2 * Math.PI);
                ctx.arc(indexFingerTip.x * canvas.width, indexFingerTip.y * canvas.height, isTouching ? 20 : 10, 0, 2 * Math.PI);
                ctx.fillStyle = isTouching ? "#ab0707" : "red";
                ctx.fill();

                const distance = Math.sqrt(
                    Math.pow(indexFingerTip.x - thumbFingerTip.x, 2) +
                    Math.pow(indexFingerTip.y - thumbFingerTip.y, 2)
                );

                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 7
                });

                const canvasRect = canvas.getBoundingClientRect();
                const fingerX = canvasRect.left + (1 - indexFingerTip.x) * canvasRect.width;
                const fingerY = canvasRect.top + indexFingerTip.y * canvasRect.height;

                for (let i = 0; i < balloons.length; i++) {
                    const balloon = balloons[i];
                    const balloonRect = balloon.getBoundingClientRect();

                    if (
                        distance < 0.04 &&
                        fingerX >= balloonRect.left &&
                        fingerX <= balloonRect.right &&
                        fingerY >= balloonRect.top &&
                        fingerY <= balloonRect.bottom
                    ) {
                        isTouching = true;

                        balloon.classList.add("explode");
                        balloons.splice(i, 1);
                        popSound.currentTime = 0;
                        popSound.play();

                        balloon.addEventListener("animationend", () => {
                            balloon.remove();
                        });

                        const balloonCenterX = balloon.offsetLeft;
                        const balloonCenterY = balloon.offsetTop;

                        createParticles(
                            balloonCenterX,
                            balloonCenterY,
                            balloon.style.backgroundColor
                        );

                        if (balloon.style.backgroundColor == targetBalloonColor) {
                            score += 5;
                        } else {
                            if (heartNumber > 0) {
                                heartNumber -= 1;

                                if (heartNumber <= 0) {
                                    if (score > highScore) {
                                        highScore = score;
                                    }

                                    if (!isGameOver) {
                                        localStorage.setItem("score", score);
                                        localStorage.setItem("highScore", highScore);

                                        loseSound.play();

                                        setTimeout(() => {
                                            window.location.href = "gameOver.html";
                                        }, 1000);
                                    }
                                }
                            } else {
                                if (score > highScore) {
                                    highScore = score;
                                    localStorage.setItem("highScore", highScore);
                                    highScoreText.textContent = "En yüksek skor: " + highScore;
                                }
                            }

                            if (score > 0) {
                                score -= 3;
                                score = score < 0 ? 0 : score;
                            }
                        }

                        scoreText.textContent = "Puan: " + score;
                        heartNumberText.textContent = heartNumber;
                        break;
                    } else {
                        isTouching = false;
                    }
                }
            });

            const hasTargetBalloon = balloons.some(balloon => balloon.style.backgroundColor === targetBalloonColor);

            if (!hasTargetBalloon) {
                balloons.forEach(balloon => balloon.remove());
                balloons.length = 0;
                createBalloons();
                transitionSound.play();

                const index = Math.floor(Math.random() * avatars.length);
                const messageIndex = Math.floor(Math.random() * avatars[index].messages.length);

                avatarBox.style.visibility = "visible";
                avatarImage.src = avatars[index].image;
                avatarName.textContent = avatars[index].name;
                avatarMessage.textContent = avatars[index].messages[messageIndex];
            }
        }

        requestAnimationFrame(detectHands);
    }

    detectHands();
}

main();

function createBalloons() {
    const gameContainer = document.querySelector(".game-container");
    const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan", "lime", "white"];
    const padding = 60;
    let balloonCount = 10;

    targetBalloonColor = colors[Math.floor(Math.random() * colors.length)];
    targetBalloonImage.style.backgroundColor = targetBalloonColor;

    let targetBalloonCount = Math.floor(balloonCount / 2);
    let nonTargetBalloonCount = balloonCount - targetBalloonCount;
    const placedBalloons = [];

    function isOverlapping(x, y, width, height) {
        return placedBalloons.some(({ left, top, w, h }) =>
            x < left + w &&
            x + width > left &&
            y < top + h &&
            y + height > top
        );
    }

    function createBalloon(color) {
        const balloon = document.createElement("div");
        balloon.style.position = "absolute";
        balloon.style.width = "70px";
        balloon.style.height = "80px";
        balloon.style.borderRadius = "75% 75% 70% 70%";
        balloon.style.backgroundColor = color;
        balloon.style.transition = "left 0.5s linear, top 0.5s linear";
        balloon.style.boxShadow = "-7px -3px 10px rgba(0, 0, 0,0.7)";
        balloon.style.boxShadow = "-7px -3px 10px rgba(0, 0, 0,0.7) inset";

        const rope = document.createElement("div");
        rope.style.content = "";
        rope.style.height = "35px";
        rope.style.width = "1px";
        rope.style.padding = "1px";
        rope.style.backgroundColor = "#FDFD96";
        rope.style.display = "block";
        rope.style.position = "absolute";
        rope.style.top = "85px";
        rope.style.left = "0";
        rope.style.right = "0";
        rope.style.margin = "auto";
        rope.style.zIndex = "-2";

        const underBalloon = document.createElement("div");
        underBalloon.style.width = "0";
        underBalloon.style.height = "0";
        underBalloon.style.borderLeft = "5px solid transparent";
        underBalloon.style.borderRight = "5px solid transparent";
        underBalloon.style.borderBottom = `10px solid ${color}`;
        underBalloon.style.position = "absolute";
        underBalloon.style.top = "78px";
        underBalloon.style.left = "50%";
        underBalloon.style.transform = "translateX(-50%)";
        underBalloon.style.boxShadow = "-7px -3px 10px rgba(0, 0, 0,0.7)";
        underBalloon.style.boxShadow = "-7px -3px 10px rgba(0, 0, 0,0.7) inset";
        underBalloon.style.zIndex = "-1";

        balloon.appendChild(rope);
        balloon.appendChild(underBalloon);

        let left, top;
        do {
            left = Math.random() * (gameContainer.offsetWidth - padding * 2 - 50) + padding;
            top = Math.random() * (gameContainer.offsetHeight - padding * 2 - 70) + padding;
        } while (isOverlapping(left, top, 50, 70));

        balloon.style.left = `${left}px`;
        balloon.style.top = `${top}px`;

        placedBalloons.push({ left, top, w: 50, h: 70 });

        const smoothMovement = () => {
            let currentLeft = parseFloat(balloon.style.left);
            let currentTop = parseFloat(balloon.style.top);
            let newLeft = Math.max(
                padding,
                Math.min(gameContainer.offsetWidth - padding - 50, currentLeft + (Math.random() * 20 - 10))
            );
            let newTop = Math.max(
                padding,
                Math.min(gameContainer.offsetHeight - padding - 70, currentTop + (Math.random() * 20 - 10))
            );
            balloon.style.left = `${newLeft}px`;
            balloon.style.top = `${newTop}px`;
        };

        setInterval(smoothMovement, 500);

        balloons.push(balloon);
        gameContainer.appendChild(balloon);
    }

    for (let i = 0; i < targetBalloonCount; i++) {
        createBalloon(targetBalloonColor);
    }

    for (let i = 0; i < nonTargetBalloonCount; i++) {
        let color;
        do {
            color = colors[Math.floor(Math.random() * colors.length)];
        } while (color === targetBalloonColor);
        createBalloon(color);
    }
}

createBalloons();