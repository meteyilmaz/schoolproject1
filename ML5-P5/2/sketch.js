let video;
let faceMesh;
let faces = [];
let img;
let triangles=[];

function preload() {
  faceMesh = ml5.faceMesh({ flipped: true });
  img = loadImage('./clouds.jpg');
}

function gotFaces(results) {
  faces = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  faceMesh.detectStart(video, gotFaces);
  triangles = faceMesh.getTriangles();
}

function draw() {
  // translate(-width / 2, -height / 2);
  background(0);
  image(video, 0, 0);

  if (faces.length > 0) {
    let face = faces[0];

    beginShape(TRIANGLES);
    for (let i = 0; i < triangles.length; i++) {
      let tri = triangles[i];
      let [a, b, c] = tri;
      let pointA = face.keypoints[a]; 
      let pointB = face.keypoints[b];
      let pointC = face.keypoints[c];
      
      stroke(255, 255, 0);
      fill(random(255), 0, random(255));
      vertex(pointA.x, pointA.y);
      vertex(pointB.x, pointB.y);
      vertex(pointC.x, pointC.y);
      }
      endShape(CLOSE);

  }
}

function mousePressed() {
  console.log(faces);
}
