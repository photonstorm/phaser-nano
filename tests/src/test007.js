var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update, render: render });

function preload () {

    game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.image('arrow', 'assets/arrow.png');

}

var sprite;
var d = 1;

function create() {

    game.add.sprite(0, 0, 'sky');

    sprite = game.add.sprite(400, 300, 'arrow');
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;

}

function update() {

    sprite.rotation += 0.1;

    if (d)
    {
        sprite.scale.x += 0.1;
        sprite.scale.y += 0.1;

        if (sprite.scale.x >= 12)
        {
            d = 0;
        }
    }
    else
    {
        sprite.scale.x -= 0.1;
        sprite.scale.y -= 0.1;

        if (sprite.scale.x < 0.1)
        {
            d = 1;
        }
    }

}

function render() {

}
