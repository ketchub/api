const express = require('express');
const app     = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({extended:true}));
app.use(require('./router'));

const server  = require('http').Server(app);

server.listen(3000, '0.0.0.0', () => {
  process.stdout.write(`Serving on 0.0.0.0:3000`);
});
