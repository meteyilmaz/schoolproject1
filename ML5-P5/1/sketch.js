let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 2, refineLandmarks: false, flipHorizontal: false };
let eyeGlass = "./images/eyeglass1.png";
let moustache1 = "./images/moustache2.png";
let leftXYZ = {};
let middleXYZ = {};
let rightXYZ = {};

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
  img1 = loadImage(eyeGlass);
  img2 = loadImage(moustache1);
}

function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  // Draw all the tracked face points
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    //35:sol, 265:Sağ, 6:Orta

    let img1_width =  face.keypoints[35].x - face.keypoints[265].x - 15; let img1_height = 40;
    image(img1, face.keypoints[6].x + (img1_width/2), face.keypoints[6].y - (img1_height/2) + 10, img1_width, img1_height); 

    let img2_width =  100; let img2_height = 20;
    image(img2, face.keypoints[0].x - (img2_width/2) ,  face.keypoints[0].y - 15, img2_width, img2_height); 


    // for (let j = 0; j < face.keypoints.length; j++) {
    //   let keypoint = face.keypoints[j];
    //     fill(255, 255, 255);
    //     noStroke();
    //     circle(keypoint.x, keypoint.y, 1);


    // //     // if ( j==35 ) {
    // //     //     let img1_width =  200;
    // //     //     let img1_height = 50;
    // //     //     image(img, face.keypoints[6].x-(img1_width/2), keypoint.y-(img1_height/2), img1_width, img1_height); 
                        
    // //     // }

    // //     // image(img, face.keypoints[35].x, face.keypoints[35].y, 200, 100); 

    // // //   if ( j==6 ){
    // // //     //Orta
    // // //     middleXYZ = keypoint;
    // // //   image(img, leftXYZ.x, leftXYZ.y, 200, 100); 

    // // //   }

    // // //   if (j == 35) {
    // // //     //Sol
    // // //     leftXYZ = keypoint;
    // // //   }

    // // //   if (j == 265) {
    // // //     //sağ
    // // //     rightXYZ = keypoint;
    // // //   }



    // }
  }
}

// Callback function for when faceMesh outputs data
function gotFaces(results) {
  // Save the output to the faces variable
  faces = results;
}
