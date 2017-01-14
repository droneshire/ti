var seaport = require('../../');
var ports = seaport.connect('localhost', 6000);
var request = require('request');

ports.get('http@0.5.x', function (ps) {
    var u = 'http://' + ps[0].host + ':' + ps[0].port;
    request(u).pipe(process.stdout);
});
