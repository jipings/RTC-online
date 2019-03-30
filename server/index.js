
const ioServer = require('socket.io');
const RTCMultiConnectionServer = require('../RTCMultiConnection-Server/node_scripts');

const port = process.env.PORT || 9001;

const express = require('express');
const app = express();
const path = require('path');
const http = require('http');

const https = require('https');

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname + '/public/index.html'));
// });

const httpServer = http.createServer(app);

httpServer.listen(port, process.env.IP || "0.0.0.0", () => {
    console.log('Server is running on port \n' + `http://localhost:${port}`);
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