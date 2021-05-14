const spawn = require('child_process').spawn;
let freeportAsync = require("freeport-async");
const fs = require('fs'), http = require('http'), WebSocket = require('ws');
const streamProcess = {}
const socketHttpMap = {}

function getRTSPs(machineName) {
    return []
}

async function rtspToHTTP(rtspList) {
    const cmd = 'ffmpeg';
    const httpList = []
    let portPoint = 9000
    for (let rtsp of rtspList) {
        const reStreamPort = await freeportAsync(portPoint);
        const http = `http://127.0.0.1:${reStreamPort}/${process.env.SECRET_KEY || 'abc'}`
        const args = [
            '-rtsp_transport', 'tcp',
            '-hwaccel_device', '0',
            '-hwaccel', 'cuda',
            '-i', rtsp,
            '-f', 'mpegts',
            '-codec:v', 'mpeg1video',
            '-s', '960x540',
            '-b:v', '1500k',
            '-r', '30',
            '-bf', '0',
            '-codec:a', 'mp2',
            '-ar', '44100',
            '-ac', '1',
            '-b:a', '128k',
            http
        ];

        const proc = spawn(cmd, args);
        proc.stdout.on('data', function(data) {
            // console.log(data);
        });

        proc.stderr.setEncoding("utf8")
        proc.stderr.on('data', function(data) {
            // console.log(data);
        });

        proc.on('close', function() {
            console.log('finished/');
        });

        streamProcess[http] = proc;

        httpList.push(http);
        console.log('http')
        console.log(http)
    }
    return httpList
}

function buildStream(STREAM_SECRET, STREAM_PORT, WEBSOCKET_PORT) {
    const socketServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});
    socketServer.connectionCount = 0;
    socketServer.on('connection', function (socket, upgradeReq) {
        socketServer.connectionCount++;

        console.log(
            'New WebSocket Connection: ',
            (upgradeReq || socket.upgradeReq).socket.remoteAddress,
            (upgradeReq || socket.upgradeReq).headers['user-agent'],
            '(' + socketServer.connectionCount + ' total)'
        );

        socket.on('close', function (code, message) {
            socketServer.connectionCount--;
            console.log(
                'Disconnected WebSocket (' + socketServer.connectionCount + ' total)'
            );
        });
    });

    socketServer.broadcast = function (data) {
        socketServer.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    };

    // HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
    const streamServer = http.createServer(function (request, response) {
        const params = request.url.substr(1).split('/');

        if (params[0] !== STREAM_SECRET) {
            console.log(
                'Failed Stream Connection: ' + request.socket.remoteAddress + ':' +
                request.socket.remotePort + ' - wrong secret.'
            );
            response.end();
        }

        response.connection.setTimeout(0);
        console.log(
            'Stream Connected: ' +
            request.socket.remoteAddress + ':' +
            request.socket.remotePort
        );

        request.on('data', function (data) {
            socketServer.broadcast(data);
            if (request.socket.recording) {
                request.socket.recording.write(data);
            }
        });

        request.on('end', function () {
            console.log('close');
            if (request.socket.recording) {
                request.socket.recording.close();
            }
        });
    });

    // Keep the socket open for streaming
    streamServer.headersTimeout = 0;
    streamServer.listen(STREAM_PORT);


    console.log('Listening for incomming MPEG-TS Stream on http://127.0.0.1:' + STREAM_PORT + '/<secret>');
    console.log('Awaiting WebSocket connections on ws://127.0.0.1:' + WEBSOCKET_PORT + '/');

    return `ws://0.0.0.0:${WEBSOCKET_PORT}`
}

async function httpToWebsocket(httpList) {
    const STREAM_SECRET = process.env.SECRET_KEY
    const websocketList = []
    let portPoint = 7000
    for (let httpLink of httpList) {
        const WEBSOCKET_PORT = await freeportAsync(portPoint);
        const STREAM_PORT = parseInt(httpLink.match(/:([0-9]+)/)[0].replace(':', ''))
        const socket = buildStream(STREAM_SECRET, STREAM_PORT, WEBSOCKET_PORT)
        socketHttpMap[socket] = httpLink
        websocketList.push(socket)
        portPoint = WEBSOCKET_PORT + 1;
    }

    return websocketList
}

async function rtspToWebsocket(rtspList) {
    const httpList = await rtspToHTTP(rtspList)
    return httpToWebsocket(httpList)
}

function clearStream(socket) {
    const httpSrc = socketHttpMap[socket]
    const proc = streamProcess[httpSrc]
    delete socketHttpMap[socket];
    delete streamProcess[httpSrc];
    proc.kill()
    return Object.keys(socketHttpMap);
}

module.exports = {getRTSPs, rtspToWebsocket, clearStream}