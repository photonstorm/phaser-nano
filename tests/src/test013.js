var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.load.path = 'assets/';
    game.load.atlas('atlas_array_no_trim');

}

function create() {

    // var sprite = game.add.sprite(0, 0, 'atlas_array_no_trim', 3);

    var sprite = game.add.sprite(0, 0, 'atlas_array_no_trim', 'nanoha_taiken_blue');

    console.log(sprite.frame);
    console.log(sprite.frameName);

}

function update() {

}
