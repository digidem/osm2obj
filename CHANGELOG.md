# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.2.1] - 2017-09-11
### Fixed
- Support empty tags in changesets [#4](https://github.com/digidem/osm2obj/pull/4)

## [2.2.0] - 2017-09-08
### Added
- Ability to parse multiple docs [#3](https://github.com/digidem/osm2obj/pull/3)

## [2.1.0] - 2016-08-23
### Added
- Process `if-unused` attribute on `<delete>` block

## [2.0.0] - 2016-08-22
### Changed
- if the `role` attribute on the `member` element in XML is empty, no `role` prop will be set on member of result.

## [1.2.0] - 2016-08-22
### Added
- Support [`<diffResult>`](http://wiki.openstreetmap.org/wiki/API_v0.6#Diff_upload:_POST_.2Fapi.2F0.6.2Fchangeset.2F.23id.2Fupload)
- Add non-streaming `parse(str)` method.

## [1.1.0] - 2016-08-21
### Added
- Options `bounds`, `strict`, `types`

## [1.0.0] - 2016-08-19
### Changed
- Output Overpass [OSM JSON format](http://overpass-api.de/output_formats.html#json) fixes [#1](https://github.com/digidem/osm2obj/issues/1)
- Parse [OsmChange XML](http://wiki.openstreetmap.org/wiki/OsmChange)
- Use sax-js for use in the browser
- Much stricter checking on input XML

## 0.0.1 - 2013-09-26
- Initial release

[2.2.1]: https://github.com/digidem/osm2obj/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/digidem/osm2obj/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/digidem/osm2obj/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/digidem/osm2obj/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/digidem/osm2obj/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/digidem/osm2obj/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/digidem/osm2obj/compare/v0.0.1...v1.0.0
