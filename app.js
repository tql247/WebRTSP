require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const routes = require('./routes');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set("views",".");

app.use('/', routes);
app.set('trust proxy', 1);

app.listen(3000, () => console.log(`Listening at http://localhost:${3000}`))

