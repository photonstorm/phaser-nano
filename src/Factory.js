/**
* @author       Richard Davey @photonstorm
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserNano.Factory = function (game, parent) {

    this.game = game;

    this.parent = parent;

};

PhaserNano.Factory.prototype = {

    sprite: function (x, y, key, frame) {

        var sprite = new PhaserNano.Sprite(this.game, x, y, key, frame);

        sprite.parent = this.parent;

        this.parent.children.push(sprite);

        return sprite;

    },

    layer: function (x, y) {

        var layer = new PhaserNano.Layer(this.game, x, y, this.parent);

        this.parent.children.push(layer);

        return layer;

    },

    group: function () {

        return new PhaserNano.Group(this.game);

    }

};