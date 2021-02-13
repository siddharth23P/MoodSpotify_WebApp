# MoodSpotify_WebApp

# How to run

$pip insall -r requirements.txt

$npm install

$node app.js

open https://localhost::8888/

# How it works

It uses spotifyweb-node-api to login into user account

Then it takes top 50 songs the user listens , followed by top 50 artists whose songs user listens to and take top 10 songs of those artists , thus creating a list of total 550 songs and then store it details into array

Now the main part ->

Node js server runs the python code with uses pretrained model to detect user's face detect user face landmarks and compare it with pretrained model to predict whichh type of emotion is shown by user.

Now using this emotion the array of songs is filtered

Now we create a playlist in user's account and push the songs into the playlist

Voila!! The Playlist of top songs for user using his/her mood is created

