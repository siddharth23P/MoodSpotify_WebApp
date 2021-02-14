# MoodSpotify_WebApp

# How to run

Open .env and add your client_id and client_secret from Spotify developer dashboard

$pip insall -r requirements.txt

$npm install

$node app.js

Open https://localhost::8888/

# How it works

It uses spotifyweb-node-api to login into user account

Then it takes top songs the user listens in short term, medium term and long term, followed by top artists whose songs user listens to in short term, medium term and long term and take top 10 songs of those artists, then filter any duplicates, thus creating a large list of songs and then store its details into array

Now the main part ->

Node js server runs the python code with uses pretrained model to detect user's face, detect user face landmarks and compare it with pretrained model to predict which type of emotion is shown by user.

Now using this emotion the array of songs is filtered

Now we create a playlist in user's account and push the songs into the playlist

Voila!! The Playlist of top songs for user using his/her mood is created

# Notes

1. Make sure your camera is working.
2. Make sure your your face is facing a light source for better results.
3. If on Windows, make sure to install Visual Studio C/C++ build tools after installing cmake else dlib installation will give an error.

