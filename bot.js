const appleMusic = require('./applemusic');
const spotify = require('./spotify');
const axios = require('axios');
// TODO: generate new bot token
var TelegramBot = require('node-telegram-bot-api'); 
var token = require('./config/config.js').authToken;
const bot = new TelegramBot(token, {polling: true});




// Explaination of the bot
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to songswap. I'll send the Apple music link for "+
  "any Spotify song sent, and the Spotify link for any Apple music song sent. "+
  "Because what expensive freak buys two different music streaming services? "+
  "Apologies if it doesn't always return your song. Part of this is due to lacking "+
  "an Apple Music API key for 99 dollars. If you want me to add it, venmo me 99 dollars "+
  "at venmo.com/pay-here . Created by @amcdevitt97 .", {
  });
});


// The real magic
bot.on('text', async function (msg){

  // ---------------SPOTIFY TO APPLE MUSIC --------------------//
  if(msg.text.toString().includes("https://open.spotify.com/")){
    
    // Get full spotify link 
    var spotifyRegex = /(https:\/\/open\.spotify\.com\/track\/)([a-zA-Z0-9]+)(.*)$/g;
    var foundURL = msg.text.toString().match(spotifyRegex);
    // Get spotify song ID
    var spotifyID = foundURL.toString().match(/\/\w{22}/g).toString().substring(1, 23);

    // Lookup title and artist
    var data = await spotify.getTrackName(spotifyID)
    var title = data.body.name;
    var query = title + ' ';
    data.body.artists.forEach(artist => { query+= artist.name+" "; });

    // Anonymous Async fucntion to search for our apple music link
    (async () => {
      var message = await appleMusic.searchAppleMusicLink(query, title);
      bot.sendMessage(msg.chat.id, message, {});
    })();
        
  }

  // ---------------APPLE MUSIC TO SPOTIFY--------------------//
  if(msg.text.toString().includes("https://music.apple.com")){
    // Make sure it is a track link
    if(msg.text.toString().includes("?i=")){
      var appleRegex = /https?:\/\/(music\.)?apple\.com\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      var foundURL = msg.text.toString().match(appleRegex);

      // Anonymous Async fucntion to search for our spotify link
      (async () => {
        var message = await spotify.searchSpotifyLink(foundURL[0], title);
        bot.sendMessage(msg.chat.id, message, {});
      })();
    }
    // Apple music link sent wasn't a track link.
    else{
      bot.sendMessage(msg.chat.id, 'Your messsage doesn\'t look like an Apple Music track link. Make sure you\'re sending the song and not an album or artist page.', {});
    }
  }
});

// Debugging
bot.on("polling_error", (err) => console.log(err));
