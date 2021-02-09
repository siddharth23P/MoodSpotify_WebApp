import numpy as np
import pandas as pd
import cv2
import imutils
import dlib
from scipy.ndimage import zoom
from scipy.spatial import distance
from scipy import ndimage
from scipy import stats
from imutils import face_utils
from tensorflow.keras.models import load_model
from tensorflow import keras

shape_x = 48
shape_y = 48
input_shape = (shape_x, shape_y, 1)
nClasses = 7
thresh = 0.25
frame_check = 20

def eye_aspect_ratio(eye):
        A = distance.euclidean(eye[1], eye[5])
        B = distance.euclidean(eye[2], eye[4])
        C = distance.euclidean(eye[0], eye[3])
        ear = (A + B) / (2.0 * C)
        return ear

def detect_face(frame):
        #Cascade classifier pre-trained model
        cascPath = 'Models/face_landmarks.dat'
        faceCascade = cv2.CascadeClassifier(cascPath)
        #BGR -> Gray conversion
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        #Cascade MultiScale classifier
        detected_faces = faceCascade.detectMultiScale(gray,scaleFactor=1.1,minNeighbors=6,
                                                      minSize=(shape_x, shape_y),
                                                      flags=cv2.CASCADE_SCALE_IMAGE)
        coord = []
                                              
        for x, y, w, h in detected_faces :
            if w > 100 :
                sub_img=frame[y:y+h,x:x+w]
                cv2.rectangle(frame,(x,y),(x+w,y+h),(0, 255,255),1)
                coord.append([x,y,w,h])

        return gray, detected_faces, coord

def extract_face_features(faces, offset_coefficients=(0.075, 0.05)):
        gray = faces[0]
        detected_face = faces[1]
        
        new_face = []
        
        for det in detected_face :
            x, y, w, h = det
            horizontal_offset = np.int(np.floor(offset_coefficients[0] * w))
            vertical_offset = np.int(np.floor(offset_coefficients[1] * h))
            extracted_face = gray[y+vertical_offset:y+h, x+horizontal_offset:x-horizontal_offset+w]
            new_extracted_face = zoom(extracted_face, (shape_x / extracted_face.shape[0],shape_y / extracted_face.shape[1]))
            new_extracted_face = new_extracted_face.astype(np.float32)
            new_extracted_face /= float(new_extracted_face.max())
            new_face.append(new_extracted_face)
        return new_face

def catch_emotion():
    (lStart, lEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
    (rStart, rEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]
    (nStart, nEnd) = face_utils.FACIAL_LANDMARKS_IDXS["nose"]
    (mStart, mEnd) = face_utils.FACIAL_LANDMARKS_IDXS["mouth"]
    (jStart, jEnd) = face_utils.FACIAL_LANDMARKS_IDXS["jaw"]
    (eblStart, eblEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eyebrow"]
    (ebrStart, ebrEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eyebrow"]
    model = load_model('Models/video.h5', compile=False)
    optimizer = keras.optimizers.Adam(lr=0.0001, beta_1=0.9, beta_2=0.999, epsilon=None, decay=0.0, amsgrad=False)
    model.compile(optimizer=optimizer,loss='sparse_categorical_crossentropy',metrics=['accuracy'])
    face_detect = dlib.get_frontal_face_detector()
    predictor_landmarks  = dlib.shape_predictor("Models/face_landmarks.dat")
    video_capture = cv2.VideoCapture(0)
    final_result = []
    counter = 10
    while True:
        if(counter<=0):
            break
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
            prediction_result = np.argmax(prediction)
            if(prediction_result>0):
                counter = counter - 1
                final_result.append(prediction_result) 
    final = np.array(final_result)
    result = int(stats.mode(final)[0])
    emotion = {0:'Angry',1:'Disgust',2:'Fear',3:'Happy',4:'Sad',5:'Surprise',6:'Neutral'}
    video_capture.release()
    cv2.destroyAllWindows()
    return emotion[result]

print(catch_emotion())