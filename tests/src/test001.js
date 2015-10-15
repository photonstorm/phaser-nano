var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.load.image('atari', 'assets/atari130xe.png');

}

var img = null;
var w = 0;
var h = 0;
var y = 0;

function create() {

    img = game.cache.getImage('atari');
    w = img.width;
    h = img.height;

    game.context.drawImage(img, 0, 0, w, h, 0, 0, w, h);

}

function update() {

    game.context.drawImage(img, 0, 0, w, h, 0, y, w, h);

    if (y < 500)
    {
        y++;
    }

}
