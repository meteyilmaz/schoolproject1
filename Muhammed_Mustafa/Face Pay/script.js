const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const progressBar = document.getElementById("progress-bar");

let insideTimer = null;
let cutAmount = 10;
let faceBoxElement;

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("../models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("../models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("../models"),
]).then(main);

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

function updateFaceBox(faceBox) {
    if (!faceBoxElement) {
        faceBoxElement = document.createElement("div");
        faceBoxElement.style.position = "absolute";
        faceBoxElement.style.border = "3px solid red";
        faceBoxElement.style.borderRadius = "15px";
        faceBoxElement.style.boxShadow = "0px 0px 10px rgba(255, 0, 0, 0.5)";
        faceBoxElement.style.zIndex = "10";
        faceBoxElement.style.transition = "all 0.2s ease-in-out";
        faceBoxElement.style.pointerEvents = "none";
        document.body.appendChild(faceBoxElement);
    }
    
    const videoRect = video.getBoundingClientRect();
    faceBoxElement.style.left = `${videoRect.left + faceBox.x}px`;
    faceBoxElement.style.top = `${videoRect.top + faceBox.y}px`;
    faceBoxElement.style.width = `${faceBox.width}px`;
    faceBoxElement.style.height = `${faceBox.height}px`;
}

async function getLabeledFaceDescriptions() {
    const imageFolder = "./images";
    const imageFiles = await fetchImageFiles(imageFolder);
    return Promise.all(
        imageFiles.map(async (file) => {
            const label = file.split(".")[0].replace("%20", " ");
            const img = await faceapi.fetchImage(`${imageFolder}/${file}`);
            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                console.warn(`Yüz tespit edilemedi: ${file}`);
                return null;
            }

            return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
        })
    ).then((descriptors) => descriptors.filter((desc) => desc !== null));
}

async function fetchImageFiles(folderPath) {
    const response = await fetch(folderPath);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return Array.from(doc.querySelectorAll("a"))
        .map((a) => a.href.split("/").pop())
        .filter((file) => file.match(/\.(png|jpg|jpeg)$/i));
}

async function faceMatcher() {
    let usersValue;

    try {
        usersValue = await fetch("users.json").then((response) => response.json());
    } catch (error) {
        console.error("Hata: ", error);
        return;
    }

    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    let faceBox = {
        x: (video.clientWidth - 225) / 2,
        y: (video.clientHeight - 275) / 2,
        width: 225,
        height: 275,
    };

    updateFaceBox(faceBox);

    setInterval(async () => {
        const detections = await faceapi
            .detectSingleFace(video)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detections) {
            return;
        }

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const result = faceMatcher.findBestMatch(resizedDetections.descriptor);
        let label = usersValue[result.label];
        const box = resizedDetections.detection.box;

        let isFaceInside = (
            box.x > faceBox.x &&
            box.y > faceBox.y &&
            box.x + box.width < faceBox.x + faceBox.width &&
            box.y + box.height < faceBox.y + faceBox.height
        );

        updateFaceBox(faceBox);

        if (label && isFaceInside) {
            if (!insideTimer) {
                let progress = 0;
                progressBar.style.width = "0%";

                insideTimer = setInterval(async () => {
                    progress += 10;
                    progressBar.style.width = `${progress}%`;

                    if (progress >= 100) {
                        clearInterval(insideTimer);
                        insideTimer = null;
                        progressBar.style.width = "0%";

                        if (label.balance >= cutAmount) {
                            label.balance -= cutAmount;
                            localStorage.setItem("result", `✅ ${cutAmount} TL kesildi. Yeni bakiye: ${label.balance} TL`);
                        } else {
                            localStorage.setItem("result", "❌ Bakiyeniz yetersiz!!!");
                        }
                        
                        window.location.href = "timer.html";
                    }
                }, 300);
            }
        } else {
            if (insideTimer) {
                clearInterval(insideTimer);
                insideTimer = null;
                progressBar.style.width = "0%";
            }
        }
    }, 500);
}

async function main() {
    await setupCamera();
    await faceMatcher();
}