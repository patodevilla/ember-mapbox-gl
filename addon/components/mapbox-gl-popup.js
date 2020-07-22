import { assign } from '@ember/polyfills';
import { getOwner } from '@ember/application';
import { bind } from '@ember/runloop';
import Component from '@ember/component';
import layout from '../templates/components/mapbox-gl-popup';

/**
  Adds a [popup](https://www.mapbox.com/mapbox-gl-js/api/#popup) to the map.

  ### Properties
  - `lngLat`
    - The longitude and latitude to pin the popup at.

  ### Example
  ```hbs
  {{#mapbox-gl as |map|}}
    {{#map.source options=(hash
      type='geojson'
      data=(hash
        type='FeatureCollection'
        features=(array
          (hash
            type='Feature'
            geometry=(hash
              type='Point'
              coordinates=(array -96.7969879 32.7766642)
            )
          )
        )
      )) as |source|}}
      {{source.layer layer=(hash
          type='circle'
          paint=(hash circle-color='#007cbf' circle-radius=10))}}
    {{/map.source}}

    {{#map.popup lngLat=(array -96.7969879 32.7766642)}}
      Dallas, TX
    {{/map.popup}}
  {{/mapbox-gl}}
  ```

  @class MapboxGLPopup
 */
export default Component.extend({
  layout,
  tagName: '',

  MapboxGl: null,
  map: null,
  marker: null,
  lngLat: null,
  initOptions: null,

  onClose() {},

  init() {
    this._super(...arguments);

    const { initOptions, marker } = this;

    this.domContent = document.createElement('div');
    this._onClose = bind(this, this.onClose);
    const options = assign(
      {},
      (
        getOwner(this).resolveRegistration('config:environment')['mapbox-gl'] ??
        {}
      ).popup,
      initOptions
    );

    this.popup = new this.MapboxGl.Popup(options)
      .setDOMContent(this.domContent)
      .on('close', this._onClose);

    if (marker === null) {
      this.popup.addTo(this.map);
    } else {
      marker.setPopup(this.popup);
    }
  },

  didReceiveAttrs() {
    this._super(...arguments);

    const lngLat = this.lngLat;

    if (lngLat) {
      this.popup.setLngLat(lngLat);
    }
  },

  willDestroy() {
    this._super(...arguments);

    this.popup.off('close', this._onClose);
    const marker = this.marker;

    if (marker === null) {
      this.popup.remove();
    } else {
      marker.setPopup(null);
    }
  },
});
