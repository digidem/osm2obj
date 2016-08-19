var fs = require('fs')
var Osm2Json = require('../lib/osm2json')
var concat = require('concat-stream')

var rs = fs.createReadStream(__dirname + '/test.osm')

rs.pipe(new Osm2Json()).pipe(concat(console.log))
