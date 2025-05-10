const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
let yoklama_listesi=[];

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

async function GetLabeledFaceDescriptions() {
    const imageFolder = "./images";
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

function refreshTable(student){
    const tbodyRef = document.getElementById('table1').getElementsByTagName('tbody')[0];
    // Insert a row at the end of table
    const newRow = tbodyRef.insertRow();
    
    // Insert a cell at the end of the row
    var newCell = newRow.insertCell();
    var newText = document.createTextNode(student.number);
    newCell.appendChild(newText);

    newCell = newRow.insertCell();
    newText = document.createTextNode(student.name+" "+student.surname);
    newCell.appendChild(newText);

    newCell = newRow.insertCell();
    newText = document.createTextNode(student.class);
    newCell.appendChild(newText);
}

async function FaceMatcher() {
    let studentsValue;

    fetch("./students.json")
        .then(response => response.json())
        .then(value => {
            studentsValue = value;            
        })
        .catch(error => console.error("Hata: ", error));

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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map((result) => {
            return faceMatcher.findBestMatch(result.descriptor);
        });

        results.forEach((result, i) => { //result.label ile dosyanın ismi geliyor örneğin 16.jpg için "16" geliyor.
            let student = studentsValue.find(el => el.number === result.label);

            if (student) {
                if ( !yoklama_listesi.find(el=>el.number===student.number) ) {
                    yoklama_listesi.push(student);
                    refreshTable(student);
                } 
            }
            
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                // label: studentsValue[result.label].name+" "+studentsValue[result.label].surname+", "+studentsValue[result.label].class
                label : student.name+" "+student.surname
            });
            drawBox.draw(canvas);

            // console.log(yoklama_listesi);
            
        });
    }, 100);
}

async function Main() {
    await SetupCamera();
    await FaceMatcher();
}

let btn_clear = document.getElementById("btn_clear");
btn_clear.addEventListener("click", ()=>{
    yoklama_listesi=[];

    const tbodyRef = document.getElementById('table1').getElementsByTagName('tbody')[0];
    const rowCount = tbodyRef.rows.length; // Get the number of rows
    for (let i = rowCount - 1; i >= 0; i--) {
        tbodyRef.deleteRow(i);
    }
 
})