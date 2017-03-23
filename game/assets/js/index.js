var Phaser  = Phaser  || {};
var KageClone = KageClone || {};
KageClone.version = "0.0.2a";
KageClone.shouldDebug = false;
KageClone.getVersion = function () {
    "use strict";
    return this.version;
};
if(!KageClone.shouldDebug){
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
        //KageClone.game.scale.stopFullScreen();
    } else {
        KageClone.game.scale.startFullScreen(false);
    }
};

function render() {
    "use strict";
    KageClone.game.blockedLayer.debug = KageClone.shouldDebug;
    var myFont = {
        desc : '9px Arial',
        color : '#FFFFFF',
        color2: '#00FF00'
    };
    var xoffset = 10;
    if(!KageClone.shouldDebug){
        KageClone.game.debug.text('FSM: '+dbug.state, xoffset, KageClone.game.camera.view.height/2, '#FF0000', '15px Arial');
        KageClone.game.debug.text('[S]: jump/grapple, [D]: attack, [Up] (while grappling): climb, [Down] (while grappling): release', xoffset, 12, myFont.color, myFont.desc );
        KageClone.game.debug.text('[O]: toggle debug (needs movement for the bounding boxes to appear)', xoffset, 24, myFont.color, myFont.desc);
        KageClone.game.debug.text('TileProps: '+dbug.tileprops, xoffset, KageClone.game.camera.view.height-32,  myFont.color, myFont.desc);
        KageClone.game.debug.text('EnemyHit: '+dbug.hitEnemy, xoffset, KageClone.game.camera.view.height-16,  myFont.color, myFont.desc);
    } else{ 
        //KageClone.game.debug.cameraInfo(KageClone.game.camera, 32, 160);
        KageClone.game.debug.text('FSM: '+dbug.state, xoffset, KageClone.game.camera.view.height/2, '#FF0000', '15px Arial');
        KageClone.game.debug.bodyInfo(ninja, xoffset, 22);
        KageClone.game.debug.text('FPS: ' + (KageClone.game.time.fps || '--') , 180, 205, myFont.color2, myFont.desc);
        if (KageClone.game.time.suggestedFps !== null){
            KageClone.game.debug.text('suggested: ' + KageClone.game.time.suggestedFps, 180, 215, myFont.color2, myFont.desc);
            KageClone.game.debug.text('desired: ' + KageClone.game.time.desiredFps, 180, 225, myFont.color2, myFont.desc);
        }
        KageClone.game.debug.text('Speed: '+ ninja.spd , xoffset, 165, myFont.color, myFont.desc);
        KageClone.game.debug.text('Jump Speed: '+ ninja.jspd , xoffset, 175, myFont.color, myFont.desc);
        KageClone.game.debug.text('Jump Distance: '+ ninja.jump_distance_max, xoffset, 185, myFont.color, myFont.desc);
        KageClone.game.debug.text('Jump Height Max: '+ ninja.jump_height_max, xoffset, 195, myFont.color, myFont.desc);
        KageClone.game.debug.text('Gravity: '+ ninja.body.gravity.y, xoffset, 205, myFont.color, myFont.desc);
        KageClone.game.debug.text('Ground Friction: '+ ninja.frictionX, xoffset, 215, myFont.color, myFont.desc);
        KageClone.game.debug.text('Air Friction: '+ ninja.airFrictionX, xoffset, 225, myFont.color, myFont.desc);
        // Ninja data
        KageClone.game.debug.body(ninja);
    }
};

function toggleDebug() {
    "use strict";
    KageClone.shouldDebug = !KageClone.shouldDebug;
};

// Dev 640 x 480 ||  NES 16:9 ---> 426 x 240  || Original NES Resolution ---> 256 x 240
KageClone.game = new Phaser.Game(640, 240, Phaser.CANVAS, 'Kage', { preload: preload, create: create, update: update, render: render }, false, false );


