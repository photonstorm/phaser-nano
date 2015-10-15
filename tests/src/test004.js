var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.image('ship', 'assets/bsquadron3.png');

}

var ships;

function create() {

    game.add.sprite(0, 0, 'sky');

    ships = new PhaserNano.Group(game);

    var sprite;

    for (var i = 0; i < 100; i++)
    {
        var x = Math.random() * game.width;
        var y = Math.random() * game.height;
        sprite = game.add.sprite(x, y, 'ship');
        sprite.rotation = 45 * PhaserNano.DEG_TO_RAD;
        sprite.scale.x = 2;
        sprite.scale.y = 2;
        ships.add(sprite);
    }

}

function update() {

    ships.forEach(move, this);

}

function move(ship) {

    ship.x -= 2;
    ship.y += 2;

    if (ship.x < -64)
    {
        ship.x = 864;
    }

    if (ship.y > 600)
    {
        ship.y = -64;
    }

}
