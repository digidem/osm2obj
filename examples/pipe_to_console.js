var fs = require('fs')
var path = require('path')
var Osm2Obj = require('../lib/osm2obj')
var concat = require('concat-stream')

var rs = fs.createReadStream(path.join(__dirname, '../test/osm.xml'))

rs.pipe(new Osm2Obj()).pipe(concat(console.log))
