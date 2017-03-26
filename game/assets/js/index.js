var Phaser  = Phaser  || {};
var KageClone = KageClone || {};
KageClone.version = "0.0.3a";
KageClone.shouldDebug = false;
KageClone.getVersion = function () {
    "use strict";
    return this.version;
};
if(!KageClone.shouldDebug){
    // avoid console logs
    window.console.log = function(){};
}

// Will store some public vars for debugging
var dbug = {};

function preload() {
    "use strict";
    loadAssets( KageClone );
};

var ninja, cursors;
var debugKey, pauseKey, pause_label, pause_legend;
var backgroundGroup;
var enemyGroup;
var startLoc = new Phaser.Point( 45, 128 );

function create() {
    "use strict";
    KageClone.game.physics.startSystem( Phaser.Physics.ARCADE );
    backgroundGroup = KageClone.game.add.group();
    //KageClone.game.world.setBounds(0, 0, 3000, 300);
    KageClone.game.stage.backgroundColor = '#000000';
    ninja = new NinjaPlayer( KageClone.game, startLoc );
    window.ninja = ninja;
    // Our controls
    cursors = KageClone.game.input.keyboard.createCursorKeys();
    cursors.s = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.S);
    cursors.d = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.D);
    cursors.a = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.A);
    // Make the camara follow the player (for now)
    KageClone.game.camera.follow( ninja, Phaser.Camera.FOLLOW_PLATFORMER, 0.9, 0.6);
    KageClone.game.camera.roundPx = true;
    //KageClone.game.camera.shake(0.05, 10000, false, Phaser.Camera.SHAKE_VERTICAL, true);
    //KageClone.game.camera.deadzone = new Phaser.Rectangle(400/2, 224/2, 25, 25);
    KageClone.game.map = KageClone.game.add.tilemap('initial-level');
    //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
    //KageClone.game.map.addTilesetImage('32x32_tileset', 'gameTiles');
    //KageClone.game.map.addTilesetImage('kage_level_1_8x8', 'gameTiles');
    //KageClone.game.map.addTilesetImage('kage_level_1_16x16', 'gameBkg');
    //// FUTURE PARALLAX http://www.html5gamedevs.com/topic/11025-parallax-background-with-tileset-image-layer/
    KageClone.game.add.tileSprite(0, 2, 2176, 240, 'plan', null, backgroundGroup);
    KageClone.game.map.addTilesetImage('8x8_blank', '8x8_blank');
    //KageClone.game.map.addTilesetImage('plan', 'plan');
    //create layer
    //KageClone.game.back = KageClone.game.map.createLayer('background');
    KageClone.game.blockedLayer = KageClone.game.map.createLayer('blockedLayer');
    KageClone.game.world.sendToBack( KageClone.game.blockedLayer );
    //KageClone.game.gameBkg = KageClone.game.map.createLayer('gameBkg');
    KageClone.game.blockedLayer.scale.set(1);
    //collision on blockedLayer (block IDs 1 to 21)
    KageClone.game.map.setCollisionBetween(1, 21, true, 'blockedLayer');
    KageClone.game.blockedLayer.resizeWorld();
    // Added debug on pressing 'O'
    debugKey = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.O);
    debugKey.onDown.add(toggleDebug);
    // Pause on pressing 'P'
    pauseKey = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.P);
    pauseKey.onDown.add(togglePauseMenu);
/*
    var hud = new HUD(KageClone.game, {x:0, y:0}, 'hudback');
    hud.setHealth(50);
    hud.setState(0);
*/
    KageClone.game.time.advancedTiming = true;
    KageClone.game.time.desiredFps = 60;
    //KageClone.game.time.slowMotion = 10;

    // Stretch to fill
    //KageClone.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
    // Keep original size
    // KageClone.game.scale.fullScreenScaleMode = Phaser.ScaleManager.NO_SCALE;
    // Maintain aspect ratio
    KageClone.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    KageClone.game.input.onDown.add(goFullScreen, this);

    generateEnemies( KageClone );
};

var darkScreen;

function togglePauseMenu() {
    "use strict";
    var camHorCenter  = KageClone.game.camera.view.width/2 + KageClone.game.camera.view.x;
    var camVertCenter = KageClone.game.camera.view.height/2 + KageClone.game.camera.view.y;
    if(!KageClone.game.paused){
        // Pause
        KageClone.game.paused = true;
        // Create the darkscreen, scale it to fit the width of the game (the original sprite is 32x32 in size)
        darkScreen = KageClone.game.add.group();
        darkScreen.block      = darkScreen.create(KageClone.game.camera.view.x, KageClone.game.camera.view.y, 'blackout');
        darkScreen.block.scale.setTo(KageClone.game.camera.view.width/32, KageClone.game.camera.view.height/32);
        darkScreen.block.alpha = 0.4;
        pause_label = KageClone.game.add.text(camHorCenter, camVertCenter, 'PAUSE', { font: '13px Arial', fill: '#fff' });
        pause_label.anchor.setTo(0.5, 0.5);
    } else {
        // Un-pause
        KageClone.game.paused = false;
        pause_label.destroy();
        darkScreen.destroy();
        darkScreen.block.destroy();
    }
};

function update() {
    "use strict";
};

function goFullScreen() {
    if (KageClone.game.scale.isFullScreen) {
        //KageClone.game.scale.stopFullScreen();
    } else {
        KageClone.game.scale.startFullScreen(false);
    }
};

function render() {
    "use strict";
    var xoffset = 10;
    KageClone.game.blockedLayer.debug = KageClone.shouldDebug;
    
    if(!KageClone.shouldDebug){
        var hash1 = {
            '[D]'     : 'Attack',
            '[F]'     : 'Jump/Grapple/Climb',
            '[Arrows]': 'Move/duck',
            '[O]'     : 'toggle debug (needs movement to start)',
            '[P]'     : 'Pause the game',
        };
        KageClone.Utils.addDebugText(hash1, 8, 12, 10, '#00FFFF', '9px Arial');

        KageClone.game.debug.text('FSM: '+dbug.state, xoffset, KageClone.game.camera.view.height/2, '#FF0000', '15px Arial');
        KageClone.game.debug.text('TileProps: '+dbug.tileprops, xoffset, KageClone.game.camera.view.height-32,  '#FFFFFF', '9px Arial');
        KageClone.game.debug.text('EnemyHit: '+dbug.hitEnemy, xoffset, KageClone.game.camera.view.height-16,  '#FFFFFF', '9px Arial');
    } else{

        KageClone.game.debug.text('FSM: '+dbug.state, xoffset, KageClone.game.camera.view.height/2, '#FF0000', '15px Arial');
        var hash2 = {
            'FPS'       : KageClone.game.time.fps,
            'suggested' : KageClone.game.time.suggestedFps,
            'desired'   : KageClone.game.time.desiredFps
        };
        KageClone.Utils.addDebugText(hash2, 180, 205, 10, '#00FF00', '9px Arial');
        var hash3 = {
            'Speed'           : ninja.spd,
            'Jump Speed'      : ninja.jspd,
            'Jump Distance'   : ninja.jump_distance_max,
            'Jump Height Max' : ninja.jump_height_max,
            'Gravity'         : ninja.body.gravity.y,
            'Ground Friction' : ninja.frictionX,
            'Air Friction'    : ninja.airFrictionX
        }
        KageClone.Utils.addDebugText(hash3, 8, 165, 10, '#FFFFFF', '9px Arial');
        // Ninja data
        KageClone.game.debug.bodyInfo(ninja, xoffset, 22);
        KageClone.game.debug.body(ninja);
        // Camera data
        //KageClone.game.debug.cameraInfo(KageClone.game.camera, xoffset, 32);
    }
};

function toggleDebug() {
    "use strict";
    KageClone.shouldDebug = !KageClone.shouldDebug;
};

// Dev 640 x 480 ||  NES 16:9 ---> 426 x 240  || Original NES Resolution ---> 256 x 240
KageClone.game = new Phaser.Game(426, 240, Phaser.CANVAS, 'Kage', { preload: preload, create: create, update: update, render: render }, false, false );


