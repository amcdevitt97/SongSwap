const axios = require('axios');
async function searchSpotifyLink(link, title) {
    
    var propertyRegex = /\"\@type\"\:\"MusicRecording\"\,\"name\"\:\"\b([-a-zA-Z0-9()@:%_\'\-\*\s\+\,.~#?&//=]*)\"/g;
    var artistRegex = /\"artistName\"\:\"\b([-a-zA-Z0-9()@:%_\'\-\*\s\+\,.~#?&//=]*)\"/g;
    var response = await axios.get(link);
    var property = response.data.toString().match(propertyRegex);
    var artistProperty = response.data.toString().match(artistRegex);
    
    var artist = artistProperty[0].toString().substring(14, artistProperty[0].toString().length-1);
    var title = property[0].toString().substring(33, property[0].toString().length-1 );
    return Promise.resolve(title+' '+artist);
    // TODO: spotify api query for artist and title combined
}

module.exports = {searchSpotifyLink};