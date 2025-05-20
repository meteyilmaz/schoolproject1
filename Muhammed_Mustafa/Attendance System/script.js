const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const comingOnes = document.getElementById("comingOnes");
const notComingOnes = document.getElementById("notComingOnes");
const resultAttendanceBtn = document.getElementById("resultAttendance");
const resetAttendanceBtn = document.getElementById("resetAttendance");

let attendanceList = {};
let isAttendanceActive = true;
let labeledFaceDescriptors = [];
let faceMatcher = null;
let intervalId = null;

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("../models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("../models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("../models"),
]).then(Main);

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

async function getLabeledFaceDescriptions() {
    const imageFolder = "./images";
    const imageFiles = await fetchImageFiles(imageFolder);
    attendanceList = Object.fromEntries(imageFiles.map(file => [file.split(".")[0].replace("%20", " "), "YOK"]));

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
    labeledFaceDescriptors = await getLabeledFaceDescriptions();
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    if (intervalId) clearInterval(intervalId);

    intervalId = setInterval(async () => {
        if (!isAttendanceActive) return canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map((result) => {
            return faceMatcher.findBestMatch(result.descriptor);
        });

        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const score = result.distance;
            console.log(score)
            const color = score >= 0.7 ? "green" : "red";
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result, boxColor: color
            });
            drawBox.draw(canvas);

            const name = result.label;

            if (attendanceList[name]) {
                attendanceList[name] = "VAR";
            }
        });
    }, 250);
}

function attendanceResult() {
    isAttendanceActive = false;

    comingOnes.innerHTML = "";
    notComingOnes.innerHTML = "";

    Object.entries(attendanceList).forEach(([name, status]) => {
        const entry = document.createElement("li");
        entry.textContent = name;

        if (status == "VAR") {
            comingOnes.appendChild(entry);
        } else {
            notComingOnes.appendChild(entry);
        }
    });

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

async function resetAttendance() {
    comingOnes.innerHTML = "";
    notComingOnes.innerHTML = "";

    labeledFaceDescriptors = await getLabeledFaceDescriptions();
    attendanceList = Object.fromEntries(labeledFaceDescriptors.map(desc => [desc.label, "YOK"]));
    isAttendanceActive = true;

    await faceMatcher();
}

resultAttendanceBtn.addEventListener("click", () => {
    attendanceResult();
});

resetAttendanceBtn.addEventListener("click", async () => {
    await resetAttendance();
});

async function Main() {
    await setupCamera();
    await faceMatcher();
}