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

    addImage: function (key, url, data, frameWidth, frameHeight, frameMax, margin, spacing) {

        if (frameWidth !== undefined)
        {
            var frames = this.buildSheet(data, frameWidth, frameHeight, frameMax, margin, spacing);
        }
        else
        {
            var frames = [ new PhaserMicro.Rectangle(0, 0, data.width, data.height) ];
        }

        this.addImageEntry(key, url, data, frames);

    },

    //  Private
    addImageEntry: function (key, url, data, frames) {

        var obj = {
            key: key,
            url: url,
            data: data,
            base: new PhaserMicro.BaseTexture(data, frames)
        };

        if (this.game.pixelArt)
        {
            obj.base.scaleMode = 1;
        }

        //  WebGL only
        this.game.renderer.loadTexture(obj.base);

        this._cache.image[key] = obj;

    },

    addTextureAtlas: function (key, url, data, atlasData) {

        console.log(arguments);

        var frames = this.buildAtlasData(atlasData);

        this.addImageEntry(key, url, data, frames);

    },

    buildAtlasData: function (json) {

        console.log(json);

        if (!json['frames'])
        {
            console.warn("Invalid Atlas JSON");
            return;
        }

        var i = 0;
        var frames = [];

        if (Array.isArray(json.frames))
        {
            for (i = 0; i < json.frames.length; i++)
            {
                frames.push(this.buildFrame(i, json.frames[i]));
            }
        }
        else
        {
            for (var key in json.frames)
            {
                frames.push(this.buildFrame(i, json.frames[key]));
                i++;
            }
        }

        return frames;

    },

    buildFrame: function (index, frame) {

        var rect = frame.frame;

        var output = new PhaserMicro.Frame(index, rect.x, rect.y, rect.w, rect.h, frame.filename);

        if (frame.trimmed)
        {
            var source = frame.spriteSourceSize;
            frame.setTrim(frame.sourceSize.w, frame.sourceSize.h, source.w, source.y, source.w, source.h);
        }

        return output;

    },

    buildSheet: function (img, frameWidth, frameHeight, frameMax, margin, spacing) {

        var width = img.width;
        var height = img.height;
        var frames = [];

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
            return frames;
        }

        var x = margin;
        var y = margin;

        for (var i = 0; i < total; i++)
        {
            frames.push(new PhaserMicro.Frame(i, x, y, frameWidth, frameHeight));

            x += frameWidth + spacing;

            if (x + frameWidth > width)
            {
                x = margin;
                y += frameHeight + spacing;
            }
        }

        return frames;

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
