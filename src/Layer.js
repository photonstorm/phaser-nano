/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

//  A Layer is a Group that lives on the display list and contains Sprites (or other Layers)
//  A State could be a Layer (could be super-useful)
 
PhaserNano.Layer = function (game, x, y) {

    PhaserNano.Group.call(this, game);

    this.game = game;

    this.position = new PhaserNano.Point(x, y);

    this.scale = new PhaserNano.Point(1, 1);

    this.pivot = new PhaserNano.Point();

    this.rotation = 0;

    this.alive = true;

    this.visible = true;

    this.parent = null;

    this.renderable = false;

    this.worldAlpha = 1;

    this.alpha = 1;

    this.worldTransform = new PhaserNano.Matrix();

    //  Could just check for the presence of the children array?
    this.container = true;

};

PhaserNano.Layer.prototype = Object.create(PhaserNano.Group.prototype);
PhaserNano.Layer.prototype.constructor = PhaserNano.Layer;

PhaserNano.Layer.prototype.create = function (x, y, key, frame) {

    var sprite = new PhaserNano.Sprite(this.game, x, y, key, frame);

    this.add(sprite);

    sprite.parent = this;

    return sprite;

};

PhaserNano.Layer.prototype.updateFast = function () {

    if (!this.parent)
    {
        //  No parent? Then we can optimize to this ...
        this.worldTransform.set(this.scale.x, 0, 0, this.scale.y, this.position.x - this.pivot.x * this.scale.x, this.position.y - this.pivot.y * this.scale.y);
        return;
    }

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

};

PhaserNano.Layer.prototype.updateRotation = function () {

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

};

PhaserNano.Layer.prototype.updateFastRotation = function () {

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

    // this.a = 1;
    // this.b = 0;
    // this.c = 0;
    // this.d = 1;
    // this.tx = 0;
    // this.ty = 0;

    // wt.a  = a  * 1 + b  * 0;
    // wt.b  = a  * 0 + b  * 1;
    // wt.c  = c  * 1 + d  * 0;
    // wt.d  = c  * 0 + d  * 1;
    // wt.tx = tx * 1 + ty * 0;
    // wt.ty = tx * 0 + ty * 1;

    wt.a  = a;
    wt.b  = b;
    wt.c  = c;
    wt.d  = d;
    wt.tx = tx;
    wt.ty = ty;

};

PhaserNano.Layer.prototype.updateTransform = function () {

    if (this.rotation % PhaserNano.PI_2)
    {
        if (!this.parent)
        {
            this.updateFastRotation();
        }
        else
        {
            this.updateRotation();
        }
    }
    else
    {
        this.updateFast();
    }

    // this.worldAlpha = this.alpha * this.parent.worldAlpha;
    this.worldAlpha = this.alpha;

    // console.log('layer updateTransform', this.worldTransform);

    for (var i = 0; i < this.children.length; i++)
    {
        this.children[i].updateTransform();
    }

};
