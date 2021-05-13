const express = require('express');
const {clearStream} = require("./utils");
const {rtspToWebsocket} = require("./utils");
const {getRTSPs} = require("./utils");
const router = express.Router();
let listSocket = [];


router.get('/', async (req, res) => {
    if (listSocket.length === 0) {
        const rtspList = getRTSPs();
        listSocket = await rtspToWebsocket(rtspList)
    }
    res.render('views/index.ejs', {listSocket: listSocket, camNum:listSocket.length});
})

router.post('/addStream', async (req, res) => {
    const {rtsp} = req.body;
    const socket = (await rtspToWebsocket([rtsp]))[0];
    listSocket.push(socket);
    return res.redirect('back');
})

router.post('/clearStream', async (req, res) => {
    const {socket} = req.body;
    console.log('listSocket')
    console.log(listSocket)
    listSocket = clearStream(socket);
    console.log(listSocket)
    return res.redirect('back');
})

module.exports = router;