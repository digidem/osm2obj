var test = require('tape')
var fs = require('fs')
var path = require('path')
var concat = require('concat-stream')
var fromString = require('from2-string')

var Osm2Obj = require('../lib/osm2obj')

test('expected output defaults', function (t) {
  var expected = require('./output_defaults.json')
  var rs = fs.createReadStream(path.join(__dirname, 'osm.xml'))
  rs.pipe(new Osm2Obj()).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})

test('non-streaming', function (t) {
  var expected = require('./output_defaults.json')
  var input = fs.readFileSync(path.join(__dirname, 'osm.xml'), 'utf8')
  var parser = new Osm2Obj()
  t.deepEqual(parser.parse(input), expected)
  t.deepEqual(parser.parse(input), expected, 're-usable')
  t.end()
})

test('expected output coerceIds = false', function (t) {
  var expected = require('./output_string_ids.json')
  var rs = fs.createReadStream(path.join(__dirname, 'osm.xml'))
  rs.pipe(new Osm2Obj({coerceIds: false})).pipe(concat(function (data) {
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
  var rs = fs.createReadStream(path.join(__dirname, 'osm.xml'))
  rs.pipe(new Osm2Obj({types: ['way']})).pipe(concat(function (data) {
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
  var rs = fs.createReadStream(path.join(__dirname, 'osm.xml'))
  rs.pipe(new Osm2Obj({types: ['way'], bounds: false})).pipe(concat(function (data) {
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
  fromString(input).pipe(new Osm2Obj()).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})

test('osmChange', function (t) {
  var expected = require('./output_osmChange.json')
  var rs = fs.createReadStream(path.join(__dirname, 'osmChange.xml'))
  rs.pipe(new Osm2Obj()).pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))
})

test('osmChange with delete if-unused', function (t) {
  var expected = [
    { action: 'delete', changeset: 42, id: 12, lat: 1, lon: 2, type: 'node', version: 1, ifUnused: true },
    { action: 'delete', changeset: 42, id: 34, lat: 3, lon: 4, type: 'node', version: 1 }
  ]
  var rs = fs.createReadStream(path.join(__dirname, 'osmChange_ifunused.xml'))
  rs.pipe(new Osm2Obj()).pipe(concat(function (data) {
    t.deepEqual(data, expected, 'output has ifUnused prop')
    t.end()
  }))
})

test('multiple documents', function (t) {
  var expected = require('./output_osmChange.json').concat([
    { action: 'delete', changeset: 42, id: 12, lat: 1, lon: 2, type: 'node', version: 1, ifUnused: true },
    { action: 'delete', changeset: 42, id: 34, lat: 3, lon: 4, type: 'node', version: 1 }
  ])
  var parser = new Osm2Obj({strict: true})
  var rs1 = fs.readFileSync(path.join(__dirname, 'osmChange.xml'))
  var rs2 = fs.readFileSync(path.join(__dirname, 'osmChange_ifunused.xml'))

  parser.pipe(concat(function (data) {
    t.deepEqual(data, expected)
    t.end()
  }))

  parser.write(rs1)
  parser.write(rs2)
  parser.end()
})
