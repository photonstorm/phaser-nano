var game = new PhaserNano.Game(1024, 896, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.load.path = 'assets/';
    game.load.atlas('dracula');

}

var cy = 0;
var logo;

function create() {

    game.add.sprite(0, 0, 'dracula', 'background');
    game.add.sprite(0, 0, 'dracula', 'hills');

    logo = game.add.sprite(0, 0, 'dracula', 'logo');

    game.add.sprite(0, 0, 'dracula', 'copy');

    logo.texture.cropHeight = 0;

}

function update() {

    if (logo.texture.cropHeight < logo.texture.frame.height)
    {
        logo.texture.cropHeight++;
    }

}
