var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.load.image('atari', 'assets/atari130xe.png');

}

var x = 0;
var bob1;
var bob2;
var bob3;

function create() {

    bob1 = game.add.sprite(0, 0, 'atari');
    bob2 = game.add.sprite(100, 10, 'atari');
    bob3 = game.add.sprite(200, 20, 'atari');

}

function update() {


}
