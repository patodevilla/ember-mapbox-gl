import { scheduleOnce } from '@ember/runloop';
import { getProperties, get, computed } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import Component from '@ember/component';
import layout from '../templates/components/mapbox-gl-source';
import { assert } from '@ember/debug';

/**
  This is a component for a Mabox source object.
  Can be set to longLived so it is not destroyed along with its component.
*/

export default Component.extend({
  layout,
  tagName: '',

  map: null,

  /**
   * @param boolean
   * @description Set to longLived so it is not destroyed along with its component
  */
  longLived: false,

  /**
   * @param string
   * @description The source options to add, conforming to the Mapbox Source spec.
   * {@link https://www.mapbox.com/mapbox-gl-js/style-spec/#sources Mapbox}
  */
  options: null,

  /**
   * @param object
   * @description The ID of the source to add. Must not conflict with existing sources.
   * {@link https://www.mapbox.com/mapbox-gl-js/api/#map#addsource Mapbox}
  */
  sourceId: computed(function() {
    return this.get('idName') || guidFor(this);
  }),

  init() {
    this._super(...arguments);

    if(this.longLived){
      assert('need to pass idName if source is longLived', this.idName);
    }

    // Add source to map if it is not already present
    const sourceId = this.sourceId;


    if(!this.map.getSource(sourceId)){
      window.console.log('add source');
      let options = this.options;
      if(!options.data){
        // This allows you to send data as null without causing an error en first render.
        // Subsecuent renders only unhide the layer, so if data is required by an
        // if helper in the template, the layer won't be unhidden until the data has been loaded
        options.data = {'type': 'FeatureCollection', 'features': []}
      }
      this.map.addSource(sourceId, options);
    }

  },

  didUpdateAttrs() {
    this._super(...arguments);

    const { sourceId, options } = getProperties(this, 'sourceId', 'options');

    if (options) {
      if (options.data) {
        this.map.getSource(sourceId).setData(options.data);
      } else if (options.coordinates) {
        this.map.getSource(sourceId).setCoordinates(options.coordinates);
      }
    }
  },

  willDestroy() {
    this._super(...arguments);

    if(!this.longLived){
      window.console.log('destroy source');
      const sourceId = get(this, 'sourceId');
      // wait for any layers to be removed before removing the source
      scheduleOnce('afterRender', this.map, this.map.removeSource, sourceId);
    }

  }
});
