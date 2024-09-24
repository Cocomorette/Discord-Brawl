var http = require('http');
http.createServer (function (req, res) {
res.write("I'malive");
res.end();
}).listen(8080);
