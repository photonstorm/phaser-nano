    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = PhaserNano;
        }
        exports.PhaserNano = PhaserNano;
    } else if (typeof define !== 'undefined' && define.amd) {
        define('PhaserNano', (function() { return root.PhaserNano = PhaserNano; })() );
    } else {
        root.PhaserNano = PhaserNano;
    }

    return PhaserNano;
}).call(this);
