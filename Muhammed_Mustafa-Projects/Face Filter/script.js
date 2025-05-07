import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let imageNameList = ["moustache1", "moustache2", "moustache3", "moustache4", "moustache5", "moustache6"];
let moustacheNameList = ["moustache1", "moustache2", "moustache3", "moustache4", "moustache5", "moustache6"];

let image = new Image();
image.src = `./Images/${moustacheNameList[Math.floor(Math.random() * moustacheNameList.length)]}.png`;

let imageName = image.src.split('/').pop().split('.').shift();

async function SetupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(video);
        });
    } catch (error) {
        console.error("Kamera Erişimi Reddedildi: ", error);
    }
}

async function LoadFaceLandmarker() {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");

    return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 1
    });
}

async function Main() {
    await SetupCamera();
    const faceLandmarker = await LoadFaceLandmarker();

    function DetectFaces() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const results = faceLandmarker.detectForVideo(video, performance.now());

        if (results.faceLandmarks) {
            results.faceLandmarks.forEach((landmarks) => {
                if (moustacheNameList.includes(imageName)) {
                    const leftPos = landmarks[57];
                    const rightPos = landmarks[287];

                    const x = ((leftPos.x + rightPos.x) / 2) * canvas.width;
                    const y = landmarks[164].y * canvas.height;

                    const posDistance = Math.sqrt(
                        Math.pow(rightPos.x - leftPos.x, 2) + Math.pow(rightPos.y - leftPos.y, 2)
                    );

                    let scaledWidth = posDistance * canvas.width * 1.5;
                    let scaledHeight = scaledWidth * 0.25;

                    let rotationAngle = Math.atan2(rightPos.y - leftPos.y, rightPos.x - leftPos.x);

                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rotationAngle);
                    ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                    ctx.restore();
                }
            });
        }

        requestAnimationFrame(DetectFaces);
    }

    DetectFaces();
}

Main();