Implements a [Node Transport Stream](http://nodejs.org/api/stream.html#stream_class_stream_transform). Takes a readable stream of [OSM XML](http://wiki.openstreetmap.org/wiki/OSM_XML) and outputs a stream of JSON in the following format:

```JSON
{
    "attrs": {
        "changeset": "50", 
        "id": "29", 
        "lat": "38.9003573", 
        "lon": "-77.0232578", 
        "timestamp": "2013-09-05T19:38:11Z", 
        "version": "1"
    }, 
    "tags": [
        {
            "k": "amenity", 
            "v": "place_of_worship"
        }
    ], 
    "type": "node"
}
```

```JSON
{
  "type": "way",
  "attrs": {
    "id": "3",
    "version": "3",
    "timestamp": "2013-09-05T19:38:11Z",
    "changeset": "49"
  },
  "nodes": [{
    "ref": "19"
  }, {
    "ref": "20"
  }, {
    "ref": "21"
  }, {
    "ref": "22"
  }, {
    "ref": "26"
  }, {
    "ref": "27"
  }],
  "tags": [{
    "k": "name",
    "v": "York St"
  }]
}
```

##Example

```Javascript
var fs = require('fs')
  , Osm2Json = require('../lib/osm2json');
  
var rs = fs.createReadStream('./test.osm');

var osm2Json = new Osm2Json();

rs.pipe(osm2Json).pipe(process.stdout);
```