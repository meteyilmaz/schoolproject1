let video;
let classifier;

function preload() {
    classifier = ml5.imageClassifier('./my_model/model.json');
}

function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  classifyVideo();
}

function classifyVideo(){
    classifier.classify(video, gotResults);
}

function draw() {
    background(0);
  // Draw the webcam video
  image(video, 0, 0, width, height);

}

// Callback function for when faceMesh outputs data
function gotResults(error, results) {
    if (error) {
        console.error(error);
        return
    }

    console.log(results);
    

  // Save the output to the faces variable
  faces = results;
}
