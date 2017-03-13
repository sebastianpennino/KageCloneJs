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
    this.body.setSize(32, 32, 0, 0);
    // Finally add the sprite to the game
    game.add.existing(this);

    // Get user-input information
    var cursors = KageClone.game.input.keyboard.createCursorKeys();
    var jumpButton = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.S);
    var attackButton = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.D);
    //var cursors.a = KageClone.game.input.keyboard.addKey(Phaser.Keyboard.A);

    this.getMovement = function() {
        var xm = 0;
        if (cursors.right.isDown) {
            xm = 1;
        } else if (cursors.left.isDown) {
            xm = -1;
        }
        var ym = 0;
        if (jumpButton.isDown || cursors.up.isDown) {
            ym = 1;
        } else if (cursors.down.isDown) {
            ym = -1;
        }
        return {
            xm: xm,
            ym: ym
        };
    };

    this.hasPressedAttack = function(){
        return attackButton.isDown;
    }

    this.getVelocity = function() {
        return {
            xv: this.body.velocity.x,
            yv: this.body.velocity.y
        };
    };
    // Register states
    registerStates( this );
};

// Inherit from Sprite
NinjaPlayer.prototype = Object.create(Phaser.Sprite.prototype);
NinjaPlayer.prototype.constructor = NinjaPlayer;

//  Automatically called by World.update
NinjaPlayer.prototype.update = function() {
    'use strict';
    //  Collide the this with the platforms
    KageClone.game.physics.arcade.collide(this, KageClone.game.blockedLayer);

    var onGround = function onGround() {
        //return this.body.touching.down || this.body.onFloor();
        this.inTheFloor   = this.body.touching.down || this.body.blocked.down;
        return this.inTheFloor;
    };

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
            var nowGrounded = this.body.touching.down || this.body.blocked.down;
            var wasDown = fsm.is( 'crouching' );
            var nowDown = ym < 0;
            var jumpPressed = ym > 0;
            var wasAttacking = fsm.is('airAttackEvent') || fsm.is('grnAttackEvent');
            var isPressingAttack = this.hasPressedAttack();
            var self = this;
            /*
            var releasedJump = true; // was state.releasedJump...see how can we detect that
            if (!releasedJump && !jumpPressed) {
                releasedJump = true;
            }
            */
            if (nowGrounded && !wasGrounded) {
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
            if (xm) {
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
            if (ym > 0 && nowGrounded){
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
                    fsm.airAttackEvent( self );
                }
            }
            if( fsm.is( 'neutral' ) ){
                // Correct minimal out of focus effect
                this.body.x = Math.round(this.body.x);
            }
            break;

        case 'experimental':
            // Try new stuff here
            break;

        default:
            //default code block
    }

};

