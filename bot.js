const axios = require('axios');
// TODO: generate new bot token
var TelegramBot = require('node-telegram-bot-api'); 
var token = require('./config/config.js').authToken;
const bot = new TelegramBot(token, {polling: true});
var found = false;
//---------------   SPOTIFY API - With Wrapper     ------------------

var client_id = require('./config/config.js').spotifyClientID; // Your client id
var client_secret = require('./config/config.js').spotifyClientSecret; // Your secret
var redirect_uri = require('./config/config.js').spotifyRedirectURI;

var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
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
// ----------------- START APPLE MUSIC VIA SEARCH----------

const {google} = require('googleapis');
const customsearch = google.customsearch('v1');
var customSearchKey = require('./config/config.js').customSearchKey; 
var customSearchID = require('./config/config.js').customSearchID; 
var artistRegex = /https?:\/\/(music\.)?apple\.com\/([-a-zA-Z]{2})\/artist\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
var albumRegex = /https?:\/\/(music\.)?apple\.com\/([-a-zA-Z]{2})\/album\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

// Using google custom search, look for songs in apple music.
async function runSearch(query) {
  const res = await customsearch.cse.list({
    cx: customSearchID ,
    q: query,
    auth: customSearchKey,
  });
  return res.data.items[0].link;
}

// Based on the link returned, determine if it is an album or artist link
function searchAppleMusicLink(query, msg, title){
  runSearch(query).then(function(link){
    if(link.match(artistRegex)){
      fromAppleArtistLink(link, msg, title);
    }
    else if(link.match(albumRegex)){
      getHTMLforAlbum(link, msg, title);
    }
  });
}

// Link is an artist link, get all links embedded in the site with song ids.
function fromAppleArtistLink(link, msg, title){
  axios({
    method: 'get',
    url: 'https://api.hackertarget.com/pagelinks/?q='+link,
    responseType: 'JSON'
  })
    .then(function (response) {
      console.log(response.data);
      let results = response.data.match(albumRegex);
      // go through the links in results and return the right link
      var i;
      for(i = 0; i<results.length; i++){
        getHTMLfor(results[i], msg, title)
      }
      setTimeout(function(){
        if(i == results.length && found == false){
          // song wasn't found, blame my debt.
          bot.sendMessage(msg.chat.id, "Oopsie. We hit a snag trying to get your song. Blame the lack of an Apple Music API key. If you want to contribute to @amcdevitt97 's college kid API fund, venmo me 99 dollars at venmo.com/pay-here", {});
        }
      }, 5000);
      
    })
    .catch(function (error) {
      // Error hit
      bot.sendMessage(msg.chat.id, "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ error, {});
    });;
}

// look for the link that has a title that matches our song
function getHTMLfor(link, msg, title){
  axios.get(link).then(response => {
    // Site has a title tag with our song title in it
    if(response.data.toString().toLowerCase().includes('<title>‎'+title.toLowerCase())){
      found = true;
      console.log('FOUND');
      bot.sendMessage(msg.chat.id, "Apple Music Link: "+ link, {});
    }
    else{
      console.log('NOT THIS');
    }
  })
  .catch(error => {
    console.log(error);
  })
}

function getHTMLforAlbum(link, msg, title){
  // Look for this in the link's HTML
  var propertyRegex = /\{\"\@type\"\:\"MusicRecording"\,\"url\"\:\"https?:\/\/(music\.)?apple\.com\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)\"\,\"name\"\:\"\b([-a-zA-Z0-9()@:%_\'\-\*\s\+\,.~#?&//=]*)\"/g;
  // Look for the link in the array of properties
  var songRegex = /https?:\/\/(music\.)?apple\.com\b([-a-zA-Z0-9?//=]*)/g;
  axios.get(link).then(response => {
    // Get all the songs listed in the HTML doc
    let songs = response.data.toString().match(propertyRegex);
    var i;
    for(i = 0; i<songs.length; i++){
      // For each song, look for the one with our title
      if(songs[i].toLowerCase().includes(title.toLowerCase())){
        console.log('FOUND');
        found = true;
        // Pull the link from the property, send it.
        let returnSong = songs[i].toLowerCase().match(songRegex);
        bot.sendMessage(msg.chat.id, "Apple Music Link: "+ returnSong[0], {});
      }
    }
  })
  .catch(error => {
    console.log(error);
  })
}


// ----------------- END APPLE MUSIC SEARCH


// Explaination of the bot
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to songswap. I'll send the Apple music link for "+
  "any Spotify song sent, and the Spotify link for any Apple music song sent. "+
  "Because what expensive freak buys two different music streaming services? ", {
  });
});

// The real magic
bot.on('text', function (msg){
  var chatId = msg.chat.id;
  if(msg.text.toString().includes("https://open.spotify.com/")){
    
    var spotifyRegex = /(https:\/\/open\.spotify\.com\/track\/)([a-zA-Z0-9]+)(.*)$/g;
    var foundURL = msg.text.toString().match(spotifyRegex);
    
    // Get spotify song ID
    var spotifyID = foundURL.toString().match(/\/\w{22}/g).toString().substring(1, 23);

    // Lookup title and artist
    spotifyApi.getTrack(spotifyID)
    .then(function (data) {
        var title = data.body.name;
        var query = title + ' ';
        data.body.artists.forEach(artist => { query+= artist.name+" "; });
        searchAppleMusicLink(query, msg, title);
    }, function (err) {
        console.log('Something went wrong!', err);
    });

  }

  if(msg.text.toString().includes("https://music.apple.com")){

    var appleRegex = /https?:\/\/(music\.)?apple\.com\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    var foundURL = msg.text.toString().match(appleRegex);
    var appleID = foundURL.toString().match(/i=.+/g).toString().substring(2);
    bot.sendMessage(msg.chat.id, "Apple Music ID is: " + appleID, {});
        // TODO: parse URL metadata to get title/artist
        // Use spotify API to search the song
        // get first results' URL and send it
  }

});

bot.on("polling_error", (err) => console.log(err));
