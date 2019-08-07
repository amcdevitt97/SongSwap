var TelegramBot = require('node-telegram-bot-api'); 
var token = require('./config/config.js').authToken;

const bot = new TelegramBot(token, {polling: true});

//---------------   SPOTIFY API - With Wrapper     ------------------

//  https://github.com/thelinmichael/spotify-web-api-node#installation
var client_id = require('./config/config.js').spotifyClientID; // Your client id
var client_secret = require('./config/config.js').spotifyClientSecret; // Your secret
var redirect_uri = require('./config/config.js').spotifyRedirectURI;

var SpotifyWebApi = require('spotify-web-api-node');
// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
  //  redirectUri: redirect_uri,
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

// ----------------- END SPOTIFY API


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to songswap. I'll send the Apple music link for "+
  "any Spotify song sent, and the Spotify link for any Apple music song sent. "+
  "Because what expensive freak buys two different music streaming services? ", {
  });
});

bot.on('text', function (msg){
  var chatId = msg.chat.id;
  if(msg.text.toString().includes("https://open.spotify.com/")){
    
    var spotifyRegex = /(https:\/\/open\.spotify\.com\/track\/)([a-zA-Z0-9]+)(.*)$/g;
    
    
    var foundURL = msg.text.toString().match(spotifyRegex);

    var spotifyID = foundURL.toString().match(/\/\w{22}/g).toString().substring(1, 23);
    // TODO: use spotify web API to get the artist and track title 
    bot.sendMessage(msg.chat.id, "Spotify ID is: " + spotifyID, {});

    // Lookup title and artist
    spotifyApi.getTrack(spotifyID)
    .then(function (data) {
        console.log('TITLE: ', data.body.name);
        console.log('ARTISTS: ', data.body.artists[0].name);
        bot.sendMessage(msg.chat.id, "TITLE: "+ data.body.name, {});
        data.body.artists.forEach(artist => { bot.sendMessage(msg.chat.id, "ARTIST: "+ artist.name, {}); });
    }, function (err) {
        console.log('Something went wrong!', err);
    });

    // TODO: 
    // Use apple music API to search the song
    // get first results' URL and send it
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
