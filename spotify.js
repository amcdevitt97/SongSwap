const axios = require('axios');

//---------------   SPOTIFY API - With Wrapper     ------------------

//var client_id = require('./config/config.js').spotifyClientID; // Your client id
//var client_secret = require('./config/config.js').spotifyClientSecret; // Your secret


var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.spotifyClientID,
    clientSecret: process.env.spotifyClientSecret,
});

// Get an access token and 'save' it using a setter
spotifyApi.clientCredentialsGrant().then(
  function(data) {
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.log('Something went wrong!', err);
  }
);
// ----------------- END SPOTIFY API-----------------------
// --------------------------------------------------------


async function searchSpotifyLink(link, title) {
    
    var propertyRegex = /\"\@type\"\:\"MusicRecording\"\,\"name\"\:\"\b([-a-zA-Z0-9()@:%_\'\-\*\s\+\,.~#?&//=]*)\"/g;
    var artistRegex = /\"artistName\"\:\"\b([-a-zA-Z0-9()@:%_\'\-\*\s\+\,.~#?&//=]*)\"/g;
    var response = await axios.get(link);
    var property = response.data.toString().match(propertyRegex);
    var artistProperty = response.data.toString().match(artistRegex);
    
    var artist = artistProperty[0].toString().substring(14, artistProperty[0].toString().length-1);
    var title = property[0].toString().substring(33, property[0].toString().length-1 );
    var query = artist+' '+title;
    // Little known fact, Apple adds 'feat.' to either titles or artists listings
    // Spotify doesn't and it messes with search. This find-replace fixes that.
    query = query.replace("feat.", " ");
    var data = await spotifyApi.searchTracks(query);
    if(data.body.tracks.items[0] != undefined){
        return Promise.resolve('Spotify link: '+ data.body.tracks.items[0].external_urls.spotify);
        
    }
    else{
        return "Sorry, there was a problem getting your song :( "
    }
}


async function getTrackName(spotifyID) {
    var response = await spotifyApi.getTrack(spotifyID)
    return Promise.resolve(response);
}




module.exports = {searchSpotifyLink, getTrackName};