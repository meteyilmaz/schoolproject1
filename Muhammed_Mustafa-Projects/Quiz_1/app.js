import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const cevap = document.getElementById("cevap");

import { data, getRandomQuestion } from "./utils.js";

let interval; // Countdown timer
let count = 5; // Countdown timer
let img1 = new Image;
let img2 = new Image;
let rects = [
  { x: 50, y: 50, width: 150, height: 150 }, // img1 bounding rect
  { x: 450, y: 50, width: 150, height: 150 }, // img2 bounding rect
];

class HandTracker {
  constructor() {
    this.video = document.getElementById("video");
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.handLandmarker = null;
    this.drawingUtils = null;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.targetFPS = 30; // Optimized frame rate
    this.frameInterval = 1000 / this.targetFPS;
    this.thumbTipIndex = 4;
    this.indexFingerTipIndex = 8;
  }

  async init() {
    try {
      await this.setupCamera();
      await this.loadModel();
      this.startDetection();
    } catch (error) {
      console.error("Initialization error:", error);
      // Add user-facing error message here
    }
  }

  async setupCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not supported");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user" 
      } 
    });

    this.video.srcObject = stream;
    
    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.video.play();
        resolve();
      };
    });
  }

  async loadModel() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
        delegate: "GPU" // Use GPU acceleration
      },
      runningMode: "VIDEO",
      numHands: 1, // Allow for two hands detection
      minHandDetectionConfidence: 0.9,
    });

    this.drawingUtils = new DrawingUtils(this.ctx);
  }

  startDetection() {
    const detectFrame = (timestamp) => {
      // Throttle frame processing
      if (timestamp - this.lastFrameTime >= this.frameInterval) {
        this.lastFrameTime = timestamp;
        this.processFrame();
      }
      this.animationId = requestAnimationFrame(detectFrame);
    };
    this.animationId = requestAnimationFrame(detectFrame);
  }

  async setImages() {
    img1.src = "https://img.static-af.com/transform/45cb9a13-b167-4842-8ea8-05d0cc7a4d04/?io=transform:fill,width:480,height:240";
    img2.src= "https://www.hotelgift.com/media/wp/HG/2022/08/blue-mosque-Turkey-where-to-stay-in-istanbul.webp";

    this.ctx.drawImage(img1, rects[0].x, rects[0].y, rects[0].width, rects[0].height); // Draw image at (10, 50) with width and height of 100px
    this.ctx.drawImage(img2, rects[1].x, rects[1].y, rects[1].width, rects[1].height); // Draw image at (10, 50) with width and height of 100px
  }

  processFrame() {
    if (this.video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA || !this.handLandmarker) {
      return;
    }

    // Clear canvas efficiently
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
    // Draw video frame
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Detect hands
    const results = this.handLandmarker.detectForVideo(this.video, performance.now());

    this.setImages();

    if (results.landmarks) {
      this.drawResults(results.landmarks);
    }
  }

  drawResults(landmarksArray) {
    landmarksArray.forEach((landmarks) => {
      // Draw all landmarks efficiently
      this.drawingUtils.drawLandmarks(landmarks, {
        color: "#00FF00",
        radius: 1,
        lineWidth: 5
      });

      // Highlight thumb and index finger tips
      this.drawFingerTips(landmarks);
    });
  }

  drawFingerTips(landmarks) {
    const thumbTip = landmarks[this.thumbTipIndex];
    const indexTip = landmarks[this.indexFingerTipIndex];

    // Batch drawing operations
    this.ctx.save();
    this.ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    
    [indexTip].forEach(tip => {
      if (tip) {
        this.ctx.beginPath();
        this.ctx.arc(
          tip.x * this.canvas.width,
          tip.y * this.canvas.height,
          15,
          0,
          2 * Math.PI
        );
        this.ctx.fill();
        
        // Normalleştirilmiş x,y → ekran koordinatlarına çevir
        const absX = tip.x * video.videoWidth;
        const absY = tip.y * video.videoHeight;

        cevap.textContent="";
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          if (
            absX > rect.x &&
            absX < rect.x + rect.width &&
            absY > rect.y &&
            absY < rect.y + rect.height
          ) {
            this.ctx.fillStyle = "rgba(0, 255, 0, 0.8)"; // Change color to green if inside rectangle
            this.ctx.fillText(`Inside Rect ${i + 1}`, absX, absY);

            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 40px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";

            if (i === 0) {
              cevap.textContent  = "Hatalı cevap..!";
            } else {
              cevap.textContent  = "Tebrikler, doğru bildiniz!";
            }
          }
        }
        
      }
    });

    this.ctx.restore();
  }

  cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    if (this.handLandmarker) {
      this.handLandmarker.close();
    }
  }
}

// Initialize when ready
document.addEventListener("DOMContentLoaded", async () => {
  const tracker = new HandTracker();
  await tracker.init();
  
  // Cleanup on exit
  window.addEventListener("beforeunload", () => tracker.cleanup());
});