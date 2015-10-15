var game = new PhaserNano.Game(800, 600, 'canvas', '', { preload: preload, create: create, update: update });

function preload () {

    game.load.image('pic', 'assets/Equality_by_Ragnarok.png');

}

function create() {

    var pic = game.add.sprite(0, 0, 'pic');

    pic.rotation = 0.2;

}

function update() {

}
