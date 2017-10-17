/**
 * Copyright (c) 2016 Digital Democracy
 * MIT +no-false-attribs License
 * <https://github.com/digidem/osm2obj/blob/master/LICENSE>
 */

var Transform = require('readable-stream').Transform
var Parser = require('htmlparser2').Parser
var util = require('util')

// These attributes are "id-like" and will be coerced to Number if opts.coerceIds === true
var ID_ATTRIBUTES = ['id', 'uid', 'version', 'changeset', 'ref', 'old_id', 'new_id', 'new_version']
// These attributes are always coerced to Number
var NUMBER_ATTRIBUTES = ['lat', 'lon', 'comments_count', 'min_lat', 'min_lon', 'max_lat', 'max_lon',
  'minlon', 'minlat', 'maxlon', 'maxlat']

// Any nodes in the XML that are not listed below will throw an error
var VALID_ROOTS = ['osm', 'osmChange', 'diffResult']
var VALID_ACTIONS = ['create', 'modify', 'delete']
var VALID_NODES = ['node', 'way', 'relation', 'changeset', 'bounds', 'osmChange']

// Attributes that are not in these whitelists are ignored.
// Any node that is a child of a VALID_NODE that is not in `children` will throw an error
var ELEMENT_ATTRIBUTES = ['id', 'user', 'uid', 'visible', 'version', 'changeset', 'timestamp', 'old_id', 'new_id', 'new_version']
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

var DEFAULTS = {
  coerceIds: false,
  bounds: true,
  strict: false,
  types: VALID_NODES.slice(0, -1)
}

function is (list, value) {
  return list.indexOf(value) > -1
}

function isValidChild (name, childname) {
  return WHITELISTS[name] &&
    WHITELISTS[name].children &&
    WHITELISTS[name].children.indexOf(childname) > -1
}

function isValidAttribute (name, attr) {
  return WHITELISTS[name] && WHITELISTS[name].attributes.indexOf(attr) > -1
}

function parseNumber (str) {
  if (!isNaN(str) && str.length) {
    return str % 1 === 0 ? parseInt(str, 10) : parseFloat(str)
  }
  return str
}

function parseBoolean (str) {
  if (/^(?:true|false)$/i.test(str)) {
    return str.toLowerCase() === 'true'
  }
  return str
}

module.exports = Osm2Obj

function Osm2Obj (opts) {
  if (!(this instanceof Osm2Obj)) return new Osm2Obj(opts)
  this.opts = Object.assign({}, DEFAULTS, opts)
  var parserHandlers = {
    onerror: this.onError.bind(this),
    onopentag: this.onOpenTag.bind(this),
    onclosetag: this.onCloseTag.bind(this)
  }
  var parserOpts = {
    xmlMode: true
  }
  this.parser = new Parser(parserHandlers, parserOpts)
  this.on('_resetparser', function () {
    this.parser = new Parser(parserHandlers, parserOpts)
  })
  if (this.opts.bounds) this.opts.types.push('bounds')
  this.nodes = []
  Transform.call(this, { readableObjectMode: true })

  // seed the parser so it can handle multiple roots
  this.parser.write('<root>')
}

util.inherits(Osm2Obj, Transform)

Osm2Obj.prototype._transform = function (chunk, enc, done) {
  if (this.error) return done(this.error)
  this.parser.write(chunk.toString())
  while (this.nodes.length) this.push(this.nodes.shift())
  done(this.error)
}

Osm2Obj.prototype.parse = function (str) {
  if (!this.parser) this.emit('_resetparser')
  this.parser.write(str)
  this.parser.end()
  this.parser = null
  if (this.error) {
    var err = this.error
    this.error = null
    throw err
  }
  var nodes = this.nodes
  this.nodes = []
  return nodes
}

Osm2Obj.prototype.onError = function (err) {
  err.message = 'Invalid XML at line #' + this.parser.line +
    ', column #' + this.parser.column + ':\n' +
    err.message
  this.error = err
}

Osm2Obj.prototype.onOpenTag = function (name, attributes) {
  if (this.error) return
  if (name === 'root') return
  if (!this.root && is(VALID_ROOTS, name)) {
    this.root = name
  } else if ((!this.opts.strict || this.root === 'osmChange') &&
    !this.currentAction && is(VALID_ACTIONS, name)) {
    this.currentAction = name
    this.ifUnused = !!attributes['if-unused']
  } else if (!this.currentNode && is(this.opts.types, name)) {
    this.processNode(name, attributes)
  } else if (this.currentNode && isValidChild(this.currentNode.type, name)) {
    this.processChild(name, attributes)
  } else if (this.opts.strict && !is(VALID_NODES, name)) {
    this.onError(new Error('invalid tag <' + name + '>'))
  }
}

Osm2Obj.prototype.onCloseTag = function (name) {
  if ((!this.opts.strict || this.root === 'osmChange') && is(VALID_ACTIONS, name)) {
    this.currentAction = null
    this.ifUnused = null
  } else if (is(this.opts.types, name)) {
    this.nodes.push(this.currentNode)
    this.currentNode = null
  }
}

Osm2Obj.prototype.processNode = function (name, attributes) {
  this.currentNode = {}
  this.currentNode.type = name
  var attr = attributes
  for (var attrName in attr) {
    if (!attr.hasOwnProperty(attrName)) continue
    if (!isValidAttribute(name, attrName)) continue
    this.currentNode[attrName] = this.coerce(attrName, attr[attrName])
  }
  if (this.currentAction) this.currentNode.action = this.currentAction
  if (this.ifUnused) this.currentNode.ifUnused = true
}

Osm2Obj.prototype.processChild = function (name, attributes) {
  var currentNode = this.currentNode
  var attr = attributes
  switch (name) {
    case 'tag':
      if (!attr.k || attr.v == null) {
        if (this.opts.strict) {
          return this.onError(new Error('<tag> missing k or v attribute'))
        }
      } else {
        currentNode.tags = currentNode.tags || {}
        currentNode.tags[attr.k] = attr.v
      }
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
      var member = {
        type: attr.type,
        ref: this.coerce('ref', attr.ref)
      }
      if (attr.role) member.role = attr.role
      currentNode.members.push(member)
      break
  }
}

Osm2Obj.prototype.coerce = function (attrName, value) {
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
