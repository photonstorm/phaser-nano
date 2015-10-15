var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update, render: render });

function preload () {

    game.pixelArt = true;

    game.load.image('sky', 'assets/sky2.png');
    game.load.image('ship1', 'assets/bsquadron1.png');
    game.load.image('ship2', 'assets/bsquadron2.png');
    game.load.image('ship3', 'assets/bsquadron3.png');

}

var blitTexture;
var pool = [];

function create() {

    blitTexture = new PhaserNano.Texture(game.cache.getTexture('ship1'));

    game.add.sprite(0, 0, 'sky');

    //  Our Blit pool
    for (var i = 0; i < 500; i++)
    {
        var x = Math.random() * game.width;
        var y = Math.random() * game.height;
        pool.push( { x: x, y: y, r: 2 + Math.random() * 6 });
    }

}

function update() {

}

function render() {

    var y;

    for (var i = 0; i < pool.length; i++)
    {
        y = pool[i].y;

        game.renderer.blit(pool[i].x, y, blitTexture);

        y -= pool[i].r;

        if (y < -64)
        {
            y = 600;
        }
        
        pool[i].y = y;
    }

}
