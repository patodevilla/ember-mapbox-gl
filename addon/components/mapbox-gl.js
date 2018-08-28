import Component from '@ember/component';
import { assert } from '@ember/debug';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { getOwner } from '@ember/application';
import { bind, next, scheduleOnce } from '@ember/runloop';
import MapboxGl from 'mapbox-gl';
import { assign } from '@ember/polyfills';
import noop from 'ember-mapbox-gl/utils/noop';
import layout from 'ember-mapbox-gl/templates/components/mapbox-gl';

/**
  This is the main component for creating a Mapbox GL Map.
  Can be set to longLived so it is not destroyed along with its component.
*/

export default Component.extend({

  classNames: ['map-wrapper'],

  layout,

  initOptions: null,

  /**
   * @param boolean
   * @description Set to longLived to save the Map instance into the mapsService
  */
  longLived: false,

  mapLoaded: noop,
  mapsService: service(),

  init() {
    this._super(...arguments);

    this.map = null;
    this.glSupported = MapboxGl.supported();

    const mbglConfig = getOwner(this).resolveRegistration('config:environment')['mapbox-gl'];
    if(this.longLived){
      assert('passing mapId to component is required', this.mapId);
    }
    assert('mapbox-gl config is required in config/environment', mbglConfig);
    assert('mapbox-gl config must have an accessToken string', typeof mbglConfig.accessToken === 'string');

    MapboxGl.accessToken = mbglConfig.accessToken;
  },

  didInsertElement() {
    this._super(...arguments);

    if (this.glSupported) {
      scheduleOnce('afterRender', this, this._setup);
    }

  },

  willDestroy() {
    this._super(...arguments);

    if (!this.longLived && this.map !== null) { //&& this.map !== null
      // some map users may be late doing cleanup (seen with mapbox-draw-gl), so don't remove the map until the next tick
      next(this.map, this.map.remove);
    }
  },

  /*
    @param {map} MapboxGL map instance
    @description Run mapLoaded action if initial setup, otherwise run mapReload action
  */
  _setup() {

    let obj = this.mapsService.getMap(this.mapId, this.initOptions, this.longLived);
    this.element.prepend(obj.element) //prepend the map html element into component

    let map = obj.map;
    if(map.hasLoaded){
      this._onReload(map);
    }else{
      map.once('load', bind(this, this._onLoad, map));
    }
    map.resize(); //this needs to be after since it sets map.loaded() to false;
  },

  /*
    @param {map} MapboxGL map instance
    @description Run mapLoaded action
  */
  _onLoad(map) {
    this.mapLoaded(map);

    window[this.mapId] = map; //debug
    set(this, 'map', map);

    //cache map instance and DOM element
    if(this.longLived){
      map.hasLoaded = true;
      this.set(`mapsService.cachedMaps.${this.mapId}`, {element: map._container, map: map})
    }
  },

  /*
    @param {map} MapboxGL map instance
    @description Run mapReload action
  */
  _onReload(map) {
    this.mapReload(map);
    set(this, 'map', map);
  }

});
