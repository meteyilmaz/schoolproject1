let video;
let faceMesh;
let faces = [];
let triangles;
let uvCoords;
let img;

function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1 });
  img = loadImage("./masks/anonymousmask.png");
}

function gotFaces(results) {
  faces = results;
}

function setup() {
  createCanvas(640, 480, WEBGL);
  video = createCapture(VIDEO);
  video.hide();
  faceMesh.detectStart(video, gotFaces);
  triangles = faceMesh.getTriangles();
  uvCoords = faceMesh.getUVCoords();
}

function draw() {
  translate(-width / 2, -height / 2);
  background(0);
  image(video, 0, 0);

  if (faces.length > 0) {
    let face = faces[0];
    texture(img);
    textureMode(NORMAL);
    noStroke();
    beginShape(TRIANGLES);

    for (let i = 0; i < triangles.length; i++) {
      let tri = triangles[i];
      let [a, b, c] = tri;
      let pointA = face.keypoints[a];
      let pointB = face.keypoints[b];
      let pointC = face.keypoints[c];
      let uvA = uvCoords[a];
      let uvB = uvCoords[b];
      let uvC = uvCoords[c];

      vertex(pointA.x, pointA.y, uvA[0], uvA[1]);
      vertex(pointB.x, pointB.y, uvB[0], uvB[1]);
      vertex(pointC.x, pointC.y, uvC[0], uvC[1]);
    }

    endShape();
  }
}