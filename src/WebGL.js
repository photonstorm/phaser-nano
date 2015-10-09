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

    this._size = 0;
    this._batch = [];
    this._base = null;

    this.dirty = true;

    // this.lastIndexCount = 0;
    // this.drawCount = 0;
    // this.drawing = false;
    // this.offset = { x: 0, y: 0 };
    // this.textures = [];
    // this._UID = 0;

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

        PhaserMicro.log('initWebGL ' + gl.id);

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

        PhaserMicro.log('initShader', '#ffffff', '#ff0000');

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
            // PhaserMicro.log('flush 1');
            this.flush();
            this._base = texture.baseTexture;
        }

        var uvs = texture._uvs;
        var alpha = 1;
        var tint = 0xffffff;

        var aX = 0;
        var aY = 0;

        var w0 = (texture.frame.width) * (1 - aX);
        var w1 = (texture.frame.width) * -aX;

        var h0 = texture.frame.height * (1 - aY);
        var h1 = texture.frame.height * -aY;

        //  Merge scale values in here
        var a = 1;
        var b = 0;
        var c = 0;
        var d = 1;
        var tx = x;
        var ty = y;

        var verts = this.vertices;
        var i = this._size * 4 * this.vertSize;

        //  Top Left vert (xy, uv, color)
        verts[i++] = a * w1 + c * h1 + tx;
        verts[i++] = d * h1 + b * w1 + ty;
        verts[i++] = uvs.x0;
        verts[i++] = uvs.y0;
        verts[i++] = alpha;
        verts[i++] = tint;

        //  Top Right vert (xy, uv, color)
        verts[i++] = a * w0 + c * h1 + tx;
        verts[i++] = d * h1 + b * w0 + ty;
        verts[i++] = uvs.x1;
        verts[i++] = uvs.y1;
        verts[i++] = alpha;
        verts[i++] = tint;

        //  Bottom Right vert (xy, uv, color)
        verts[i++] = a * w0 + c * h0 + tx;
        verts[i++] = d * h0 + b * w0 + ty;
        verts[i++] = uvs.x2;
        verts[i++] = uvs.y2;
        verts[i++] = alpha;
        verts[i++] = tint;

        //  Bottom Left vert (xy, uv, color)
        verts[i++] = a * w1 + c * h0 + tx;
        verts[i++] = d * h0 + b * w1 + ty;
        verts[i++] = uvs.x3;
        verts[i++] = uvs.y3;
        verts[i++] = alpha;
        verts[i++] = tint;
        
        //  Increment the batchsize
        this._batch[this._size++] = { blendMode: 0, texture: texture };

    },

    renderSprite: function (sprite) {

        // PhaserMicro.log('renderSprite');

        var texture = sprite.texture;
        
        if (this._size >= this.batchSize)
        {
            // PhaserMicro.log('flush 1');
            this.flush();
            this._base = texture.baseTexture;
        }

        var uvs = texture._uvs;
        var alpha = sprite.worldAlpha;
        var tint = sprite.tint;

        var aX = sprite.anchor.x;
        var aY = sprite.anchor.y;

        var w0 = (texture.frame.width) * (1 - aX);
        var w1 = (texture.frame.width) * -aX;

        var h0 = texture.frame.height * (1 - aY);
        var h1 = texture.frame.height * -aY;

        /*
        if (texture.trim)
        {
            // if the sprite is trimmed then we need to add the extra space before transforming the sprite coords..
            var trim = texture.trim;

            w1 = trim.x - aX * trim.width;
            w0 = w1 + texture.crop.width;

            h1 = trim.y - aY * trim.height;
            h0 = h1 + texture.crop.height;

        }
        else
        {
            w0 = (texture.frame.width ) * (1-aX);
            w1 = (texture.frame.width ) * -aX;

            h0 = texture.frame.height * (1-aY);
            h1 = texture.frame.height * -aY;
        }
        */

        var wt = sprite.worldTransform;

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
        verts[i++] = tint;

        //  Top Right vert (xy, uv, color)
        verts[i++] = a * w0 + c * h1 + tx;
        verts[i++] = d * h1 + b * w0 + ty;
        verts[i++] = uvs.x1;
        verts[i++] = uvs.y1;
        verts[i++] = alpha;
        verts[i++] = tint;

        //  Bottom Right vert (xy, uv, color)
        verts[i++] = a * w0 + c * h0 + tx;
        verts[i++] = d * h0 + b * w0 + ty;
        verts[i++] = uvs.x2;
        verts[i++] = uvs.y2;
        verts[i++] = alpha;
        verts[i++] = tint;

        //  Bottom Left vert (xy, uv, color)
        verts[i++] = a * w1 + c * h0 + tx;
        verts[i++] = d * h0 + b * w1 + ty;
        verts[i++] = uvs.x3;
        verts[i++] = uvs.y3;
        verts[i++] = alpha;
        verts[i++] = tint;
        
        // PhaserMicro.log('added to batch array');

        // increment the batchsize
        this._batch[this._size++] = sprite;

    },

    flush: function () {

        if (this._size === 0)
        {
            //  Nothing more to draw
            return;
        }

        // PhaserMicro.log('flush');

        var gl = this.gl;

        if (this.dirty)
        {
            //  Always dirty the first pass through
            //  but subsequent calls may be clean
            // PhaserMicro.log('flush dirty');

            this.dirty = false;

            // bind the main texture
            gl.activeTexture(gl.TEXTURE0);

            // bind the buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

            //  set the projection vector (defaults to middle of game world on negative y)
            gl.uniform2f(this.projectionVector, this.projection.x, this.projection.y);

            //  vertex position
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, this.stride, 0);

            //  texture coordinate
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, this.stride, 2 * 4);

            //  color attribute
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, this.stride, 4 * 4);
        }

        //  Upload the verts to the buffer
        if (this._size > (this.batchSize * 0.5))
        {
            // PhaserMicro.log('flush verts 1');
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        }
        else
        {
            // PhaserMicro.log('flush verts 2');
            var view = this.vertices.subarray(0, this._size * 4 * this.vertSize);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }

        var start = 0;
        var currentSize = 0;

        var texture = { source: null };
        var nextTexture = null;

        var blend = -1;
        var nextBlend = null;

        var sprite;

        for (var i = 0; i < this._size; i++)
        {
            //  Could be a sprite OR a texture
            sprite = this._batch[i];

            nextTexture = sprite.texture.baseTexture;
            nextBlend = sprite.blendMode;

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

            if (texture.source !== nextTexture.source)
            {
                // PhaserMicro.log('texture !== next');

                if (currentSize > 0)
                {
                    // console.log('draw1', currentSize);
                    gl.bindTexture(gl.TEXTURE_2D, texture._gl[gl.id]);
                    gl.drawElements(gl.TRIANGLES, currentSize * 6, gl.UNSIGNED_SHORT, start * 6 * 2);
                }

                start = i;
                currentSize = 0;
                texture = nextTexture;
            }

            currentSize++;
        }

        if (currentSize > 0)
        {
            // console.log('draw2', currentSize);
            gl.bindTexture(gl.TEXTURE_2D, texture._gl[gl.id]);
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