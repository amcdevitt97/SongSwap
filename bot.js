const appleMusic = require('./applemusic');
const axios = require('axios');
// TODO: generate new bot token
var TelegramBot = require('node-telegram-bot-api'); 
var token = require('./config/config.js').authToken;
const bot = new TelegramBot(token, {polling: true});


//---------------   SPOTIFY API - With Wrapper     ------------------

var client_id = require('./config/config.js').spotifyClientID; // Your client id
var client_secret = require('./config/config.js').spotifyClientSecret; // Your secret


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


// Explaination of the bot
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to songswap. I'll send the Apple music link for "+
  "any Spotify song sent, and the Spotify link for any Apple music song sent. "+
  "Because what expensive freak buys two different music streaming services? ", {
  });
});

// The real magic
bot.on('text', async function (msg){
  var chatId = msg.chat.id;
  if(msg.text.toString().includes("https://open.spotify.com/")){
    
    var spotifyRegex = /(https:\/\/open\.spotify\.com\/track\/)([a-zA-Z0-9]+)(.*)$/g;
    var foundURL = msg.text.toString().match(spotifyRegex);
    
    // Get spotify song ID
    var spotifyID = foundURL.toString().match(/\/\w{22}/g).toString().substring(1, 23);

    // Lookup title and artist
    var data = await spotifyApi.getTrack(spotifyID)
    var title = data.body.name;
    var query = title + ' ';
    data.body.artists.forEach(artist => { query+= artist.name+" "; });
    
    bot.sendMessage(msg.chat.id, "Finding your song...", {});
    // Anonymous Async fucntion to search for our apple music link
    (async () => {
      var message = await appleMusic.searchAppleMusicLink(query, title);
      bot.sendMessage(msg.chat.id, message, {});
    })();
        
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
