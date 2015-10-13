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
                PhaserMicro.log('File Complete ' + file.key);
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

        PhaserMicro.log('Load Complete');

        this.game.start();

    }

};
