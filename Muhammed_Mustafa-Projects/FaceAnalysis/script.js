const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("../models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("../models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("../models"),
    faceapi.nets.ageGenderNet.loadFromUri("../models"),
]).then(Main);

async function SetupCamera() {
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

async function FaceAnalysis() {
    let faceData = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors().withAgeAndGender();

    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceData = faceapi.resizeResults(faceData, video);
    faceapi.draw.drawDetections(canvas, faceData);

    faceData.forEach(face => {
        const {age, gender, genderProbability} = face;
        const genderText = gender + " - " + genderProbability.toFixed(2) + "%";
        const ageText = Math.round(age) + " years";
        const textField = new faceapi.draw.DrawTextField([genderText, ageText], face.detection.box.topRight);
        textField.draw(canvas);
    });

    requestAnimationFrame(FaceAnalysis);
}

async function Main() {
    await SetupCamera();
    await FaceAnalysis();
}
