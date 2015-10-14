/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

//  A Layer is a Group that lives on the display list and contains Sprites (or other Layers)
 
PhaserNano.Layer = function (game) {

    PhaserNano.Group.call(this, game);

    //  position, scale, rotation

};

PhaserNano.Layer.prototype = Object.create(PhaserNano.Group.prototype);
PhaserNano.Layer.prototype.constructor = PhaserNano.Layer;

PhaserName.Layer.prototype.renderXY = function (displayObject, x, y, clear) {



};

