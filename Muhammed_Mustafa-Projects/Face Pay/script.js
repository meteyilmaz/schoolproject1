const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const progressBar = document.getElementById("progress-bar");
const resultText = document.getElementById("resultText");
let insideTimer = null;
let cutAmount = 10;

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("../models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("../models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("../models"),
]).then(Main);

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

async function GetLabeledFaceDescriptions() {
    const imageFolder = "./Images";
    const imageFiles = await FetchImageFiles(imageFolder);
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

async function FetchImageFiles(folderPath) {
    const response = await fetch(folderPath);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return Array.from(doc.querySelectorAll("a"))
        .map((a) => a.href.split("/").pop())
        .filter((file) => file.match(/\.(png|jpg|jpeg)$/i));
}

async function FaceMatcher() {
    let usersValue;

    try {
        usersValue = await fetch("users.json").then((response) => response.json());
    } catch (error) {
        console.error("Hata: ", error);
        return;
    }

    const labeledFaceDescriptors = await GetLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    let faceBox = {
        x: (canvas.width - 225) / 2,
        y: (canvas.height - 275) / 2,
        width: 225,
        height: 275,
    };

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

        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

        let label = usersValue[result.label];
        const box = resizedDetections.detection.box;

        let isFaceInside = (
            box.x > faceBox.x &&
            box.y > faceBox.y &&
            box.x + box.width < faceBox.x + faceBox.width &&
            box.y + box.height < faceBox.y + faceBox.height
        );

        if (label && isFaceInside) {
            ctx.strokeStyle = "green";
            ctx.lineWidth = 3;
            ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

            if (!insideTimer) {
                let progress = 0;
                progressBar.style.width = "0%";

                insideTimer = setInterval(() => {
                    progress += 10;
                    progressBar.style.width = `${progress}%`;

                    if (progress >= 100) {
                        clearInterval(insideTimer);
                        insideTimer = null;
                        progressBar.style.width = "0%";

                        if (label.balance >= cutAmount) {
                            label.balance -= cutAmount;
                            resultText.textContent = 
                            `✅ Bakiyenizden ${cutAmount} TL kesildi. | 🟢 Geçebilirsiniz. | 💰 Yeni bakiyeniz: ${label.balance} TL`;
                        } else {
                            resultText.textContent = `❌ Bakiyeniz yetersiz!!!`;
                        }
                    }
                }, 300);
            }
        } else {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

            if (insideTimer) {
                clearInterval(insideTimer);
                insideTimer = null;
                progressBar.style.width = "0%";
            }
        }

        const drawBox = new faceapi.draw.DrawBox(box, {
            label: result.label
        });
        drawBox.draw(canvas);
    }, 500);
}

async function Main() {
    await SetupCamera();
    await FaceMatcher();
}