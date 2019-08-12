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
// ----------------- END SPOTIFY API-----------------------
// --------------------------------------------------------
// ----------------- START APPLE MUSIC VIA SEARCH----------

const {google} = require('googleapis');
const customsearch = google.customsearch('v1');
var customSearchKey = require('./config/config.js').customSearchKey; 
var customSearchID = require('./config/config.js').customSearchID; 

async function runSearch(query) {
  const res = await customsearch.cse.list({
    cx: customSearchID ,
    q: query,
    auth: customSearchKey,
  });
  return res.data.items[0].link;
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
        var query = data.body.name + ' ';
        
        data.body.artists.forEach(artist => { query+= artist.name; });

        runSearch(query).then(function(link){

          // TODO: based on whether this link has /album/ or /artist/ in the url,
          // either scrape it for links that have our title in it, or store all 
          // list items (li) with ' "targetId": ' in their properties list, and 
          // put all the ones with numbers following it into an array. Pull the 
          // spotify track number and get the song id from the given array based
          // on that track number. 
          
          // This is excessive scraping but this is what Apple gets
          // when they make their Music API 99 dollars to use...
          
          // for now, this will at least link to the artist/album for a given song. 
          bot.sendMessage(msg.chat.id, "LINK: "+ link, {});
        });

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
