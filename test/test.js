var test = require('tape')
var fs = require('fs')
var path = require('path')
var concat = require('concat-stream')

var Osm2Json = require('../lib/osm2json')

test('expected output defaults', function (t) {
  var expected = require('./output_defaults.json')
  var rs = fs.createReadStream(path.join(__dirname, 'test.osm'))
  rs.pipe(new Osm2Json()).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
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
