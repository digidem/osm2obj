var fs = require('fs')
  , Osm2Json = require('../lib/osm2json');
  
var rs = fs.createReadStream('./test.osm');

var osm2Json = new Osm2Json();

rs.pipe(osm2Json).pipe(process.stdout);
