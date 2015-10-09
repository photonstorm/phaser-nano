/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Texture = function (baseTexture) {

    this.baseTexture = baseTexture;

    this.frame = { x: 0, y: 0, width: baseTexture.width, height:baseTexture.height };
    this.width = this.frame.width;
    this.height = this.frame.height;

    this.requiresUpdate = false;

    this._uvs = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 };

    this.updateUVs();

};

PhaserMicro.Texture.prototype = {

    updateUVs: function () {

        //  Swap for 'this.crop' once we add atlas support back in
        var frame = this.frame;
        var tw = this.baseTexture.width;
        var th = this.baseTexture.height;
        
        this._uvs.x0 = frame.x / tw;
        this._uvs.y0 = frame.y / th;

        this._uvs.x1 = (frame.x + frame.width) / tw;
        this._uvs.y1 = frame.y / th;

        this._uvs.x2 = (frame.x + frame.width) / tw;
        this._uvs.y2 = (frame.y + frame.height) / th;

        this._uvs.x3 = frame.x / tw;
        this._uvs.y3 = (frame.y + frame.height) / th;

    }

};

PhaserMicro.BaseTexture = function (source) {

    this.width = source.width;
    this.height = source.height;
    this.source = source;

    this.premultipliedAlpha = true;

    this._glTextures = [];
    this._powerOf2 = false;
    this._dirty = [true, true, true, true];

};

PhaserMicro.BaseTexture.prototype = {

    dirty: function () {

        for (var i = 0; i < this._glTextures.length; i++)
        {
            this._dirty[i] = true;
        }

    }

};
