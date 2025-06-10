import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";
import { questions } from "./questions.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const questionText = document.getElementById("questionText");
const reply1 = document.getElementById("reply1");
const reply2 = document.getElementById("reply2");
const resultText = document.getElementById("resultText");

const bgColors = {"normalColor": "#1e1e2f", "redColor": "#ff4a2a", "greenColor": "#07cf08"};

const correctSound = new Audio("./sounds/correctAnswerSound.wav");
const wrongSound = new Audio("./sounds/wrongAnswerSound.wav");

let interactableObjects = [reply1, reply2];
let isTouching = false;
let touchStartTime = 0;
let clicked = false;
let isClicked = false;
let isReadyHand = true;
let hasAnswered = false;
let handTimeOut = 0;
let questionNumber = 0;

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
        numHands: 1,
    });
}

async function main() {
    await setupCamera();
    const handLandmarker = await loadHandLandmarker();
    const drawingUtils = new DrawingUtils(ctx);

    function detectHands() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const results = handLandmarker.detectForVideo(video, performance.now());

        if (!results.landmarks || results.landmarks.length === 0) {
            if (isTouching || clicked) {
                isTouching = false;
                clicked = false;
                clearTimeout(handTimeOut);
                for (let i = 0; i < interactableObjects.length; i++) {
                    interactableObjects[i].style.backgroundColor = "";
                }
            }
            requestAnimationFrame(detectHands);
            return;
        }

        if (results.landmarks && isReadyHand) {
            results.landmarks.forEach((landmarks) => {
                const indexFingerTip = landmarks[8];
                ctx.beginPath();
                ctx.arc(indexFingerTip.x * canvas.width, indexFingerTip.y * canvas.height, isTouching ? 20 : 10, 0, 2 * Math.PI);
                ctx.fillStyle = isTouching ? "#ab0707" : "red";
                ctx.fill();
                
                for (let i = 0; i < landmarks.length; i++) {
                    if (i == 4 || i == 12 || i == 16 || i == 20){
                        ctx.beginPath();
                        ctx.arc(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height, 10, 0, 2 * Math.PI);
                        ctx.fillStyle = "green";
                        ctx.fill();
                    }                    
                }

                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 5
                });

                const canvasRect = canvas.getBoundingClientRect();
                const fingerX = canvasRect.left + (1 - indexFingerTip.x) * canvasRect.width;
                const fingerY = canvasRect.top + indexFingerTip.y * canvasRect.height;

                let isTouchingNow = false;

                for (let i = 0; i < interactableObjects.length; i++) {
                    const object = interactableObjects[i];
                    const objectRect = object.getBoundingClientRect();

                    if (
                        fingerX >= objectRect.left &&
                        fingerX <= objectRect.right &&
                        fingerY >= objectRect.top &&
                        fingerY <= objectRect.bottom
                    ) {
                        isTouchingNow = true;

                        if (isTouchingNow && !isTouching) {
                            touchStartTime = performance.now();
                            isTouching = true;
                        }

                        if (isTouchingNow && !clicked) {
                            object.style.backgroundColor = "#a0a6f1";
                            clicked = true;
                            isClicked = true;

                            if (isClicked && isTouching) {
                                handTimeOut = setTimeout(() => {
                                    if (isTouching) {
                                        object.click();
                                    }
                                }, 1000);
                            }
                        }
                    } else {
                        if (isTouchingNow && !clicked) {
                            for (let i = 0; i < interactableObjects.length; i++) {
                                interactableObjects[i].style.backgroundColor = "";
                            }

                            isTouching = false;
                            touchStartTime = 0;
                        }
                    }
                }

                if (!isTouchingNow) {
                    for (let i = 0; i < interactableObjects.length; i++) {
                        interactableObjects[i].style.backgroundColor = "";
                    }

                    isTouching = false;
                    touchStartTime = 0;
                    clicked = false;
                    clearTimeout(handTimeOut);
                }
            });
        }

        requestAnimationFrame(detectHands);
    }

    detectHands();
}

main();

function setupQuestion() {
    let question = questions[questionNumber];

    questionText.textContent = question.question;

    let randomIndex1 = Math.floor(Math.random() * 2);
    let randomIndex2 = (randomIndex1 === 0) ? 1 : 0;
    
    reply1.textContent = question.options[randomIndex1];
    reply2.textContent = question.options[randomIndex2];
    reply1.style.backgroundColor = "";
    reply2.style.backgroundColor = "";
    resultText.textContent = "";

    document.body.style.backgroundColor = bgColors.normalColor;
    resultText.style.backgroundColor = "#2c2c3e";

    reply1.onclick = function () { checkAnswer(reply1.textContent, question.answer) };
    reply2.onclick = function () { checkAnswer(reply2.textContent, question.answer) };

    setTimeout(() => {
        isReadyHand = true;
    }, 1000);

    hasAnswered = false;
}

function checkAnswer(reply, correctAnswer) {
    if (hasAnswered) return;
    hasAnswered = true;

    if (reply == correctAnswer) {
        resultText.textContent = "Doğru Cevap";
        document.body.style.backgroundColor = bgColors.greenColor;
        resultText.style.backgroundColor = bgColors.greenColor;
        resultText.style.color = "#fff";
        correctSound.play();
        isReadyHand = false;
    } else {
        resultText.textContent = "Yanlış Cevap";
        document.body.style.backgroundColor = bgColors.redColor;
        resultText.style.backgroundColor = bgColors.redColor;
        resultText.style.color = "#fff";
        wrongSound.play();
        isReadyHand = false;
    }

    questionNumber += 1;
    clearTimeout(handTimeOut);

    if (questionNumber < questions.length) {
        setTimeout(setupQuestion, 3000);
    } else {
        questionNumber = 0;
        setupQuestion();
    }
}

setupQuestion();