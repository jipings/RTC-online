
const ioServer = require('socket.io');

const RTCMultiConnectionServer = require('../RTCMultiConnection-Server/node_scripts');

let PORT =  9001;

const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const fs = require('fs');

const https = require('https');

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname + '/public/index.html'));
// });
const jsonPath = {
    config: 'config.json',
    logs: 'logs.json'
};
const BASH_COLORS_HELPER = RTCMultiConnectionServer.BASH_COLORS_HELPER;
const getValuesFromConfigJson = RTCMultiConnectionServer.getValuesFromConfigJson;
const getBashParameters = RTCMultiConnectionServer.getBashParameters;
const resolveURL = RTCMultiConnectionServer.resolveURL;

let config = getValuesFromConfigJson(jsonPath);
config = getBashParameters(config, BASH_COLORS_HELPER);

if(PORT === 9001) {
    PORT = config.port;
}

const options = {
    key: null,
    cert: null,
    ca: null,
};
let pfx = false;

if (!fs.existsSync(config.sslKey)) {
    console.log(BASH_COLORS_HELPER.getRedFG(), 'sslKey:\t ' + config.sslKey + ' does not exist.');
} else {
    pfx = config.sslKey.indexOf('.pfx') !== -1;
    options.key = fs.readFileSync(config.sslKey);
}

if (!fs.existsSync(config.sslCert)) {
    console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCert:\t ' + config.sslCert + ' does not exist.');
} else {
    options.cert = fs.readFileSync(config.sslCert);
}

if (config.sslCabundle) {
    if (!fs.existsSync(config.sslCabundle)) {
        console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCabundle:\t ' + config.sslCabundle + ' does not exist.');
    }

    options.ca = fs.readFileSync(config.sslCabundle);
}

if (pfx === true) {
    options = {
        pfx: sslKey
    };
}

const httpServer = http.createServer(app);
RTCMultiConnectionServer.beforeHttpListen(httpServer, config);

httpServer.listen(PORT, process.env.IP || "0.0.0.0", () => {
    console.log('Server is running on port \n' + `http://localhost:${PORT}`);
});

const rooms = []; // 房间列表
const allUsers = {};
ioServer(httpServer).on('connection', (socket) => {
    console.log('connection',);
    RTCMultiConnectionServer.addSocket(socket);

    const params = socket.handshake.query;

    if(!params.socketCustomEvent) {
        params.socketCustomEvent = 'custom-message';
    }

    socket.on(params.socketCustomEvent, (message) => {
        console.log('message', message);
        socket.broadcast.emit(params.socketCustomEvent, message);
    });

    socket.on('*', (msg) => {
        console.log('message', msg);
    })

    // rtc-message
  
    socket.on('rtc-message', (message) => {
        console.log(message, socket.id);
        if(rooms.some(x => x.roomId === message.roomId)) {
            const index = rooms.findIndex(x => x.roomId === message.roomId);
            const users = rooms[index].users;
            const user = message.user;

            if(users.indexOf(user) === -1 ) {
                users.push(user);
            }

            socket.emit('rtc-message', { roomId: message.roomId, users });
            socket.broadcast.emit('rtc-message', { roomId: message.roomId, users });
        } else {
            rooms.push({ roomId: message.roomId, users: [message.user] });
            socket.emit('rtc-message', { roomId: message.roomId, users: [message.user] });
            socket.broadcast.emit('rtc-message',{ roomId: message.roomId, users: [message.user] });
            console.log(rooms)
        }
    });
    socket.on('rtc-message-desc', (message) => {
        console.log('rtc-message-desc', message.type);
        // socket.emit('rtc-message-desc', message);

        socket.broadcast.emit('rtc-message-desc', message)
    });
    socket.on('rtc-message-ice', (message) => {
        console.log('rtc-message-ice')
        socket.broadcast.emit('rtc-message-ice', message);
    });

    socket.on('profile-mp4', ({filename}) => {
        // fs.createReadStream('./video/chrome.mp4');
        fs.readFile(`./video/${filename}`, (err, buf) => {
            console.log(buf);
            if(!err) {
                socket.emit('profile-mp4', { file: true, buffer: buf });
            } else {
                socket.emit('profile-mp4', { file: false, buffer: null });
            }
            
        });
    })
})
