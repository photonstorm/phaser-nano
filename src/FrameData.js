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
        this._names[name] = this._frames[i];

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