/**
* @author       Richard Davey @photonstorm
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserNano.Cache = function (game) {

    this.game = game;

    this._cache = {
        image: {}
    };

};

PhaserNano.Cache.prototype = {

    addImage: function (key, url, img, frameWidth, frameHeight, frameMax, margin, spacing) {

        var frameData = new PhaserNano.FrameData();

        if (frameWidth !== undefined)
        {
            this.buildSheet(frameData, img, frameWidth, frameHeight, frameMax, margin, spacing);
        }
        else
        {
            frameData.addFrame(0, 0, img.width, img.height, key);
        }

        this.addImageEntry(key, url, img, frameData);

    },

    //  Private
    addImageEntry: function (key, url, img, frames) {

        var obj = {
            key: key,
            url: url,
            data: img,
            base: new PhaserNano.BaseTexture(img, frames)
        };

        if (this.game.pixelArt)
        {
            obj.base.scaleMode = 1;
        }

        //  WebGL only
        this.game.renderer.loadTexture(obj.base);

        this._cache.image[key] = obj;

    },

    addTextureAtlas: function (key, url, img, json) {

        if (!json['frames'])
        {
            console.warn("Invalid Atlas JSON");
            return;
        }

        var width = img.width;
        var height = img.height;
        var frameData = new PhaserNano.FrameData();

        if (Array.isArray(json.frames))
        {
            for (var i = 0; i < json.frames.length; i++)
            {
                frameData.add(json.frames[i], width, height, json.frames[i].filename);
            }
        }
        else
        {
            for (var name in json.frames)
            {
                frameData.add(json.frames[name], width, height, name);
            }
        }

        this.addImageEntry(key, url, img, frameData);

    },

    buildSheet: function (frameData, img, frameWidth, frameHeight, frameMax, margin, spacing) {

        var width = img.width;
        var height = img.height;

        if (frameWidth <= 0)
        {
            frameWidth = Math.floor(-width / Math.min(-1, frameWidth));
        }

        if (frameHeight <= 0)
        {
            frameHeight = Math.floor(-height / Math.min(-1, frameHeight));
        }

        var row = Math.floor((width - margin) / (frameWidth + spacing));
        var column = Math.floor((height - margin) / (frameHeight + spacing));
        var total = row * column;

        if (frameMax !== -1)
        {
            total = frameMax;
        }

        //  Zero or smaller than frame sizes?
        if (width === 0 || height === 0 || width < frameWidth || height < frameHeight || total === 0)
        {
            return;
        }

        var x = margin;
        var y = margin;

        for (var i = 0; i < total; i++)
        {
            frameData.addFrame(x, y, frameWidth, frameHeight);

            x += frameWidth + spacing;

            if (x + frameWidth > width)
            {
                x = margin;
                y += frameHeight + spacing;
            }
        }

    },

    getTexture: function (key) {

        if (this._cache.image[key])
        {
            return this._cache.image[key].base;
        }
        else
        {
            console.warn('No texture found matching key', key);
        }

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
