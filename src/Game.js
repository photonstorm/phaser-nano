/**
* @author       Richard Davey @photonstorm
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

var PhaserMicro = PhaserMicro || {};

PhaserMicro.showLog = true;

PhaserMicro.log = function (text, color, bg) {

    if (!PhaserMicro.showLog)
    {
        return;
    }

    if (color === undefined) { color: '#000000'; }
    if (bg === undefined) { bg: '#ffffff'; }

    text = '%c' + text;

    var style = 'color: ' + color + '; background: ' + bg;

    console.log.apply(console, [text, style]);

};

PhaserMicro.Game = function (width, height, renderer, parent, state) {

    PhaserMicro.log('/// PhaserMicro v1.0 ///', '#91c6fa', '#0054a6');

    this.parent = parent || '';
    this.width = width || 800;
    this.height = height || 600;

    this.isBooted = false;

    this.canvas = null;
    this.context = null;

    this.state = state;

    this.cache = null;
    this.load = null;
    this.renderer = null;

    //  Move to World?
    this.children = [];
    // this.worldAlpha = 1;
    // this.worldTransform = new PhaserMicro.Matrix();

    this.boot();

};

PhaserMicro.BLEND_NORMAL = 0;
PhaserMicro.BLEND_ADD = 1;
PhaserMicro.BLEND_MULTIPLY = 2;
PhaserMicro.BLEND_SCREEN = 3;

PhaserMicro.Game.prototype = {

    boot: function () {

        if (this.isBooted)
        {
            return;
        }

        var check = this.boot.bind(this);

        if (document.readyState === 'complete' || document.readyState === 'interactive')
        {
            if (!document.body)
            {
                window.setTimeout(check, 20);
            }
            else
            {
                document.removeEventListener('deviceready', check);
                document.removeEventListener('DOMContentLoaded', check);
                window.removeEventListener('load', check);

                this.isBooted = true;

                this.init();
            }
        }
        else
        {
            document.addEventListener('DOMContentLoaded', check, false);
            window.addEventListener('load', check, false);
        }

    },

    init: function () {

        this.cache = new PhaserMicro.Cache(this);
        this.load = new PhaserMicro.Loader(this);

        //  Create the Canvas

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        //  TODO: WebGL / Canvas switch
        this.renderer = new PhaserMicro.WebGL(this);
        this.renderer.boot();

        this.addToDOM();

        if (this.state.preload)
        {
            this.state.preload.call(this.state, this);

            //  Empty loader?
            if (this.load._totalFileCount === 0)
            {
                this.start();
            }
            else
            {
                this.load.start();
            }
        }
        else
        {
            this.start();
        }

    },

    start: function () {

        if (this.state.create)
        {
            this.state.create.call(this.state, this);
        }

        window.requestAnimationFrame(this.update.bind(this));

    },

    update: function () {

        if (this.state.update)
        {
            this.state.update.call(this.state, this);
        }

        this.renderer.render();

        if (this.frameCount < 1)
        {
            window.requestAnimationFrame(this.update.bind(this));
            this.frameCount++;
        }

        // window.requestAnimationFrame(this.update.bind(this));

    },

    addToDOM: function () {

        var target;

        if (this.parent)
        {
            if (typeof this.parent === 'string')
            {
                // hopefully an element ID
                target = document.getElementById(this.parent);
            }
            else if (typeof this.parent === 'object' && this.parent.nodeType === 1)
            {
                // quick test for a HTMLelement
                target = this.parent;
            }
        }

        // Fallback, covers an invalid ID and a non HTMLelement object
        if (!target)
        {
            target = document.body;
        }

        target.appendChild(this.canvas);

    },

    addChild: function (x, y, key) {

        var sprite = new PhaserMicro.Sprite(this, x, y, key);

        sprite.parent = this.renderer;

        this.children.push(sprite);

        return sprite;

    }

};
