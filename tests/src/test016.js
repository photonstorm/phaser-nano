var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.load.image('pic', 'assets/Equality_by_Ragnarok.png');

}

function create() {

    var pic = game.add.sprite(0, 0, 'pic');

    pic.width = 800;
    pic.height = 600;

    //  The cropHeight works on the texture dimensions, not the
    //  scaled dimensions. So a height of 300px here won't look like
    //  300px because the sprite is scaled.
    pic.texture.cropHeight = 300;

}

function update() {

}
