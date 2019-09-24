const axios = require('axios');
const {google} = require('googleapis');
const customsearch = google.customsearch('v1');
//var customSearchKey = require('./config/config.js').customSearchKey; 
//var customSearchID = require('./config/config.js').customSearchID; 
var artistRegex = /https?:\/\/(music\.)?apple\.com\/([-a-zA-Z]{2})\/artist\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
var albumRegex = /https?:\/\/(music\.)?apple\.com\/([-a-zA-Z]{2})\/album\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
var found = false;

async function searchAppleMusicLink (query, title) {
    // Based on the link returned, determine if it is an album or artist link
    try{
        var link = await runSearch(query)
        if(link.match(artistRegex)){
            return await Promise.resolve(fromAppleArtistLink(link, title));
        }
        else if(link.match(albumRegex)){
            return await Promise.resolve(getHTMLforAlbum(link, title));
        }
    }
    catch(err){
        var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
        return errorMessage.toString();
    }
    
}

// Using google custom search, look for songs in apple music.
// Because Apple wants to suck my wallet dry.
async function runSearch(query) {
    try{
        const res = await customsearch.cse.list({
        cx: process.env.customSearchID ,
        q: query,
        auth: process.env.customSearchKey,
        });
        return res.data.items[0].link;
    }
    catch(err){
        var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
        return errorMessage.toString();
    }
}

// Link is an artist link, get all links embedded in the site with song ids.
async function fromAppleArtistLink(link, title){
    try{
        var response = await axios({
        method: 'get',
        url: 'https://api.hackertarget.com/pagelinks/?q='+link,
        responseType: 'JSON'
        });
        var message = await getPageInfo(response.data, title);
        return message.toString();
    }
    catch(err){
        var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
        return errorMessage.toString();
    }
}

async function getPageInfo(webText, title) {
    try{
        let results = webText.match(albumRegex);
        // go through the links in results and return the right link
        var i;
        for(i = 0; i<results.length; i++){
            var response = await getHTMLfor(results[i], title);
            console.log(response);
            if(response!=null){
                console.log('HEY ITS HERE');
                return response.toString();
            }
        }
    }
    catch(err){
        var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
        return errorMessage.toString();
    }
}

// Look for the link that has a title that matches our song
async function getHTMLfor (link, title){
    try{
        var response = await axios.get(link);
        // Site has a title tag with our song title in it
        if(response.data.toString().toLowerCase().includes('<title>‎'+title.toLowerCase())){
            found = true;
            var response = "Apple Music Link: "+ link;
            console.log(response);
            return response.toString();
        }
        else{
            // If all songs in the for-loop that called 
            // this function don't have the right title
            // the 'found' flag will always be false and
            // send the user a message saying the song wasn't found.
            console.log('NOT THIS');
            return null;
        }
    }
    catch(err){
        var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
        return errorMessage.toString();
    }
}

async function getHTMLforAlbum(link, title){
    // Look for this in the link's HTML
    try{
        var propertyRegex = /\{\"\@type\"\:\"MusicRecording"\,\"url\"\:\"https?:\/\/(music\.)?apple\.com\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)\"\,\"name\"\:\"\b([-a-zA-Z0-9()@:%_\'\-\*\s\+\,.~#?&//=]*)\"/g;
    
        // Look for the link in the array of properties
        var songRegex = /https?:\/\/(music\.)?apple\.com\b([-a-zA-Z0-9?//=]*)/g;
        var response = await axios.get(link);

        // Get all the songs listed in the HTML doc
        let songs = response.data.toString().match(propertyRegex);
        var i;
        for(i = 0; i<songs.length; i++){

            // For each song, look for the one with our title
            if(songs[i].toLowerCase().includes(title.toLowerCase())){
                found = true;

                // Pull the link from the property, send it.
                let returnSong = songs[i].toLowerCase().match(songRegex);
                var response =  "Apple Music Link: "+ returnSong[0];
                return response.toString();
            }
        }
    }
    catch(err){
        var errorMessage = "Oopsie. We hit a snag trying to get your song. If you see @amcdevitt97, tell her this error happened: "+ err;
        return errorMessage.toString();
    }
}

module.exports = {searchAppleMusicLink,runSearch,fromAppleArtistLink, getHTMLfor, getHTMLforAlbum};
