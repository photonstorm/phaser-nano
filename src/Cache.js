/**
* @author       Richard Davey @photonstorm
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Cache = function (game) {

    this.game = game;

    this._cache = {
        image: {}
    };

};

PhaserMicro.Cache.prototype = {

    addImage: function (key, url, data) {

        var img = {
            key: key,
            url: url,
            data: data,
            base: new PhaserMicro.BaseTexture(data)
        };

        //  WebGL only
        if (this.game.pixelArt)
        {
            img.base.scaleMode = 1;
        }

        this.game.renderer.loadTexture(img.base);

        this._cache.image[key] = img;

        return img;

    },

    getTexture: function (key) {

        return this._cache.image[key].base;

    },

    getImage: function (key, full) {

        var img = this._cache.image[key];

        if (full)
        {
            return img;
        }
        else
        {
            return img.data;
        }

    }

};
