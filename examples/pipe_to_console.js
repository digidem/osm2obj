var fs = require('fs')
var path = require('path')
var Osm2Json = require('../lib/osm2json')
var concat = require('concat-stream')

var rs = fs.createReadStream(path.join(__dirname, '../test/test.osm'))

rs.pipe(new Osm2Json()).pipe(concat(console.log))
