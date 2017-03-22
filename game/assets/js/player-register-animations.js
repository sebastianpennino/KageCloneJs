/**
 * registerAnimations register animations for a given sprite
 * @param {NinjaPlayer} player - a instance of NinjaPlayer class
 */
var registerAnimations = function( player ){
    'use strict';
    var animationList, key, fps, loop;

    animationList = {
        'ground'     : ['ground'],
        'ground_mv'  : ['gd_mv_1','gd_mv_2','gd_mv_3','gd_mv_2'],
        'ground_at'  : ['gd_at_1','gd_at_2','gd_at_3'],
        'duck'       : ['duck'],
        'duck_at'    : ['dk_at_1','dk_at_2','dk_at_3'],
        'jump'       : ['jump'],
        'jump_at'    : ['jp_at_1','jp_at_2','jp_at_3'],
        'grapple'    : ['grapple'],
        'grapple_mv' : ['gp_mv_1','gp_mv_2','gp_mv_3','gp_mv_2'],
        'grapple_at' : ['gp_at_1','gp_at_2','gp_at_3'],
        'climb_up'   : ['climb_1','climb_2','climb_3'],
        'climb_down' : ['climb_3','climb_2','climb_1'],
        'start'      : ['start'],
        'hit'        : ['hit'],
        'die'        : ['die_1','die_2']
    };

    for (key in animationList) {
        fps  = animationList[ key ].length === 1 ? 1 : 8;
        loop = (fps === 8);
        player.animations.add( key, animationList[ key ], fps, loop);
    }

};
