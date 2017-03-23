;(function(namespace) {

    var utils = {
        /**
         * Generates text for Debugging
         * @param {Object} hashObj - An object with strings
         * @param {number} xoffset - position on the X axis
         * @param {number} startY - starting position on the Y axis
         * @param {number} inc - increments in the Y axis, after the first element
         * @param {string} fcolor - font color
         * @param {string} fdesc - font size and face
         */
        addDebugText : function( hashObj, xoffset, startY, inc, fcolor, fdesc ){
            var i       = 0,
                xoffset = xoffset || 8,
                startY  = startY  || 165,
                inc     = inc     || 10,
                fc      = fcolor  || '9px Arial',
                fd      = fdesc   || '#FFFFFF';
            if( namespace && namespace.game && namespace.game.debug && namespace.game.debug.text ){
                _.forEach( hashObj, function action(val, key) {
                    namespace.game.debug.text( key+': '+val, xoffset, (startY + i*inc), fc, fd );
                    i++;
                });
            }
        }
    };


    namespace.Utils = utils;

}( KageClone ));