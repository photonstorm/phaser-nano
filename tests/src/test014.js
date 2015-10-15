var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.pixelArt = true;

    game.load.path = 'assets/';
    // game.load.atlas('atlas_array_no_trim');
    game.load.atlas('atlas_hash_no_trim');

}

function create() {

    var sprite;

    //  Lots of sprites using the same shared texture data
    //  with their own scales

    for (var i = 0; i < 30; i++)
    {
        var x = Math.random() * game.width;
        var y = Math.random() * game.height;

        // sprite = game.add.sprite(x, y, 'atlas_array_no_trim', Math.round(Math.random() * 12));
        sprite = game.add.sprite(x, y, 'atlas_hash_no_trim', Math.round(Math.random() * 12));

        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        var scale = 0.5 + Math.random();
        sprite.scale.x = scale;
        sprite.scale.y = scale;
    }

}

function update() {

}
