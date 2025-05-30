const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("../models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("../models"),
    faceapi.nets.faceExpressionNet.loadFromUri("../models")
]).then(main);

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

async function faceExpression() {
    let faceData = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceExpressions();
    
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceData = faceapi.resizeResults(faceData, video);
    faceapi.draw.drawDetections(canvas, faceData);
    faceapi.draw.drawFaceExpressions(canvas, faceData);

    requestAnimationFrame(faceExpression);
}

async function main() {
    await setupCamera();
    await faceExpression();
}