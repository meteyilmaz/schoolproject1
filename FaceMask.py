import cv2
import mediapipe as mp

cap = cv2.VideoCapture(0)

mpFaceMesh = mp.solutions.face_mesh
faceMesh = mpFaceMesh.FaceMesh(max_num_faces=2)
mpDraw = mp.solutions.drawing_utils
drawSpec = mpDraw.DrawingSpec(thickness=1, circle_radius=1)

glasses = cv2.imread("glasses.png", cv2.IMREAD_UNCHANGED)

def OverlayImage(bgImage, fgImage, x, y, scale=1):
    fgImage = cv2.resize(fgImage, None, fx=scale, fy=scale)
    h, w, _ = fgImage.shape
    for i in range(h):
        for j in range(w):
            if x + i >= bgImage.shape[0] or y + j >= bgImage.shape[1]:
                continue
            alpha = fgImage[i, j, 3] / 255.0
            bgImage[x + i, y + j] = alpha * fgImage[i, j, :3] + (1 - alpha) * bgImage[x + i, y + j]
    return bgImage

while True:
    success, img = cap.read()
    img = cv2.flip(img, 1)
    imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = faceMesh.process(imgRGB)

    if results.multi_face_landmarks:
        for faceLms in results.multi_face_landmarks:
            ih, iw, ic = img.shape
            leftEye = faceLms.landmark[133]
            rightEye = faceLms.landmark[362]

            leftX, leftY = int(leftEye.x * iw), int(leftEye.y * ih)
            rightX, rightY = int(rightEye.x * iw), int(rightEye.y * ih)

            scalingFactor = 5
            glassesWidth = int(scalingFactor * abs(rightX - leftX))
            glassesHeight = int(glassesWidth * glasses.shape[0] / glasses.shape[1])
            glassesX = int((leftX + rightX) / 2 - glassesWidth / 2)
            glassesY = int((leftY + rightY) / 2 - glassesHeight / 2)

            OverlayImage(img, glasses, glassesY, glassesX, scale=glassesWidth / glasses.shape[1])

    cv2.imshow("Image", img)
    cv2.waitKey(1)