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

let interactableObjects = [reply1, reply2];
let isTouching = false;
let touchStartTime = 0;
let clicked = false;
let isReadyHand = true;
let questionNumber = 0;

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

        if (results.landmarks && isReadyHand) {
            results.landmarks.forEach((landmarks) => {
                const indexFingerTip = landmarks[8];
                ctx.beginPath();
                ctx.arc(indexFingerTip.x * canvas.width, indexFingerTip.y * canvas.height, 10, 0, 2 * Math.PI);
                ctx.fillStyle = "red";
                ctx.fill();
                drawingUtils.drawLandmarks(landmarks, { color: "#FFF", radius: 1 });

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
                            object.click();
                            clicked = true;
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
    resultText.textContent = "";

    document.body.style.backgroundColor = bgColors.normalColor;
    resultText.style.backgroundColor = "#2c2c3e";

    reply1.onclick = function () { checkAnswer(reply1.textContent, question.answer) };
    reply2.onclick = function () { checkAnswer(reply2.textContent, question.answer) };

    setTimeout(() => {
        isReadyHand = true;
    }, 1000);
}

function checkAnswer(reply, correctAnswer) {
    if (reply == correctAnswer) {
        resultText.textContent = "Doğru Cevap";
        document.body.style.backgroundColor = bgColors.greenColor;
        resultText.style.backgroundColor = bgColors.greenColor;
        resultText.style.color = "#fff";
        isReadyHand = false;
    } else {
        resultText.textContent = "Yanlış Cevap";
        document.body.style.backgroundColor = bgColors.redColor;
        resultText.style.backgroundColor = bgColors.redColor;
        resultText.style.color = "#fff";
        isReadyHand = false;
    }

    questionNumber += 1;

    if (questionNumber < questions.length) {
        setTimeout(setupQuestion, 3000);
    } else {
        resultText.textContent = "Quiz Bitti";
    }
}

setupQuestion();
