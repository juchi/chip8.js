var chip8 = chip8 || {};

chip8.Screen = function() {
    var consts = {
        WIDTH: 64,
        HEIGHT: 32,
        PIXELSIZE: 8,
        BLACK: '#000',
        WHITE: '#FFF'
    }
    for (var i in consts) {
        this[i] = consts[i];
    }

    this.data = new Array()

    var canvas = document.getElementById('canvas');
    canvas.width = this.WIDTH * this.PIXELSIZE;
    canvas.height = this.HEIGHT * this.PIXELSIZE;

    this.context = canvas.getContext('2d');
    this.clear();
};

chip8.Screen.prototype.clear = function() {
    this.context.fillStyle = this.BLACK;
    this.context.fillRect(
        0,
        0,
        this.WIDTH * this.PIXELSIZE,
        this.HEIGHT * this.PIXELSIZE
    );

    this.data = new Array()
    for (var x = 0; x < this.WIDTH; x++) {
        this.data[x] = new Array();
        for (var y = 0; y < this.HEIGHT; y++) {
            this.data[x][y] = 0;
        }
    }
};

chip8.Screen.prototype.drawPixel = function(x, y) {
    if (typeof this.data[x] == "undefined") console.log('screen x', x, 'undefined');
    this.data[x][y] += 1;
    this.data[x][y] %= 2;

    var flip = false;

    if (this.data[x][y] == 0) {
        this.context.fillStyle = this.BLACK;
        flip = true;
    } else {
        this.context.fillStyle = this.WHITE;
    }
    this.context.fillRect(x * this.PIXELSIZE, y * this.PIXELSIZE, this.PIXELSIZE, this.PIXELSIZE);
    return flip;
};
