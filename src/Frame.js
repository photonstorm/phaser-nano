/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A Frame is a single frame of an animation and is part of a FrameData collection.
*
* @class PhaserNano.Frame
* @constructor
* @param {number} index - The index of this Frame within the FrameData set it is being added to.
* @param {number} x - X position of the frame within the texture image.
* @param {number} y - Y position of the frame within the texture image.
* @param {number} width - Width of the frame within the texture image.
* @param {number} height - Height of the frame within the texture image.
* @param {string} [name] - The name of the frame. In Texture Atlas data this is usually set to the filename.
*/
PhaserNano.Frame = function (index, x, y, width, height, name) {

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

PhaserNano.Frame.prototype = {

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

PhaserNano.Frame.prototype.constructor = PhaserNano.Frame;
