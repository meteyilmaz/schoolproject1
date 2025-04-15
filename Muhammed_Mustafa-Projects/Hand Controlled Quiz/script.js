import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";
import { questions } from "./questions.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const questionText = document.getElementById("questionText");
const reply1 = document.getElementById("reply1");
const reply2 = document.getElementById("reply2");
const resultText = document.getElementById("resultText");
const correctCountText = document.getElementById("correctCount");
const wrongCountText = document.getElementById("wrongCount");

let interactableObjects = [reply1, reply2];
let isTouching = false;
let touchStartTime = 0;
let clicked = false;
let questionNumber = 0;
let correctCount = 0;
let wrongCount = 0;

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
        numHands: 1,
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
                const thumbTip = landmarks[4];
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
                            object.style.backgroundColor = "lightgreen";
                        }

                        if (isTouchingNow && !clicked) {
                            object.click();
                            clicked = true;
                        }
                    } else {
                        if (isTouchingNow && !clicked) {
                            isTouching = false;
                            touchStartTime = 0;
                            object.style.backgroundColor = "";
                        }
                    }
                }

                if (!isTouchingNow) {
                    for (let i = 0; i < interactableObjects.length; i++) {
                        const object = interactableObjects[i];
                        object.style.backgroundColor = "";
                    }

                    isTouching = false;
                    touchStartTime = 0;
                    clicked = false;
                }
            });
        }

        requestAnimationFrame(DetectHands);
    }

    DetectHands();
}

Main();

function SetupQuestion() {
    let question = questions[questionNumber];

    questionText.textContent = question.question;

    let randomIndex1 = Math.floor(Math.random() * 2);
    let randomIndex2 = (randomIndex1 === 0) ? 1 : 0;
    
    reply1.textContent = question.options[randomIndex1];
    reply2.textContent = question.options[randomIndex2];
    resultText.textContent = "";

    reply1.onclick = function () { CheckAnswer(reply1.textContent, question.answer) };
    reply2.onclick = function () { CheckAnswer(reply2.textContent, question.answer) };
}

function CheckAnswer(reply, correctAnswer) {
    if (reply == correctAnswer) {
        resultText.textContent = "Doğru Cevap";
        correctCount += 1;
        correctCountText.textContent = "Doğru: " + correctCount;
    } else {
        resultText.textContent = "Yanlış Cevap";
        wrongCount += 1;
        wrongCountText.textContent = "Yanlış: " + wrongCount;
    }

    questionNumber += 1;

    if (questionNumber < questions.length) {
        setTimeout(SetupQuestion, 2000);
    } else {
        resultText.textContent = "Quiz Bitti";
    }
}

SetupQuestion();