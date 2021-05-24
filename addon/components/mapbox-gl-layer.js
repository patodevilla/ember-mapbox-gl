import { assign } from '@ember/polyfills';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import { assert } from '@ember/debug';

/**
  This is a component for a Mabox layer object.
  can be set to longLived so it is not destroyed along with its component.
*/

/**
  Adds a data source to the map.
  The API matches the mapbox [source docs](https://www.mapbox.com/mapbox-gl-js/api/#sources).

  Example:
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
  {{/mapbox-gl}}
  ```

  @class MapboxGLSource
*/
export default Component.extend({
  tagName: '',

  map: null,

  /**
   * @param boolean
   * @description Set to longLived so it is not destroyed along with its component
   */
  longLived: false,

  /**
    @argument layer
    @type {Object}
    @description
    A hash to pass on to the mapbox [layer](https://www.mapbox.com/mapbox-gl-js/style-spec/#layers).
  */
  layer: null,

  /**
    @argument before
    @type {String}
    @description
    The ID of an existing layer to insert the new layer before.
    If this argument is omitted, the layer will be appended to the end of the layers array.
  */
  before: null,

  /**
   * @property _sourceId
   * @private for use by mapbox-gl-source to pass in its sourceId
   */
  _sourceId: reads('layer.source'),

  /**
   * @property _layerId
   * @private the id of the layer bound to this component
   */
  _layerId: computed('layer.id', function () {
    return this.layer?.id;
  }).readOnly(),

  /**
   * @property _layerType
   * @private
   */
  _layerType: computed('layer.type', function () {
    return this.layer?.type;
  }).readOnly(),

  _envConfig: computed('_layerType', function () {
    const config = getOwner(this).resolveRegistration('config:environment');
    return (config['mapbox-gl'] ?? {})[this._layerType];
  }).readOnly(),

  _layout: computed('_envConfig.layout', 'layer.layout', function () {
    return assign({}, this._envConfig?.layout, this.layer?.layout);
  }).readOnly(),

  _paint: computed('_envConfig.paint', 'layer.paint', function () {
    return assign({}, this._envConfig?.paint, this.layer?.paint);
  }).readOnly(),

  _layer: computed(
    'layer',
    '_layerId',
    '_layerType',
    '_sourceId',
    '_layout',
    '_paint',
    function () {
      // do this to pick up other properties like filter, re, metadata, source-layer, minzoom, maxzoom, etc
      return assign({}, this.layer, {
        id: this._layerId,
        type: this._layerType,
        source: this._sourceId,
        layout: this._layout,
        paint: this._paint,
      });
    }
  ).readOnly(),

  init() {
    this._super(...arguments);

    assert('layer type needs to be specified', this.layer.type);
    assert('layer id needs to be specified', this.layer.id);

    const { _layer, before } = this;

    if (this.map.getLayer(this._layerId)) {
      //window.console.log('unhide layer');
      this.map.setLayoutProperty(this._layerId, 'visibility', 'visible');
    } else {
      //window.console.log('add layer');
      this.map.addLayer(this._layer, this.before);
    }
  },

  didUpdateAttrs() {
    this._super(...arguments);

    const { _layer } = this;

    for (const k in _layer.layout) {
      this.map.setLayoutProperty(_layer.id, k, _layer.layout[k]);
    }

    for (const k in _layer.paint) {
      this.map.setPaintProperty(_layer.id, k, _layer.paint[k]);
    }

    if ('filter' in _layer) {
      this.map.setFilter(_layer.id, _layer.filter);
    }

    this.map.setLayerZoomRange(_layer.id, _layer.minzoom, _layer.maxzoom);
  },

  willDestroy() {
    this._super(...arguments);

    if (this.longLived) {
      //window.console.log('hide layer');
      this.map.setLayoutProperty(this._layerId, 'visibility', 'none');
    } else {
      //window.console.log('remove layer');
      this.map.removeLayer(this._layerId);
    }
  },
});
