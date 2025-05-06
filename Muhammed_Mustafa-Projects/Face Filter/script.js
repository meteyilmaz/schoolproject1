import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let image = new Image();
image.src = "./Images/glasses.png";

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
                if (imageName == "glasses") {
                    const leftEye = landmarks[33];
                    const rightEye = landmarks[263];

                    const x = ((leftEye.x + rightEye.x) / 2) * canvas.width;
                    const y = landmarks[168].y * canvas.height;

                    const eyeDistance = Math.sqrt(
                        Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
                    );

                    let scaledWidth = eyeDistance * canvas.width * 1.5;
                    let scaledHeight = scaledWidth * 1;

                    let rotationAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rotationAngle);
                    ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                    ctx.restore();
                } else if (imageName == "skullClasp") {
                    const leftEye = landmarks[103];
                    const rightEye = landmarks[67];

                    const x = ((leftEye.x + rightEye.x) / 2) * canvas.width;
                    const y = landmarks[67].y * canvas.height;

                    const eyeDistance = Math.sqrt(
                        Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
                    );

                    let scaledWidth = eyeDistance * canvas.width * 1.5;
                    let scaledHeight = scaledWidth * 1;

                    let rotationAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

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
