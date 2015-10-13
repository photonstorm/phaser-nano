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
    * @property {number} index - The index of this Frame within the FrameData set it is being added to.
    */
    this.index = index;

    /**
    * @property {number} x - X position within the image to cut from.
    */
    this.x = x;

    /**
    * @property {number} y - Y position within the image to cut from.
    */
    this.y = y;

    /**
    * @property {number} width - Width of the frame.
    */
    this.width = width;

    /**
    * @property {number} height - Height of the frame.
    */
    this.height = height;

    /**
    * @property {string} name - Useful for Texture Atlas files (is set to the filename value).
    */
    this.name = name || '';

    /**
    * @property {number} rotation - If the frame is rotated this holds the amount of rotation to be applied.
    * @default
    */
    this.rotation = 0;

    /**
    * @property {boolean} trimmed - Was it trimmed when packed?
    * @default
    */
    this.trimmed = false;

    /**
    * @property {number} sourceSizeW - Width of the original sprite before it was trimmed.
    */
    this.sourceSizeW = width;

    /**
    * @property {number} sourceSizeH - Height of the original sprite before it was trimmed.
    */
    this.sourceSizeH = height;

    /**
    * @property {number} spriteSourceSizeX - X position of the trimmed sprite inside original sprite.
    * @default
    */
    this.spriteSourceSizeX = 0;

    /**
    * @property {number} spriteSourceSizeY - Y position of the trimmed sprite inside original sprite.
    * @default
    */
    this.spriteSourceSizeY = 0;

    /**
    * @property {number} spriteSourceSizeW - Width of the trimmed sprite.
    * @default
    */
    this.spriteSourceSizeW = 0;

    /**
    * @property {number} spriteSourceSizeH - Height of the trimmed sprite.
    * @default
    */
    this.spriteSourceSizeH = 0;

};

PhaserMicro.Frame.prototype = {

    /**
    * If the frame was trimmed when added to the Texture Atlas this records the trim and source data.
    *
    * @method Phaser.Frame#setTrim
    * @param {number} width - The actual width of the frame before being trimmed.
    * @param {number} height - The actual height of the frame before being trimmed.
    * @param {number} destX - The destination X position of the trimmed frame for display.
    * @param {number} destY - The destination Y position of the trimmed frame for display.
    * @param {number} destWidth - The destination width of the trimmed frame for display.
    * @param {number} destHeight - The destination height of the trimmed frame for display.
    */
    setTrim: function (width, height, destX, destY, destWidth, destHeight) {

        this.trimmed = true;

        this.sourceSizeW = width;
        this.sourceSizeH = height;
        this.spriteSourceSizeX = destX;
        this.spriteSourceSizeY = destY;
        this.spriteSourceSizeW = destWidth;
        this.spriteSourceSizeH = destHeight;

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
