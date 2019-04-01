import React, { Component } from 'react';

import io from 'socket.io-client';

export default class Socket extends Component {

    componentDidMount() {
        const socket = io.connect('https://localhost:9001');
        console.log(socket);
        socket.on('custom-message', (res) => {
            console.log(res, 'custom-message');
        });
        socket.emit('custom-message', {msg: 'first msg'});
    }

    render() {
        return <div>Socket</div>
    }
}