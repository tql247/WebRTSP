const express = require('express');
const {rtspToWebsocket} = require("./utils");
const {getRTSPs} = require("./utils");
const router = express.Router();
let listSocket = [];


router.get('/', async (req, res) => {
    if (listSocket.length === 0) {
        const rtspList = getRTSPs();
        listSocket = await rtspToWebsocket(rtspList)
    }
    res.render('index.ejs', {listSocket: listSocket, camNum:listSocket.length});
})

router.post('/addStream', async (req, res) => {
    const {rtsp} = req.body;
    const socket = (await rtspToWebsocket([rtsp]))[0];
    listSocket.push(socket);
    return res.send(socket);
})

module.exports = router;