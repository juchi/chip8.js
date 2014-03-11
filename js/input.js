var chip8 = chip8 || {};

chip8.Input = function(app) {
    var that = this;
    addEventListener('keydown', function(e) {
        if (e.keyCode == 27) {
            app.kill();
        }
        var i = that.keys.indexOf(e.keyCode|0);
        if (i == -1) {
            return;
        }
        app.keydown(i);
    });
    addEventListener('keyup', function(e) {
        var i = that.keys.indexOf(e.keyCode|0);
        if (i == -1) {
            return;
        }
        app.keyup(i);
    });

    this.keys = [
        32, // 0 -> space
        65, // 1 -> A
        90, // 2 -> Z
        69, // 3 -> E
        81, // 4 -> Q
        83, // 5 -> S
        68, // 6 -> D
        87, // 7 -> W
        88, // 8 -> X
        67, // 9 -> C
        82, // A -> R
        70, // B -> F
        86, // C -> V
        84, // D -> T
        71, // E -> G
        66  // F -> B
    ]
}