var chip8 = chip8 || {};

chip8.Rom = function() {

}

chip8.Rom.prototype.requestFile = function(filename, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {
        var rom = new Uint8Array(xhr.response);
        cb(rom);
    };

    xhr.send();
}

chip8.Rom.prototype.load = function(file, cb) {
    var fr = new FileReader();
    fr.onload = function() {
        var rom = new Uint8Array(fr.result);
        cb(rom);
    };
    fr.onerror = function(e) {
        console.log('Error reading the file', e.target.error.code)
    };
    fr.readAsArrayBuffer(file);
}
