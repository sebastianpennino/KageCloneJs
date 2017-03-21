var marker;

/**
 * NinjaPlayer Class
 * Creates a new NinjaPlayer
 * @param {Object} game - a Phaser.game reference
 * @param {Phaser.Point} startPoint - starting location of the player
 * @constructor
 */
NinjaPlayer = function NinjaPlayer(game, startPoint) {
    'use strict';
    // We call the Phaser.Sprite passing in the game reference
    Phaser.Sprite.call(this, game, startPoint.x, startPoint.y, 'hayate');
    // Center the anchor at the half of the sprite
    this.anchor.setTo(0.5, 0.5);
    // Physics enabled
    KageClone.game.physics.enable(this, Phaser.Physics.ARCADE);
    // Modes of control
    this.controlMode = 'fsmold';
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
    // Applu gravity and check collisions with world bounds
    this.body.gravity.y          = this.grav;
    this.body.collideWorldBounds = true;
    // Physics body size
    this.body.setSize(24, 32, 8, 8);
    // Finally add the sprite to the game
    game.add.existing(this);

    // Get user-input information
    var cursors = KageClone.game.input.keyboard.createCursorKeys();
    var jumpButton = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.S);
    var attackButton = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.D);
    //var cursors.a = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.A);
    this.wasPressingAttack = false;
    this.wasPressingJump = false;

    /*
    this.setBodySize = function( mode ){
        switch (mode) {
            case 'jump':
                this.body.setSize(24, 32, 8, 0);
                break;
            default:
                this.body.setSize(24, 32, 8, 8);
                break;
        }
    }
    */

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
    // Register states
    registerStates( this );

    // Grappling Hitbox
    var gpx = this.gHitBox = game.make.sprite(-12, -20, 'pix');
    gpx.width = 24;
    gpx.height = 8;
    gpx.alpha = 0.5;
    gpx.tint = "0xFFFF00"; // Yellowish
    gpx.enableBody = true;
    gpx.physicsBodyType = Phaser.Physics.ARCADE;

    this.addChild( gpx );

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
    apx.alpha = 0.5;
    apx.tint = "0xFF0000"; // Red-ish
    //apx.enableBody = true;
    //apx.physicsBodyType = Phaser.Physics.ARCADE;

    this.addChild( apx );


    marker = game.add.graphics();
    marker.lineStyle(2, 0xffffff, 1);
    marker.drawRect(0, 0, 8, 8);
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


function getTileProperties( layer, xcoord, ycoord ) {
    var x = layer.getTileX( xcoord );
    var y = layer.getTileY( ycoord );
    var y2 = layer.getTileY( ycoord + 8 );
    marker.x = x * 8;
    marker.y = y * 8;
    
    var tile = KageClone.game.map.getTile(x, y, layer);
    var tile2 = KageClone.game.map.getTile(x, y2, layer);

    if( tile && tile.properties ){
        // Note: JSON.stringify will convert the object tile properties to a string
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

//  Automatically called by World.update
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

    switch(this.controlMode) {
        case 'fsmold':
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

            // IT KINDA WORKS
            /*
            if(nowCeiled && ym > 0){
                fsm.testEvent({'dir':'up', 'player':this});
            } else if(nowGrounded && ym < 0){
                fsm.testEvent({'dir':'down', 'player':this});
            }
            */
            //KageClone.game.physics.arcade.overlap(self, KageClone.game.grapplingLimitsLayer, collisionHandler, null, this);

            // Check collision for grappling
            //var nowCeiled = (this['gHitBox'].body.blocked.up);
            //console.log(this['gHitBox'].body)
            
            if(nowCeiled){
                var isGrappable = getTileProperties( KageClone.game.blockedLayer, Math.ceil(this.world.x), Math.floor(this.world.y - 24) );
                if(isGrappable){
                    fsm.hookEvent();
                    this.grappling = true;
                }
            }
/*
            if(nowCeiled){
                //http://www.html5gamedevs.com/topic/19311-detecting-the-collision-side/
                //https://phaser.io/examples/v2/arcade-physics/custom-sprite-vs-group --->
                // game.physics.arcade.overlap(sprite, group, collisionHandler, null, this);
                fsm.hookEvent();
                this.grappling = true;
            }
*/
            if( !this.grappling ){

                if (nowGrounded && !wasGrounded || nowGrounded && fsm.is( 'falling' )) {
                    fsm.hitGroundEvent();
                }
                /*
                if (!nowGrounded && wasGrounded && !jumpPressed) {
                    fsm.fallEvent();
                }
                */
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
                /*
                if (ym > 0 && releasedJump && nowGrounded) {
                    releasedJump = false;
                    fsm.jumpEvent();
                }
                */
                if (ym > 0 && !wasJumping && nowGrounded){
                    fsm.jumpEvent( self );
                } else if(!nowGrounded){
                    fsm.fallEvent();
                }
                if (ym < 0) {
                    fsm.duckEvent();
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
                if (jumpPressed && (fsm.is( 'grapplingStill' ) || fsm.is( 'grapplingMove' )) ){
                    fsm.releaseGrapEvent();
                }
                if(!wasAttacking && isPressingAttack){
                    fsm.grapAttackEvent( self );
                }
                /*
                Needs adjustment of ym > 0
                if(ym > 0 && !isPressingAttack && fsm.is( 'grapplingStill' ) ){
                    fsm.climbUpEvent( {'dir':'up', 'player':self} );
                }
                */
            }
            if( fsm.is( 'neutral' ) || fsm.is('grapplingStill') ){
                // Correct minimal out-of-focus effect (pixel approximation)
                this.body.x = Math.round(this.body.x);
            }
            // Update values for next frame
            this.wasPressingAttack = this.hasPressedAttack();
            this.wasPressingJump = this.hasPressedJump();
            break;

        case 'experimental':
            // Try new stuff here
            break;

        default:
            //default code block
    }

};

 
