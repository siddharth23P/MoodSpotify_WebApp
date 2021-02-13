#!/usr/bin/env python
# coding: utf-8

# In[1]:

from __future__ import division
import numpy as np
import pandas as pd
# import matplotlib.pyplot as plt
import time
import re
import os
import requests
import argparse
import dlib
import cv2
import imutils
import statistics as stat

from time import sleep
from math import isclose
from collections import OrderedDict
from scipy.ndimage import zoom
from scipy.spatial import distance
from scipy import ndimage
from imutils import face_utils
from tensorflow.keras.models import load_model
from tensorflow.keras import backend as K
#global variables
shape_x = 48
shape_y = 48



def main():
    model = load_model('Models/video.h5')
    face_detect = dlib.get_frontal_face_detector()
    predictor_landmarks  = dlib.shape_predictor("Models/face_landmarks.dat")
    video_capture = cv2.VideoCapture(0)
    predictions = []
    
    global k
    k = 0
    end = 0
    max_time = 10
    start = time.time()
    angry_0 = []
    disgust_1 = []
    fear_2 = []
    happy_3 = []
    sad_4 = []
    surprise_5 = []
    neutral_6 = []
    
    while end - start < max_time :
        k = k+1
        end = time.time()
        ret, frame = video_capture.read()
        face_index = 0
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rects = face_detect(gray, 1)
        for (i, rect) in enumerate(rects):
            shape = predictor_landmarks(gray, rect)
            shape = face_utils.shape_to_np(shape)
            (x, y, w, h) = face_utils.rect_to_bb(rect)
            face = gray[y:y+h,x:x+w]
            face = zoom(face, (shape_x / face.shape[0],shape_y / face.shape[1]))
            face = face.astype(np.float32)
            face /= float(face.max())
            face = np.reshape(face.flatten(), (1, 48, 48, 1))
            prediction = model.predict(face)
            
            angry_0.append(prediction[0][0].astype(float))
            disgust_1.append(prediction[0][1].astype(float))
            fear_2.append(prediction[0][2].astype(float))
            happy_3.append(prediction[0][3].astype(float))
            sad_4.append(prediction[0][4].astype(float))
            surprise_5.append(prediction[0][5].astype(float))
            neutral_6.append(prediction[0][6].astype(float))
            
            prediction_result = np.argmax(prediction)
            predictions.append(str(prediction_result))
            
        if end-start > max_time - 1 :
            with open("histo_perso.txt", "w") as d:
                d.write("density"+'\n')
                for val in predictions :
                  d.write(str(val)+'\n')
                
            with open("histo.txt", "a") as d:
                for val in predictions :
                    d.write(str(val)+'\n')
               
            rows = zip(angry_0,disgust_1,fear_2,happy_3,sad_4,surprise_5,neutral_6)
            import csv
            with open("prob.csv", "w") as d:
                writer = csv.writer(d)
                for row in rows:
                    writer.writerow(row)
         

            with open("prob_tot.csv", "a") as d:
                writer = csv.writer(d)
                for row in rows:
                    writer.writerow(row)
          
            K.clear_session()
            break
    pleasant = ((stat.mean(happy_3)+stat.mean(surprise_5))/2 + stat.mean(neutral_6))/2
    unPleasant = ((stat.mean(angry_0)+stat.mean(disgust_1)+stat.mean(fear_2)+stat.mean(sad_4))/4 + stat.mean(neutral_6)) /2
    calm = ((stat.mean(sad_4)+stat.mean(disgust_1))/2 + stat.mean(neutral_6))/2
    energized = ((stat.mean(happy_3)+stat.mean(surprise_5)+stat.mean(fear_2)+stat.mean(angry_0))/4 + stat.mean(neutral_6))/2

#     plt.bar(('Pleasant','Unpleasant','Calm','Energized'),[
#         pleasant,
#         unPleasant,
#         calm,
#         energized
#     ])
#     plt.show()

    
    goodNBad = 0
    if (isclose(pleasant, unPleasant, abs_tol=1e-2)):
        goodNBad = 0
    elif pleasant > unPleasant:
        goodNBad = 1
    else:
        goodNBad = 2
    
    energy = 0
    if (isclose(calm, energized, abs_tol=1e-2)):
        energy = 0
    elif energized > calm:
        energy = 1
    else:
        energy = 2
        
    video_capture.release()
    # print(goodNBad,flush=True,sep='')
    # print(energy,flush=True,sep='')
    print(goodNBad, energy, sep=',')


# In[4]:

if __name__ == '__main__':
    main()


