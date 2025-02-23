const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/MachineLearningProjects/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/MachineLearningProjects/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/MachineLearningProjects/models"),
    faceapi.nets.ageGenderNet.loadFromUri("/MachineLearningProjects/models"),
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

async function GetLabeledFaceDescriptions() {
    const imageFolder = "/MachineLearningProjects/Images";
    const imageFiles = await FetchImageFiles(imageFolder);
    return Promise.all(
      imageFiles.map(async (file) => {
        const label = file.split(".")[0];
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
    const labeledFaceDescriptors = await GetLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";

    const displaySize = {width: video.width, height: video.height};
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map((result) => {
            return faceMatcher.findBestMatch(result.descriptor)
        });

        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result
            });
            drawBox.draw(canvas);
        });
    }, 100);
}

async function Main() {
    await SetupCamera();
    await FaceMatcher();
}
