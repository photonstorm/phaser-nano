/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserNano.Sprite = function (game, x, y, key, frame) {

    this.game = game;

    this.position = new PhaserNano.Point(x, y);

    this.scale = new PhaserNano.Point(1, 1);

    this.anchor = new PhaserNano.Point();

    this.pivot = new PhaserNano.Point();

    this.rotation = 0;

    this.alive = true;

    this.visible = true;

    this.renderable = true;

    this.container = false;

    //  The parent display object (Layer, other Sprite, World)
    this.parent = null;

    this.worldAlpha = 1;
    this.alpha = 1;

    this.worldTransform = new PhaserNano.Matrix();

    this.tint = [0xffffff, 0xffffff, 0xffffff, 0xffffff];

    this.texture = new PhaserNano.Texture(game.cache.getTexture(key), frame);

    this._width = this.texture.width;
    this._height = this.texture.height;
    this._rot = 0;
    this._sr = 0;
    this._cr = 1;

};

PhaserNano.Sprite.prototype = {

    updateFast: function () {

        var pt = this.parent.worldTransform;
        var wt = this.worldTransform;

        var a = this.scale.x;
        var d = this.scale.y;

        var tx = this.position.x - this.pivot.x * a;
        var ty = this.position.y - this.pivot.y * d;

        wt.a  = a  * pt.a;
        wt.b  = a  * pt.b;
        wt.c  = d  * pt.c;
        wt.d  = d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;

    },

    updateRotation: function () {

        var pt = this.parent.worldTransform;
        var wt = this.worldTransform;

        //  Check to see if the rotation is the same as the previous render.
        //  This means we only need to use sin and cos when rotation actually changes
        if (this.rotation !== this._rot)
        {
            this._rot = this.rotation;
            this._sr = Math.sin(this.rotation);
            this._cr = Math.cos(this.rotation);
        }

        var a  =  this._cr * this.scale.x;
        var b  =  this._sr * this.scale.x;
        var c  = -this._sr * this.scale.y;
        var d  =  this._cr * this.scale.y;
        var tx =  this.position.x;
        var ty =  this.position.y;
        
        //  Check for pivot.. not often used so geared towards that fact!
        if (this.pivot.x || this.pivot.y)
        {
            tx -= this.pivot.x * a + this.pivot.y * c;
            ty -= this.pivot.x * b + this.pivot.y * d;
        }

        //  Concat the parent matrix with the objects transform
        wt.a  = a  * pt.a + b  * pt.c;
        wt.b  = a  * pt.b + b  * pt.d;
        wt.c  = c  * pt.a + d  * pt.c;
        wt.d  = c  * pt.b + d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;

    },

    updateTransform: function () {

        if (this.rotation % PhaserNano.PI_2)
        {
            this.updateRotation();
        }
        else
        {
            this.updateFast();
        }

        this.worldAlpha = this.alpha * this.parent.worldAlpha;

        // console.log('sprite updateTransform', this.worldTransform);

    }

};

PhaserNano.Sprite.prototype.constructor = PhaserNano.Sprite;

Object.defineProperties(PhaserNano.Sprite.prototype, {

    'width': {

        get: function() {
            return this.scale.x * this.texture.frame.width;
        },

        set: function(value) {
            this.scale.x = value / this.texture.frame.width;
            this._width = value;
        }

    },

    'height': {

        get: function() {
            return this.scale.y * this.texture.frame.height;
        },

        set: function(value) {
            this.scale.y = value / this.texture.frame.height;
            this._height = value;
        }

    },

    'worldVisible': {

        get: function() {

            var item = this;

            do
            {
                if (!item.visible)
                {
                    return false;
                }

                item = item.parent;
            }
            while(item);

            return true;
        }

    },

    'x': {

        get: function() {
            return this.position.x;
        },

        set: function(value) {
            this.position.x = value;
        }

    },

    'y': {

        get: function() {
            return this.position.y;
        },

        set: function(value) {
            this.position.y = value;
        }

    },

    'frame': {

        get: function() {
            return this.texture.frame.index;
        },

        set: function(value) {
            this.texture.setFrameByIndex(value);
        }

    },

    'frameName': {

        get: function() {
            return this.texture.frame.name;
        },

        set: function(value) {
            this.texture.setFrameByName(value);
        }

    },

    'blendMode': {

        get: function() {
            return this.texture.blendMode;
        },

        set: function(value) {
            this.texture.blendMode = value;
        }

    }

});
