import Service from '@ember/service';
import { get, set } from '@ember/object';

/**
  This service serves as a 'cache' for the map instances and their html elements.
  The values are saved in a hash {element: element, map: map} and are used
  for optimizing the performance and rendering speed.
*/

export default Service.extend({

  init() {
    this._super(...arguments);
    set(this, '_cachedMaps', new Map());
  },

  /*
    @method hasMap
    @param {key} Id of map
    @return {Boolean} True if cachedMaps contains the map, false if not
  */
  hasMap(key) {
    return get(this, '_cachedMaps').has(key);
  },

  /*
    @method getMap
    @param {key} Id of map
    @return {MapLoaderInstance w/ HTML Element| false} Maploader instance of the key specified
  */
  getMap(key) {
    return get(this, '_cachedMaps').has(key) && get(this, '_cachedMaps').get(key);
  },

  /*
    @method setMap
    @param {key} Id of map to save
    @param {MapLoader Instance } MapLoader Instance of map
    @param { HTML Element } Html element where map instance is rendered
    @description Saves a new MapLoader Instance to cachedMaps
  */
  setMap(mapId, map, element) {
    get(this, '_cachedMaps').set(mapId, { map, element });
  },

  /*
    @method deleteMap
    @param {key} Id of map to save
    @return {Boolean} True if map is deleted, false if not
  */
  deleteMap(mapId) {
    return get(this, '_cachedMaps').delete(mapId);
  }

});
