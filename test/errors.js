var test = require('tape')
var fromString = require('from2-string')
var concat = require('concat-stream')

var Osm2Obj = require('../lib/osm2obj')

test('malformed xml', function (t) {
  var input = '<osm>\n' +
    '<changeset' +
    '<tag k="comment" v="wow"/>' +
    '</changeset>' +
    '</osm>'
  fromString(input).pipe(new Osm2Obj({strict: true})).on('error', function (err) {
    t.ok(err instanceof Error)
    t.end()
  }).resume()
})

test('invalid element', function (t) {
  var input = '<osm>\n' +
    '<changeset' +
    '<bob k="comment" v="wow"/>' +
    '</changeset>' +
    '</osm>'
  fromString(input).pipe(new Osm2Obj({strict: true})).on('error', function (err) {
    t.ok(err instanceof Error)
    t.end()
  }).resume()
})

test('relation member missing type', function (t) {
  var input = '<osm>\n' +
    '<relation id="30" version="1" timestamp="2013-09-05T19:38:11Z" changeset="49">' +
    '<member ref="19" role=""/>' +
    '</relation>' +
    '</osm>'
  fromString(input).pipe(new Osm2Obj()).on('error', function (err) {
    t.ok(err instanceof Error)
    t.ok(/type/i.test(err.message), 'Throws error missing type')
    t.end()
  }).resume()
})

test('relation member empty type', function (t) {
  var input = '<osm>\n' +
    '<relation id="30" version="1" timestamp="2013-09-05T19:38:11Z" changeset="49">' +
    '<member ref="19" role="" type=""/>' +
    '</relation>' +
    '</osm>'
  fromString(input).pipe(new Osm2Obj()).on('error', function (err) {
    t.ok(err instanceof Error)
    t.ok(/type/i.test(err.message), 'Throws error missing type')
    t.end()
  }).resume()
})

test('relation member missing ref', function (t) {
  var input = '<osm>\n' +
    '<relation id="30" version="1" timestamp="2013-09-05T19:38:11Z" changeset="49">' +
    '<member type="node" role=""/>' +
    '</relation>' +
    '</osm>'
  fromString(input).pipe(new Osm2Obj()).on('error', function (err) {
    t.ok(err instanceof Error)
    t.ok(/ref/i.test(err.message), 'Throws error missing ref')
    t.end()
  }).resume()
})

test('relation member missing role', function (t) {
  var input = '<osm>\n' +
    '<relation id="30" version="1" timestamp="2013-09-05T19:38:11Z" changeset="49">' +
    '<member ref="19" type="node"/>' +
    '</relation>' +
    '</osm>'

  var expected = [{
    type: 'relation',
    id: 30,
    version: 1,
    timestamp: '2013-09-05T19:38:11Z',
    changeset: 49,
    members: [{
      ref: 19,
      type: 'node'
    }]
  }]
  fromString(input).pipe(new Osm2Obj()).pipe(concat(function (data) {
    t.deepEqual(data, expected, 'missing role, no role on output')
    t.end()
  })).on('error', t.fail)
})

test('relation member empty role', function (t) {
  var input = '<osm>\n' +
    '<relation id="30" version="1" timestamp="2013-09-05T19:38:11Z" changeset="49">' +
    '<member ref="19" type="node" role=""/>' +
    '</relation>' +
    '</osm>'

  var expected = [{
    type: 'relation',
    id: 30,
    version: 1,
    timestamp: '2013-09-05T19:38:11Z',
    changeset: 49,
    members: [{
      ref: 19,
      type: 'node'
    }]
  }]
  fromString(input).pipe(new Osm2Obj()).pipe(concat(function (data) {
    t.deepEqual(data, expected, 'empty role, no role on output')
    t.end()
  })).on('error', t.fail)
})
