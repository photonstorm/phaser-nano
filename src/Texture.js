/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Texture = function (baseTexture, frame) {

    if (frame === undefined) { frame = 0; }

    this.baseTexture = baseTexture;

    this.blendMode = PhaserMicro.BLEND_NORMAL;

    //  A Frame object that specifies the part of the BaseTexture that this Texture uses.
    //  Also holds Trim data.
    this.frame = this.baseTexture.frameData.getFrame(frame);

    //  A per Texture setting that the user can modify without
    //  messing with any other Sprite using the same Texture Frame
    this._crop = { x: this.frame.x, y: this.frame.y, width: this.frame.width, height: this.frame.height };

    this._isCropped = false;

    /**
    * @property {object} uvs - WebGL UV data.
    * @default
    */
    this.uvs = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0 };

    this.updateUVs();

};

PhaserMicro.Texture.prototype = {

    resetCrop: function () {

        this._isCropped = false;

        this.updateFrame();

    },

    updateFrame: function () {

        if (!this._isCropped)
        {
            this._crop.x = this.frame.x;
            this._crop.y = this.frame.y;
            this._crop.width = this.frame.width;
            this._crop.height = this.frame.height;
        }

        this.updateUVs();

    },

    setFrame: function (value) {

        this.frame = this.baseTexture.frameData.getFrame(value);

        this.updateFrame();

    },

    setFrameByIndex: function (value) {

        this.frame = this.baseTexture.frameData.getFrameIndex(value);

        this.updateFrame();

    },

    setFrameByName: function (value) {

        this.frame = this.baseTexture.frameData.getFrameName(value);

        this.updateFrame();

    },

    updateUVs: function () {

        var bw = this.baseTexture.width;
        var bh = this.baseTexture.height;
        
        this.uvs.x0 = this.cropX / bw;
        this.uvs.y0 = this.cropY / bh;

        this.uvs.x1 = (this.cropX + this.cropWidth) / bw;
        this.uvs.y1 = this.cropY / bh;

        this.uvs.x2 = (this.cropX + this.cropWidth) / bw;
        this.uvs.y2 = (this.cropY + this.cropHeight) / bh;

        this.uvs.x3 = this.cropX / bw;
        this.uvs.y3 = (this.cropY + this.cropHeight) / bh;

    }

};

Object.defineProperties(PhaserMicro.Texture.prototype, {

    'width': {

        get: function() {
            return this.frame.sourceWidth;
        }

    },

    'height': {

        get: function() {
            return this.frame.sourceHeight;
        }

    },

    'cropX': {

        get: function() {
            return this._crop.x;
        },

        set: function(value) {
            this._crop.x = value;
            this._isCropped = true;
            this.updateUVs();
        }

    },

    'cropY': {

        get: function() {
            return this._crop.y;
        },

        set: function(value) {
            this._crop.y = value;
            this._isCropped = true;
            this.updateUVs();
        }

    },

    'cropWidth': {

        get: function() {
            return this._crop.width;
        },

        set: function(value) {
            this._crop.width = value;
            this._isCropped = true;
            this.updateUVs();
        }

    },

    'cropHeight': {

        get: function() {
            return this._crop.height;
        },

        set: function(value) {
            this._crop.height = value;
            this._isCropped = true;
            this.updateUVs();
        }

    }

});

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
