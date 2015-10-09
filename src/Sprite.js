/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Sprite = function (game, x, y, key) {

    this.game = game;

    this.position = { x: x, y: y };

    this.scale = { x: 1, y: 1 };

    this.anchor = { x: 0, y: 0 };

    this.pivot = { x: 0, y: 0 };

    this.rotation = 0;

    this.visible = true;

    this.renderable = true;

    this.parent = null;

    this.worldAlpha = 1;
    this.alpha = 1;

    this.worldTransform = new PhaserMicro.Matrix();

    this.tint = 0xffffff;

    this.blendMode = PhaserMicro.BLEND_NORMAL;

    this.texture = new PhaserMicro.Texture(game.cache.getTexture(key));

    this._width = this.texture.width;
    this._height = this.texture.height;
    this._rot = 0;
    this._sr = 0;
    this._cr = 1;

};

PhaserMicro.Sprite.prototype = {

    updateTransform: function() {

        //  Create matrix refs for easy access
        var pt = this.parent.worldTransform;
        var wt = this.worldTransform;

        var a = this.scale.x;
        var d = this.scale.y;

        var tx = this.position.x - this.pivot.x * a;
        var ty = this.position.y - this.pivot.y * d;

        //  If rotation !== 0
        if (this.rotation % PhaserMicro.PI_2)
        {
            //  Check to see if the rotation is the same as the previous render.
            //  This means we only need to use sin and cos when rotation actually changes
            if (this.rotation !== this._rot)
            {
                this._rot = this.rotation;
                this._sr = Math.sin(this.rotation);
                this._cr = Math.cos(this.rotation);
            }

            //  Get the matrix values of the sprite based on its transform properties

            // a  =  this._cr * this.scale.x;
            a *=  this._cr;
            var b  =  this._sr * this.scale.x;
            var c  = -this._sr * this.scale.y;
            // d  =  this._cr * this.scale.y;
            d  *=  this._cr;
            tx =  this.position.x;
            ty =  this.position.y;
            
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
        }
        else
        {
            wt.a  = a  * pt.a;
            wt.b  = a  * pt.b;
            wt.c  = d  * pt.c;
            wt.d  = d  * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        }

        this.worldAlpha = this.alpha * this.parent.worldAlpha;

    }

};

PhaserMicro.Sprite.prototype.constructor = PhaserMicro.Sprite;

Object.defineProperties(PhaserMicro.Sprite.prototype, {

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
            return  this.scale.y * this.texture.frame.height;
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

    }

});
