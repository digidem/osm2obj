/* Copyright (c) 2013 Digital Democracy
 * MIT +no-false-attribs License
 * <https://github.com/digidem/osm2json/blob/master/LICENSE>
 */

var util = require('util')
  , Transform = require('stream').Transform
  , expat = require('node-expat');

util.inherits(Osm2Json, Transform);

function Osm2Json (options) {
  if (!(this instanceof Osm2Json))
    return new Osm2Json(options);
    
  var self = this;
  var currentElement = null;
  
  Transform.call(this, options);
  this.parser = new expat.Parser('UTF-8');
  
  this.parser.on('startElement', function (name, attrs) {
    if (name.match(/node|way|relation/)) {
      currentElement = { type: name, attrs: attrs };
    } else if (name == 'tag') {
      if (!currentElement.tags) currentElement.tags = []
      currentElement.tags.push(attrs);
    } else if (name == 'nd') {
      if (!currentElement.nodes) currentElement.nodes = []
      currentElement.nodes.push(attrs);
    }
  });

  this.parser.on('endElement', function (name) {
    if (name.match(/node|way|relation/)) {
      self.push(JSON.stringify(currentElement)+'\n');
      currentElement = null;
    }
  })
}

Osm2Json.prototype._transform = function (chunk, encoding, done) {
  this.parser.parse(chunk);
  done();
}

module.exports = Osm2Json;