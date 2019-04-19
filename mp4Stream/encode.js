var box = require('mp4-box-encoding')
var fs = require('fs');
var buffer = fs.readFileSync('../video/chrome.mp4')
// decode any box including headers
// decode the entire moov box and its children
var moov = box.decode(buffer)

//  moov.mfhd.mtime = new Date() // Change the modification time
console.log(moov);
// now this is an encoding of the modified moov box
var moofBuffer = box.encode(moov)

// decode the contents of just the stts box
var stts = box.decode(buffer.slice(609, 625))

console.log(stts);
