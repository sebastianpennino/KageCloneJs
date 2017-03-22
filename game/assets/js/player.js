var marker;
var marker2;
/**
 * NinjaPlayer Class
 * Creates a new NinjaPlayer
 * @param {Object} game - a Phaser.game reference
 * @param {Phaser.Point} startPoint - starting location of the player
 * @constructor
 * @extends {Phaser.Sprite}
 */
NinjaPlayer = function NinjaPlayer(game, startPoint) {
    'use strict';
    // We call the Phaser.Sprite passing in the game reference
    Phaser.Sprite.call(this, game, startPoint.x, startPoint.y, 'hayate');
    // Center the anchor at the half of the sprite
    this.anchor.setTo(0.5, 0.5);
    // Physics enabled
    KageClone.game.physics.enable(this, Phaser.Physics.ARCADE);
    // Register animations
    registerAnimations( this );
    // Physics properties of the player
    this.spd                     = 36; // v sub x
    this.jump_height_max         = 64; // h.
    this.jump_distance_max       = 24; // (x sub h)
    this.jump_distance_to_peak   = this.jump_distance_max / 2; // x sub h
    this.jump_time_to_peak       = this.jump_distance_to_peak / this.spd; // t sub h (shouldn't be needed)
    this.jspd                    = (2*this.jump_height_max) / this.jump_time_to_peak;
    this.grav                    = (2 * this.jump_height_max * Math.pow( this.spd, 2)) / Math.pow(this.jump_distance_to_peak, 2);
    this.frictionX               = 0.7;
    this.airFrictionX            = 0.8;
    // Apply gravity and check collisions with world bounds
    this.body.gravity.y          = this.grav;
    this.body.collideWorldBounds = true;
    // Get user-input information
    var cursors = KageClone.game.input.keyboard.createCursorKeys();
    var jumpButton = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.S);
    var attackButton = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.D);
    var specialButton = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.A);
    this.wasPressingAttack = false;
    this.wasPressingJump = false;
    this.wasPressingSpecial = false;

    this.getMovement = function() {
        var xm = 0;
        if (cursors.right.isDown) {
            xm = 1;
        } else if (cursors.left.isDown) {
            xm = -1;
        }
        var ym = 0;
        if (jumpButton.isDown || cursors.up.isDown) { //jumpButton.isDown ||
            ym = 1;
        } else if (cursors.down.isDown) {
            ym = -1;
        }
        return {
            xm: xm,
            ym: ym
        };
    };

    this.hasPressedSpecial = function(){
        return specialButton.isDown;
    };

    this.hasPressedJump = function(){
        return jumpButton.isDown;
    };

    this.hasPressedAttack = function(){
        return attackButton.isDown;
    };

    this.getVelocity = function() {
        return {
            xv: this.body.velocity.x,
            yv: this.body.velocity.y
        };
    };

    /*
    NORMAL
    var pix = game.make.sprite(4, -12, 'pix');
    pix.width = 16;
    pix.height = 20;
    pix.alpha = 0.3;
    */
    /*
    DUCK
    var pix = game.make.sprite(4, -4, 'pix');
    pix.width = 16;
    pix.height = 20;
    pix.alpha = 0.3;
    */
    // Attack Hitbox
    var apx = this.aHitBox = game.make.sprite(4, -12, 'pix');
    apx.width = 16;
    apx.height = 32;
    apx.alpha = 0.5; // was 0.5
    apx.tint = "0xFF0000"; // Red-ish
    //apx.enableBody = true;
    //apx.physicsBodyType = Phaser.Physics.ARCADE;
    this.addChild( apx );

    // Physics body size
    this.body.setSize(24, 32, 8, 8);
    // Finally add the sprite to the game
    game.add.existing(this);
    // Register states
    registerStates( this );

    marker = KageClone.game.add.graphics();
    marker.lineStyle(2, 0xffffff, 1);
    marker.drawRect(0, 0, 8, 8);
    marker2 = KageClone.game.add.graphics();
    marker2.lineStyle(2, 0x00ff00, 1);
    marker2.drawRect(0, 0, 8, 8);
};

// Inherit from Sprite
NinjaPlayer.prototype = Object.create(Phaser.Sprite.prototype);
NinjaPlayer.prototype.constructor = NinjaPlayer;

function collisionHandler (player, tile) {
    return true;
};

function processCallback(player, tile){
    //console.log(player, tile);
    if(!player.grappling){
        if(tile && tile.layer && tile.layer.name === "blockedLayer"){
            if(tile.properties.grappleOnlyCollision){
                // Don't trigger collision
                return false;
            }
        }
    }
    // Normal block
    return true;
}

function checkOverlapGrappling(playerSprite, layer, prop){
    var boundsB, 
        boundsA = playerSprite[ prop ].getBounds();
    var boundsIntersect = layer.children.some(function checkBounds( sprite ) {
            boundsB = sprite.getBounds();
            if( Phaser.Rectangle.intersects(boundsA, boundsB) ){
                sprite.kill();
                return true;
            }
        })
    return boundsIntersect;
}

function getPlatformInfo( layer, xcoord, ycoord, yAxis, xAxis ) {
    var x = layer.getTileX( Math.ceil( xcoord) );
    var y = layer.getTileY( Math.floor( ycoord + (yAxis*20) ) );
    //var y2 = layer.getTileY(Math.floor(ycoord - 28) + 8 );
    marker.x = x * 8;
    marker2.x = (x * 8) + (xAxis*-8);
    marker.y = y * 8;
    marker2.y = y * 8;
    
    var tile = KageClone.game.map.getTile(x, y, layer);

    if( tile && tile.properties ){
        dbug.tileprops = JSON.stringify( tile.properties );
        return tile.properties.grappleEnabled;
    } else {
        dbug.tileprops = '';
        return false;
    }
};

/*
function getPlatformInfo( layer, xcoord, ycoord ) {
    var x = layer.getTileX( Math.ceil(xcoord) );
    var y = layer.getTileY( Math.floor(ycoord - 24) );
    var y2 = layer.getTileY(Math.floor(ycoord - 24) + 8 );
    marker.x = x * 8;
    marker.y = y * 8;
    
    var tile = KageClone.game.map.getTile(x, y, layer);
    var tile2 = KageClone.game.map.getTile(x, y2, layer);

    if( tile && tile.properties ){
        dbug.tileprops = '(y1): '+JSON.stringify( tile.properties );
        return tile.properties.grappleEnabled;
    } else if(tile2 && tile2.properties){
        marker.y = y2 * 8;
        dbug.tileprops = '(y2): '+JSON.stringify( tile2.properties );
        return tile2.properties.grappleEnabled;
    }else {
        dbug.tileprops = '';
        return false;
    }
}
*/
function checkOverlapWhileAttacking(playerSprite, groupOfSprites, prop) {
    var boundsB, 
        boundsA = playerSprite[ prop ].getBounds(),
        boundsIntersect = groupOfSprites.children.some(function checkBounds( sprite ) {
            boundsB = sprite.getBounds();
            if( Phaser.Rectangle.intersects(boundsA, boundsB) ){
                sprite.kill();
                return true;
            }
        })
    return boundsIntersect;
}

NinjaPlayer.prototype.update = function() {
    'use strict';
    //  Collide the this with the platforms
    KageClone.game.physics.arcade.collide(this, KageClone.game.blockedLayer, collisionHandler, processCallback);
    // Check collision with enemies
    if(this.isAttacking){
        dbug.hitEnemy = checkOverlapWhileAttacking(this, enemyGroup, 'aHitBox');
    } else {
        dbug.hitEnemy = false;
    }
    var fsm = this.sm;
    // Apply friction
    this.body.velocity.x = this.body.velocity.x * this.frictionX;
    // Get current state from the state machine
    dbug.state = fsm.current;
    //fsm.is(s) - return true if state s is the current state
    //fsm.can(e) - return true if event e can be fired in the current state
    //fsm.cannot(e) - return true if event e cannot be fired in the current state
    //fsm.transitions() - return list of events that are allowed from the current state
    //fsm.states() - return list of all possible states.
    var mov = this.getMovement(),
        xm  = mov.xm, 
        ym  = mov.ym;
    var vel = this.getVelocity(),
        xv  = vel.xv,
        yv  = vel.yv;
    //console.log( fsm.current, xm, ym, xv, yv  );
    //console.log( fsm.transitions() );
    var wasGrounded = fsm.is( 'crouching' ) || fsm.is( 'neutral' ) || fsm.is( 'running' );
    var nowGrounded = (this.body.touching.down || this.body.blocked.down);
    var nowCeiled = (this.body.touching.up || this.body.blocked.up);
    var wasDown = fsm.is( 'crouching' );
    var nowDown = ym < 0;
    var wasJumping = this.wasPressingJump;
    var jumpPressed = this.hasPressedJump();
    var wasAttacking = fsm.is('airAttackEvent') || fsm.is('grnAttackEvent') || this.wasPressingAttack;
    var isPressingAttack = this.hasPressedAttack();
    var self = this;
    var grapplingMode = false;
    var isPressingUp = cursors.up.isDown;
    var isPressingSpecial = this.hasPressedSpecial();
    var wasSpecial = this.wasPressingSpecial;
    
    if(nowCeiled){
        var canGrapple = getPlatformInfo( KageClone.game.blockedLayer, this.world.x, this.world.y, -1, xm );
        if(canGrapple){
            console.log('hooking up event')
            fsm.hookEvent();
            this.grappling = true;
            // small adjust to sync 'grappling' height
            this.body.y = this.body.y + 8;
        }
    }

    if( !this.grappling ){

        if (nowGrounded && !wasGrounded || nowGrounded && fsm.is( 'falling' )) {
            fsm.hitGroundEvent();
        }
        if (!nowGrounded && wasGrounded) {
            fsm.fallEvent();
        }
        if (xm && !this.isAttacking) {
            // side facing
            this.scale.setTo(xm,1);
            if( !fsm.is( 'crouching' ) ){
                fsm.moveEvent( nowGrounded );
                this.body.velocity.x += this.scale.x * this.spd;
            }
        }
        if (jumpPressed && !wasJumping && nowGrounded){
            fsm.jumpEvent( self );
        } else if(!nowGrounded){
            fsm.fallEvent();
        }
        if (ym < 0) {
            fsm.duckEvent();
            if(isPressingSpecial && !wasSpecial){
                var canClimbDown = getPlatformInfo( KageClone.game.blockedLayer, this.world.x, this.world.y, 1, xm );
                if(canClimbDown){
                    fsm.climbDownEvent( {'dir':'down', 'player':self} );
                }
            }
        } else if (!ym && wasDown) {
            fsm.standEvent();
        }
        if (!xm) {
            fsm.stopEvent();
        }
        if(!wasAttacking && isPressingAttack){
            if( nowGrounded && fsm.can('grnAttackEvent') ){
                fsm.grnAttackEvent( self );
            } else if( fsm.can('airAttackEvent') ) {
                console.log('correct this sliding attack --->');
                fsm.airAttackEvent( self );
            }
        }
    } else {
        if (xm && !this.isAttacking) {
            // side facing
            this.scale.setTo(xm,1);
            if( fsm.is( 'grapplingStill' ) || fsm.is( 'grapplingMove' ) ){
                fsm.moveGrapEvent();
                this.body.velocity.x += this.scale.x * (this.spd/2);
            }
        }
        if (!xm) {
            fsm.stopGrapEvent();
        }             
        if (ym < 0 && (fsm.is( 'grapplingStill' ) || fsm.is( 'grapplingMove' )) ){
            fsm.releaseGrapEvent();
        }
        if(!wasAttacking && isPressingAttack){
            fsm.grapAttackEvent( self );
        }
        if(!this.wasPressingUp && isPressingUp && !isPressingAttack && fsm.is( 'grapplingStill' ) ){
            fsm.climbUpEvent( {'dir':'up', 'player':self} );
        }
    }
    if( fsm.is( 'neutral' ) || fsm.is('grapplingStill') ){
        // Correct out-of-focus effect (pixel approximation)
        this.body.x = Math.round(this.body.x);
    }
    // Update values for next frame
    this.wasPressingAttack = this.hasPressedAttack();
    this.wasPressingJump = this.hasPressedJump();
    this.wasPressingUp =  cursors.up.isDown;
    this.wasPressingSpecial = this.hasPressedSpecial();
};

 
