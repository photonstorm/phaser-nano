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
        this.game.renderer.updateTexture(img.base);

        this._cache.image[key] = img;

        return img;

    },

    getBaseTexture: function (key) {

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
