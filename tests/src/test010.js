var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.spritesheet('diamonds', 'assets/diamonds32x24x5.png', 32, 24);

}

function create() {

    game.add.sprite(0, 0, 'sky');

    var sprite;

    for (var f = 0; f < 5; f++)
    {
        for (var i = 0; i < 100; i++)
        {
            var x = Math.random() * game.width;
            var y = Math.random() * game.height;

            //  Testing spritesheet + frame number support
            sprite = game.add.sprite(x, y, 'diamonds', f);
        }
    }

}

function update() {

}
