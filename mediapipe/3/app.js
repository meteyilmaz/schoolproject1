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

            // HandLandmarker modelini yükleme
            return await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
                },
                runningMode: "VIDEO",
                numHands: 1,
            });
        }

        async function main() {
            await setupCamera();
            const handLandmarker = await loadHandLandmarker();
            const drawingUtils = new DrawingUtils(ctx);

            function detectFaces() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const results = handLandmarker.detectForVideo(video, performance.now());

                if (results.landmarks) {
                    
                    results.landmarks.forEach((landmarks) => {
                        
                        const thumbTip = landmarks[4]; // **Baş parmak ucu**
                        const indexFingerTip = landmarks[8]; // **İşaret parmak ucu**
                        ctx.beginPath();
                        ctx.arc(thumbTip.x * canvas.width, thumbTip.y * canvas.height, 10, 0, 2 * Math.PI);
                        ctx.arc(indexFingerTip.x * canvas.width, indexFingerTip.y * canvas.height, 10, 0, 2 * Math.PI);
                        ctx.fillStyle = "red";
                        ctx.fill();
                        // console.log(thumbTip);
                        drawingUtils.drawLandmarks(landmarks, { color: "#FFF", radius: 1 });
                        
                    });
                }
                requestAnimationFrame(detectFaces);
            }

            detectFaces();
        }

        main();