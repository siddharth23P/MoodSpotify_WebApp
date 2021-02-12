const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const request = require('request');
const fetch = require('node-fetch');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const {
    json
} = require('express');
const {
    mainModule
} = require('process');

const client_id = '8c8099f005164e54ae1ae0d956d12743'; // Your client id
const client_secret = '289b49bcee894ebe99347e34eb5abf19'; // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var uris = ''
// MongoDB
var MongoClient = require('mongodb').MongoClient;
const e = require('express');
// Connection URI
const uri =
  "mongodb+srv://Serpent23P:Adisid@2323@cluster0.n7fnu.mongodb.net/test";

var access_token = ''
var refresh_token = ''
var track = ''

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */

var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

const getTopTracks = async function () {
    // let topTracks = []
    // let options = {
    //     url: 'https://api.spotify.com/v1/me/top/tracks?limit=50',
    //     headers: {
    //         'Authorization': 'Bearer ' + access_token
    //     },
    //     json: true
    // };

    const response = await fetch('https://api.spotify.com/v1/me/top/tracks', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    })
    const data = await response.json();
    return data;

}

var getTopArtists = async function () {
    // let topArtists = []
    // let options = {
    //     url: 'https://api.spotify.com/v1/me/top/artists?limit=50',
    //     headers: {
    //         'Authorization': 'Bearer ' + access_token
    //     },
    //     json: true
    // };
    const response = await fetch('https://api.spotify.com/v1/me/top/artists', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    })
    const data = await response.json()
    return data;
}

var getTopArtistTracks = async function (topArtist) {
    // let topArtistTracks = []
    // let options = {
    //     url: `https://api.spotify.com/v1/artists/${topArtist}/top-tracks?market=IN`,
    //     headers: {
    //         'Authorization': 'Bearer ' + access_token
    //     },
    //     json: true
    // };
    const response = await fetch(`https://api.spotify.com/v1/artists/${topArtist}/top-tracks?market=IN`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    })
    const data = await response.json()
    return data;
    // console.log('Artist tracks');
    // return topArtistTracks
}

async function getPlaylistData() {
    topTracks = []
    topArtists = []
    topArtistTracks = []

    await getTopTracks().then((data) => {
        let arr = data.items;
        for (let i = 0; i < arr.length; i++) {
            topTracks.push(arr[i].id);
        }
    })

    await getTopArtists().then((data) => {
        let arr = data.items;
        for (let i = 0; i < arr.length; i++) {
            topArtists.push(arr[i].id);
        }
    })

    for (let i = 0; i < topArtists.length; i++) {
        await getTopArtistTracks(topArtists[i]).then((data) => {
            let topArtistTracksArr = data.tracks;
            // console.log(topArtistTracks[0].id);
            // topArtistTracks.push(topArtistTracksArr[0].id);
            for (let j = 0; j < topArtistTracksArr.length; j++) {
                if (!(topArtistTracksArr[j].id in topTracks)) {
                    topTracks.push(topArtistTracksArr[j].id);
                }
                topArtistTracks.push(topArtistTracksArr[j].id);
            }
        });
    }
    return {
        topTracks,
        topArtists,
        topArtistTracks
    };
}

app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')))
    .use(cors())
    .use(cookieParser())

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// app.get('/', (req, res) => {
//     // res.render('home');
//     res.send('Home');
// })

// app.post('/', (req, res) => {
//     var dataArr = []
//     const python = spawn('python', ['catchEmotion.py']);
//     python.stdout.on('data', function (data) {
//         console.log('Pipe data from python script...');
//         dataArr.push(data);
//     });

//     python.on('close', (code) => {
//         console.log(`child process close all stdio with code ${code}`);
//         var moodObj = {
//             dataArr
//         };
//         MongoClient.connect(uri,{useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true },function(err,db){
//             if(err) throw err;
//             var dbo = db.db("moodspotify");
//         dbo.collection("mood").drop();
//         dbo.createCollection("mood");
//         dbo.collection("mood").insertOne(moodObj, function(err,res){
//             if(err) throw err;
//             console.log("Number of documents inserted: " + res.insertedCount);
//             db.close();
//         });
//         });
//         console.log(dataArr);
//         console.log(moodObj);
//         res.render('player', {
//             track,
//             dataArr,
//         })
//     })
// })

app.get('/login', (req, res) => {
    let state = generateRandomString(16);
    res.cookie(stateKey, state);

    let scope = 'user-read-private user-read-email user-read-playback-state user-top-read user-read-email user-library-read playlist-read-collaborative playlist-modify-private user-follow-read user-read-playback-state user-read-currently-playing playlist-read-private user-library-modify playlist-modify-public ugc-image-upload user-follow-modify user-modify-playback-state user-read-recently-played';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            client_secret: client_secret,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
        })
    );
});


app.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                access_token = body.access_token
                refresh_token = body.refresh_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me/',
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    // console.log(body);
                    // track.push(body.item.name)
                    // track = body.item.name
                    // console.log(track);
                });



                // we can also pass the token to the browser to make requests from there
                // res.redirect('/#' +
                //   querystring.stringify({
                //     access_token: access_token,
                //     refresh_token: refresh_token
                //   }));
                // res.send({
                //     access_token: access_token,
                //     refresh_token: refresh_token,
                // });
                res.render('home', {
                    access_token,
                    refresh_token
                })
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

app.get('/refresh_token', function (req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

app.get('/playlist', (req, res) => {
    var spawn = require('child_process').spawn;
py = spawn('python',['catchEmotion.py']);
var moods = ''
py.stdout.on('data', function(data){
    const daa = data
    moods += (daa.toString('utf8'));
});
py.stdout.on('end', function(){
    console.log('Sum of numbers=',moods);
    getPlaylistData().then(({
        topTracks,
        topArtists,
        topArtistTracks
    }) => {
        // console.log(topTracks.length)
        // console.log(topArtists.length)
        // console.log(topArtistTracks.length)
        // console.log(topTracks)
        var outjson = []
        var queryIds = ''
        for (let i = 0; i < Math.min(100, topTracks.length); i++) {
            queryIds = queryIds + (queryIds ? '%2C' + topTracks[i] : topTracks[i]);
        }
        console.log(queryIds);
        fetch(`https://api.spotify.com/v1/audio-features?ids=${queryIds}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                }
            })
            .then(data => data.json())
            .then(json => {
                const trackFeatures = json.audio_features;

                trackFeatures.forEach(trackFeature => {
                    const {
                        danceability,
                        energy,
                        valence,
                        id
                    } = trackFeature;
                    // console.log(danceability, energy, valence, id);
                    var trackFeatureJson = {
                        danceability: danceability,
                        energy: energy,
                        valence: valence,
                        _id: id
                    }

                    outjson.push(trackFeatureJson)
                    outjson = outjson.filter((obj,index,self) => 
                        index === self.findIndex((t) => (
                            t._id === obj._id
                        ))
                    )

                    if(moods.charAt(0)==='1'){
                        if(moods.charAt(2)==='1'){
                            outjson = outjson.filter(function(el){
                                return el.valence>=0.6975 &&
                                    el.danceability>=0.6825 &&
                                    el.energy>=0.6375;
    
                            });
                        }
                        else if (moods.charAt(2)==='2') {
                            outjson = outjson.filter(function(el){
                                return el.valence>=0.6975 &&
                                    el.danceability<=0.35 &&
                                    el.energy<=0.35;
    
                            });
                        } else {
                            outjson = outjson.filter(function(el){
                                return el.valence>0.6975 &&
                                    el.danceability>0.25 &&
                                    el.danceability<0.75 &&
                                    el.energy>0.25 &&
                                    el.energy<0.75;
    
                            });
                        }
                    }
                    else if (moods.charAt(0)==='2') {
                        if(moods.charAt(2)==='1'){
                            outjson = outjson.filter(function(el){
                                return el.valence<0.35 &&
                                    el.danceability>=0.6825 &&
                                    el.energy>=0.6375;
    
                            });
                        }
                        else if (moods.charAt(2)==='2') {
                            outjson = outjson.filter(function(el){
                                return el.valence<0.35 &&
                                    el.danceability<=0.35 &&
                                    el.energy<=0.35;
    
                            });
                        } else {
                            outjson = outjson.filter(function(el){
                                return el.valence<0.35 &&
                                    el.danceability>0.25 &&
                                    el.danceability<0.75 &&
                                    el.energy>0.25 &&
                                    el.energy<0.75;
    
                            });
                        }
                    } else {
                        if(moods.charAt(2)==='1'){
                            outjson = outjson.filter(function(el){
                                return el.valence>0.25 &&
                                    el.valence<0.75 &&
                                    el.danceability>=0.6825 &&
                                    el.energy>=0.6375;
    
                            });
                        }
                        else if (moods.charAt(2)==='2') {
                            outjson = outjson.filter(function(el){
                                return el.valence>0.25 &&
                                    el.valence<0.75 &&
                                    el.danceability<=0.35 &&
                                    el.energy<=0.35;
    
                            });
                        } else {
                            outjson = outjson.filter(function(el){
                                return el.valence>0.25 &&
                                    el.valence<0.75 &&
                                    el.danceability>0.25 &&
                                    el.danceability<0.75 &&
                                    el.energy>0.25 &&
                                    el.energy<0.75;
    
                            });
                        }
                    }
                })
                console.log(JSON.stringify(outjson));
                MongoClient.connect(uri,{useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true },function(err,db){
                    if(err) throw err;
                    var dbo = db.db("moodspotify");
                    dbo.collection("songs").drop();
                    dbo.createCollection("songs");
                    dbo.collection("songs").insertMany(outjson, function(err,res){
                        if(err) throw err;
                        console.log("Number of documents inserted: " + res.insertedCount);
                        console.log(moods.charAt(0));
                        console.log(moods.charAt(2));
                        db.close();
                    });
                });
                res.render('playlist', {
                    tracks: outjson
                })
            });

    })
});
    
})

app.get('/player',(req,res) =>{
    MongoClient.connect(uri,{useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true },function(err,db){
        if(err) throw err;
        var dbo = db.db("moodspotify");
        dbo.collection("songs").find({}).toArray(function(err, result) {
          if (err) throw err;
          var playlistCreated = [];
          var x;
          for( x in result ) {
            var y = "spotify:track:"
            y+=result[x]._id
            playlistCreated.push(y);
          };
          uris ={"uris":playlistCreated};
          console.log(JSON.stringify(uris));
          //getUserId();
          //postPlaylist();
          //postedSongs(uris);
          res.render('player');
          db.close();
        });
    });
})

app.listen(8888, () => {
    console.log('Listening on port 8888');
})