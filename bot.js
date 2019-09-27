// TODO: generate new bot token
var TelegramBot = require('node-telegram-bot-api'); 
var token = process.env.token;
const bot = new TelegramBot(token, {polling: true});
const appleMusic = require('./applemusic');
const spotify = require('./spotify');





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
  var message = msg.text.toString();
  // ---------------SPOTIFY TO APPLE MUSIC --------------------//
  if(message.includes("https://open.spotify.com/track")){
    
    // Get full spotify link 
    var spotifyRegex = /(https:\/\/open\.spotify\.com\/track\/)([a-zA-Z0-9]+)(.*)$/g;
    var foundURL = message.match(spotifyRegex);
    // Get spotify song ID
    var spotifyID = foundURL.toString().match(/\/\w{22}/g).toString().substring(1, 23);

    // Lookup title and artist
    try{
      var data = await spotify.getTrackName(spotifyID)
      var title = data.body.name;
      var query = title + ' ';
      data.body.artists.forEach(artist => { query+= artist.name+" "; });
    }catch(err){
      var errorMessage = "Oopsie. We hit a snag trying to find your spotify song data. If you see @amcdevitt97, tell her this error happened: "+ err;
      bot.sendMessage(msg.chat.id, errorMessage, {});
    }

    // Anonymous Async fucntion to search for our apple music link
    (async () => {
      try{
        console.log("query:"+query);
        console.log("title:"+title);
        var response = await appleMusic.searchAppleMusicLink(query, title);
        console.log(response);
        bot.sendMessage(msg.chat.id, response, {});
      }
      catch(err){
        var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
        bot.sendMessage(msg.chat.id, errorMessage, {});
      }
    })();
        
  }

  // ---------------APPLE MUSIC TO SPOTIFY--------------------//
  if(message.includes("https://music.apple.com")){
    // Make sure it is a track link
    if(message.includes("?i=")){
      var appleRegex = /https?:\/\/(music\.)?apple\.com\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      var foundURL = message.match(appleRegex);

      // Anonymous Async fucntion to search for our spotify link
      (async () => {
        try{
          var response = await spotify.searchSpotifyLink(foundURL[0], title);
          console.log(response);
          bot.sendMessage(msg.chat.id, response, {});
        }
        catch(err){
          var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
          bot.sendMessage(msg.chat.id, errorMessage, {});
        }
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
