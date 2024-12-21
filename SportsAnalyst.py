# Gayet güzel olmuş
# javascript ile yaptığım çalışmalara da bakıver.
# Pazartesi görüşelim.

import cv2
import mediapipe as mp
import time
import math
import numpy
import numpy as np

camW, camH = 1280, 720

cap = cv2.VideoCapture(0)
cap.set(3, camW)
cap.set(4, camH)

mpPose = mp.solutions.pose
pose = mpPose.Pose()
mpDraw = mp.solutions.drawing_utils

count = 0
dir = 0
perValueBar = 400

while True:
    success, img = cap.read()
    img = cv2.flip(img, 1)
    imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = pose.process(imgRGB)

    if results.pose_landmarks:
        mpDraw.draw_landmarks(img, results.pose_landmarks, mpPose.POSE_CONNECTIONS)
        for id, lm in enumerate(results.pose_landmarks.landmark):
            h, w, c = img.shape
            cx, cy = int(lm.x * w), int(lm.y * h)

            if id == 12 or id == 14 or id == 16:
                x1, y1 = int(results.pose_landmarks.landmark[12].x * w), int(results.pose_landmarks.landmark[12].y * h)
                x2, y2 = int(results.pose_landmarks.landmark[14].x * w), int(results.pose_landmarks.landmark[14].y * h)
                x3, y3 = int(results.pose_landmarks.landmark[16].x * w), int(results.pose_landmarks.landmark[16].y * h)

                x1Value, y1Value = results.pose_landmarks.landmark[12].x, results.pose_landmarks.landmark[12].y
                x2Value, y2Value = results.pose_landmarks.landmark[14].x, results.pose_landmarks.landmark[14].y
                x3Value, y3Value = results.pose_landmarks.landmark[16].x, results.pose_landmarks.landmark[16].y

                angle = math.degrees(math.atan2(y3Value - y2Value, x3Value - x2Value) - math.atan2(y1Value - y2Value, x1Value - x2Value))

                if angle < 0:
                    angle += 360

                cv2.circle(img, (cx, cy), 10, (255, 0, 0), cv2.FILLED)
                cv2.line(img, (x1, y1), (x3, y3), (0, 255, 0), 3)

                per = np.interp(angle, (210, 310), (0, 100))
                perValueBar = np.interp(angle, (210, 310), (400, 150))
                print(per)

                if per == 100:
                    if dir == 0:
                        count += 0.5
                        dir = 1
                if per == 0:
                    if dir == 1:
                        count += 0.5
                        dir = 0
                print(count)

                cv2.rectangle(img, (50, 150), (85, 400), (0, 255, 0), 3)
                cv2.rectangle(img, (50, int(perValueBar)), (85, 400), (0, 255, 0), cv2.FILLED)
                cv2.putText(img, f"{float(count)}", (40, 450), cv2.FONT_HERSHEY_PLAIN, 3, (255, 255, 0), 3)

    cv2.imshow("Image", img)
    cv2.waitKey(1)
