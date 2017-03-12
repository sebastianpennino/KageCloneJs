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
    this.anchor.setTo(0.5, 1);
    // Physics enabled
    game.physics.arcade.enable(this);
    //KageClone.game.physics.enable(this, Phaser.Physics.ARCADE);
    // Modes of control
    //this.controlMode = 'experimental';
    //this.controlMode = 'state-based';
    this.controlMode = 'fsmold';

    // Register animations
    registerAnimations( this );

    // Will hold the current weapon name
    this.currentWeapon = {
        display : 'BareHanded'
    };

    // Physics properties of the player
    this.spd                     = 60; // v sub x
    this.jump_height_max         = 64; // h.   3.5 blocks
    this.jump_distance_max       = 32; // (x sub h) * 2.   4.5 blocks
    this.jump_distance_to_peak   = this.jump_distance_max / 2; // x sub h
    this.jump_time_to_peak       = this.jump_distance_to_peak / this.spd; // t sub h (shouldn't be needed)
    this.jspd                    = (2*this.jump_height_max) / this.jump_time_to_peak;
    this.grav                    = (2 * this.jump_height_max * Math.pow( this.spd, 2)) / Math.pow(this.jump_distance_to_peak, 2); // g.
    this.frictionX               = 0.7;
    this.airFrictionX            = 0.8;
    this.body.gravity.y          = this.grav;
    this.body.collideWorldBounds = true;
    // Physics body size
    this.body.setSize(32, 32, 0, 0);
    // Finally add the sprite to the game
    game.add.existing(this);

    window.recordx = 0;
    window.recordy = 0;

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

    if(this.controlMode === 'fsm'){
        this.sm = new StateMachine('standing');
        // Register states
        this.sm.addStates( setPlayerStates( this ) ); 
    } else if(this.controlMode === 'fsmold'){
        //this.sm = new StateMachine('neutral');
        // Register states
        registerStates( this );
    }
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
        case 'fsm':
            // Apply friction
            this.body.velocity.x = this.body.velocity.x * this.frictionX;

            var body = this.body,
                sm = this.sm;

            var state = this.state = {};

            var mov = this.getMovement(),
                xm = mov.xm,
                ym = mov.ym;

            var vel = this.getVelocity(),
                xv = vel.xv,
                yv = vel.yv;

            var wasGrounded = state.grounded;
            state.grounded = this.body.touching.down || this.body.blocked.down;

            var wasDown = state.down;
            state.down = ym < 0;

            var jumpPressed = ym > 0;

            if (!state.releasedJump && !jumpPressed) {
              state.releasedJump = true;
            }

            if (state.grounded && !wasGrounded) {
              sm.trigger('hitground');
            }
            if (!state.grounded && wasGrounded && !jumpPressed) {
              sm.trigger('fall');
            }
            if (xm) {
              sm.trigger('move');
            }
            if (ym > 0 && state.releasedJump) {
              state.releasedJump = false;
              sm.trigger('jump');
            }

            if (ym < 0) {
              sm.trigger('down');
            } else if (!ym && wasDown) {
              sm.trigger('mid');
            }

            if (!xm) {
              sm.trigger('stop');
            }

            if (state.grounded) {
              //this.shape.friction = 1;
            } else {
                //this.shape.friction = 0;
            }

            sm.updateState(Object.assign(this.getMovement(), this.getVelocity()));

            break;
        case 'fsmold':
            // Apply friction
            this.body.velocity.x = this.body.velocity.x * this.frictionX;

            var state = fsm.current;// Get current state from the state machine
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

            //console.log( state, xm, ym, xv, yv  );
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
                if(!fsm.is( 'crouching' )){
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
                console.log('yee')
                fsm.duckEvent();
            } else if (!ym && wasDown) {
                console.log('niie')
                fsm.standEvent();
            }
            if (!xm) {
                fsm.stopEvent();
            }

            if(!wasAttacking && isPressingAttack){
                if( nowGrounded && fsm.can('grnAttackEvent') ){
                    console.log('trigger ground attack')
                    fsm.grnAttackEvent( self );
                } else if( fsm.can('airAttackEvent') ) {
                    fsm.airAttackEvent( self );
                }
            }

            if (nowGrounded) {
              ///////////this.shape.friction = 1;
            } else {
              ///////////this.shape.friction = 0;
            }

            //sm.updateState(Object.assign(this.getMovement(), this.getVelocity()));

            break;
        case 'experimental':
            // Apply friction
            this.body.velocity.x = this.body.velocity.x * this.frictionX;
            // Check if is on the ground/air
            this.inTheFloor   = this.body.touching.down || this.body.blocked.down;
            this.forms.medium = this.inTheFloor ? 'ground' : 'aereal';
            // Check what is pressed
            var preseedLeft    = cursors.left.isDown;
            var preseedRight   = cursors.right.isDown;
            var pressedJump    = cursors.up.isDown || cursors.s.isDown;
            var pressedCrouch  = cursors.down.isDown;
            var pressedAttack  = cursors.d.isDown;
            var releasedAttack = cursors.d.isUp;

            // STEP 1: FACING ANIMATION (LEFT/RIGHT)
            if(!this.isPerformingAttack){
                if( preseedRight ){
                    this.scale.setTo(1,1);
                } else if( preseedLeft ) {
                    this.scale.setTo(-1,1);
                } else {
                    this.forms.action = 'still';
                    //this.body.setSize(32, 32, 0, 0);
                    //this.animations.stop();
                }
            }
            // STEP 2: CROUCH STATE
            if( pressedCrouch ){
                this.forms.action = 'still';
                this.forms.medium = 'crouch';
            }
            // STEP 3: MOVEMENT (MOVEMENT/STILL) (Logical XOR)
            if( ( preseedLeft || preseedRight ) && !( preseedLeft && preseedRight ) && !pressedCrouch ){
                //this.body.setSize(24, 32, 0, 0);
                if(this.inTheFloor){ // Ground control
                    if(!this.isPerformingAttack){
                        this.body.velocity.x += this.scale.x * this.spd;
                    }
                } else { // Air control (air friction)
                    this.body.velocity.x += this.scale.x * this.spd * this.airFrictionX;
                }
                this.forms.action = 'movin';
                this.animationStateHandler();
            }
            // STEP 4: JUMP
            if( pressedJump && !pressedCrouch ){
                if(this.inTheFloor){
                    this.body.velocity.y -= this.jspd;
                } else {
                    //this.animations.stop();
                    this.animationStateHandler();
                }
            }
            // STEP 5: ATTACK
            if( pressedAttack && !this.isPerformingAttack){
                this.forms.mode = 'attack';
                this.animationStateHandler(true);

                if(!this.isPerformingAttack && this.inTheFloor){
                    if( ( preseedLeft || preseedRight ) && !( preseedLeft && preseedRight ) ){
                        this.body.velocity.x = this.body.velocity.x * this.frictionX; // des-accelerate
                    }
                    this.attackTimer        = KageClone.game.time.now;
                    this.isPerformingAttack = true;
                }
                if(!this.isPerformingAttack && !this.inTheFloor){
                    this.body.velocity.x = this.body.velocity.x * this.airFrictionX; // des-accelerate
                    this.isPerformingAttack = true;
                }
            } else {
                this.forms.mode = 'calmed';
                this.animationStateHandler();
            }
            // STEP 6: UNLOCK THE ATTACK BUTTON // (KageClone.game.time.now - this.attackTimer > 600)
            if( (this.isPerformingAttack && releasedAttack) ){
                this.isPerformingAttack = false;
            }

            break;
        default:
            //default code block
    }

};

var registerStates = function( player ){
    'use strict';
    var animations = player.animations;

    player.sm = StateMachine.create({
        initial: 'neutral',
        error: function(eventName, from, to, args, errorCode, errorMessage, originalException) {
            //return 'event ' + eventName + ' was naughty :- ' + errorMessage;
            //console.log('.');
        },
        events: [
            {name: 'moveEvent', from: 'neutral', to: 'running'},
            {name: 'stopEvent', from: 'running', to: 'neutral'},
            {name: 'duckEvent', from: ['neutral', 'running'], to: 'crouching'},
            {name: 'standEvent', from: 'crouching', to: 'neutral'},
            {name: 'jumpEvent', from: ['neutral', 'running'], to: 'jumping'},
            {name: 'airAttackEvent', from: ['jumping', 'falling'], to: 'airAttack'},
            {name: 'grnAttackEvent', from: ['neutral', 'running', 'crouching'], to: 'grnAttack'},
            {name: 'returnToCalmEvent', from: ['grnAttack'], to: 'neutral'},
            {name: 'returnToCalmEvent', from: ['airAttack'], to: 'falling'},
            {name: 'fallEvent', from: ['neutral', 'running','jumping'], to: 'falling'},
            {name: 'hitGroundEvent', from: 'falling', to: 'neutral'}
        ],
        callbacks : {
            onenterneutral: function(event, from, to, msg) { 
                //console.log('entered neutral state! ' + msg); 
                animations.stop();
                animations.frame = 0;
            },
            onleaveneutral: function(event, from, to, msg) { console.log('leaving neutral state! ' + msg); },
            onenterjumping: function(event, from, to, player){
                console.log('->');
                animations.play( 'ninja-hayate-movin-ground-attack', null, false, false )
                player.body.velocity.y -= player.jspd;
            },
            onrunning: function(event, from, to, isInFloor){
                //player.body.velocity.x += player.scale.x * player.spd;
                animations.play('ninja-hayate-movin-ground-calmed');
            },
            onentergrnAttack: function(event, from, to){
                // Play ground attack animation
                animations
                    .play( 'ninja-hayate-movin-ground-attack', null, false, false )
                    .onComplete.add(function () {  
                        console.log('animation complete');
                        player.sm.returnToCalmEvent();
                        //player.sm.transition();
                    }, player);
                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            },
            onenterairAttackEvent: function(event, from, to, player){
                // Play air attack animation
                // trigger transition
                //fsm.transition();
                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            },
            oncrouching: function(){
                console.log('duck!')
                animations.frame = 4;
            },

            /*
            onleavegame: function() {
                // replace 196 with "on complete" animation attack:
                $('#game').slideUp('slow', function() {
                    // trigger transition
                    fsm.transition();
                };
                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            }
            */
        }
    });
};

var registerAnimations = function( player ){
    'use strict';

    player.animations.add(
        'ninja-hayate-movin-ground-calmed',
        Phaser.Animation.generateFrameNames('ground_run_', 1, 3),
        8, true);

    player.animations.add(
        'ninja-hayate-still-ground-calmed',
        Phaser.Animation.generateFrameNames('ground_still'),
        8, false);

    player.animations.add(
        'ninja-hayate-still-ground-attack',
        Phaser.Animation.generateFrameNames('ground_at_', 1, 3),
        8, false);

    player.animations.add(
        'ninja-hayate-movin-ground-attack',
        Phaser.Animation.generateFrameNames('ground_at_', 1, 3),
        8, false);

    player.animations.add(
        'ninja-hayate-still-crouch-calmed',
        Phaser.Animation.generateFrameNames('duck_still'),
        8, false);

    player.animations.add(
        'ninja-hayate-still-crouch-attack',
        Phaser.Animation.generateFrameNames('duck_at_', 1, 3),
        8, false);

    player.animations.add(
        'ninja-hayate-movin-aereal-calmed',
        Phaser.Animation.generateFrameNames('jump'),
        1, false);

    player.animations.add(
        'ninja-hayate-still-aereal-calmed',
        Phaser.Animation.generateFrameNames('jump'),
        1, false);

    player.animations.add(
        'ninja-hayate-movin-aereal-attack',
        Phaser.Animation.generateFrameNames('jump_at_', 1, 3),
        8, false);

    player.animations.add(
        'ninja-hayate-still-aereal-attack',
        Phaser.Animation.generateFrameNames('jump_at_', 1, 3),
        8, false);
};


NinjaPlayer.prototype.preload = function() {
    'use strict';

    KageClone.game.load.atlas('hayate', 'assets/images/hayate/hayate.png', 'assets/images/hayate/hayate_hash.json',Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
};
