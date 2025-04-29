// app.js
import {
    FilesetResolver,
    ImageSegmenter,
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";
  
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  
  async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((r) => (video.onloadedmetadata = () => r(video)));
  }
  
  async function loadSegmenter() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    return await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.tflite",
      },
      segmenterOptions: {
        outputCategoryMask: false,
        outputConfidenceMasks: true,
        outputConfidenceScores: false,
      },
    });
  }
  
  async function main() {
    await setupCamera();
    const segmenter = await loadSegmenter();
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    function render() {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const result = segmenter.segmentForVideo(video, performance.now());
      const mask = result.confidenceMasks[0];
  
      if (mask.hasFloat32Array()) {
        const data = mask.getAsFloat32Array();
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < data.length; i++) {
          img.data[i * 4 + 3] = data[i] * 255;
        }
        ctx.putImageData(img, 0, 0);
      }
      mask.close();
      requestAnimationFrame(render);
    }
  
    render();
  }
  
  main();
  