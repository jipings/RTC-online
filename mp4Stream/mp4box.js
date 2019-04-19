var MP4Box = require('mp4box').MP4Box; // Or whatever import method you prefer.
const fs = require('fs');

var mp4box = new MP4Box();
mp4box.onError = function(e) {};
mp4box.onReady = function(info) { console.log(info) };

fs.readFile('../video/chrome.mp4', (err, data) => {
    console.log(err, data);
    data.fileStart = 0;
    mp4box.appendBuffer(data);
})

