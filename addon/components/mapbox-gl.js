import Component from '@ember/component';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import layout from '../templates/components/mapbox-gl';
import MapboxLoader from '../-private/mapbox-loader';
import { set } from '@ember/object';
import { assert } from '@ember/debug';

/**
  Component that creates a new [mapbox-gl-js instance](https://www.mapbox.com/mapbox-gl-js/api/#map):

  ```hbs
  {{#mapbox-gl initOptions=initOptions mapLoaded=(action 'mapLoaded') as |map|}}

  {{/mapbox-gl}}
  ```

  @class MapboxGL
  @yield {Hash} map
  @yield {Component} map.control
  @yield {Component} map.layer
  @yield {Component} map.marker
  @yield {Component} map.on
  @yield {Component} map.popup
  @yield {Component} map.source
*/
export default Component.extend({

  classNames: ['map-wrapper'],

  mapsService: service(),

  layout,

  /**
   * @argument boolean
   * @description Set to longLived to save the Map instance into the mapsService
  */
  longLived: false,

  /**
    If map is longLived, mapId should be passed, it's the key to identified the map to reload it from cache

    @argument mapId
    @type {String}
  */
  mapId: null,

  /**
    An action function to call when the map has finished loading. Note that the component does not yield until the map has loaded,
    so this is the only way to listen for the mapbox load event.

    @argument mapLoaded
    @type {Function}
  */
  mapLoaded: null,

  init() {
    this._super(...arguments);
    
    assert('Longlived maps require mapId as a string', !this.longLived || typeof this.mapId === 'string' || this.mapId instanceof String);
    this._loader = MapboxLoader.create();
  },

  didInsertElement() {
    this._super(...arguments);

    if (this.mapsService.hasMap(this.mapId)) {

      let { map: mapLoader , element } = this.mapsService.getMap(this.mapId);
      set(this, '_loader', mapLoader);

      //append the map html element into component
      this.element.appendChild(element);

      //Call arg onReloaded if mas was retrieved from cache
      mapLoader.map.hasLoaded && this.mapReloaded && this.mapReloaded(mapLoader.map);

    } else {

      const { accessToken, map } =
        getOwner(this).resolveRegistration('config:environment')['mapbox-gl'] ||
        {};
  
      const options = Object.assign({}, map, this.initOptions);

      //create map DOM element
      let element = document.createElement('div');
      options.container = element;
      this.element.appendChild(element);

      this._loader.load(accessToken, options, this._onLoad.bind(this));

    }

  },

  _onLoad(map) {

    //this needs to be after since it sets map.loaded() to false;
    map.resize();

    //cache map instance and DOM element
    if (this.longLived) {
      map.hasLoaded = true;
      this.mapsService.setMap(this.mapId, this._loader, map._container);
    }

    this.mapLoaded && this.mapLoaded(map);
  },

  willDestroyElement() {
    this._super(...arguments);

    if (!this.longLived) {
      this._loader.cancel();
      //In case it was created longLived, and then retrieve and rendered without longLived
      this.mapsService.hasMap(this.mapId) && this.mapsService.deleteMap(this.mapId);
    }

    !this.longLived && this._loader.cancel();
  }

});
