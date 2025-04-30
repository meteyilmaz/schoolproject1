import {FaceLandmarker, FilesetResolver, DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let image = new Image();
image.src = "./Images/skullClasp.png";

async function SetupCamera() {
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
    const drawingUtils = new DrawingUtils(ctx);

    function DetectFaces() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const results = faceLandmarker.detectForVideo(video, performance.now());

        if (results.faceLandmarks) {
            results.faceLandmarks.forEach((landmarks) => {
                if (landmarks[103]) {
                    const x = landmarks[103].x * canvas.width;
                    const y = landmarks[103].y * canvas.height;

                    let scaledWidth = 50;
                    let scaledHeight = 50;

                    let headPos1 = landmarks[10];
                    let headPos2 = landmarks[152];

                    let headPosDistance = Math.sqrt(
                        Math.pow(headPos2.x - headPos1.x, 2) +
                        Math.pow(headPos2.y - headPos1.y, 2)
                    );

                    if (headPosDistance >= 0.4) {
                        scaledWidth = 100;
                        scaledHeight = 100;
                    } else if (headPosDistance <= 0.25) {
                        scaledWidth = 25;
                        scaledHeight = 25;
                    }

                    // console.log(headPosDistance);

                    ctx.drawImage(image, x - scaledWidth / 2, y - scaledHeight / 2, scaledWidth, scaledHeight);
                }
            });
        }

        requestAnimationFrame(DetectFaces);
    }

    DetectFaces();
}

Main();