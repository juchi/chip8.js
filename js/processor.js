var chip8 = chip8 || {};

chip8.Proc = function(app) {
    var consts = {
        MAX_NESTING: 16,
        MEM_SIZE: 4096,
        START_ADDRESS: 0x200,
        SPEED: 240
    }
    for (var i in consts) {
        this[i] = consts[i];
    }

    this.app = app;
    this.reset();
};

chip8.Proc.prototype.reset = function() {
    this.nextClock = null;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.jumps = new Array(); // jump stack
    this.V = new Array(16); // registries
    for (var i = 0; i < 16; i++) {
        this.V[i] = 0;
    }
    this.I = 0; // address registry
    this.memory = new Array(this.MEM_SIZE);
    for(var i = 0; i < this.MEM_SIZE; i++) {
        this.memory[i] = 0;
    }
    this.pc = 0;
    this.keys = new Array();
    for (var i = 0; i < 16; i++) {
        this.keys[i] = 0; // 0 is key up
    }

    // chars are 5 lines height, each line 1 byte / 8 bit
    // with the 4 first bits defining which pixel are lit for each line
    var baseChars = [
        0xF0,0x90,0x90,0x90,0xF0, // 0
        0x20,0x60,0x20,0x20,0x70, // 1
        0xF0,0x10,0xF0,0x80,0xF0, // 2
        0xF0,0x10,0xF0,0x10,0xF0, // 3
        0x90,0x90,0xF0,0x10,0x10, // 4
        0xF0,0x80,0xF0,0x10,0xF0, // 5
        0xF0,0x80,0xF0,0x90,0xF0, // 6
        0xF0,0x10,0x20,0x40,0x40, // 7
        0xF0,0x90,0xF0,0x90,0xF0, // 8
        0xF0,0x90,0xF0,0x10,0xF0, // 9
        0xF0,0x90,0xF0,0x90,0x90, // A
        0xE0,0x90,0xE0,0x90,0xE0, // B
        0xF0,0x80,0x80,0x80,0xF0, // C
        0xE0,0x90,0x90,0x90,0xE0, // D
        0xF0,0x80,0xF0,0x80,0xF0, // E
        0xF0,0x80,0xF0,0x80,0x80  // F
    ];
    for (var i in baseChars) {
        this.memory[i] = baseChars[i];
    }
};

chip8.Proc.prototype.start = function() {
    this.pc = this.START_ADDRESS;
    this.clock();
};

chip8.Proc.prototype.clock = function() {
    this.updateTimers();

    for (var i = 0; i < this.SPEED / 60 |0; i++) {
        var opcode = this.getOpcode();
        var id = this.getInstruction(opcode);
        this.runInstruction(id, opcode);
    }

    this.nextClock = setTimeout(this.clock.bind(this), 16);
};

chip8.Proc.prototype.updateTimers = function() {
    if (this.delayTimer > 0) {
        this.delayTimer--;
    }
    if (this.soundTimer > 0) {
        this.soundTimer--;
    }
};

chip8.Proc.prototype.getOpcode = function() {
    var op = (this.memory[this.pc] << 8) + this.memory[this.pc + 1];
    if (isNaN(op)) {
        throw Error('Opcode is NaN, program counter='+this.pc);
    }

    return op;
};

chip8.Proc.prototype.getInstruction = function(opcode) {
    for (var i in this.instructions.masks) {
        if ((this.instructions.masks[i] & opcode) == this.instructions.ids[i]) {
            return i|0;
        }
    }
    throw Error('Unknown opcode: '+ opcode);
};

chip8.Proc.prototype.stop = function() {
    if (this.nextClock) {
        clearTimeout(this.nextClock);
    }
};

chip8.Proc.prototype.runInstruction = function(instructionId, opcode) {
    // extract the bytes from the opcode
    var bytes = [opcode & 0x00F, (opcode & 0x0F0) >> 4, (opcode & 0xF00) >> 8];
    switch (instructionId) {
    case 0: // 0NNN
        break;
    case 1: // 00E0
        this.app.clearScreen();
        break;
    case 2: // 00EE
        this.pc = this.jumps.pop();
        break;
    case 3: // 1NNN
        this.pc = (bytes[2] << 8) + (bytes[1] << 4) + bytes[0];
        this.pc -= 2;
        break;
    case 4: // 2NNN
        if (this.jumps.length >= this.MAX_NESTING) {
            throw Error('Max nesting level reached')
        }
        this.jumps.push(this.pc);
        this.pc = (bytes[2] << 8) + (bytes[1] << 4) + bytes[0];
        this.pc -= 2;
        break;
    case 5: // 3XNN
        if (this.V[bytes[2]] == (bytes[1] << 4) + bytes[0]) {
            this.pc += 2;
        }
        break;
    case 6: // 4XNN
        if (this.V[bytes[2]] != (bytes[1] << 4) + bytes[0]) {
            this.pc += 2;
        }
        break;
    case 7: // 5XY0
        if (this.V[bytes[2]] == this.V[bytes[1]]) {
            this.pc += 2;
        }
        break;
    case 8: // 6XNN
        this.V[bytes[2]] = (bytes[1] << 4) + bytes[0];
        break;
    case 9: // 7XNN
        this.V[bytes[2]] += (bytes[1] << 4) + bytes[0];
        this.V[bytes[2]] &= 0xFF;
        break;
    case 10: // 8XY0
        this.V[bytes[2]] = this.V[bytes[1]];
        break;
    case 11: // 8XY1
        this.V[bytes[2]] |= this.V[bytes[1]];
        break;
    case 12: // 8XY2
        this.V[bytes[2]] &= this.V[bytes[1]];
        break;
    case 13: // 8XY3
        this.V[bytes[2]] ^= this.V[bytes[1]];
        break;
    case 14: // 8XY4
        this.V[bytes[2]] += this.V[bytes[1]];
        if (this.V[bytes[2]] / 0x100 >= 1) {
            this.V[bytes[2]] &= 0xFF;
            this.V[0xF] = 1;
        } else {
            this.V[0xF] = 0;
        }
        break;
    case 15: // 8XY5
        this.V[bytes[2]] -= this.V[bytes[1]];
        if (this.V[bytes[2]] < 0) {
            this.V[bytes[2]] += 0x100;
            this.V[0xF] = 0;
        } else {
            this.V[0xF] = 1;
        }
        break;
    case 16: // 8XY6
        this.V[0xF] = this.V[bytes[2]] & 0x01;
        this.V[bytes[2]] = this.V[bytes[2]] >> 1;
        break;
    case 17: // 8XY7
        this.V[bytes[2]] = this.V[bytes[1]] - this.V[bytes[2]];
        if (this.V[bytes[2]] < 0) {
            this.V[bytes[2]] += 0x100;
            this.V[0xF] = 0;
        } else {
            this.V[0xF] = 1;
        }
        break;
    case 18: // 8XYE
        this.V[0xF] = this.V[bytes[2]] >> 7;
        this.V[bytes[2]] = (this.V[bytes[2]] << 1) & 0xFF;
        break;
    case 19: // 9XY0
        if (this.V[bytes[2]] != this.V[bytes[1]]) {
            this.pc += 2;
        }
        break;
    case 20: // ANNN
        this.I = (bytes[2] << 8) + (bytes[1] << 4) + bytes[0];
        break;
    case 21: // BNNN
        this.pc = (bytes[2] << 8) + (bytes[1] << 4) + bytes[0] + this.V[0];
        this.pc -= 2;
        break;
    case 22: // CXNN
        var max = (bytes[1] << 4) + bytes[0];
        this.V[bytes[2]] = Math.floor(Math.random() * max);
        break;
    case 23: // DXYN
        var x = this.V[bytes[2]], y = this.V[bytes[1]];
        var flag = false, flip = false;
        for (var i = 0; i < bytes[0]; i++) {
            var line = this.memory[this.I + i];
            for (var j = 0; j < 8; j++) {
                if (((line >> (7 - j)) & 1) == 1) {
                    var pixelX = (x + j) & 0x3F;
                    var pixelY = (y + i) & 0x1F;
                    flip = this.app.drawPixel(pixelX, y + i);
                    if (flip) {
                        flag = true;
                    }
                }

            }
        }
        this.V[0xF] = flag ? 1 : 0;
        break;
    case 24: // EX9E
        if (this.keys[this.V[bytes[2]]] == 1) {
            this.pc += 2;
        }
        break;
    case 25: // EXA1
        if (this.keys[this.V[bytes[2]]] == 0) {
            this.pc += 2;
        }
        break;
    case 26: // FX07
        this.V[bytes[2]] = this.delayTimer;
        break;
    case 27: // FX0A
        for (var i in this.keys) {
            if (this.keys[i] == 1) {
                this.V[bytes[2]] = i;
                this.pc += 2;
            }
        }
        this.pc -= 2;
        break;
    case 28: // FX15
        this.delayTimer = this.V[bytes[2]];
        break;
    case 29: // FX18
        this.soundTimer = this.V[bytes[2]];
        break;
    case 30: // FX1E
        this.V[0xF] = 0;
        this.I += this.V[bytes[2]];
        if (this.I > 0xFFF) {
            this.V[0xF] = 1;
        }
        this.I &= 0xFFF;
        break;
    case 31: // FX29
        this.I = this.V[bytes[2]] * 5;
        break;
    case 32: // FX33
        var vx = this.V[bytes[2]];
        this.memory[this.I] = vx / 100 |0;
        this.memory[this.I+1] = (vx % 100) / 10 |0;
        this.memory[this.I+2] = vx % 10;
        break;
    case 33: // FX55
        for (var i = 0; i <= bytes[2]; i++) {
            this.memory[this.I + i] = this.V[i];
        }
        break;
    case 34: // FX65
        for (var i = 0; i <= bytes[2]; i++) {
            this.V[i] = this.memory[this.I + i];
        }
        break;
    default:
        throw Error('Unknown instruction index');
        break;
    }
    this.pc += 2;
};

chip8.Proc.prototype.fillMemory = function(data) {
    this.pc = this.START_ADDRESS;
    for (var i in data) {
        this.memory[this.pc] = data[i];
        this.pc++;
    }
    this.pc = this.START_ADDRESS;
};

chip8.Proc.prototype.instructions = {
    // ids are fixed par from the opcode (zeros are variable bytes)
    ids: [
        0xFFFF,
        0x00E0,
        0x00EE,
        0x1000,
        0x2000,
        0x3000,
        0x4000,
        0x5000,
        0x6000,
        0x7000,
        0x8000,
        0x8001,
        0x8002,
        0x8003,
        0x8004,
        0x8005,
        0x8006,
        0x8007,
        0x800E,
        0x9000,
        0xA000,
        0xB000,
        0xC000,
        0xD000,
        0xE09E,
        0xE0A1,
        0xF007,
        0xF00A,
        0xF015,
        0xF018,
        0xF01E,
        0xF029,
        0xF033,
        0xF055,
        0xF065
    ],
    // masks are signature for each opcode
    masks: [
        0x0000,
        0xFFFF,
        0xFFFF,
        0xF000,
        0xF000,
        0xF000,
        0xF000,
        0xF000,
        0xF000,
        0xF000,
        0xF00F, //8XY0
        0xF00F,
        0xF00F,
        0xF00F,
        0xF00F,
        0xF00F,
        0xF00F,
        0xF00F,
        0xF00F,
        0xF00F, //9XY0
        0xF000,
        0xF000,
        0xF000,
        0xF000,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF,
        0xF0FF
    ]
};
