var test = require('tape')
var fs = require('fs')
var path = require('path')
var concat = require('concat-stream')
var fromString = require('from2-string')

var Osm2Json = require('../lib/osm2json')

test('expected output defaults', function (t) {
  var expected = require('./output_defaults.json')
  var rs = fs.createReadStream(path.join(__dirname, 'test.osm'))
  rs.pipe(new Osm2Json()).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})

test('non-streaming', function (t) {
  var expected = require('./output_defaults.json')
  var input = fs.readFileSync(path.join(__dirname, 'test.osm'), 'utf8')
  var parser = new Osm2Json()
  t.deepEqual(parser.parse(input), expected)
  t.deepEqual(parser.parse(input), expected, 're-usable')
  t.end()
})

test('expected output coerceIds = false', function (t) {
  var expected = require('./output_string_ids.json')
  var rs = fs.createReadStream(path.join(__dirname, 'test.osm'))
  rs.pipe(new Osm2Json({coerceIds: false})).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})

test("expected output types = ['way']", function (t) {
  var expected = [
    { maxlat: 90, maxlon: 180, minlat: -90, minlon: -180, type: 'bounds' },
    { type: 'way',
      id: 3,
      version: 3,
      timestamp: '2013-09-05T19:38:11Z',
      changeset: 49,
      nodes: [ 19, 20, 21, 22, 26, 27 ],
      tags: { name: 'York St' }
    }
  ]
  var rs = fs.createReadStream(path.join(__dirname, 'test.osm'))
  rs.pipe(new Osm2Json({types: ['way']})).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})

test('expected output bounds = false', function (t) {
  var expected = [
    { type: 'way',
      id: 3,
      version: 3,
      timestamp: '2013-09-05T19:38:11Z',
      changeset: 49,
      nodes: [ 19, 20, 21, 22, 26, 27 ],
      tags: { name: 'York St' }
    }
  ]
  var rs = fs.createReadStream(path.join(__dirname, 'test.osm'))
  rs.pipe(new Osm2Json({types: ['way'], bounds: false})).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})

test('diffResult', function (t) {
  var input = '<diffResult generator="OpenStreetMap Server" version="0.6">' +
    '<node old_id="1" new_id="2" new_version="2"/>' +
    '<way old_id="3" new_id="4" new_version="2"/>' +
    '<relation old_id="5"/>' +
    '</diffResult>'
  var expected = [{
    type: 'node',
    old_id: 1,
    new_id: 2,
    new_version: 2
  }, {
    type: 'way',
    old_id: 3,
    new_id: 4,
    new_version: 2
  }, {
    type: 'relation',
    old_id: 5
  }]
  fromString(input).pipe(new Osm2Json()).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})
