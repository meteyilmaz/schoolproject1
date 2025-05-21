import {FaceDetector, FilesetResolver, DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

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
        console.error("Kamera Erişimi Reddedildi: ", error);
    }
}

async function loadFaceLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    return await FaceDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
        },
        runningMode: "VIDEO",
    });
}

async function main() {
    await setupCamera();
    const faceDetection = await loadFaceLandmarker();

    function detectFaces() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const results = faceDetection.detectForVideo(video, performance.now());

        if (results.detections.length > 0) {
            results.detections.forEach((detection) => {
                const score = detection.categories[0].score * 100;

                if (score < 70) {
                    return;
                }

                console.log(detection);
                const x = detection.boundingBox.originX;
                const y = detection.boundingBox.originY;
                const w = detection.boundingBox.width;
                const h = detection.boundingBox.height;

                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.rect(x, y, w, h);

                ctx.font = "20px Georgia";
                ctx.fillText("Yüz Tanıma Oranı:%" + Math.round(score), x, y - 10);
                ctx.font = "30px Verdana";
                ctx.stroke();
            });
        }

        requestAnimationFrame(detectFaces);
    }

    detectFaces();
}

main();