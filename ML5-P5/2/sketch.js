let video;
let faceMesh;
let faces = [];

function preload() {
  faceMesh = ml5.faceMesh({ flipped: false });
}

function gotFaces(results) {
  faces = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: false });
  video.hide();
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  image(video, 0, 0);

  if (faces.length > 0) {
    let face = faces[0];
    let lips = face.lips;
    console.log(lips);
    
    beginShape(); 
    for (let i = 0; i < lips.keypoints.length; i++) {
      let keypoint = lips.keypoints[i];

    }
    endShape();

    let a = face.keypoints[13];
    let b = face.keypoints[14];
    let d = dist(a.x, a.y, b.x, b.y);

    let yellowPoint = face.keypoints[94];
    stroke(255, 255, 0);
    fill(255, 255, 0);
    circle(yellowPoint.x, yellowPoint.y, d);
  }
}

function mousePressed() {
  console.log(faces);
  
}