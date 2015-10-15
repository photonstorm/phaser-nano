var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.image('ship', 'assets/bsquadron3.png');

}

function create() {

    game.add.sprite(0, 0, 'sky');

    var sprite;

    for (var i = 0; i < 100; i++)
    {
        var x = Math.random() * game.width;
        var y = Math.random() * game.height;
        sprite = game.add.sprite(x, y, 'ship');
        sprite.scale.x = 2;
        sprite.scale.y = 2;
    }

}

function update() {

}
