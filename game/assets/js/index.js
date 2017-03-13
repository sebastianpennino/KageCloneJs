var Phaser  = Phaser  || {};
var KageClone = KageClone || {};
KageClone.version = "0.0.2a";
KageClone.shouldDebug = false;
KageClone.getVersion = function () {
    "use strict";
    return this.version;
};

// Will store some public vars for debugging
var dbug = {}

function preload() {
    "use strict";
    //KageClone.game.load.tilemap('initial-level', 'assets/levels/level_boat.json', null, Phaser.Tilemap.TILED_JSON);
    KageClone.game.load.tilemap('initial-level', 'assets/levels/level_boat_v2.json', null, Phaser.Tilemap.TILED_JSON);
    //KageClone.game.load.image('gameTiles', 'assets/images/32x32_tileset.jpg');
    //KageClone.game.load.image('gameTiles', 'assets/images/tilesets/kage_level_1_8x8.jpg');
    //KageClone.game.load.image('gameBkg', 'assets/images/tilesets/kage_level_1_16x16.jpg');
    KageClone.game.load.image('8x8_blank', 'assets/images/tilesets/8x8_blank.png');
    KageClone.game.load.image('plan', 'assets/images/kage_level_1_plan.png');


    KageClone.game.load.image('pauseMenu', 'assets/images/pause_menu_back.jpg');
    KageClone.game.load.image('selectMenu', 'assets/images/pause_menu_select.png');
    KageClone.game.load.image('blackout', 'assets/images/black.png');
    KageClone.game.load.image('hudback', 'assets/images/hud_bkg.png');
    KageClone.game.load.image('hpx', 'assets/images/health_pixel.jpg');
    // Hayate Atlas
    KageClone.game.load.atlas('hayate', 'assets/images/hayate/hayate.png', 'assets/images/hayate/hayate_hash.json',Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
};

var ninja, cursors;
var debugKey, pauseKey, pause_label, pause_legend;
var backgroundGroup;

function create() {
    "use strict";
    KageClone.game.physics.startSystem( Phaser.Physics.ARCADE );
    //KageClone.game.physics.arcade.TILE_BIAS = 40;

    backgroundGroup = KageClone.game.add.group();
    //KageClone.game.world.setBounds(0, 0, 3000, 300);
    //KageClone.game.stage.backgroundColor = '#337799';
    KageClone.game.stage.backgroundColor = '#CCCCCC';

    var startLoc = new Phaser.Point(32, 32);  // was 320, 2400
    ninja = new NinjaPlayer( KageClone.game, startLoc );
    window.ninja = ninja;
    // The score
    //scoreText = KageClone.game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#fff' });
    // Our controls
    cursors = KageClone.game.input.keyboard.createCursorKeys();
    cursors.s = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.S);
    cursors.d = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.D);
    cursors.a = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.A);

    // Make the camara follow the player (for now)
    //KageClone.game.camera.follow( ninja, Phaser.Camera.FOLLOW_PLATFORMER, 0.9, 0.5);
    KageClone.game.camera.follow( ninja, Phaser.Camera.FOLLOW_PLATFORMER, 0.9, 0.6);
    //KageClone.game.camera.deadzone = new Phaser.Rectangle(400/2, 224/2, 25, 25);

    KageClone.game.map = KageClone.game.add.tilemap('initial-level');
    //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
    //KageClone.game.map.addTilesetImage('32x32_tileset', 'gameTiles');
    //KageClone.game.map.addTilesetImage('kage_level_1_8x8', 'gameTiles');
    //KageClone.game.map.addTilesetImage('kage_level_1_16x16', 'gameBkg');
    //// FUTURE PARALLAX http://www.html5gamedevs.com/topic/11025-parallax-background-with-tileset-image-layer/
    KageClone.game.add.tileSprite(0, 0, 2176, 240, 'plan', null, backgroundGroup);
    KageClone.game.map.addTilesetImage('8x8_blank', '8x8_blank');
    //KageClone.game.map.addTilesetImage('plan', 'plan');
    //create layer
    //KageClone.game.back = KageClone.game.map.createLayer('background');
    KageClone.game.blockedLayer = KageClone.game.map.createLayer('blockedLayer');
    //KageClone.game.gameBkg = KageClone.game.map.createLayer('gameBkg');
    KageClone.game.blockedLayer.scale.set(1);
    //KageClone.game.gameBkg.scale.set(1);
    //collision on blockedLayer
    KageClone.game.map.setCollisionBetween(1, 2000, true, 'blockedLayer');
    //  This will set Tile ID 4 (red blocks) to call the hitDestroy function when collided with
    KageClone.game.map.setTileIndexCallback(4, hitDestroy, this);
    KageClone.game.blockedLayer.resizeWorld();
    //KageClone.game.gameBkg.resizeWorld();
    // Added debug on pressing 'O'
    debugKey = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.O);
    debugKey.onDown.add(toggleDebug);
    // Pause on pressing 'P'
    pauseKey = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.P);
    pauseKey.onDown.add(togglePauseMenu);

    var hud = new HUD(KageClone.game, {x:0, y:0}, 'hudback');
    hud.setHealth(50);
    hud.setState(0);

    KageClone.game.time.advancedTiming = true;
    KageClone.game.time.desiredFps = 60;
    //KageClone.game.time.slowMotion = 10;

    // Stretch to fill
    // KageClone.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
    // Keep original size
    // KageClone.game.scale.fullScreenScaleMode = Phaser.ScaleManager.NO_SCALE;
    // Maintain aspect ratio
    KageClone.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    KageClone.game.input.onDown.add(goFullScreen, this);
};

function hitDestroy(sprite, tile) {
    "use strict";
    tile.alpha = 0.2;
    tile.ninjaDestroyed = true;
    KageClone.game.blockedLayer.dirty = true;
    return false;
};
var darkScreen;
var pauseMenu;

function togglePauseMenu() {
    "use strict";
    var camHorCenter  = KageClone.game.camera.view.width/2 + KageClone.game.camera.view.x;
    var camVertCenter = KageClone.game.camera.view.height/2 + KageClone.game.camera.view.y;
    var block;
    if(!KageClone.game.paused){
        // Pause
        KageClone.game.paused = true;
        // Create the darkscreen, scale it to fit the width of the game (the original sprite is 32x32 in size)
        darkScreen = KageClone.game.add.group();
        block      = darkScreen.create(KageClone.game.camera.view.x, KageClone.game.camera.view.y, 'blackout');
        block.scale.setTo(KageClone.game.camera.view.width/32, KageClone.game.camera.view.height/32);
        block.alpha = 0.8;
        // Create a pause text in the center of the screen
        pause_label = KageClone.game.add.text(camHorCenter, camVertCenter, 'Pause', { font: '24px Arial', fill: '#fff' });
        pause_label.anchor.setTo(0.5, 0.5);
        pause_legend = KageClone.game.add.text(camHorCenter, camVertCenter+32, 'Press Enter to select a weapon', { font: '12px Arial', fill: '#fff', align: 'right' });
        pause_legend.anchor.setTo(0.5, 0.5);
        // Create a new menu at x-144 y+48 using pauseMenu asset
        pauseMenu = new PauseMenu(KageClone.game, {x:camHorCenter-144, y:camVertCenter+48}, 'pauseMenu', {xpos:0, ypos:0});
        pauseMenu.addSprite(0, 0, 'selectMenu', true);
        pauseMenu.fillWeapons([
            { display:'BareHanded'      },
            { display:'Desert Eagle'    },
            { display:'Machinegun'      },
            { display:'Phaser Cannon'   },
            { display:'Mega Ray Gun'    },
            { display:'Homming Missiles'}
        ]);
        // Register menu keyboard bindings
        KageClone.game.input.keyboard.addKey(Phaser.Keyboard.DOWN) .onDown.add(PauseMenu.prototype.moveDown , pauseMenu);
        KageClone.game.input.keyboard.addKey(Phaser.Keyboard.UP)   .onDown.add(PauseMenu.prototype.moveUp   , pauseMenu);
        KageClone.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(PauseMenu.prototype.moveRight, pauseMenu);
        KageClone.game.input.keyboard.addKey(Phaser.Keyboard.LEFT) .onDown.add(PauseMenu.prototype.moveLeft , pauseMenu);
        KageClone.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(PauseMenu.prototype.announceSelection , pauseMenu);

    } else {
        // Un-pause and clean up pause stuff
        KageClone.game.paused = false;
        pause_label.destroy();
        pause_legend.destroy();
        darkScreen.destroy();
        pauseMenu.destroy();
        // Remove menu keyboard bindings
        KageClone.game.input.keyboard.removeKey( Phaser.Keyboard.DOWN  );
        KageClone.game.input.keyboard.removeKey( Phaser.Keyboard.UP    );
        KageClone.game.input.keyboard.removeKey( Phaser.Keyboard.RIGHT );
        KageClone.game.input.keyboard.removeKey( Phaser.Keyboard.LEFT  );
        KageClone.game.input.keyboard.removeKey( Phaser.Keyboard.ENTER );
        // Re-add standard bindings
        cursors = KageClone.game.input.keyboard.createCursorKeys();
        cursors.s = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.S);
        cursors.d = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.D);
        cursors.a = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.A);
    }
};

function update() {
    "use strict";
};

function goFullScreen() {
    if (KageClone.game.scale.isFullScreen) {
        KageClone.game.scale.stopFullScreen();
    } else {
        KageClone.game.scale.startFullScreen(false);
    }
};

function render() {
    "use strict";
    KageClone.game.blockedLayer.debug = KageClone.shouldDebug;
    var myFont = {
        desc : '9px Arial',
        color : '#FFFFFF'
    }
    var xoffset = 10;
    if(!KageClone.shouldDebug){
        KageClone.game.debug.text('(P) to toggle pause', xoffset, 64, myFont.color, myFont.desc );
        KageClone.game.debug.text('(O) to toggle debug (needs movement for the bounding boxes to appear)', xoffset, 84, myFont.color, myFont.desc);
    } else{ 
        //KageClone.game.debug.cameraInfo(KageClone.game.camera, 32, 160);
        //console.log(ninja)
        KageClone.game.debug.text('FSM: '+dbug.state, xoffset, KageClone.game.camera.view.height/2, '#FF0000', '15px Arial');
        KageClone.game.debug.bodyInfo(ninja, xoffset, 22);
        //KageClone.game.debug.text('Weapon: '+ninja.currentWeapon.display, xoffset, 544);
        KageClone.game.debug.text('render FPS: ' + (KageClone.game.time.fps || '--') , 325, 14, "#00ff00");
        if (KageClone.game.time.suggestedFps !== null){
            KageClone.game.debug.text('suggested FPS: ' + KageClone.game.time.suggestedFps, 325, 28, "#00ff00");
            KageClone.game.debug.text('desired FPS: ' + KageClone.game.time.desiredFps, 325, 42, "#00ff00");
        }
        KageClone.game.debug.text('Speed: '+ ninja.spd , xoffset, 165, myFont.color, myFont.desc);
        KageClone.game.debug.text('Jump Speed: '+ ninja.jspd , xoffset, 175, myFont.color, myFont.desc);
        KageClone.game.debug.text('Jump Distance: '+ ninja.jump_distance_max, xoffset, 185, myFont.color, myFont.desc);
        KageClone.game.debug.text('Jump Height Max: '+ ninja.jump_height_max, xoffset, 195, myFont.color, myFont.desc);
        KageClone.game.debug.text('Gravity: '+ ninja.body.gravity.y, xoffset, 205, myFont.color, myFont.desc);
        KageClone.game.debug.text('Ground Friction: '+ ninja.frictionX, xoffset, 215, myFont.color, myFont.desc);
        KageClone.game.debug.text('Air Friction: '+ ninja.airFrictionX, xoffset, 225, myFont.color, myFont.desc);

        KageClone.game.debug.body(ninja) 
    };

};

function toggleDebug() {
    "use strict";
    KageClone.shouldDebug = !KageClone.shouldDebug;
};
// Dev 640 x 480 ||  NES 16:9 ---> 426 x 240  || Original NES Resolution ---> 256 x 240
KageClone.game = new Phaser.Game(426, 240, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render: render });

