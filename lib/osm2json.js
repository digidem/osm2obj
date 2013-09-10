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
  
  this.currentElement = null;
  
  Transform.call(this, options);
  this.parser = new expat.Parser('UTF-8');
  
  this.parser.on('startElement', onStartElement.bind(this));

  this.parser.on('endElement', onEndElement.bind(this));
}

function onStartElement (name, attrs) {
  if (name.match(/node|way|relation/)) {
    this.currentElement = { type: name, attrs: attrs };
  } else if (name == 'tag') {
    if (!this.currentElement.tags) this.currentElement.tags = []
    this.currentElement.tags.push(attrs);
  } else if (name == 'nd') {
    if (!this.currentElement.nodes) this.currentElement.nodes = []
    this.currentElement.nodes.push(attrs);
  }
}

function onEndElement (name) {
  if (name.match(/node|way|relation/)) {
    this.push(JSON.stringify(this.currentElement)+'\n');
    this.currentElement = null;
  }
}

Osm2Json.prototype._transform = function (chunk, encoding, done) {
  this.parser.parse(chunk);
  done();
}

module.exports = Osm2Json;