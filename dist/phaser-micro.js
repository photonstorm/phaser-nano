/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

(function(){

    var root = this;

/**
* @author       Richard Davey @photonstorm
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

var PhaserMicro = PhaserMicro || {};

PhaserMicro.VERSION = '1.0.0';

PhaserMicro.BLEND_NORMAL = 0;
PhaserMicro.BLEND_ADD = 1;
PhaserMicro.BLEND_MULTIPLY = 2;
PhaserMicro.BLEND_SCREEN = 3;

PhaserMicro.LINEAR = 0;
PhaserMicro.NEAREST = 1;

PhaserMicro.TINT = [0xffffff, 0xffffff, 0xffffff, 0xffffff];

PhaserMicro.PI_2 = Math.PI * 2;
PhaserMicro.RAD_TO_DEG = 180 / Math.PI;
PhaserMicro.DEG_TO_RAD = Math.PI / 180;

PhaserMicro.Game = function (width, height, renderer, parent, state) {

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
    this.renderer = null;

    //  Move to World?
    this.children = [];
    // this.worldAlpha = 1;
    // this.worldTransform = new PhaserMicro.Matrix();

    this.boot();

};

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

        this.showHeader();

        this.cache = new PhaserMicro.Cache(this);
        this.load = new PhaserMicro.Loader(this);

        //  Create the Canvas

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        //  TODO: WebGL / Canvas switch
        // this.renderer = new PhaserMicro.Canvas(this);
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

    showHeader: function () {

        if (window['PhaserGlobal'] && window['PhaserGlobal'].hideBanner)
        {
            return;
        }

        var v = PhaserMicro.VERSION;

        var args = [
            '%c %c %c %c %c  PhaserMicro v' + v + ' - http://phaser.io  ',
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

        window.requestAnimationFrame(this.update.bind(this));

    },

    update: function () {

        if (this.state.update)
        {
            this.state.update.call(this.state, this);
        }

        this.renderer.render();

        // if (this.frameCount < 1)
        // {
        //     window.requestAnimationFrame(this.update.bind(this));
        //     this.frameCount++;
        // }

        window.requestAnimationFrame(this.update.bind(this));

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

    addChild: function (x, y, key, frame) {

        var sprite = new PhaserMicro.Sprite(this, x, y, key, frame);

        sprite.parent = this.renderer;

        this.children.push(sprite);

        return sprite;

    }

};

/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.WebGL = function (game) {

    this.game = game;
    this.canvas = game.canvas;

    this.gl = null;

    //  WebGL Properties

    //  limit frames rendered
    this.frameCount = 0;

    this.contextOptions = {
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
        stencil: false,
        preserveDrawingBuffer: false
    };

    //  Temporary - will move to a World container
    this.worldAlpha = 1;
    this.worldTransform = new PhaserMicro.Matrix();

    this.contextLost = false;

    this.projection = { x: 0, y: 0 };

    this.vertSize = 6;
    this.batchSize = 2000;

    this.stride = this.vertSize * 4;

    this.vertices = new Float32Array(this.batchSize * 4 * this.vertSize);
    this.indices = new Uint16Array(this.batchSize * 6);

    this._blitMatrix = new PhaserMicro.Matrix();

    this._size = 0;
    this._batch = [];
    this._base = null;

    this.dirty = true;

};

PhaserMicro.WebGL.prototype = {

    boot: function () {

        this.contextLostBound = this.handleContextLost.bind(this);
        this.contextRestoredBound = this.handleContextRestored.bind(this);

        this.canvas.addEventListener('webglcontextlost', this.contextLostBound, false);
        this.canvas.addEventListener('webglcontextrestored', this.contextRestoredBound, false);

        var gl = this.canvas.getContext('webgl', this.contextOptions) || this.canvas.getContext('experimental-webgl', this.contextOptions);

        this.gl = gl;

        if (!gl)
        {
            throw new Error('Browser does not support WebGL');
        }

        gl.id = 0;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);

        this.gl.viewport(0, 0, this.game.width, this.game.height);

        this.projection.x =  this.game.width / 2;
        this.projection.y =  -this.game.height / 2;

        for (var i = 0, j = 0; i < (this.batchSize * 6); i += 6, j += 4)
        {
            this.indices[i + 0] = j + 0;
            this.indices[i + 1] = j + 1;
            this.indices[i + 2] = j + 2;
            this.indices[i + 3] = j + 0;
            this.indices[i + 4] = j + 2;
            this.indices[i + 5] = j + 3;
        }

        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

        // 65535 is max index, so 65535 / 6 = 10922.

        //  Upload the index data
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

        this.initShader();

    },

    initShader: function () {

        var gl = this.gl;

        //  We could have the projectionVector as a const instead
        //  'const vec2 projectionVector = vec2(400.0, -300.0);',
        //  but it assumes the game size never changes. Would avoid a single uniform though.

        var vertexSrc = [
            'attribute vec2 aVertexPosition;',
            'attribute vec2 aTextureCoord;',
            'attribute vec4 aColor;',

            'uniform vec2 projectionVector;',

            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',

            'const vec2 center = vec2(-1.0, 1.0);',

            'void main(void) {',
            '   gl_Position = vec4((aVertexPosition / projectionVector) + center, 0.0, 1.0);',
            '   vTextureCoord = aTextureCoord;',
            '   vec3 color = mod(vec3(aColor.y / 65536.0, aColor.y / 256.0, aColor.y), 256.0) / 256.0;',
            '   vColor = vec4(color * aColor.x, aColor.x);',
            '}'
        ];

        //  Changed to mediump to avoid crashing older Androids (#2147)

        var fragmentSrc = [
            'precision mediump float;',
            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',
            'uniform sampler2D uSampler;',
            'void main(void) {',
            '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;',
            '}'
        ];

        var fragmentShader = this.compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
        var vertexShader = this.compileShader(vertexSrc, gl.VERTEX_SHADER);
        var program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            PhaserMicro.log("Could not initialise shaders");
            return false;
        }
        else
        {
            //  Set Shader
            gl.useProgram(program);

            //  Get and store the attributes
            this.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
            this.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
            this.colorAttribute = gl.getAttribLocation(program, 'aColor');

            //  vertex position
            gl.enableVertexAttribArray(0);

            //  texture coordinate
            gl.enableVertexAttribArray(1);

            //  color attribute
            gl.enableVertexAttribArray(2);

            //  The projection vector (middle of the game world)
            this.projectionVector = gl.getUniformLocation(program, 'projectionVector');

            //  Un-used Shader uniforms
            // this.uSampler = gl.getUniformLocation(program, 'uSampler');
            // this.dimensions = gl.getUniformLocation(program, 'dimensions');

            //  Shader reference - not needed globally atm, leave commented for now
            // this.program = program;

            return true;
        }

    },

    compileShader: function (src, type) {

        var gl = this.gl;
        var src = src.join("\n");
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            return null;
        }

        return shader;

    },

    render: function () {

        if (this.contextLost)
        {
            return;
        }

        var gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //  Transparent
        // gl.clearColor(0, 0, 0, 0);

        //  Black
        gl.clearColor(0, 0, 0, 1);

        gl.clear(gl.COLOR_BUFFER_BIT);

        this._size = 0;
        this._batch = [];

        // PhaserMicro.log('renderWebGL start', '#ff0000');

        this.dirty = true;

        var sprite;

        for (var i = 0; i < this.game.children.length; i++)
        {
            sprite = this.game.children[i];

            sprite.updateTransform();

            if (sprite.visible && sprite.worldAlpha > 0)
            {
                this.renderSprite(sprite);
            }
        }

        //  External render hook (BEFORE the batch flush!)
        if (this.game.state.render)
        {
            this.game.state.render.call(this.game.state, this);
        }

        // PhaserMicro.log('renderWebGL end', '#ff0000');

        this.flush();

    },

    blit: function (x, y, texture) {

        if (this._size >= this.batchSize)
        {
            this.flush();
            this._base = texture.baseTexture;
        }

        //  Allow as argument (along with scale and rotation?)
        var alpha = 1;

        /*
        //  Not needed unless we allow them to set the anchor
        var aX = 0;
        var aY = 0;

        var w0 = (texture.frame.width) * (1 - aX);
        var w1 = (texture.frame.width) * -aX;

        var h0 = texture.frame.height * (1 - aY);
        var h1 = texture.frame.height * -aY;
        */

        var w0 = texture.frame.width;
        var w1 = texture.frame.width;
        var h0 = texture.frame.height;
        var h1 = texture.frame.height;

        this._blitMatrix.set(1, 0, 0, 1, x, y);

        this.addVerts(texture.uvs, this._blitMatrix, w0, h0, w1, h1, alpha, PhaserMicro.TINT);

        this._batch[this._size++] = texture;

    },

    renderSprite: function (sprite) {

        var texture = sprite.texture;
        
        if (this._size >= this.batchSize)
        {
            this.flush();
            this._base = texture.baseTexture;
        }

        var aX = sprite.anchor.x;
        var aY = sprite.anchor.y;

        var w0, w1, h0, h1;

        if (texture.frame.trimmed)
        {
            w1 = texture.frame.trimX - aX * texture.frame.trimWidth;
            w0 = w1 + texture.cropWidth;

            h1 = texture.frame.trimY - aY * texture.frame.trimHeight;
            h0 = h1 + texture.cropHeight;
        }
        else
        {
            w0 = texture.cropWidth * (1 - aX);
            w1 = texture.cropWidth * -aX;

            h0 = texture.cropHeight * (1 - aY);
            h1 = texture.cropHeight * -aY;
        }

        this.addVerts(texture.uvs, sprite.worldTransform, w0, h0, w1, h1, sprite.worldAlpha, sprite.tint);

        this._batch[this._size++] = texture;

    },

    addVerts: function (uvs, wt, w0, h0, w1, h1, alpha, tint) {

        var a = wt.a;
        var b = wt.b;
        var c = wt.c;
        var d = wt.d;
        var tx = wt.tx;
        var ty = wt.ty;

        var verts = this.vertices;
        var i = this._size * 4 * this.vertSize;

        //  Top Left vert (xy, uv, color)
        verts[i++] = a * w1 + c * h1 + tx;
        verts[i++] = d * h1 + b * w1 + ty;
        verts[i++] = uvs.x0;
        verts[i++] = uvs.y0;
        verts[i++] = alpha;
        verts[i++] = tint[0];

        //  Top Right vert (xy, uv, color)
        verts[i++] = a * w0 + c * h1 + tx;
        verts[i++] = d * h1 + b * w0 + ty;
        verts[i++] = uvs.x1;
        verts[i++] = uvs.y1;
        verts[i++] = alpha;
        verts[i++] = tint[1];

        //  Bottom Right vert (xy, uv, color)
        verts[i++] = a * w0 + c * h0 + tx;
        verts[i++] = d * h0 + b * w0 + ty;
        verts[i++] = uvs.x2;
        verts[i++] = uvs.y2;
        verts[i++] = alpha;
        verts[i++] = tint[2];

        //  Bottom Left vert (xy, uv, color)
        verts[i++] = a * w1 + c * h0 + tx;
        verts[i++] = d * h0 + b * w1 + ty;
        verts[i++] = uvs.x3;
        verts[i++] = uvs.y3;
        verts[i++] = alpha;
        verts[i++] = tint[3];

    },

    flush: function () {

        if (this._size === 0)
        {
            //  Nothing more to draw
            return;
        }

        var gl = this.gl;

        if (this.dirty)
        {
            //  Always dirty the first pass through
            //  but subsequent calls may be clean
            this.dirty = false;

            // bind the main texture
            gl.activeTexture(gl.TEXTURE0);

            // bind the buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

            //  set the projection vector (defaults to middle of game world on negative y)
            gl.uniform2f(this.projectionVector, this.projection.x, this.projection.y);

            //  vertex position
            gl.vertexAttribPointer(this.aVertexPosition, 2, gl.FLOAT, false, this.stride, 0);

            //  texture coordinate
            gl.vertexAttribPointer(this.aTextureCoord, 2, gl.FLOAT, false, this.stride, 2 * 4);

            //  color attribute
            gl.vertexAttribPointer(this.colorAttribute, 2, gl.FLOAT, false, this.stride, 4 * 4);
        }

        //  Upload the verts to the buffer
        if (this._size > (this.batchSize * 0.5))
        {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        }
        else
        {
            var view = this.vertices.subarray(0, this._size * 4 * this.vertSize);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }

        var start = 0;
        var currentSize = 0;

        var base = { source: null };
        var nextBase = null;

        var blend = -1;
        var nextBlend = null;

        for (var i = 0; i < this._size; i++)
        {
            //  _batch[i] contains the next texture to be rendered
            nextBase = this._batch[i].baseTexture;
            nextBlend = this._batch[i].blendMode;

            if (blend !== nextBlend)
            {
                //  Unrolled for speed
                if (nextBlend === PhaserMicro.BLEND_NORMAL)
                {
                    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }
                else if (nextBlend === PhaserMicro.BLEND_ADD)
                {
                    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
                }
                else if (nextBlend === PhaserMicro.BLEND_MULTIPLY)
                {
                    gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
                }
                else if (nextBlend === PhaserMicro.BLEND_SCREEN)
                {
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                }
            }

            if (base.source !== nextBase.source)
            {
                if (currentSize > 0)
                {
                    gl.bindTexture(gl.TEXTURE_2D, base._gl[gl.id]);
                    gl.drawElements(gl.TRIANGLES, currentSize * 6, gl.UNSIGNED_SHORT, start * 6 * 2);
                }

                start = i;
                currentSize = 0;
                base = nextBase;
            }

            currentSize++;
        }

        if (currentSize > 0)
        {
            gl.bindTexture(gl.TEXTURE_2D, base._gl[gl.id]);
            gl.drawElements(gl.TRIANGLES, currentSize * 6, gl.UNSIGNED_SHORT, start * 6 * 2);
        }

        //  Reset the batch
        this._size = 0;

    },

    unloadTexture: function (base) {

        for (var i = base._gl.length - 1; i >= 0; i--)
        {
            var glTexture = base._gl[i];

            if (this.gl && glTexture)
            {
                this.gl.deleteTexture(glTexture);
            }
        }

        base._gl.length = 0;

        base.dirty();

    },

    loadTexture: function (base) {

        var gl = this.gl;

        if (!base._gl[gl.id])
        {
            base._gl[gl.id] = gl.createTexture();
        }

        gl.bindTexture(gl.TEXTURE_2D, base._gl[gl.id]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, base.premultipliedAlpha);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, base.source);

        if (base.scaleMode)
        {
            //  scaleMode 1 = Nearest
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
        else
        {
            //  scaleMode 0 = Linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        if (base._pot)
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        else
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        base._dirty[gl.id] = false;

    },

    handleContextLost: function (event) {

        event.preventDefault();
        this.contextLost = true;

    },

    handleContextRestored: function () {

        this.boot();

        // empty all the ol gl textures as they are useless now
        // for(var key in PIXI.TextureCache)
        // {
        //     var texture = PIXI.TextureCache[key].baseTexture;
        //     texture._gl = [];
        // }

        this.contextLost = false;

    },

};
PhaserMicro.Canvas = function (game) {

    this.game = game;
    this.canvas = game.canvas;
    this.context = null;

    this.width = game.width;
    this.height = game.height;

    this.smoothProperty = null;

    //  Temporary - will move to a World container
    this.worldAlpha = 1;
    this.worldTransform = new PhaserMicro.Matrix();

};

PhaserMicro.Canvas.prototype = {

    boot: function () {

        this.context = this.canvas.getContext("2d", { alpha: false });

        this.smoothProperty = this.getSmoothingPrefix();

    },

    render: function () {

        //  Transparent
        // this.context.clearRect(0, 0, this.width, this.height);

        this.context.setTransform(1, 0, 0, 1, 0, 0);

        this.context.globalAlpha = 1;

        this.context.globalCompositeOperation = 'source-over';

        //  Black
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.width, this.height);

        var sprite;

        for (var i = 0; i < this.game.children.length; i++)
        {
            sprite = this.game.children[i];

            sprite.updateTransform();

            if (sprite.visible && sprite.worldAlpha > 0)
            {
                this.renderSprite(sprite);
            }
        }

        //  External render hook (BEFORE the batch flush!)
        if (this.game.state.render)
        {
            this.game.state.render.call(this.game.state, this);
        }

    },

    blit: function (x, y, texture) {

        //  Allow for pixel rounding
        if (this.game.pixelArt)
        {
            x | 0;
            y | 0;
        }

        this.context.setTransform(1, 0, 0, 1, x, y);

        var frame = texture.frame;

        this.context[this.smoothProperty] = (texture.baseTexture.scaleMode === PhaserMicro.LINEAR || !this.game.pixelArt);

        var dx = -texture.frame.width;
        var dy = -texture.frame.height;

        this.context.drawImage(texture.baseTexture.source, frame.x, frame.y, frame.width, frame.height, dx, dy, frame.width, frame.height);

    },

    renderSprite: function (sprite) {

        // if (sprite.blendMode !== this.currentBlendMode)
        // {
        //     this.currentBlendMode = sprite.blendMode;
        //     this.context.globalCompositeOperation = sprite.blendMode;
        // }

        this.context.globalAlpha = sprite.worldAlpha;

        var wt = sprite.worldTransform;
        var tx = wt.tx;
        var ty = wt.ty;

        //  Allow for pixel rounding
        if (this.game.pixelArt)
        {
            tx | 0;
            ty | 0;
        }

        this.context.setTransform(wt.a, wt.b, wt.c, wt.d, tx, ty);

        var texture = sprite.texture;
        var frame = texture.frame;

        this.context[this.smoothProperty] = (texture.baseTexture.scaleMode === PhaserMicro.LINEAR || !this.game.pixelArt);

        var dx, dy;

        if (frame.trimmed)
        {
            dx = frame.trimX - sprite.anchor.x * texture.cropWidth;
            dy = frame.trimY - sprite.anchor.y * texture.cropHeight;
        }
        else
        {
            dx = sprite.anchor.x * -frame.width;
            dy = sprite.anchor.y * -frame.height;
        }

        this.context.drawImage(
            texture.baseTexture.source,
            texture.cropX,
            texture.cropY,
            texture.cropWidth,
            texture.cropHeight,
            dx,
            dy,
            texture.cropWidth,
            texture.cropHeight);

        // for (var i = 0; i < sprite.children.length; i++)
        // {
        //     this.renderSprite(sprite.children[i]);
        // }

    },

    loadTexture: function (base) {
        // Skipped for Canvas
    },

    getSmoothingPrefix: function () {

        var vendor = [ 'i', 'webkitI', 'msI', 'mozI', 'oI' ];

        for (var prefix in vendor)
        {
            var s = vendor[prefix] + 'mageSmoothingEnabled';

            if (s in this.context)
            {
                return s;
            }
        }

        return null;

    },


};

/**
* @author       Richard Davey @photonstorm
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Loader = function (game) {

    this.game = game;
    this.cache = game.cache;

    this.baseURL = '';
    this.path = '';

    this.isLoading = false;
    this.hasLoaded = false;

    this._list = [];
    this._queue = [];
    this._started = false;
    this._total = 0;
    this._processingHead = 0;

};

PhaserMicro.Loader.prototype = {

    reset: function () {

        this.isLoading = false;
        this.hasLoaded = false;

        this._list.length = 0;
        this._queue.length = 0;
        this._started = false;
        this._total = 0;
        this._processingHead = 0;

    },

    addToFileList: function (type, key, url, properties, extension) {

        if (key === undefined || key === '')
        {
            console.warn("Phaser.Loader: Invalid or no key given of type " + type);
            return this;
        }

        if (url === undefined || url === null)
        {
            if (extension)
            {
                url = key + extension;
            }
            else
            {
                console.warn("Phaser.Loader: No URL given for file type: " + type + " key: " + key);
                return this;
            }
        }

        var file = {
            type: type,
            key: key,
            path: this.path,
            url: url,
            data: null,
            loading: false,
            loaded: false,
            error: false
        };

        if (properties)
        {
            for (var prop in properties)
            {
                file[prop] = properties[prop];
            }
        }

        this._list.push(file);
        this._total++;

        return this;

    },

    image: function (key, url) {

        return this.addToFileList('image', key, url, undefined, '.png');

    },

    spritesheet: function (key, url, frameWidth, frameHeight, frameMax, margin, spacing) {

        if (frameMax === undefined) { frameMax = -1; }
        if (margin === undefined) { margin = 0; }
        if (spacing === undefined) { spacing = 0; }

        return this.addToFileList('spritesheet', key, url, { width: frameWidth, height: frameHeight, max: frameMax, margin: margin, spacing: spacing }, '.png');

    },

    atlas: function (key, textureURL, atlasURL, atlasData) {

        if (!textureURL)
        {
            textureURL = key + '.png';
        }

        if (!atlasURL && !atlasData)
        {
            atlasURL = key + '.json';
        }

        if (typeof atlasData === 'string')
        {
            atlasData = JSON.parse(atlasData);
            atlasURL = null;
        }

        this.addToFileList('textureatlas', key, textureURL, { atlasURL: atlasURL, atlasData: atlasData });

        return this;

    },

    start: function () {

        if (this.isLoading)
        {
            return;
        }

        this.hasLoaded = false;
        this.isLoading = true;

        this._processingHead = 0;

        this.processLoadQueue();

    },

    processLoadQueue: function () {

        if (!this.isLoading)
        {
            console.warn('Phaser.Loader - active loading canceled / reset');
            this.finishedLoading(true);
            return;
        }

        // Empty the flight queue as applicable
        for (var i = 0; i < this._queue.length; i++)
        {
            var file = this._queue[i];

            if (file.loaded || file.error)
            {
                this._queue.splice(i, 1);
                i--;

                file.loading = false;
                file.requestUrl = null;
                file.requestObject = null;

                if (file.error)
                {
                    PhaserMicro.log('File loading error' + file.key);
                    // this.onFileError.dispatch(file.key, file);
                }

                this._loadedFileCount++;
                // this.onFileComplete.dispatch(this.progress, file.key, !file.error, this._loadedFileCount, this._total);
            }
        }

        for (var i = this._processingHead; i < this._list.length; i++)
        {
            var file = this._list[i];

            if (file.loaded || file.error)
            {
                // Item at the start of file list finished, can skip it in future
                if (i === this._processingHead)
                {
                    this._processingHead = i + 1;
                }
            }
            else if (!file.loading && this._queue.length < 4)
            {
                // -> not loaded/failed, not loading
                if (!this._started)
                {
                    this._started = true;
                    // this.onLoadStart.dispatch();
                }

                this._queue.push(file);
                file.loading = true;
                // this.onFileStart.dispatch(this.progress, file.key, file.url);
                this.loadFile(file);
            }

            // Stop looking if queue full
            if (this._queue.length >= 4)
            {
                break;
            }
        }

        // True when all items in the queue have been advanced over
        // (There should be no inflight items as they are complete - loaded/error.)
        if (this._processingHead >= this._list.length)
        {
            this.finishedLoading();
        }
        else if (!this._queue.length)
        {
            // Flight queue is empty but file list is not done being processed.
            // This indicates a critical internal error with no known recovery.
            console.warn("Phaser.Loader - aborting: processing queue empty, loading may have stalled");

            var _this = this;

            setTimeout(function () {
                _this.finishedLoading(true);
            }, 2000);
        }

    },

    loadFile: function (file) {

        switch (file.type)
        {
            case 'image':
            case 'spritesheet':
            case 'textureatlas':
                this.loadImageTag(file);
                break;
        }

    },

    loadImageTag: function (file) {

        var _this = this;

        file.data = new Image();
        file.data.name = file.key;

        if (this.crossOrigin)
        {
            file.data.crossOrigin = this.crossOrigin;
        }

        file.data.onload = function () {
            if (file.data.onload)
            {
                file.data.onload = null;
                file.data.onerror = null;
                _this.fileComplete(file);
            }
        };

        // file.data.onerror = function () {
        //     if (file.data.onload)
        //     {
        //         file.data.onload = null;
        //         file.data.onerror = null;
        //         _this.fileError(file);
        //     }
        // };

        file.data.src = this.transformUrl(file.url, file);

        // Image is immediately-available/cached
        if (file.data.complete && file.data.width && file.data.height)
        {
            file.data.onload = null;
            file.data.onerror = null;
            this.fileComplete(file);
        }

    },

    transformUrl: function (url, file) {

        if (!url)
        {
            return false;
        }

        if (url.match(/^(?:blob:|data:|http:\/\/|https:\/\/|\/\/)/))
        {
            return url;
        }
        else
        {
            return this.baseURL + file.path + url;
        }

    },

    fileComplete: function (file, xhr) {

        var loadNext = true;

        switch (file.type)
        {
            case 'image':

                this.cache.addImage(file.key, file.url, file.data);
                break;

            case 'spritesheet':

                this.cache.addImage(file.key, file.url, file.data, file.width, file.height, file.max, file.margin, file.spacing);
                break;

            case 'textureatlas':

                if (!file.atlasURL)
                {
                    this.cache.addTextureAtlas(file.key, file.url, file.data, file.atlasData);
                }
                else
                {
                    //  Load the JSON before carrying on with the next file
                    loadNext = false;
                    this.xhrLoad(file, this.transformUrl(file.atlasURL, file), 'text', this.jsonLoadComplete);
                }
                break;
        }

        if (loadNext)
        {
            this.asyncComplete(file);
        }

    },

    /**
    * Starts the xhr loader.
    *
    * This is designed specifically to use with asset file processing.
    *
    * @method Phaser.Loader#xhrLoad
    * @private
    * @param {object} file - The file/pack to load.
    * @param {string} url - The URL of the file.
    * @param {string} type - The xhr responseType.
    * @param {function} onload - The function to call on success. Invoked in `this` context and supplied with `(file, xhr)` arguments.
    * @param {function} [onerror=fileError]  The function to call on error. Invoked in `this` context and supplied with `(file, xhr)` arguments.
    */
    xhrLoad: function (file, url, type, onload, onerror) {

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = type;

        onerror = onerror || this.fileError;

        var _this = this;

        xhr.onload = function () {

            try {

                return onload.call(_this, file, xhr);

            } catch (e) {

                //  If this was the last file in the queue and an error is thrown in the create method
                //  then it's caught here, so be sure we don't carry on processing it

                if (!_this.hasLoaded)
                {
                    _this.asyncComplete(file, e.message || 'Exception');
                }
                else
                {
                    if (window['console'])
                    {
                        console.error(e);
                    }
                }
            }
        };

        xhr.onerror = function () {

            try {

                return onerror.call(_this, file, xhr);

            } catch (e) {

                if (!_this.hasLoaded)
                {
                    _this.asyncComplete(file, e.message || 'Exception');
                }
                else
                {
                    if (window['console'])
                    {
                        console.error(e);
                    }
                }

            }
        };

        file.requestObject = xhr;
        file.requestUrl = url;

        xhr.send();

    },

    /**
    * Successfully loaded a JSON file - only used for certain types.
    *
    * @method Phaser.Loader#jsonLoadComplete
    * @private
    * @param {object} file - File associated with this request
    * @param {XMLHttpRequest} xhr
    */
    jsonLoadComplete: function (file, xhr) {

        var data = JSON.parse(xhr.responseText);

        if (file.type === 'json')
        {
            this.cache.addJSON(file.key, file.url, data);
        }
        else
        {
            this.cache.addTextureAtlas(file.key, file.url, file.data, data);
        }

        this.asyncComplete(file);

    },

    asyncComplete: function (file, errorMessage) {

        if (errorMessage === undefined) { errorMessage = ''; }

        file.loaded = true;
        file.error = !!errorMessage;

        if (errorMessage)
        {
            file.errorMessage = errorMessage;

            console.warn('Phaser.Loader - ' + file.type + '[' + file.key + ']' + ': ' + errorMessage);
        }

        this.processLoadQueue();

    },

    finishedLoading: function (abnormal) {

        if (this.hasLoaded)
        {
            return;
        }

        this.hasLoaded = true;
        this.isLoading = false;

        // If there were no files make sure to trigger the event anyway, for consistency
        if (!abnormal && !this._started)
        {
            this._started = true;
            // this.onLoadStart.dispatch();
        }

        // this.onLoadComplete.dispatch();

        this.reset();

        this.game.start();

    }

};

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

    addImage: function (key, url, img, frameWidth, frameHeight, frameMax, margin, spacing) {

        var frameData = new PhaserMicro.FrameData();

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
            base: new PhaserMicro.BaseTexture(img, frames)
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
        var frameData = new PhaserMicro.FrameData();

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

/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Sprite = function (game, x, y, key, frame) {

    this.game = game;

    this.position = new PhaserMicro.Point(x, y);

    this.scale = new PhaserMicro.Point(1, 1);

    this.anchor = new PhaserMicro.Point();

    this.pivot = new PhaserMicro.Point();

    this.rotation = 0;

    this.alive = true;

    this.visible = true;

    //  Needed?
    this.renderable = true;

    //  The parent display object (Layer, other Sprite, World)
    this.parent = null;

    this.worldAlpha = 1;
    this.alpha = 1;

    this.worldTransform = new PhaserMicro.Matrix();

    this.tint = [0xffffff, 0xffffff, 0xffffff, 0xffffff];

    this.texture = new PhaserMicro.Texture(game.cache.getTexture(key), frame);

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

/**
* @author       Richard Davey @photonstorm
* @author       Mat Groves @Doormat23
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Matrix = function() {

    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.tx = 0;
    this.ty = 0;

};

PhaserMicro.Matrix.prototype = {

    set: function (a, b, c, d, tx, ty) {

        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;

        return this;

    }

};

/*
PhaserMicro.Matrix.prototype = {

    fromArray: function (array) {

        this.a = array[0];
        this.b = array[1];
        this.c = array[3];
        this.d = array[4];
        this.tx = array[2];
        this.ty = array[5];

    },

    toArray: function (transpose) {

        if(!this.array) this.array = new Float32Array(9);

        var array = this.array;

        if(transpose)
        {
            array[0] = this.a;
            array[1] = this.b;
            array[2] = 0;
            array[3] = this.c;
            array[4] = this.d;
            array[5] = 0;
            array[6] = this.tx;
            array[7] = this.ty;
            array[8] = 1;
        }
        else
        {
            array[0] = this.a;
            array[1] = this.c;
            array[2] = this.tx;
            array[3] = this.b;
            array[4] = this.d;
            array[5] = this.ty;
            array[6] = 0;
            array[7] = 0;
            array[8] = 1;
        }

        return array;

    },

    apply: function(pos, newPos) {

        newPos = newPos || { x: 0, y: 0 };

        newPos.x = this.a * pos.x + this.c * pos.y + this.tx;
        newPos.y = this.b * pos.x + this.d * pos.y + this.ty;

        return newPos;

    },

    applyInverse: function (pos, newPos) {

        newPos = newPos || new { x: 0, y: 0 };

        var id = 1 / (this.a * this.d + this.c * -this.b);
         
        newPos.x = this.d * id * pos.x + -this.c * id * pos.y + (this.ty * this.c - this.tx * this.d) * id;
        newPos.y = this.a * id * pos.y + -this.b * id * pos.x + (-this.ty * this.a + this.tx * this.b) * id;

        return newPos;

    },

    translate: function (x , y) {

        this.tx += x;
        this.ty += y;
        
        return this;

    },

    scale: function (x, y) {

        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;

        return this;

    },

    rotate: function (angle) {

        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        var a1 = this.a;
        var c1 = this.c;
        var tx1 = this.tx;

        this.a = a1 * cos - this.b * sin;
        this.b = a1 * sin + this.b * cos;
        this.c = c1 * cos - this.d * sin;
        this.d = c1 * sin + this.d * cos;
        this.tx = tx1 * cos - this.ty * sin;
        this.ty = tx1 * sin + this.ty * cos;
     
        return this;

    },

    append: function (matrix) {

        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;

        this.a  = matrix.a * a1 + matrix.b * c1;
        this.b  = matrix.a * b1 + matrix.b * d1;
        this.c  = matrix.c * a1 + matrix.d * c1;
        this.d  = matrix.c * b1 + matrix.d * d1;

        this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
        this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;
        
        return this;

    },

    identity: function () {

        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;

        return this;

    }

};

PhaserMicro.identityMatrix = new PhaserMicro.Matrix();

*/


/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* Creates a new Rectangle object with the top-left corner specified by the x and y parameters and with the specified width and height parameters.
* If you call this function without parameters, a Rectangle with x, y, width, and height properties set to 0 is created.
*
* @class Phaser.Rectangle
* @constructor
* @param {number} x - The x coordinate of the top-left corner of the Rectangle.
* @param {number} y - The y coordinate of the top-left corner of the Rectangle.
* @param {number} width - The width of the Rectangle. Should always be either zero or a positive value.
* @param {number} height - The height of the Rectangle. Should always be either zero or a positive value.
*/
PhaserMicro.Rectangle = function (x, y, width, height) {

    x = x || 0;
    y = y || 0;
    width = width || 0;
    height = height || 0;

    /**
    * @property {number} x - The x coordinate of the top-left corner of the Rectangle.
    */
    this.x = x;

    /**
    * @property {number} y - The y coordinate of the top-left corner of the Rectangle.
    */
    this.y = y;

    /**
    * @property {number} width - The width of the Rectangle. This value should never be set to a negative.
    */
    this.width = width;

    /**
    * @property {number} height - The height of the Rectangle. This value should never be set to a negative.
    */
    this.height = height;

};

PhaserMicro.Rectangle.prototype = {

    copyFrom: function (src) {

        this.x = src.x;
        this.y = src.y;
        this.width = src.width;
        this.height = src.height;
        
    },

    clone: function () {

        return new PhaserMicro.Rectangle(this.x, this.y, this.width, this.height);

    }

};

PhaserMicro.Point = function (x, y) {

    x = x || 0;
    y = y || 0;

    /**
    * @property {number} x - The x value of the point.
    */
    this.x = x;

    /**
    * @property {number} y - The y value of the point.
    */
    this.y = y;

};

PhaserMicro.Point.prototype = {

    /**
    * Sets the `x` and `y` values of this Point object to the given values.
    * If you omit the `y` value then the `x` value will be applied to both, for example:
    * `Point.set(2)` is the same as `Point.set(2, 2)`
    *
    * @method Phaser.Point#set
    * @param {number} x - The horizontal value of this point.
    * @param {number} [y] - The vertical value of this point. If not given the x value will be used in its place.
    * @return {Phaser.Point} This Point object. Useful for chaining method calls.
    */
    set: function (x, y) {

        this.x = x || 0;
        this.y = y || ( (y !== 0) ? this.x : 0 );

        return this;

    }

};
/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserMicro.Group = function (game) {

    this.game = game;

    this.children = [];

};

PhaserMicro.Group.prototype = {

    add: function (child) {

        return this.addAt(child, this.children.length);

    },

    addAt: function (child, index) {

        this.children.splice(index, 0, child);

        return child;

    },

    swap: function (child, child2) {

        if (child === child2)
        {
            return;
        }

        var index1 = this.children.indexOf(child);
        var index2 = this.children.indexOf(child2);

        if (index1 < 0 || index2 < 0)
        {
            return false;
        }

        this.children[index1] = child2;
        this.children[index2] = child;

        return true;

    },

    getIndex: function (child) {

        return this.children.indexOf(child);

    },

    getAt: function (index) {

        if (index < 0 || index >= this.children.length)
        {
            return false;
        }
        else
        {
            return this.children[index];
        }

    },

    remove: function (child) {

        var index = this.children.indexOf(child);

        if (index !== -1)
        {
            return this.removeAt(index);
        }

    },

    removeAt: function (index) {

        var child = this.getAt(index);

        if (child)
        {
            this.children.splice(index, 1);
        }

        return child;

    },

    bringToTop: function (child)  {

        if (this.getIndex(child) < this.children.length)
        {
            this.remove(child);
            this.add(child);
        }

        return child;

    },

    sendToBack: function (child) {

        if (this.getIndex(child) > 0)
        {
            this.remove(child);
            this.addAt(child, 0);
        }

        return child;

    },

    moveUp: function (child) {

        var a = this.getIndex(child);

        if (a < this.children.length - 1)
        {
            var b = this.getAt(a + 1);

            if (b)
            {
                this.swap(child, b);
            }
        }

        return child;

    },

    moveDown: function (child) {

        var a = this.getIndex(child);

        if (a > 0)
        {
            var b = this.getAt(a - 1);

            if (b)
            {
                this.swap(child, b);
            }
        }

        return child;

    },

    filter: function (callback, context) {

        var index = -1;
        var length = this.children.length;
        var results = [];

        while (++index < length)
        {
            var child = this.children[index];

            if (callback.call(context, child))
            {
                results.push(child);
            }
        }

        return results;

    },

    forEach: function (callback, context) {

        if (arguments.length <= 2)
        {
            for (var i = 0; i < this.children.length; i++)
            {
                callback.call(context, this.children[i]);
            }
        }
        else
        {
            // Assigning to arguments properties causes Extreme Deoptimization in Chrome, FF, and IE.
            // Using an array and pushing each element (not a slice!) is _significantly_ faster.
            var args = [null];

            for (var i = 2; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }

            for (var i = 0; i < this.children.length; i++)
            {
                args[0] = this.children[i];
                callback.apply(context, args);
            }
        }

    },

    /**
    * Iterates over the children of the group performing one of several actions for matched children.
    *
    * A child is considered a match when it has a property, named `key`, whose value is equal to `value`
    * according to a strict equality comparison.
    *
    * The result depends on the `returnType`:
    *
    * - {@link Phaser.Group.RETURN_TOTAL RETURN_TOTAL}:
    *     The callback, if any, is applied to all matching children. The number of matched children is returned.
    * - {@link Phaser.Group.RETURN_NONE RETURN_NONE}:
    *     The callback, if any, is applied to all matching children. No value is returned.
    * - {@link Phaser.Group.RETURN_CHILD RETURN_CHILD}:
    *     The callback, if any, is applied to the *first* matching child and the *first* matched child is returned.
    *     If there is no matching child then null is returned.
    *
    * If `args` is specified it must be an array. The matched child will be assigned to the first
    * element and the entire array will be applied to the callback function.
    *
    * @method Phaser.Group#iterate
    * @param {string} key - The child property to check, i.e. 'exists', 'alive', 'health'
    * @param {any} value - A child matches if `child[key] === value` is true.
    * @param {boolean} returnChild - How to iterate the children and what to return.
    * @param {function} [callback=null] - Optional function that will be called on each matching child. The matched child is supplied as the first argument.
    * @param {object} [context] - The context in which the function should be called (usually 'this').
    * @param {any[]} [args=(none)] - The arguments supplied to to the callback; the first array index (argument) will be replaced with the matched child.
    * @return {any} Returns either an integer (for RETURN_TOTAL), the first matched child (for RETURN_CHILD), or null.
    */
    iterate: function (key, value, returnChild, callback, context, args) {

        var total = 0;

        for (var i = 0; i < this.children.length; i++)
        {
            if (this.children[i][key] === value)
            {
                total++;

                if (callback)
                {
                    if (args)
                    {
                        args[0] = this.children[i];
                        callback.apply(context, args);
                    }
                    else
                    {
                        callback.call(context, this.children[i]);
                    }
                }

                if (returnChild)
                {
                    return this.children[i];
                }
            }
        }

        if (!returnChild)
        {
            return total;
        }

        return null;

    },

    getFirstAlive: function () {

        return this.iterate('alive', true, true);

    },

    getFirstDead: function () {

        return this.iterate('alive', false, true);

    }

};
/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A Frame is a single frame of an animation and is part of a FrameData collection.
*
* @class PhaserMicro.Frame
* @constructor
* @param {number} index - The index of this Frame within the FrameData set it is being added to.
* @param {number} x - X position of the frame within the texture image.
* @param {number} y - Y position of the frame within the texture image.
* @param {number} width - Width of the frame within the texture image.
* @param {number} height - Height of the frame within the texture image.
* @param {string} [name] - The name of the frame. In Texture Atlas data this is usually set to the filename.
*/
PhaserMicro.Frame = function (index, x, y, width, height, name) {

    /**
    * @property {number} index - The index of this Frame within its FrameData set.
    */
    this.index = index;

    /**
    * @property {number} x - X position within the image to cut from (in atlas json: frame.x)
    */
    this.x = x;

    /**
    * @property {number} y - Y position within the image to cut from (in atlas json: frame.y)
    */
    this.y = y;

    /**
    * @property {number} width - Width of the frame to cut from the image (in atlas json: frame.w)
    */
    this.width = width;

    /**
    * @property {number} height - Height of the frame to cut from the image (in atlas json: frame.h)
    */
    this.height = height;

    /**
    * @property {string} name - If the Frame is part of a Texture Atlas this is the 'filename' or key value.
    */
    this.name = name || '';

    /**
    * @property {number} rotation - If the frame is rotated this holds the amount of rotation to be applied.
    * @default
    */
    this.rotation = 0;

    /**
    * @property {number} sourceWidth - Width of the original sprite before it was trimmed (sourceSize.w)
    */
    this.sourceWidth = width;

    /**
    * @property {number} sourceHeight - Height of the original sprite before it was trimmed (sourceSize.h)
    */
    this.sourceHeight = height;

    /**
    * @property {boolean} trimmed - Was it trimmed when packed?
    * @default
    */
    this.trimmed = false;

    /**
    * @property {number} trimX - X position of the trimmed sprite inside original sprite (spriteSourceSize.x)
    * @default
    */
    this.trimX = 0;

    /**
    * @property {number} trimY - Y position of the trimmed sprite inside original sprite (spriteSourceSize.y)
    * @default
    */
    this.trimY = 0;

    /**
    * @property {number} trimWidth - Width of the trimmed sprite (spriteSourceSize.w)
    * @default
    */
    this.trimWidth = 0;

    /**
    * @property {number} trimHeight - Height of the trimmed sprite (spriteSourceSize.h)
    * @default
    */
    this.trimHeight = 0;

};

PhaserMicro.Frame.prototype = {

    /**
    * If the frame was trimmed when added to the Texture Atlas this records the trim and source data.
    *
    * @method Phaser.Frame#setTrim
    * @param {number} width - The actual width of the frame before being trimmed (sourceSize.w)
    * @param {number} height - The actual height of the frame before being trimmed (sourceSize.h)
    * @param {number} x - The x offset of the trimmed sprite from its x origin (spriteSourceSize.x)
    * @param {number} y - The y offset of the trimmed sprite from its y origin (spriteSourceSize.y)
    * @param {number} trimWidth - The width of the trimmed frame (spriteSourceSize.w)
    * @param {number} trimHeight - The height of the trimmed frame (spriteSourceSize.h)
    */
    setTrim: function (width, height, x, y, trimWidth, trimHeight) {

        this.trimmed = true;

        this.sourceWidth = width;
        this.sourceHeight = height;

        this.trimX = x;
        this.trimY = y;

        this.trimWidth = trimWidth;
        this.trimHeight = trimHeight;

    },

    setRotation: function (direction) {

        if (direction === 'cw')
        {
            this.rotation = 90;
        }
        else if (direction === 'ccw')
        {
            this.rotation = -90;
        }

    }

};

PhaserMicro.Frame.prototype.constructor = PhaserMicro.Frame;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* FrameData is a container for Frame objects, which are the internal representation of animation data in Phaser.
*
* @class Phaser.FrameData
* @constructor
*/
PhaserMicro.FrameData = function () {

    /**
    * @property {Array} _frames - Local array of Frame objects.
    * @private
    */
    this._frames = [];

    /**
    * @property {Array} _indexes - Numeric mapping of frame numbers to Frame objects.
    * @private
    */
    this._indexes = [];

    /**
    * @property {Object} _names - Local maping object of frame names to Frame objects.
    * @private
    */
    this._names = {};

};

PhaserMicro.FrameData.prototype = {

    addFrame: function (x, y, width, height, name) {

        var i = this._frames.length;

        var newFrame = new PhaserMicro.Frame(i, x, y, width, height, name);

        //  The base Frame object
        this._frames.push(newFrame);

        //  Numeric mapping
        this._indexes.push(this._frames[i]);

        //  String mapping
        if (name)
        {
            this._names[name] = this._frames[i];
        }

        return newFrame;

    },

    /**
    * Adds a new Frame to this FrameData collection.
    *
    * @method Phaser.FrameData#addFrame
    * @param {object} json - The json frame data.
    */
    add: function (json, width, height, name) {

        var rect = json.frame;

        var newFrame = this.addFrame(rect.x, rect.y, rect.w, rect.h, name);

        if (json.trimmed)
        {
            var source = json.spriteSourceSize;
            newFrame.setTrim(json.sourceSize.w, json.sourceSize.h, source.x, source.y, source.w, source.h);
        }

    },

    getFrame: function (value) {

        if (typeof value === 'number')
        {
            return this._indexes[value];
        }
        else
        {
            return this._names[value];
        }

    },

    getFrameIndex: function (value) {

        return this._indexes[value];

    },

    getFrameName: function (value) {

        return this._names[value];

    }

};
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = PhaserMicro;
        }
        exports.PhaserMicro = PhaserMicro;
    } else if (typeof define !== 'undefined' && define.amd) {
        define('PhaserMicro', (function() { return root.PhaserMicro = PhaserMicro; })() );
    } else {
        root.PhaserMicro = PhaserMicro;
    }

    return PhaserMicro;
}).call(this);
