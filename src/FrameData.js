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
    * @property {Object} _names - Local array of frame names to Frame objects.
    * @private
    */
    this._names = {};

};

PhaserMicro.FrameData.prototype = {

    /**
    * Adds a new Frame to this FrameData collection.
    *
    * @method Phaser.FrameData#addFrame
    * @param {object} json - The json frame data.
    */
    add: function (json, width, height) {

        var i = this._frames.length;

        var rect = json.frame;

        var newFrame = new PhaserMicro.Frame(i, rect.x, rect.y, rect.w, rect.h, json.filename);

        if (json.trimmed)
        {
            var source = json.spriteSourceSize;
            newFrame.setTrim(json.sourceSize.w, json.sourceSize.h, source.w, source.y, source.w, source.h);
        }

        newFrame.updateUVs(width, height);

        //  The base Frame object
        this._frames.push(newFrame);

        //  Numeric mapping
        this._indexes.push(this._frames[i]);

        //  String mapping
        this._names[frame.name] = this._frames[i];

    },

};