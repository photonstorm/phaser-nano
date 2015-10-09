PhaserMicro.Canvas = function (game) {

    this.game = game;
    this.canvas = game.canvas;

};

PhaserMicro.Canvas.prototype = {

    boot: function () {

        this.context = this.canvas.getContext("2d", { alpha: false });

    },

    render: function () {

        this.context.clearRect(0, 0, this.width, this.height);

        this.renderDisplayObject(this.root, this.projection);

    }

};
