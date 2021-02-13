const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express')
const {
    spawn
} = require('child_process');
const {
    totalmem
} = require('os');
const path = require('path');
const app = express()

const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
];

const spotifyApi = new SpotifyWebApi({
    redirectUri: 'http://localhost:8888/callback',
    clientId: '<your client id>',
    clientSecret: '<your client secret id>'
});

// var access_token = ''
// var refresh_token = ''
// var expires_in = ''
var moods = ''

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: false
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('home');
    // res.redirect('/login');
})

app.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            console.log('access_token:', access_token);
            console.log('refresh_token:', refresh_token);

            console.log(
                `Sucessfully retreived access token. Expires in ${expires_in} s.`
            );
            // res.send('Success! You can now close the window.');
            // res.redirect('/playlist')
            res.redirect('/create');

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];

                console.log('The access token has been refreshed!');
                console.log('access_token:', access_token);
                spotifyApi.setAccessToken(access_token);
            }, expires_in / 2 * 1000);
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
        });
});

app.get('/create', (req, res) => {
    res.render('create');
})

app.get('/playlist', async (req, res) => {
    const userid = await getMyData();
    console.log(userid);
    var topTracks = [];
    var trackFeatures = [];
    topTracks = await getTopTracks();
    console.log(topTracks.length, ' users top tracks')
    var topArtists = await getTopArtists();
    console.log(topArtists.length, ' users top artists');
    for (artist of topArtists) {
        topTracks = await getTopArtistTracks(artist, topTracks);
    }
    console.log(topTracks.length, `users top artist's tracks`);
    for (let i = 0; i < topTracks.length; i += 100) {
        let trackIds = topTracks.slice(i, Math.min(topTracks.length, i + 100));
        trackFeatures = await getTrackFeat(trackIds, trackFeatures);
    }
    console.log(trackFeatures.length, ' number of tracks with features');
    const playlistname = await generateTime();
    const playlistid = await createMyPlaylist(playlistname, {
        'description': playlistname,
        'public': false
    })
    console.log(playlistid);
    trackURIs = []
    aftersorttracks = trackFeatures;
    py = spawn('python', ['catchEmotion.py']);
    moods = "";
    py.stdout.on('data', function (data) {
        console.log('Pipe data from python script ...');
        var daa = data;
        moods += (daa.toString('utf8'));
    });
    py.stdout.on('end', function () {
        console.log('Moods', moods, moods.length);
        aftersorttracks = sortByValence(aftersorttracks);
        aftersorttracks = sortByDanceabilityAndEnergy(aftersorttracks);
        for (track of aftersorttracks) {
            trackURIs.push(track.uri);
        }
        console.log(aftersorttracks.length, ' no of selected tracks');
        for (let i = 0; i < trackURIs.length; i += 100) {
            let trackURIsliced = trackURIs.slice(i, Math.min(trackURIs.length, i + 100));
            addTracksToPlaylist(playlistid, trackURIsliced);
        }
        res.render('player', {
            playlistid
        })
    });
})

async function generateTime() {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
}

async function getMyData() {
    try {
        const myData = await spotifyApi.getMe();
        return myData.body.id;
    } catch (e) {
        console.log(e);
        return '';
    }
}
async function getTrackFeat(topTracks, trackFeatures) {
    try {
        const data = await spotifyApi.getAudioFeaturesForTracks(topTracks);
        const tracks = data.body.audio_features;
        for (track of tracks) {
            if (track === null) {
                continue;
            }
            const {
                uri,
                valence,
                danceability,
                energy
            } = track;
            trackFeatures.push({
                uri: uri,
                valence: valence,
                danceability: danceability,
                energy: energy
            })
        }
        return trackFeatures;
       
    } catch (e) {
        console.log(e);
 
        return trackFeatures;
    }
}
async function getTopTracks() {
    try {
        let topTracks = []
        const data = await spotifyApi.getMyTopTracks({
            limit: 50
        });
        data.body.items.forEach(track => {
            const {
                id,
                uri
            } = track;
            topTracks.push({
                id: id,
                uri: uri
            })
        })
        return topTracks
    } catch (e) {
        console.log(e);
        return []
    }
}

async function createMyPlaylist(name, options) {
    try {
        let playlistid = ''
        const playlistDetails = await spotifyApi.createPlaylist(name, options);
        playlistid = playlistDetails.body.id;
        return playlistid;
    } catch (e) {
        console.log(e);
        return '';
    }
}

function addTracksToPlaylist(playlistid, trackURIs) {
    spotifyApi.addTracksToPlaylist(playlistid, trackURIs)
        .then(data => console.log(data))
        .catch(e => console.log(e));
}

async function getTopArtists() {
    try {
        const data = await spotifyApi.getMyTopArtists({
            limit: 50,
            time_range: 'long_term',
        });
        const artists = data.body.items;
        var topArtists = []
        artists.forEach(artist => {
            topArtists.push(artist.id);
        })
        return topArtists;
    } catch (e) {
        console.log(e);
        return [];
    }
}

async function getTopArtistTracks(topArtist, topTracks) {
  
    try {
        const data = await spotifyApi.getArtistTopTracks(topArtist, 'IN');
        const tracks = data.body.tracks;
        for (track of tracks) {
            topTracks.push(track.id);
        }
        return topTracks;
    } catch (e) {
        console.log(e);
        return topTracks;
    }
}

function sortByValence(x) {
    if (moods.charAt(0) === '1') {
        x = x.filter(function (el) {
            return el.valence >= 0.55
        })
    } else if (moods.charAt(0) === '2') {
        x = x.filter(function (el) {
            return el.valence < 0.45
        })
    } else {
        x = x.filter(function (el) {
            return el.valence > 0.35 &&
                el.valence < 0.65
        })
    }
    return x;
}

function sortByDanceabilityAndEnergy(x) {
    if (moods.charAt(2) === '1') {
        x = x.filter(function (el) {
            return el.danceability >= 0.55 && el.energy >= 0.55;
        })
    } else if (moods.charAt(2) === '2') {
        x = x.filter(function (el) {
            return el.danceability < 0.45 &&
                el.energy < 0.45;
        })
    } else {
        x = x.filter(function (el) {
            return el.danceability > 0.35 &&
                el.danceability < 0.65 &&
                el.energy > 0.35 &&
                el.energy < 0.65
        })
    }
    return x;
}


app.listen(8888, () =>
    console.log(
        'HTTP Server up. Now go to http://localhost:8888/ in your browser.'
    )
);
