const React = require('react');

const Mock = (props) => React.createElement('div', props, props.children);

const fakeMap = {
  _zoom: 5,
  getZoom() { return this._zoom; },
  setView(_center, zoom) { this._zoom = zoom || this._zoom; },
  on() {},
  off() {}
};

module.exports = {
  MapContainer: Mock,
  TileLayer: Mock,
  Marker: Mock,
  Popup: Mock,
  useMapEvents: () => ({}),
  useMap: () => fakeMap
};
