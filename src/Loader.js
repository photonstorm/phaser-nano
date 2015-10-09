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
                    PhaserMicro.log('File loading error' + file.key);
                    // this.onFileError.dispatch(file.key, file);
                }

                this._loadedFileCount++;
                PhaserMicro.log('File Complete ' + file.key);
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

        PhaserMicro.log('Load Complete');

        this.game.start();

    }

};
