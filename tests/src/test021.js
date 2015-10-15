var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update, render: render });

function preload () {

    game.load.path = 'assets/';

    game.load.image('sky2');
    game.load.atlas('atlas_hash_trim');

}

var layer;

function create() {

    game.add.sprite(0, 0, 'sky2');

    layer = game.add.layer(400, 300);

    // layer.scale.set(2);

    var sprite;

    for (var x = 0; x < (64 * 9); x += 64)
    {
        sprite = layer.create.sprite(-256 + x, 0, 'atlas_hash_trim', 'diamond');
        sprite.anchor.set(0.5);

        if (x % 128)
        {
            sprite.scale.y = -1;
        }
    }

    for (var y = 0; y < (64 * 9); y += 64)
    {
        sprite = layer.create.sprite(0, -256 + y, 'atlas_hash_trim', 'diamond');
        sprite.anchor.set(0.5);

        if (y % 128)
        {
            sprite.scale.y = -1;
        }
    }

}

function update() {

    layer.rotation += 0.01;

    layer.forEach(rotate, this);

}

function rotate(child) {

    child.rotation -= 0.04;

}

function render() {

}
