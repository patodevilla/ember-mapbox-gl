import { getProperties } from '@ember/object';
import Component from '@ember/component';
import { assert } from '@ember/debug';

/**
  component for a Mabox Control instance
  can be set to longLived so it is not destroyed along with its component
  first positionalParam is the control object
  second positionalParam is the control position
*/

/**
 * Add a map control.
 *
 * @class MapboxGlControlComponent
 */
const MapboxGlControlComponent = Component.extend({
  tagName: '',

  map: null,
  control: null,
  position: null,

  /**
   * @param idName
   * @description An identifier used for checking if control is already present in map. NEEDS to be unique
  */
  idName: null,

  /**
   * @param boolean
   * @description Set to longLived so it is not destroyed along with its component
  */
  longLived: false,

  init() {
    this._super(...arguments);

    assert('Need to pass idName if control is longLived', !this.longLived || this.idName);

    //get _prevControl if there is one present in the map instance
    this._prevControl = this.getControlFromMap(this.idName) || null;
    this._unhideOrAddControl();
  },

  //update control by removing and setting again
  didUpdateAttrs() {
    this._super(...arguments);
    this._updateControl();
  },

  //hide if control is longLived, else destroy it
  willDestroy() {
    this._super(...arguments);
    this._hideOrRemoveControl();
  },




  /*
    @method _hideOrRemoveControl
    @description If the control is longLived hide it, otherwise remove the control from the map instance
    @private
  */

  _hideOrRemoveControl(){
    if (this._prevControl !== null) {
      if(this.longLived){
        this._prevControl._container.classList.add("hide");
      }else{
        this.map.removeControl(this._prevControl);
      }
    }
  },

  /*
    @method _unhideOrAddControl
    @description If the control is already present unhide it, otherwise add a new control to the map instance
    @private
  */
  _unhideOrAddControl(){
    if(this._prevControl){
      //unhide if it was hidden
      this._prevControl._container.classList.remove("hide");
    }else{
      //add new control
      const { control, position } = getProperties(this, 'control', 'position');
      control.idName = this.idName
      this.map.addControl(control, position);
      this._prevControl = control;
    }
  },

  /*
    @method _normalizeResponse
    @param {idName} Identifier of control to search for
    @description Finds a control instance by a custom idName property
    @private
  */
  _updateControl(){
    const { control, position } = getProperties(this, 'control', 'position');
    //remove
    if (this._prevControl !== null) {
      this.map.removeControl(this._prevControl);
    }
    //set
    if (control) {
      this.map.addControl(control, position);
      this._prevControl = control;
    } else {
      this._prevControl = null;
    }
  },

  /*
    @method _normalizeResponse
    @param {idName} Identifier of control to search for
    @return {Object || undefined} Mapbox Control instance
    @description Finds a control instance by a custom idName property
    @private
  */
  getControlFromMap(idName){
    let filtered = this.map._controls.filter(function(c){
      return c.idName == idName;
    })
    return filtered[0];
  }

});

MapboxGlControlComponent.reopenClass({
  positionalParams: [ 'control', 'position' ]
});

export default MapboxGlControlComponent;
