var through = require('through2')
var fs = require('fs')
var path = require('path')
var Osm2Obj = require('../lib/osm2obj')

var rs = fs.createReadStream(path.join(__dirname, '../test/osm.xml'))

var jsonStream = through.obj(write, end)

jsonStream.push('[')
var start = true

rs.pipe(new Osm2Obj()).pipe(jsonStream).pipe(process.stdout)

function write (row, enc, next) {
  if (!start) {
    this.push(', ')
  } else {
    start = false
  }
  next(null, JSON.stringify(row, null, 2))
}

function end (next) {
  this.push(']\n')
}
