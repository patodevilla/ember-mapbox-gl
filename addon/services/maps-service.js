import Service from '@ember/service';
import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';
import MapboxGl from 'mapbox-gl';

/**
  This service serves as a 'cache' for the map instances and their html elements.
  The values are saved in a hash {element: element, map: map} and are used
  for optimizing the performance and rendering speed.
  This service also contains the logic for creating the maps and elements.
*/

export default Service.extend({


  init() {
    this._super(...arguments);
    this.set('cachedMaps', EmberObject.create());
  },

  /*
    @method getMap
    @param {mapId} Id used to store a retrieve a cached map
    @param {initOptions} Options for building the map according to Mapbox Specs
    @param {longLived} If true, the map will be cached
    @return {Object} Hash {element: element, map: map}
    @description Returns a cached map if present, otherwise returns a new one
  */
  getMap(mapId, initOptions, longLived) {
    let obj = this.get(`cachedMaps.${mapId}`) || this._createMap(initOptions, longLived);
    return obj;
  },

  /*
    @method getMap
    @param {initOptions} Options for building the map according to Mapbox Specs
    @param {longLived} If true, the map will be cached
    @return {Object} Hash {element: element, map: map}
    @description Creates a new map instance and its html element
    @private
  */
  _createMap(initOptions, longLived) {
    window.console.log('create map');

    //create map DOM element
    let element = document.createElement('div');
    // element.parentElement.className = mapClass;

    //create map Instance
    const mbglConfig = getOwner(this).resolveRegistration('config:environment')['mapbox-gl']; // get config from environment.js
    const options = assign({}, mbglConfig.map, initOptions);
    options.container = element;
    let map = (new MapboxGl.Map(options));

    return {element: element, map: map};
  }

});
