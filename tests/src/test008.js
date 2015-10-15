var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update, render: render });

function preload () {

    // game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.image('yellow', 'assets/yellow.png');
    game.load.image('bubble', 'assets/bubble256.png');

}

var pool = [];

function create() {

    game.add.sprite(0, 0, 'sky');

    var sprite;

    for (var i = 0; i < 1000; i++)
    {
        var x = Math.random() * game.width;
        var y = Math.random() * game.height;
        sprite = game.add.sprite(x, y, 'yellow');
        sprite.blendMode = 1;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        // sprite.scale.x = 0.25;
        // sprite.scale.y = 0.25;
        pool.push( { s: sprite, r: 2 + Math.random() * 6 });
    }

}

function update() {

    var s;

    for (var i = 0; i < pool.length; i++)
    {
        s = pool[i].s;

        s.y -= pool[i].r;

        if (s.y < -256)
        {
            s.y = 700;
        }
    }

}

function render() {

}
