/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

(function(){

    var root = this;

    var PhaserMicro = PhaserMicro || {};

    PhaserMicro.Game = function (width, height, renderer, parent, state) {

        console.log('PhaserMicro', width, height, parent);

        this.parent = parent || '';
        this.width = width || 800;
        this.height = height || 600;

        this.isBooted = false;

        this.gl = null;
        this.canvas = null;
        this.context = null;

        this.contextOptions = {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false,
            stencil: true,
            preserveDrawingBuffer: false
        };

        this.state = state;

        this.cache = null;
        this.load = null;

        this.projection = { x: 0, y: 0 };

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

            this.cache = new PhaserMicro.Cache(this);
            this.load = new PhaserMicro.Loader(this);

            //  Create the Canvas

            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.addToDOM();

            this.initCanvas();
            // this.initWebGL();

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

            game.context.clearRect(0, 0, this.width, this.height);

            if (this.state.update)
            {
                this.state.update.call(this.state, this);
            }

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

        initCanvas: function () {

            this.context = this.canvas.getContext("2d", { alpha: false });

            this.context.fillStyle = '#ff0000';
            this.context.fillRect(0, 0, 128, 128);

        },

        initWebGL: function () {

            var gl = this.canvas.getContext('webgl', this.contextOptions) || this.canvas.getContext('experimental-webgl', this.contextOptions);

            this.gl = gl;

            if (!gl)
            {
                throw new Error('Browser does not support WebGL');
            }

            this.glContextId = gl.id;

            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.enable(gl.BLEND);

            this.gl.viewport(0, 0, this.width, this.height);

            this.projection.x =  this.width / 2;
            this.projection.y =  -this.height / 2;

        }


    };

    PhaserMicro.Cache = function (game) {

        this.game = game;

        this._cache = {
            image: {}
        };

    };

    PhaserMicro.Cache.prototype = {

        addImage: function (key, url, data) {

            var img = {
                key: key,
                url: url,
                data: data
            };

            this._cache.image[key] = img;

            return img;

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

    PhaserMicro.Loader = function (game) {

        this.game = game;
        this.cache = game.cache;
    
        this.baseURL = '';
        this.path = '';

        this.isLoading = false;
        this.hasLoaded = false;

        this._fileList = [];
        this._flightQueue = [];
        this._fileLoadStarted = false;
        this._totalFileCount = 0;

    };

    PhaserMicro.Loader.prototype = {

        reset: function () {

            this.isLoading = false;
            this.hasLoaded = false;

            this._fileList.length = 0;
            this._flightQueue.length = 0;
            this._fileLoadStarted = false;
            this._totalFileCount = 0;
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

            this._fileList.push(file);
            this._totalFileCount++;

            return this;

        },

        image: function (key, url) {

            return this.addToFileList('image', key, url, undefined, '.png');

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
            for (var i = 0; i < this._flightQueue.length; i++)
            {
                var file = this._flightQueue[i];

                if (file.loaded || file.error)
                {
                    this._flightQueue.splice(i, 1);
                    i--;

                    file.loading = false;
                    file.requestUrl = null;
                    file.requestObject = null;

                    if (file.error)
                    {
                        console.log('File loading error', file.key);
                        // this.onFileError.dispatch(file.key, file);
                    }

                    this._loadedFileCount++;
                    console.log('File Complete', file.key);
                    // this.onFileComplete.dispatch(this.progress, file.key, !file.error, this._loadedFileCount, this._totalFileCount);
                }
            }

            for (var i = this._processingHead; i < this._fileList.length; i++)
            {
                var file = this._fileList[i];

                if (file.loaded || file.error)
                {
                    // Item at the start of file list finished, can skip it in future
                    if (i === this._processingHead)
                    {
                        this._processingHead = i + 1;
                    }
                }
                else if (!file.loading && this._flightQueue.length < 4)
                {
                    // -> not loaded/failed, not loading
                    if (!this._fileLoadStarted)
                    {
                        this._fileLoadStarted = true;
                        // this.onLoadStart.dispatch();
                    }

                    this._flightQueue.push(file);
                    file.loading = true;
                    // this.onFileStart.dispatch(this.progress, file.key, file.url);
                    this.loadFile(file);
                }

                // Stop looking if queue full
                if (this._flightQueue.length >= 4)
                {
                    break;
                }
            }

            // True when all items in the queue have been advanced over
            // (There should be no inflight items as they are complete - loaded/error.)
            if (this._processingHead >= this._fileList.length)
            {
                this.finishedLoading();
            }
            else if (!this._flightQueue.length)
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
            }

            if (loadNext)
            {
                this.asyncComplete(file);
            }

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
            if (!abnormal && !this._fileLoadStarted)
            {
                this._fileLoadStarted = true;
                // this.onLoadStart.dispatch();
            }

            // this.onLoadComplete.dispatch();

            this.reset();

            console.log('Load Complete');

            this.game.start();

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
