var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update, render: render });

function preload () {

    game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.image('ship', 'assets/phaser-ship.png');

}

var blitTexture;
var pool = [];

function create() {

    blitTexture = new PhaserNano.Texture(game.cache.getTexture('ship'));

    game.add.sprite(0, 0, 'sky');

    //  Our Blit pool
    // for (var i = 0; i < 10000; i++)
    for (var i = 0; i < 1000; i++)
    {
        var x = Math.random() * game.width;
        var y = Math.random() * game.height;
        pool.push( { x: x, y: y, r: 2 + Math.random() * 6 });
    }

}

function update() {

}

function render() {

    var x;

    for (var i = 0; i < pool.length; i++)
    {
        x = pool[i].x;

        game.renderer.blit(x, pool[i].y, blitTexture);

        x += pool[i].r;

        if (x > 800)
        {
            x = -32;
        }
        
        pool[i].x = x;
    }

}
