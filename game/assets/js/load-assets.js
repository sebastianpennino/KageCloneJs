/**
 * Load all required assets
 * @param {Phaser.game} KageClone - Game reference
 */
var loadAssets = function loadAssets( KageClone ){
    'use strict';
    var imageAssets, key;

    var imageAssets = {
        '8x8_blank'  : 'assets/images/tilesets/8x8_blank.png',
        'plan'       : 'assets/images/kage_level_1_plan.png',
        'pauseMenu'  : 'assets/images/pause_menu_back.jpg',
        'selectMenu' : 'assets/images/pause_menu_select.png',
        'blackout'   : 'assets/images/black.png',
        'hudback'    : 'assets/images/hud_bkg.png',
        'hpx'        : 'assets/images/health_pixel.jpg',
        'pix'        : 'assets/images/grey_pixel.jpg',
        'fakeEnemy'  : 'assets/images/enemy_placeholder.png'
    };

    // Load images
    for (key in imageAssets) {
        KageClone.game.load.image(key, imageAssets[key]);
    }
    // Boat Level
    KageClone.game.load.tilemap('initial-level', 'assets/levels/level_boat_v2.json', null, Phaser.Tilemap.TILED_JSON);
    // Atlas
    KageClone.game.load.atlas('hayate', 'assets/images/hayate/hayate.png', 'assets/images/hayate/hayate_hash.json',Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
};