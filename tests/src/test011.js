var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.spritesheet('monster', 'assets/metalslug_monster39x40.png', 39, 40);

}

var pool = [];
var tick = 0;

function create() {

    game.add.sprite(0, 0, 'sky');

    var sprite;

    for (var i = 0; i < 500; i++)
    {
        var x = -800 + (Math.random() * 800);
        var y = Math.random() * game.height;

        sprite = game.add.sprite(x, y, 'monster');
        pool.push(sprite);
    }

}

function update() {

    var advance = false;

    if (Date.now() > tick)
    {
        tick = Date.now() + 40;
        advance = true;
    }

    for (var i = 0; i < pool.length; i++)
    {
        pool[i].x += 1;

        if (pool[i].x > 800)
        {
            pool[i].x = -100;
        }

        if (advance)
        {
            if (pool[i].frame === 15)
            {
                pool[i].frame = 0;
            }
            else
            {
                pool[i].frame++;
            }
        }

    }

}
