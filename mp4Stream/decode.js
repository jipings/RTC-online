const fs = require('fs');
var mp4 = require('mp4-stream')
var decode = mp4.decode()

const stream = fs.createReadStream('../video/chrome.mp4').pipe(decode)
    .on('box', function (headers) {
    console.log('found box (' + headers.type + ') (' + headers.length + ')')
    if (headers.type === 'mdat') {
        // you can get the contents as a stream
        console.log('box has stream data (consume stream to continue)')
        decode.stream().resume()
    } else if (headers.type === 'moof') {
        // you can ignore some boxes
        decode.ignore()
    } else {
        // or you can fully decode them
        decode.decode(function (box) {
        console.log('box contents:', box)
        })
    }
    })