var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.load.image('atari', 'assets/atari130xe.png');

}

var x = 0;
var bob1;
var bob2;
var bob3;

function create() {

    bob1 = game.add.sprite(x, 0, 'atari');
    bob2 = game.add.sprite(x, 200, 'atari');
    bob3 = game.add.sprite(x, 400, 'atari');

}

function update() {

    if (x < 700)
    {
        x++;

        bob1.x = x;
        bob2.x = x;
        bob3.x = x;
    }

}
