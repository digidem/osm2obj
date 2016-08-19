/**
 * Copyright (c) 2016 Digital Democracy
 * MIT +no-false-attribs License
 * <https://github.com/digidem/osm2json/blob/master/LICENSE>
 */

var Transform = require('readable-stream').Transform
var sax = require('sax')
var util = require('util')

var STRICT = true

// These attributes are "id-like" and will be coerced to Number if opts.coerceIds === true
var ID_ATTRIBUTES = ['id', 'uid', 'version', 'changeset', 'ref']
// These attributes are always coerced to Number
var NUMBER_ATTRIBUTES = ['lat', 'lon', 'comments_count', 'min_lat', 'min_lon', 'max_lat', 'max_lon',
  'minlon', 'minlat', 'maxlon', 'maxlat']

// Any nodes in the XML that are not listed below will throw an error
var VALID_ROOTS = ['osm', 'osmChange']
var VALID_ACTIONS = ['create', 'modify', 'delete']
var VALID_NODES = ['node', 'way', 'relation', 'changeset', 'bounds']

// Attributes that are not in these whitelists are ignored.
// Any node that is a child of a VALID_NODE that is not in `children` will throw an error
var ELEMENT_ATTRIBUTES = ['id', 'user', 'uid', 'visible', 'version', 'changeset', 'timestamp']
var WHITELISTS = {
  node: {
    attributes: ELEMENT_ATTRIBUTES.concat(['lat', 'lon']),
    children: ['tag']
  },
  way: {
    attributes: ELEMENT_ATTRIBUTES,
    children: ['nd', 'tag']
  },
  relation: {
    attributes: ELEMENT_ATTRIBUTES,
    children: ['member', 'tag']
  },
  changeset: {
    attributes: ['id', 'user', 'uid', 'created_at', 'closed_at', 'open',
        'min_lat', 'min_lon', 'max_lat', 'max_lon', 'comments_count'],
    children: ['tag']
  },
  bounds: {
    attributes: ['minlon', 'minlat', 'maxlon', 'maxlat']
  }
}

function is(list, value) {
  return list.indexOf(value) > -1
}

function isValidChild(name, childname) {
  return WHITELISTS[name] &&
    WHITELISTS[name].children &&
    WHITELISTS[name].children.indexOf(childname) > -1
}

function isValidAttribute(name, attr) {
  return WHITELISTS[name] && WHITELISTS[name].attributes.indexOf(attr) > -1
}

function parseNumber(str) {
  if (!isNaN(str) && str.length) {
    return str % 1 === 0 ? parseInt(str, 10) : parseFloat(str)
  }
  return str
}

function parseBoolean(str) {
  if (/^(?:true|false)$/i.test(str)) {
    return str.toLowerCase() === 'true'
  }
  return str
}

module.exports = Osm2Json

function Osm2Json(opts) {
  if (!(this instanceof Osm2Json)) return new Osm2Json(opts)
  this.opts = opts || {}
  this.opts.coerceIds = this.opts.coerceIds !== false
  this.parser = sax.parser(STRICT)
  this.parser.onerror = this.onError.bind(this)
  this.parser.onopentag = this.onOpenTag.bind(this)
  this.parser.onclosetag = this.onCloseTag.bind(this)
  Transform.call(this, { readableObjectMode : true })
}

util.inherits(Osm2Json, Transform)

Osm2Json.prototype._transform = function(chunk, enc, done) {
  if (this.error) return done(this.error)
  this.parser.write(chunk.toString())
  done(this.error)
}

Osm2Json.prototype.onError = function(err) {
  err.message = 'Invalid XML at line #' + this.parser.line +
    ', column #' + this.parser.column + ':\n' +
    err.message
  this.error = err
}

Osm2Json.prototype.onOpenTag = function(node) {
  if (this.error) return
  if (!this.root && is(VALID_ROOTS, node.name)) {
    this.root = node.name
  } else if (this.root === 'osmChange' && !this.currentAction && is(VALID_ACTIONS, node.name)) {
    this.currentAction = node.name
  } else if (!this.currentNode && is(VALID_NODES, node.name)) {
    this.processNode(node)
  } else if (this.currentNode && isValidChild(this.currentNode.type, node.name)) {
    this.processChild(node)
  } else {
    this.onError(new Error('invalid tag <' + node.name + '>'))
  }
}

Osm2Json.prototype.onCloseTag = function(name) {
  if (this.root === 'osmChange' && is(VALID_ACTIONS, name)) {
    this.currentAction = null
  } else if (is(VALID_NODES, name)) {
    this.push(this.currentNode)
    this.currentNode = null
  }
}

Osm2Json.prototype.processNode = function(node) {
  this.currentNode = {}
  this.currentNode.type = node.name
  var attr = node.attributes
  for (var attrName in attr) {
    if (!attr.hasOwnProperty(attrName)) continue
    if (!isValidAttribute(node.name, attrName)) continue
    this.currentNode[attrName] = this.coerce(attrName, attr[attrName])
  }
  if (this.currentAction) this.currentNode.action = this.currentAction
}

Osm2Json.prototype.processChild = function(node) {
  var currentNode = this.currentNode
  var attr = node.attributes
  switch (node.name) {
    case 'tag':
      if (!attr.k || !attr.v) {
        return this.onError(new Error('<tag> missing k or v attribute'))
      }
      currentNode.tags = currentNode.tags || {}
      currentNode.tags[attr.k] = attr.v
      break
    case 'nd':
      if (!attr.ref) {
        return this.onError(new Error('<nd> missing ref attribute'))
      }
      currentNode.nodes = currentNode.nodes || []
      currentNode.nodes.push(this.coerce('ref', attr.ref))
      break
    case 'member':
      if (!attr.ref || !attr.type) {
        // NB: we don't throw an error for members with no role attribute
        return this.onError(new Error('<member> missing ref or type attribute'))
      }
      currentNode.members = currentNode.members || []
      currentNode.members.push({
        type: attr.type,
        ref: this.coerce('ref', attr.ref),
        role: attr.role ? attr.role : ''
      })
      break
  }
}

Osm2Json.prototype.coerce = function(attrName, value) {
  var shouldCoerceToNumber = is(NUMBER_ATTRIBUTES, attrName)
  if (this.opts.coerceIds) {
    shouldCoerceToNumber = shouldCoerceToNumber || is(ID_ATTRIBUTES, attrName)
  }
  if (shouldCoerceToNumber) {
    return parseNumber(value)
  } else {
    return parseBoolean(value)
  }
}
