/**
* @author       Richard Davey @photonstorm
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

var PhaserNano = PhaserNano || {};

PhaserNano.VERSION = '1.0.0';

PhaserNano.BLEND_NORMAL = 0;
PhaserNano.BLEND_ADD = 1;
PhaserNano.BLEND_MULTIPLY = 2;
PhaserNano.BLEND_SCREEN = 3;

PhaserNano.LINEAR = 0;
PhaserNano.NEAREST = 1;

PhaserNano.TINT = [0xffffff, 0xffffff, 0xffffff, 0xffffff];

PhaserNano.PI_2 = Math.PI * 2;
PhaserNano.RAD_TO_DEG = 180 / Math.PI;
PhaserNano.DEG_TO_RAD = Math.PI / 180;

PhaserNano.Game = function (width, height, renderer, parent, state) {

    this.parent = parent || '';
    this.width = width || 800;
    this.height = height || 600;

    this.isBooted = false;

    this.canvas = null;
    this.context = null;

    this.state = state;

    this.pixelArt = false;

    this.cache = null;
    this.load = null;
    this.add = null;

    this.renderer = null;

    this.world = null;

    //  For frame debugging
    this.frameCount = 0;
    this.frameMax = 1;

    this.boot();

};

PhaserNano.Game.prototype = {

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

        this.showHeader();

        this.cache = new PhaserNano.Cache(this);
        this.load = new PhaserNano.Loader(this);
        this.world = new PhaserNano.Layer(this, 0, 0);
        this.add = new PhaserNano.Factory(this, this.world);

        //  Create the Canvas

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        //  TODO: WebGL / Canvas switch
        // this.renderer = new PhaserNano.Canvas(this);
        this.renderer = new PhaserNano.WebGL(this);
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

    showHeader: function () {

        if (window['PhaserGlobal'] && window['PhaserGlobal'].hideBanner)
        {
            return;
        }

        var v = PhaserNano.VERSION;

        var args = [
            '%c %c %c %c %c  Phaser Nano v' + v + ' - http://phaser.io/nano  ',
            'background: #ff0000',
            'background: #ffff00',
            'background: #00ff00',
            'background: #00ffff',
            'color: #ffffff; background: #000;'
        ];
        
        console.log.apply(console, args);

    },

    start: function () {

        if (this.state.create)
        {
            this.state.create.call(this.state, this);
        }

        var _this = this;

        this._onLoop = function (time) {
            return _this.update(time);
        };

        window.requestAnimationFrame(this._onLoop);

    },

    update: function () {

        if (this.state.update)
        {
            this.state.update.call(this.state, this);
        }

        this.world.updateTransform();

        // for (var i = 0; i < this.children.length; i++)
        // {
        //     sprite = this.children[i];

        //     if (sprite.alive)
        //     {
        //         sprite.updateTransform();
        //     }
        // }

        this.renderer.render();

        // if (this.frameCount < this.frameMax)
        // {
        //     window.requestAnimationFrame(this._onLoop);
        //     this.frameCount++;
        // }

        window.requestAnimationFrame(this._onLoop);

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

    }

};
