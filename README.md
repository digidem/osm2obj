# osm2json

[![npm](https://img.shields.io/npm/v/osm2json.svg?maxAge=2592000)](https://www.npmjs.com/package/osm2json)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

> Streaming parser from OSM XML to OSM JSON objects

Implements a [Node Transport Stream](http://nodejs.org/api/stream.html#stream_class_stream_transform). Takes a readable stream of [OSM XML](http://wiki.openstreetmap.org/wiki/OSM_XML) and outputs a stream of objects compatible with Overpass [OSM JSON](http://overpass-api.de/output_formats.html#json). Also reads [OsmChange](http://wiki.openstreetmap.org/wiki/OsmChange) XML and outputs the same format but with an additional property `action` which is one of `create`, `modify`, `delete`. Uses [sax-js](https://github.com/isaacs/sax-js) to work in both node and the browser.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)

## Install

```
npm install osm2json
```

## Usage

```js
var fs = require('fs')
var Osm2Json = require('../lib/osm2json')

var rs = fs.createReadableStream(__dirname + './test.osm')

rs.pipe(new Osm2Json()).pipe(process.stdout)
```

## Example Output

```js
// node
{
  type: 'node',
  id: 1,
  version: 0,
  timestamp: '2013-09-05T19:38:11.187Z',
  uid: 1,
  user: 'gregor',
  lat: 0,
  lon: 0,
  tags: { null: 'island' }
}

// way
{
  type: 'way',
  id: 3,
  version: 3,
  timestamp: '2013-09-05T19:38:11Z',
  changeset: 49,
  nodes: [ 19, 20, 21, 22, 26, 27 ],
  tags: { name: 'York St' }
}

// relation
{
  type: 'relation',
  id: 1,
  members: [
    {
      type: 'relation',
      ref: 1745069,
      role: ''
    },
    {
      type: 'relation',
      ref: 172789,
      role: ''
    }
  ],
  tags: {
    from: 'Konrad-Adenauer-Platz',
    name: 'VRS 636'
  }
}
```

## API

```js
var Osm2Json = require('osm2json')
```

### var stream = new Osm2Json(opts)

Create a transform stream with:

* `opts.coerceIds` - coerce ids to `Number` (defaults to *true*)

The readable side of the stream is in `objectMode`.

## Contribute

PRs welcome. Please follow [JS Standard Style](http://standardjs.com/). Right now this could do with some tests. If you are feeling ambitious, this could be sped up by using [node-expat](https://github.com/astro/node-expat) on node. The interface is similar to sax-js and it should be possible to wrap this to use sax-js on the browser and node-expat on the server using the [browserify `browser` field](https://github.com/substack/browserify-handbook#browser-field)

## License

MIT (c) 2016, Digital Democracy.
