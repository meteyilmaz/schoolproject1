import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const poppedBalloonNumberText = document.getElementById("poppedBalloonNumberText");

let isTouching = false;
let touchStartTime = 0;
let clicked = false;
let isClicked = false;
let isReadyHand = true;

const balloons = [];
let poppedBalloonNumber = 0;

function BGAnim() {
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

BGAnim();

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
        numHands: 3,
    });
}

async function Main() {
    await SetupCamera();
    const handLandmarker = await LoadHandLandmarker();
    const drawingUtils = new DrawingUtils(ctx);

    function DetectHands() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const results = handLandmarker.detectForVideo(video, performance.now());

        if (results.landmarks && isReadyHand) {
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
                    lineWidth: 5
                });

                const canvasRect = canvas.getBoundingClientRect();
                const fingerX = canvasRect.left + (1 - indexFingerTip.x) * canvasRect.width;
                const fingerY = canvasRect.top + indexFingerTip.y * canvasRect.height;

                let isTouchingNow = false;

                for (let i = 0; i < balloons.length; i++) {
                    const balloon = balloons[i];
                    const balloonRect = balloon.getBoundingClientRect();

                    if (
                        distance < 0.05 &&
                        fingerX >= balloonRect.left &&
                        fingerX <= balloonRect.right &&
                        fingerY >= balloonRect.top &&
                        fingerY <= balloonRect.bottom
                    ) {
                        isTouchingNow = true;

                        if (isTouchingNow && !isTouching) {
                            touchStartTime = performance.now();
                            isTouching = true;
                        }

                        if (isTouchingNow && !clicked) {
                            clicked = true;
                            isClicked = true;

                            if (isClicked && isTouching) {
                                balloon.remove();
                                balloons.splice(i, 1);
                                poppedBalloonNumber += 1;
                                poppedBalloonNumberText.textContent = poppedBalloonNumber;
                            }
                        }
                    } else {
                        if (isTouchingNow && !clicked) {
                            isTouching = false;
                            touchStartTime = 0;
                        }
                    }
                }

                if (!isTouchingNow) {
                    isTouching = false;
                    touchStartTime = 0;
                    clicked = false;
                }

                if (balloons.length <= 0) {
                    CreateBalloons();
                }
            });
        }

        requestAnimationFrame(DetectHands);
    }

    DetectHands();
}

Main();

function CreateBalloons() {
    const gameContainer = document.querySelector(".game-container");
    const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan", "lime", "white"];
    let balloonCount = 10;

    for (let i = 0; i < balloonCount; i++) {
        const balloon = document.createElement("div");
        balloon.style.position = "absolute";
        balloon.style.width = "50px";
        balloon.style.height = "70px";
        balloon.style.borderRadius = "50%";
        balloon.style.backgroundColor = colors[i % colors.length];
        balloon.style.left = `${Math.random() * (gameContainer.offsetWidth - 50)}px`;
        balloon.style.top = `${Math.random() * (gameContainer.offsetHeight - 50)}px`;
        balloon.style.boxShadow = "0 0 10px rgba(255,255,255,0.8)";
        balloon.style.transition = "left 0.5s linear, top 0.5s linear";

        const smoothMovement = () => {
            const currentLeft = parseFloat(balloon.style.left);
            const currentTop = parseFloat(balloon.style.top);
            const newLeft = Math.max(0, Math.min(gameContainer.offsetWidth - 50, currentLeft + (Math.random() * 20 - 10)));
            const newTop = Math.max(0, Math.min(gameContainer.offsetHeight - 70, currentTop + (Math.random() * 20 - 10)));
            balloon.style.left = `${newLeft}px`;
            balloon.style.top = `${newTop}px`;
        };

        setInterval(smoothMovement, 500);

        balloons.push(balloon);
        gameContainer.appendChild(balloon);
    }
}

CreateBalloons();