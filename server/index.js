
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

const httpServer = https.createServer(options, app);
RTCMultiConnectionServer.beforeHttpListen(httpServer, config);

httpServer.listen(PORT, process.env.IP || "0.0.0.0", () => {
    console.log('Server is running on port \n' + `http://localhost:${PORT}`);
});

ioServer(httpServer).on('connection', (socket) => {
    RTCMultiConnectionServer.addSocket(socket);

    const params = socket.handshake.query;

    if(!params.socketCustomEvent) {
        params.socketCustomEvent = 'custom-message';
    }

    socket.on(params.socketCustomEvent, (message) => {
        socket.broadcast.emit(params.socketCustomEvent, message);
    });
})