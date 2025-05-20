import {FaceLandmarker, FilesetResolver, DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(video);
        });
    } catch (error) {
        console.error("Kamera Erişimi Reddedildi: ", error)
    }
}

async function loadFaceLandmarker() {
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

async function main() {
    await setupCamera();
    const faceLandmarker = await loadFaceLandmarker();
    const drawingUtils = new DrawingUtils(ctx);

    function detectFaces() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const results = faceLandmarker.detectForVideo(video, performance.now());

        if (results.faceLandmarks) {
            results.faceLandmarks.forEach((landmarks) => {
                drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {color: "#00FF00"});
            });
        }

        requestAnimationFrame(detectFaces);
    }

    detectFaces();
}

main();