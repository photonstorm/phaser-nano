/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Texture = function (baseTexture, frame) {

    if (frame === undefined) { frame = 0; }

    this.baseTexture = baseTexture;

    this._frame = -1;

    this.frame = new PhaserMicro.Rectangle();

    this.width = 0;
    this.height = 0;

    //  UV coordinates
    this._uvs = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 };

    this.setFrame(frame);

};

PhaserMicro.Texture.prototype = {

    setFrame: function (value) {

        var baseFrame = this.baseTexture.frameData[value];

        if (baseFrame && value !== this._frame)
        {
            this._frame = value;
            this.frame.copyFrom(baseFrame);
            this.updateUVs();
        }

    },

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

PhaserMicro.BaseTexture = function (source, frameData) {

    this.source = source;

    this.width = source.width;
    this.height = source.height;

    this.frameData = frameData;

    this.scaleMode = PhaserMicro.LINEAR;
    this.premultipliedAlpha = true;

    this._gl = [];
    this._pot = false;
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
