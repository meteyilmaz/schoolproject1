let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 2, refineLandmarks: false, flipHorizontal: false };
let gozluks = [
  "./images/eyeglass1.png",
  "./images/vecteezy_sunglasses-png-with-ai-generated.png",
  "./images/vecteezy_stylish-heart-sunglasses-clipart-design-illustration_9380023.png",
  "./images/sunglasses.png",
  ];

let biyiks = [
  "./images/moustache2.png",
  "./images/moustache1.png",
];

let masks = [
  "./images/vecteezy_3d-watercolor-golden-barazil-carnival-mask.png",
  "./images/vecteezy_black-and-white-mask.png",
];

let gozluk, biyik, mask;  

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);

  gozluk = loadImage(gozluks[3]);
  biyik = loadImage(biyiks[0]); 
  mask = loadImage(masks[0]);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  // Draw all the tracked face points
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    //35:sol, 265:Sağ, 6:Orta

    let d = round(dist(face.keypoints[446].x, face.keypoints[446].y, face.keypoints[226].x, face.keypoints[226].y));

    text(d, 10, 10);
    gozluk.resize(d, (180*d)/512);

    // circle(face.keypoints[8].x, face.keypoints[8].y, d);
    image(gozluk, face.keypoints[70].x, face.keypoints[70].y-20, gozluk.width, gozluk.height); 

    // fill(255, 255, 255); circle(face.keypoints[226].x, face.keypoints[226].y, 5);
    // fill(255, 255, 255); circle(face.keypoints[359].x, face.keypoints[359].y, 5);

    // for (let j = 0; j < face.keypoints.length; j++) {
    //   let keypoint = face.keypoints[j];
    //     fill(255, 255, 255);
    //     noStroke();
    //     circle(keypoint.x, keypoint.y, 1);
    // }
  }
}

// Callback function for when faceMesh outputs data
function gotFaces(results) {
  // Save the output to the faces variable
  faces = results;
}
