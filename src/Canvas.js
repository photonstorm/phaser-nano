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

        // var dx = (this.texture.trim) ? this.texture.trim.x - this.anchor.x * this.texture.trim.width : this.anchor.x * -this.texture.frame.width;
        // var dy = (this.texture.trim) ? this.texture.trim.y - this.anchor.y * this.texture.trim.height : this.anchor.y * -this.texture.frame.height;

        this.context.drawImage(texture.baseTexture.source, frame.x, frame.y, frame.width, frame.height, dx, dy, frame.width, frame.height);

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
