import { assign } from '@ember/polyfills';
import { getOwner } from '@ember/application';
import { getProperties, get, computed } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import { assert } from '@ember/debug';

/**
  This is a component for a Mabox layer object.
  can be set to longLived so it is not destroyed along with its component.
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
   * @param object
   * @description The style layer to add, conforming to the Mapbox Style Specification's layer definition.
   * {@link https://www.mapbox.com/mapbox-gl-js/api/#map#addlayer Mapbox}
  */
  layer: null,

  /**
   * @param string
   * @description The ID of an existing layer to insert the new layer before. If this argument is omitted, the layer will be appended to the end of the layers array.
   * {@link https://www.mapbox.com/mapbox-gl-js/api/#map#addlayer Mapbox}
  */
  before: null,

  /**
   * @private for use by mapbox-gl-source to pass in its sourceId
   */
  _sourceId: reads('layer.source'),

  /**
   * @private the id of the layer bound to this component
   */
  _layerId: computed('layer.id', function() {
    return get(this, 'layer.id');
  }).readOnly(),

  /**
   * @private
   */
  _layerType: computed('layer.type', function() {
    return get(this, 'layer.type');
  }).readOnly(),

  _layout: computed('layer.layout', function() {
    return assign({}, get(this, 'layer.layout'));
  }).readOnly(),

  _paint: computed('layer.paint', function() {
    return assign({}, get(this, 'layer.paint'));
  }).readOnly(),

  _layer: computed('layer', '_layerId', '_layerType', '_sourceId', '_layout', '_paint', function() {
    const {
      layer,
      _layerId,
      _layerType,
      _sourceId,
      _layout,
      _paint
    } = getProperties(this, 'layer', '_layerId', '_layerType', '_sourceId', '_layout', '_paint');

    const computedLayer = {
      id: _layerId,
      type: _layerType,
      source: _sourceId,
      layout: _layout,
      paint: _paint
    };

    // do this to pick up other properties like filter, re, metadata, source-layer, minzoom, maxzoom, etc
    return assign({}, layer, computedLayer);
  }),

  init() {
    this._super(...arguments);

    assert("layer type needs to be specified", get(this, 'layer.type'));
    assert("layer id needs to be specified", get(this, 'layer.id'));
    
    const { _layer, before } = getProperties(this, '_layer', 'before');

    if(this.map.getLayer(this._layerId)){
      window.console.log('unhide layer');
      this.map.setLayoutProperty(this._layerId, "visibility", "visible");
    }else{
      window.console.log('add layer');
      this.map.addLayer(_layer, before);
    }

  },

  didUpdateAttrs() {
    this._super(...arguments);

    const _layer = get(this, '_layer');

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

    if(this.get('longLived')){
      window.console.log('hide layer');
      this.map.setLayoutProperty(get(this, '_layerId'), "visibility", "none");
    }else{
      window.console.log('remove layer');
      this.map.removeLayer(get(this, '_layerId'));
    }

  }

});
