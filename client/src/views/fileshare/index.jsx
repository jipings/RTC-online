import React, { Component } from 'react';
// import RTCMultiConnection from '../../RTCMultiConnection/RTCMultiConnection';
// import socket from 'socket.io';
import FileSelector from 'fbr';

import './style.css';

export default class FileShare extends Component {
    constructor(props){
        super(props);
        this.state = {

        }
        this.RoomId = this.props.match.params.roomId;
        this.connection = null;
        this.btnSelectFile = null;
        this.iframe = null;
        this.lastSelectedFile = null;
        this.logsDiv = null;
    }

    componentDidMount() {
        this.btnSelectFile = document.querySelector('.btn-select-file');
        this.iframe = document.querySelector('iframe');
        this.logsDiv = document.getElementById('logs');


        window.addEventListener('online', function() {
            window.location.reload();
          }, false);

        window.addEventListener('offline', function() {
            console.warn('Seems disconnected.', 'red');
        }, false);
          // drag-drop support
        document.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }, false);

        document.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if(!e.dataTransfer.files || !e.dataTransfer.files.length) {
                return;
            }

            var file = e.dataTransfer.files[0];

            if(!this.connection) {
                document.getElementById('join-room').onclick();
            }

            this.btnSelectFile.onclick(file);
        }, false);

        console.log(this.props, 'FileShare');
        // this.joinARoom();
        this.setupWebRTCConnection();
    }
    // 预览文件
    previewFile = (file) => {
        this.btnSelectFile.style.left = '5px';
        this.btnSelectFile.style.right = 'auto';
        this.btnSelectFile.style.zIndex = 10;
        this.btnSelectFile.style.top = '5px';
        this.btnSelectFile.style.outline = 'none';

        document.querySelector('.overlay').style.display = 'none';
        this.iframe.style.display = 'block';

        this.iframe.onload = function() {
            Array.prototype.slice.call(this.iframe.contentWindow.document.body.querySelectorAll('*')).forEach(function(element) {
                element.style.maxWidth = '100%';
            });

            if (!file.type || fileNameMatches || file.type.match(/image|video|audio|pdf/g) || this.iframe.src.indexOf('data:image/png') !== -1 || this.iframe.src.toLowerCase().search(/.png|.jpeg|.jpg|.gif/g) !== -1) {
                this.iframe.contentWindow.document.body.style.textAlign = 'center';
                this.iframe.contentWindow.document.body.style.background = 'black';
                this.iframe.contentWindow.document.body.style.color = 'white';
                return;
            }
            this.iframe.contentWindow.document.body.style.textAlign = 'left';
            this.iframe.contentWindow.document.body.style.background = 'white';
            this.iframe.contentWindow.document.body.style.color = 'black';
        };

        var fileNameMatches = (file.name || '').toLowerCase().match(/.webm|.wav|.pdf|.txt|.js|.css|.cs|.png|.jpg|.jpeg|.gif/g);
        if (fileNameMatches) {
            this.iframe.src = URL.createObjectURL(file);
        } else {
            this.iframe.src = 'https://webrtcweb.com/fs/unknown-file.png';
        }
    }

    onFileSelected = (file) => {
        var innerHTML = 'You selected:<br><b>' + file.name + '</b><br>Size: <b>' + this.bytesToSize(file.size) + '</b>';
        // appendLog(innerHTML);
        console.log(file.name, file.size);

        this.lastSelectedFile = file;

        if (this.connection) {
            this.connection.send({
                doYouWannaReceiveThisFile: true,
                fileName: file.size + file.name
            });
        }
    }

    bytesToSize = (bytes) => {
        var k = 1000;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) {
            return '0 Bytes';
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }
    incrementOrDecrementUsers = () => {
        const numberOfUsers = document.getElementById('number-of-users');
        numberOfUsers.innerHTML = this.connection ? this.connection.getAllParticipants().length : 0;
    }

    updateLabel = (progress, label) => {
        if (progress.position === -1) {
            return;
        }

        let position = +progress.position.toFixed(2).split('.')[1] || 100;
        label.innerHTML = position + '%';
    }

    setFileProgressBarHandlers = (connection) => {
        var progressHelper = {};

        // www.RTCMultiConnection.org/docs/onFileStart/
        connection.onFileStart = function(file) {
            if (connection.fileReceived[file.size + file.name]) return;

            var div = document.createElement('div');
            div.style.borderBottom = '1px solid black';
            div.style.padding = '2px 4px';
            div.id = file.uuid;

            var message = '';
            if (file.userid == connection.userid) {
                message += 'Sharing with:' + file.remoteUserId;
            } else {
                message += 'Receiving from:' + file.userid;
            }

            message += '<br><b>' + file.name + '</b>.';
            message += '<br>Size: <b>' + this.bytesToSize(file.size) + '</b>';
            message += '<br><label>0%</label> <progress></progress>';

            if(file.userid !== connection.userid) {
                message += '<br><button id="resend">Receive Again?</button>';
            }

            div.innerHTML = message;

            connection.filesContainer.insertBefore(div, connection.filesContainer.firstChild);

            if(file.userid !== connection.userid && div.querySelector('#resend')) {
                div.querySelector('#resend').onclick = function(e) {
                    e.preventDefault();
                    this.onclick = function() {};

                    if(connection.fileReceived[file.size + file.name]) {
                        delete connection.fileReceived[file.size + file.name];
                    }
                    connection.send({
                        yesIWannaReceive: true,
                        fileName: file.name
                    }, file.userid);

                    div.parentNode.removeChild(div);
                };
            }

            if (!file.remoteUserId) {
                progressHelper[file.uuid] = {
                    div: div,
                    progress: div.querySelector('progress'),
                    label: div.querySelector('label')
                };
                progressHelper[file.uuid].progress.max = file.maxChunks;
                return;
            }

            if (!progressHelper[file.uuid]) {
                progressHelper[file.uuid] = {};
            }

            progressHelper[file.uuid][file.remoteUserId] = {
                div: div,
                progress: div.querySelector('progress'),
                label: div.querySelector('label')
            };
            progressHelper[file.uuid][file.remoteUserId].progress.max = file.maxChunks;
        };

        // www.RTCMultiConnection.org/docs/onFileProgress/
        connection.onFileProgress = function(chunk) {
            if (connection.fileReceived[chunk.size + chunk.name]) return;

            var helper = progressHelper[chunk.uuid];
            if (!helper) {
                return;
            }
            if (chunk.remoteUserId) {
                helper = progressHelper[chunk.uuid][chunk.remoteUserId];
                if (!helper) {
                    return;
                }
            }

            helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
            this.updateLabel(helper.progress, helper.label);
        };

        // www.RTCMultiConnection.org/docs/onFileEnd/
        connection.onFileEnd = function(file) {
            if (connection.fileReceived[file.size + file.name]) return;

            var div = document.getElementById(file.uuid);
            if (div) {
                div.parentNode.removeChild(div);
            }

            if (file.remoteUserId === connection.userid) {
                this.previewFile(file);

                connection.fileReceived[file.size + file.name] = file;

                var message = 'Successfully received file';
                message += '<br><b>' + file.name + '</b>.';
                message += '<br>Size: <b>' + this.bytesToSize(file.size) + '</b>.';
                message += '<br><a href="' + file.url + '" target="_blank" download="' + file.name + '">Download</a>';
                var div = this.appendLog(message);
                return;
            }

            var message = 'Successfully shared file';
            message += '<br><b>' + file.name + '</b>.';
            message += '<br>With: <b>' + file.remoteUserId + '</b>.';
            message += '<br>Size: <b>' + this.bytesToSize(file.size) + '</b>.';
            this.appendLog(message);
        };
    }

    setupWebRTCConnection = () => {
        if (this.connection) {
            return;
        }
        const RTCMultiConnection = window.RTCMultiConnection;
        // www.RTCMultiConnection.org/docs/
        // console.log(RTCMultiConnection, 'RTCMultiConnection');
        this.connection = new RTCMultiConnection();

        // to make sure, "connection-reconnect" doesn't sends files again
        this.connection.fileReceived = {};

        // by default, socket.io server is assumed to be deployed on your own URL
        this.connection.socketURL = '/';

        // comment-out below line if you do not have your own socket.io server
        // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

        this.connection.socketMessageEvent = 'file-sharing-demo';

        // 60k -- assuming receiving client is chrome
        const chunk_size = 60 * 1000;

        this.connection.chunkSize = chunk_size;

        this.connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false
        };

        this.connection.enableFileSharing = true;

        if (this.room_id && this.room_id.length) {
            this.connection.userid = this.room_id;
        }

        this.connection.channel = this.connection.sessionid = this.RoomId;

        this.connection.session = {
            data: true,
            // oneway: true --- to make it one-to-many
        };
        
        this.connection.filesContainer = this.logsDiv;

        this.connection.connectedWith = {};

        this.connection.onmessage = (event) => {
            if(event.data.doYouWannaReceiveThisFile) {
                if(!this.connection.fileReceived[event.data.fileName]) {
                    this.connection.send({
                        yesIWannaReceive:true,
                        fileName: event.data.fileName
                    });
                }
            }

            if(event.data.yesIWannaReceive && !!this.lastSelectedFile) {
                this.connection.shareFile(this.lastSelectedFile, event.userid);
            }
        };

        this.connection.onopen = function(e) {
            try {
                window.chrome.power.requestKeepAwake('display');
            }
            catch(e) {}

            if (this.connection.connectedWith[e.userid]) return;
            this.connection.connectedWith[e.userid] = true;

            // var message = '<b>' + e.userid + '</b><br>is connected.';
            // appendLog(message);
            console.log(e.userid + 'is connected');
            if (!this.lastSelectedFile) return;

            // already shared the file

            var file = this.lastSelectedFile;
            setTimeout(function() {
                // appendLog('Sharing file<br><b>' + file.name + '</b><br>Size: <b>' + bytesToSize(file.size) + '<b><br>With <b>' + connection.getAllParticipants().length + '</b> users');
                console.log('Sharing file:', {
                    fileName: file.name,
                    Size: this.bytesToSize(file.size),
                    With: this.connection.getAllParticipants().length,
                });
                this.connection.send({
                    doYouWannaReceiveThisFile: true,
                    fileName: file.size + file.name
                });
            }, 500);
        };

        this.connection.onclose = function(e) {
            this.incrementOrDecrementUsers();

            if (this.connection.connectedWith[e.userid]) return;

            // appendLog('Data connection has been closed between you and <b>' + e.userid + '</b>. Re-Connecting..');
            console.log('Data connection has been closed between you and '+ e.userid + 'Re-Connectiong...');
            this.connection.join(this.RoomId);
        };

        this.connection.onerror = function(e) {
            if (this.connection.connectedWith[e.userid]) return;

            // appendLog('Data connection failed. between you and <b>' + e.userid + '</b>. Retrying..');
            console.log('Data connection failed. between you and'+ e.userid + 'Retrying...');
        };

        this.setFileProgressBarHandlers(this.connection);

        this.connection.onUserStatusChanged = function(user) {
            this.incrementOrDecrementUsers();
        };

        this.connection.onleave = function(user) {
            user.status = 'offline';
            this.connection.onUserStatusChanged(user);
            this.incrementOrDecrementUsers();
        };

        // var message = 'Connecting room:<br><b>' + connection.channel + '</b>';
        // appendLog(message);
        console.log('Connecting room:' + this.connection.channel);
        console.log(this.connection.openOrJoin, 'openOrJoin');

        // this.connection.getSocket(function(socket) {
        //     socket.on('disconnect', function() {
        //        console.warn('Seems disconnected.', 'red');
        //     });
        //     socket.on('connect', function() {
        //        window.location.reload();
        //     });
        //     socket.on('error', function() {
        //       window.location.reload();
        //     });
        //   });
        // this.connection.openOrJoin(this.connection.channel, function(isRoomExist, roomid) {
        //     const message = 'Successfully connected to room: <b>' + roomid + '</b><hr>Other users can join you on iPhone/Android using "' + roomid + '" or desktop (Windows/MacOSX/Ubuntu) users can join using this (secure/private) URL: <a href="./file-sharing.html#' + roomid + '" target="_blank">file-sharing.html#' + roomid + '</a>';
        //     console.log(message);
        //     // if (isRoomEists) { }
        //     // appendLog(message);

        //     if(document.getElementById('room-id')) {
        //         if(window.innerWidth > 500) {
        //           document.getElementById('room-id').parentNode.innerHTML = 'Joined room: ' + roomid;
        //         }
        //         else {
        //           document.getElementById('room-id').parentNode.innerHTML = 'Joined room:<br>' + roomid;
        //         }
        //     }

        //     this.connection.getSocket(function(socket) {
        //       socket.on('disconnect', function() {
        //          console.warn('Seems disconnected.', 'red');
        //       });
        //       socket.on('connect', function() {
        //          window.location.reload();
        //       });
        //       socket.on('error', function() {
        //         window.location.reload();
        //       });
        //     });

        //     window.addEventListener('offline', function() {
        //         console.warn('Seems disconnected.', 'red');
        //     }, false);
        // });

        window.connection = this.connection;
    }

    joinARoom = (roomId) => {
        
        this.btnSelectFile.onclick = function(file) {
            console.log(file);
            if(file && (file instanceof File || file instanceof Blob) && file.size) {
                this.previewFile(file);
                this.onFileSelected(file);
                return;
            }

            const fileSelector = new FileSelector();
            fileSelector.selectSingleFile(function(file) {
                this.previewFile(file);
                this.onFileSelected(file);
            });
        };

        // var lastSelectedFile;

        var room_id = '';

        window.onerror = console.error = function() {
            var error = JSON.stringify(arguments);
            if(error.indexOf('Blocked a frame with origin') !== -1) {
              return;
            }
            console.error(error);
        };

        this.setupWebRTCConnection();
    }

    appendLog = (html, color) => {
        var div = document.createElement('div');
        div.innerHTML = '<p>' + html + '</p>';
        this.logsDiv.insertBefore(div, this.logsDiv.firstChild);

        if(color) {
          div.style.color = color;
        }

        return div;
    }
    render() {

        return (<div>
            
    <div className="overlay"></div>
    <button className="btn-select-file"></button>

    <iframe></iframe>

    <header>
        <div className="ribbon"><div className="ribbon-stitches-top"></div>
            <strong className="ribbon-content">
                <h1>
                    <input type="text" id="room-id" value={this.RoomId} readOnly placeholder="room-id" />
                    <button id="join-room" disabled>Join</button>
                </h1>
            </strong>
            <div className="ribbon-stitches-bottom"></div>
        </div>
    </header>

    <div id="number-of-users" title="Number of online users.">0</div>
    <div id="logs">
      <p>
        Peer-to-Peer (private) file sharing.
      </p>
      <p>
        You can share/receive files from any platform/device e.g. destkop operating systems, Android, iOS etc.
      </p>
      <p>
        Create or join a room & select file using "+" button.
      </p>
    </div>

    <a className="chrome-web-store-icon" href="https://chrome.google.com/webstore/detail/webrtc-file-sharing/nbnncbdkhpmbnkfngmkdbepoemljbnfo" target="_blank" title="Install Chrome Desktop Extension"></a>

    <a className="android-app-icon" href="https://play.google.com/store/apps/details?id=com.webrtc.experiment" target="_blank" title="Install Android App"></a>

        </div>)
    }
}