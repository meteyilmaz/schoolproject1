import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

        const video = document.getElementById("video");
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                return new Promise((resolve) => {
                    video.onloadedmetadata = () => resolve(video);
                });
            } catch (error) {
                console.error("Kamera erişimi reddedildi: ", error);
            }
        }

        async function loadHandLandmarker() {
            // MediaPipe WASM dosyalarını yükleme
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            // Model yükleme
            return await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
                },
                runningMode: "VIDEO",
                numHands: 2
            });
        }

        async function main() {
            await setupCamera();
            const detector = await loadHandLandmarker();

            function detectHands() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const results = detector.detectForVideo(video, performance.now());
                
                if (results.landmarks.length > 0) {
                    const handedness = results.handedness[0][0];
                    // console.log(results);
                    
                    if (handedness.score>0.9) {
                    }

                    
                }
                

                requestAnimationFrame(detectHands, 100);
            }

           detectHands();
        }

        main();