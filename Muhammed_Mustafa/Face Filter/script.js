import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("../models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("../models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("../models"),
    faceapi.nets.ageGenderNet.loadFromUri("../models"),
]);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let moustachesNameList = ["moustache1", "moustache2", "moustache3", "moustache4", "moustache5", "moustache6", "moustache7", "moustache8", "moustache9", "moustache10", "moustache11", "moustache12"];
let glassesNameList = ["glasses1", "glasses2"];
let hairClaspsNameList = ["greenHairClasp", "purpleHairClasp"];
let hairRibbonsNameList = ["greenHairRibbon", "purpleHairRibbon", "pinkHairRibbon"];
let maleImagesNameList = [...moustachesNameList, ...glassesNameList];
let femaleImagesNameList = [...hairClaspsNameList, ...glassesNameList, ...hairRibbonsNameList];

let image = new Image();
let imageName = "";

async function setupCamera() {
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

async function loadFaceLandmarker() {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");

    return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 2
    });
}

async function faceAnalysis() {
    let faceData = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors().withAgeAndGender();

    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceData = faceapi.resizeResults(faceData, video);
    faceapi.draw.drawDetections(canvas, faceData);

    return faceData.length > 0 ? faceData[0] : null;
}

async function main() {
    await setupCamera();
    const faceLandmarker = await loadFaceLandmarker();
    const faceAnalysisResult = await faceAnalysis();

    if (faceAnalysisResult.gender == "male") {
        image.src = `./images/${maleImagesNameList[Math.floor(Math.random() * maleImagesNameList.length)]}.png`;
        imageName = image.src.split('/').pop().split('.').shift();
    } else if (faceAnalysisResult.gender == "female") {
        image.src = `./images/${femaleImagesNameList[Math.floor(Math.random() * femaleImagesNameList.length)]}.png`;
        imageName = image.src.split('/').pop().split('.').shift();
    }

    function detectFaces() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const results = faceLandmarker.detectForVideo(video, performance.now());

        if (results.faceLandmarks && faceAnalysisResult) {
            results.faceLandmarks.forEach((landmarks) => {
                if (faceAnalysisResult.gender == "male") {
                    if (moustachesNameList.includes(imageName)) {
                        const leftPos = landmarks[57];
                        const rightPos = landmarks[287];

                        const x = ((leftPos.x + rightPos.x) / 2) * canvas.width;
                        const y = (landmarks[164].y * canvas.height) + 5;

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
                    } else if (glassesNameList.includes(imageName)) {
                        const leftPos = landmarks[33];
                        const rightPos = landmarks[263];

                        const x = ((leftPos.x + rightPos.x) / 2) * canvas.width;
                        const y = (landmarks[168].y * canvas.height);

                        const posDistance = Math.sqrt(
                            Math.pow(rightPos.x - leftPos.x, 2) + Math.pow(rightPos.y - leftPos.y, 2)
                        );

                        let scaledWidth = posDistance * canvas.width * 1.75;
                        let scaledHeight = scaledWidth * 0.75;

                        let rotationAngle = Math.atan2(rightPos.y - leftPos.y, rightPos.x - leftPos.x);

                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(rotationAngle);
                        ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                        ctx.restore();
                    }
                } else if (faceAnalysisResult.gender == "female") {
                    if (hairClaspsNameList.includes(imageName)) {
                        const leftPos = landmarks[103];
                        const rightPos = landmarks[67];

                        const x = ((leftPos.x + rightPos.x) / 2) * canvas.width;
                        const y = (landmarks[103].y * canvas.height) - 10;

                        const posDistance = Math.sqrt(
                            Math.pow(rightPos.x - leftPos.x, 2) + Math.pow(rightPos.y - leftPos.y, 2)
                        );

                        let scaledWidth = posDistance * canvas.width * 1.5;
                        let scaledHeight = scaledWidth * 1;

                        let rotationAngle = Math.atan2(rightPos.y - leftPos.y, rightPos.x - leftPos.x);

                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(rotationAngle);
                        ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                        ctx.restore();
                    } else if (hairRibbonsNameList.includes(imageName)) {
                        const leftPos = landmarks[103];
                        const rightPos = landmarks[67];

                        const x = ((leftPos.x + rightPos.x) / 2) * canvas.width;
                        const y = (landmarks[103].y * canvas.height) - 10;

                        const posDistance = Math.sqrt(
                            Math.pow(rightPos.x - leftPos.x, 2) + Math.pow(rightPos.y - leftPos.y, 2)
                        );

                        let scaledWidth = posDistance * canvas.width * 1.5;
                        let scaledHeight = scaledWidth * 1;

                        let rotationAngle = Math.atan2(rightPos.y - leftPos.y, rightPos.x - leftPos.x);

                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(rotationAngle);
                        ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                        ctx.restore();
                    }
                }
            });
        }

        requestAnimationFrame(detectFaces);
    }

    detectFaces();
}

main();