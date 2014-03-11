
var chip8 = chip8 || {};

chip8.Application = function() {
    this.screen = new chip8.Screen();
    this.proc = new chip8.Proc(this);
    this.input = new chip8.Input(this);
    this.rom = new chip8.Rom();

    var that = this;
    //this.rom.requestFile('GAMES/TEST/IBM.ch8', that.startRom);
    document.getElementById('file').addEventListener('change', function(e){
        that.rom.load(e.target.files[0], that.startRom.bind(that));
    })
};

chip8.Application.prototype.clearScreen = function() {
    this.screen.clear();
};

chip8.Application.prototype.drawPixel = function(x, y) {
    this.screen.drawPixel(x, y);
};

chip8.Application.prototype.startRom = function(data) {
    this.kill();
    this.proc.reset();
    this.proc.fillMemory(data);
    this.proc.start();
};

chip8.Application.prototype.kill = function() {
    this.proc.stop();
    this.screen.clear();
};

chip8.Application.prototype.keydown = function(key) {
    this.proc.keys[key] = 1;
};

chip8.Application.prototype.keyup = function(key) {
    this.proc.keys[key] = 0;
};

app = new chip8.Application();
