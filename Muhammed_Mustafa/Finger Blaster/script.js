import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const targetObjectImage = document.getElementById("targetObjectImage");
const scoreText = document.getElementById("scoreText");
const heartNumberText = document.getElementById("heartNumberText");
const highScoreText = document.getElementById("highScoreText");

const popSound = new Audio("./sounds/popSound.wav");
const transitionSound = new Audio("./sounds/transitionSound.wav");

let isTouching = false;

const objects = [];
let targetObjectColor;
let score = 0;
let heartNumber = 10;
let highScore = 0;

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

                for (let i = 0; i < objects.length; i++) {
                    const object = objects[i];
                    const objectRect = object.getBoundingClientRect();

                    if (
                        distance < 0.04 &&
                        fingerX >= objectRect.left &&
                        fingerX <= objectRect.right &&
                        fingerY >= objectRect.top &&
                        fingerY <= objectRect.bottom
                    ) {
                        isTouching = true;

                        object.remove();
                        objects.splice(i, 1);
                        popSound.play();

                        if (object.style.backgroundColor == targetObjectColor) {
                            score += 5;
                        } else {
                            if (heartNumber > 0) {
                                heartNumber -= 1;

                                if (heartNumber <= 0) {
                                    if (score > highScore) {
                                        highScore = score;
                                    }

                                    localStorage.setItem("score", score);
                                    localStorage.setItem("highScore", highScore);

                                    setTimeout(() => {
                                        window.location.href = "gameOver.html";
                                    }, 1000);
                                }
                            } else {
                                if (score > highScore) {
                                    highScore = score;
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

                if (objects.length <= 0) {
                    createObjects();
                    transitionSound.play();
                }
            });

            const hasTargetObject = objects.some(object => object.style.backgroundColor === targetObjectColor);

            if (!hasTargetObject) {
                objects.forEach(object => object.remove());
                objects.length = 0;
                createObjects();
                transitionSound.play();
            }
        }

        requestAnimationFrame(detectHands);
    }

    detectHands();
}

main();

function createObjects() {
    const gameContainer = document.querySelector(".game-container");
    const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan", "lime", "white"];
    const padding = 60;
    let objectCount = 10;

    targetObjectColor = colors[Math.floor(Math.random() * colors.length)];
    targetObjectImage.style.backgroundColor = targetObjectColor;

    let targetObjectCount = Math.floor(objectCount / 2);
    let nonTargetObjectCount = objectCount - targetObjectCount;
    const placedObjects = [];

    function isOverlapping(x, y, width, height) {
        return placedObjects.some(({ left, top, w, h }) =>
            x < left + w &&
            x + width > left &&
            y < top + h &&
            y + height > top
        );
    }

    function createObject(color) {
        const object = document.createElement("div");
        object.style.position = "absolute";
        object.style.width = "70px";
        object.style.height = "70px";
        object.style.pointerEvents = "none";

        let left, top;
        do {
            left = Math.random() * (gameContainer.offsetWidth - padding * 2 - 50) + padding;
            top = Math.random() * (gameContainer.offsetHeight - padding * 2 - 70) + padding;
        } while (isOverlapping(left, top, 50, 70));

        object.style.left = `${left}px`;
        object.style.top = `${top}px`;

        placedObjects.push({ left, top, w: 50, h: 70 });

        const smoothMovement = () => {
            let currentLeft = parseFloat(object.style.left);
            let currentTop = parseFloat(object.style.top);
            let newLeft = Math.max(
                padding,
                Math.min(gameContainer.offsetWidth - padding - 50, currentLeft + (Math.random() * 20 - 10))
            );
            let newTop = Math.max(
                padding,
                Math.min(gameContainer.offsetHeight - padding - 70, currentTop + (Math.random() * 20 - 10))
            );
            object.style.left = `${newLeft}px`;
            object.style.top = `${newTop}px`;
        };

        setInterval(smoothMovement, 500);

        objects.push(object);
        gameContainer.appendChild(object);
    }

    for (let i = 0; i < targetObjectCount; i++) {
        createObject(targetObjectColor);
    }

    for (let i = 0; i < nonTargetObjectCount; i++) {
        let color;
        do {
            color = colors[Math.floor(Math.random() * colors.length)];
        } while (color === targetObjectColor);
        createObject(color);
    }
}