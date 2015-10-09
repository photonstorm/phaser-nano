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

    this.worldAlpha = 1;
    this.worldTransform = new PhaserMicro.Matrix();

    this.projection = { x: 0, y: 0 };
    this.offset = { x: 0, y: 0 };
    this.drawCount = 0;
    this.vertSize = 6;
    this.stride = this.vertSize * 4;
    this.batchSize = 2000;
    this.batchSprites = [];
    this.contextLost = false;
    this.vertices = new Float32Array(this.batchSize * 4 * this.vertSize);
    this.indices = new Uint16Array(this.batchSize * 6);
    this.lastIndexCount = 0;
    this.drawing = false;
    this.currentBatchSize = 0;
    this.currentBaseTexture = null;
    this.dirty = true;
    this.textures = [];
    this._UID = 0;

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

        var vertexSrc = [
            'attribute vec2 aVertexPosition;',
            'attribute vec2 aTextureCoord;',
            'attribute vec4 aColor;',

            'uniform vec2 projectionVector;',
            'uniform vec2 offsetVector;',

            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',

            'const vec2 center = vec2(-1.0, 1.0);',

            'void main(void) {',
            '   gl_Position = vec4( ((aVertexPosition + offsetVector) / projectionVector) + center , 0.0, 1.0);',
            '   vTextureCoord = aTextureCoord;',
            '   vec3 color = mod(vec3(aColor.y / 65536.0, aColor.y / 256.0, aColor.y), 256.0) / 256.0;',
            '   vColor = vec4(color * aColor.x, aColor.x);',
            '}'
        ];

        var fragmentSrc = [
            'precision lowp float;',
            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',
            'uniform sampler2D uSampler;',
            'void main(void) {',
            '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;',
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

            //  Shader uniforms
            this.uSampler = gl.getUniformLocation(program, 'uSampler');
            this.projectionVector = gl.getUniformLocation(program, 'projectionVector');
            this.offsetVector = gl.getUniformLocation(program, 'offsetVector');
            this.dimensions = gl.getUniformLocation(program, 'dimensions');

            this.program = program;

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

        this.drawCount = 0;
        this.currentBatchSize = 0;
        this.batchSprites = [];

        // PhaserMicro.log('renderWebGL start', '#ff0000');

        this.dirty = true;

        for (var i = 0; i < this.game.children.length; i++)
        {
            this.game.children[i].updateTransform();
            this.renderSprite(this.game.children[i]);
        }

        // PhaserMicro.log('renderWebGL end', '#ff0000');

        this.flushBatch();

    },

    renderSprite: function (sprite) {

        // PhaserMicro.log('renderSprite');

        var texture = sprite.texture;
        
        if (this.currentBatchSize >= this.batchSize)
        {
            // PhaserMicro.log('flush 1');
            this.flushBatch();
            this.currentBaseTexture = texture.baseTexture;
        }

        // get the uvs for the texture

        var uvs = texture._uvs;

        // if the uvs have not updated then no point rendering just yet!
        // if(!uvs)return;

        // get the sprites current alpha
        // var alpha = sprite.worldAlpha;
        // var tint = sprite.tint;

        var alpha = 1;
        var tint = 0xffffff;

        var verticies = this.vertices;

        //  anchor
        var aX = 0;
        var aY = 0;

        var w0 = (texture.frame.width) * ( 1 - aX);
        var w1 = (texture.frame.width) * -aX;

        var h0 = texture.frame.height * (1 - aY);
        var h1 = texture.frame.height * -aY;

        /*
        var aX = sprite.anchor.x;
        var aY = sprite.anchor.y;

        var w0, w1, h0, h1;
            
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

        var index = this.currentBatchSize * 4 * this.vertSize;
        
        // var resolution = texture.baseTexture.resolution;
        var resolution = 1;

        var worldTransform = sprite.worldTransform;

        var a = worldTransform.a / resolution;
        var b = worldTransform.b / resolution;
        var c = worldTransform.c / resolution;
        var d = worldTransform.d / resolution;
        var tx = worldTransform.tx;
        var ty = worldTransform.ty;

        //  Top Left vert
        // xy
        verticies[index++] = a * w1 + c * h1 + tx;
        verticies[index++] = d * h1 + b * w1 + ty;
        // uv
        verticies[index++] = uvs.x0;
        verticies[index++] = uvs.y0;
        // color
        verticies[index++] = alpha;
        verticies[index++] = tint;

        //  Top Right vert
        // xy
        verticies[index++] = a * w0 + c * h1 + tx;
        verticies[index++] = d * h1 + b * w0 + ty;
        // uv
        verticies[index++] = uvs.x1;
        verticies[index++] = uvs.y1;
        // color
        verticies[index++] = alpha;
        verticies[index++] = tint;

        //  Bottom Right vert
        // xy
        verticies[index++] = a * w0 + c * h0 + tx;
        verticies[index++] = d * h0 + b * w0 + ty;
        // uv
        verticies[index++] = uvs.x2;
        verticies[index++] = uvs.y2;
        // color
        verticies[index++] = alpha;
        verticies[index++] = tint;

        //  Bottom Left vert
        // xy
        verticies[index++] = a * w1 + c * h0 + tx;
        verticies[index++] = d * h0 + b * w1 + ty;
        // uv
        verticies[index++] = uvs.x3;
        verticies[index++] = uvs.y3;
        // color
        verticies[index++] = alpha;
        verticies[index++] = tint;
        
        // PhaserMicro.log('added to batch array');

        // increment the batchsize
        this.batchSprites[this.currentBatchSize++] = sprite;

    },

    flushBatch: function () {

        if (this.currentBatchSize === 0)
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

            //  set the projection vector (done every loop)
            gl.uniform2f(this.projectionVector, this.projection.x, this.projection.y);

            //  vertex position
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, this.stride, 0);

            //  texture coordinate
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, this.stride, 2 * 4);

            //  color attribute
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, this.stride, 4 * 4);
        }

        //  Upload the verts to the buffer
        if (this.currentBatchSize > (this.batchSize * 0.5))
        {
            // PhaserMicro.log('flush verts 1');
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        }
        else
        {
            // PhaserMicro.log('flush verts 2');
            var view = this.vertices.subarray(0, this.currentBatchSize * 4 * this.vertSize);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
        }

        var nextTexture = null;
        var nextBlendMode = null;
        var batchSize = 0;
        var start = 0;
        var currentBaseTexture = null;
        var currentBlendMode = -1;
        var sprite;

        for (var i = 0, j = this.currentBatchSize; i < j; i++)
        {
            sprite = this.batchSprites[i];

            nextTexture = sprite.texture.baseTexture;
            nextBlendMode = sprite.blendMode;

            if (currentBlendMode !== nextBlendMode)
            {
                if (nextBlendMode === PhaserMicro.BLEND_NORMAL)
                {
                    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }
                else if (nextBlendMode === PhaserMicro.BLEND_ADD)
                {
                    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
                }
                else if (nextBlendMode === PhaserMicro.BLEND_MULTIPLY)
                {
                    gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
                }
                else if (nextBlendMode === PhaserMicro.BLEND_SCREEN)
                {
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                }
            }

            if (currentBaseTexture !== nextTexture)
            {
                // PhaserMicro.log('texture !== next');

                if (batchSize > 0)
                {
                    gl.bindTexture(gl.TEXTURE_2D, currentBaseTexture._glTextures[gl.id]);
                    gl.drawElements(gl.TRIANGLES, batchSize * 6, gl.UNSIGNED_SHORT, start * 6 * 2);
                    this.drawCount++;
                }

                start = i;
                batchSize = 0;
                currentBaseTexture = nextTexture;
            }

            batchSize++;
        }

        if (batchSize > 0)
        {
            gl.bindTexture(gl.TEXTURE_2D, currentBaseTexture._glTextures[gl.id]);
            gl.drawElements(gl.TRIANGLES, batchSize * 6, gl.UNSIGNED_SHORT, start * 6 * 2);
            this.drawCount++;
        }

        // then reset the batch!
        this.currentBatchSize = 0;

    },

    updateTexture: function (texture) {

        // PhaserMicro.log('updateTexture: ' + texture);

        var gl = this.gl;

        if (!texture._glTextures[gl.id])
        {
            texture._glTextures[gl.id] = gl.createTexture();
        }

        gl.bindTexture(gl.TEXTURE_2D, texture._glTextures[gl.id]);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultipliedAlpha);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);

        //  Or gl.NEAREST (for pixel art style)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        if (!texture._powerOf2)
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        else
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }

        texture._dirty[gl.id] = false;

        return texture._glTextures[gl.id];

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
        //     texture._glTextures = [];
        // }

        this.contextLost = false;

    },

};