/**
 * NinjaPlayer Class
 * Creates a new NinjaPlayer
 * @param {Object} game - a Phaser.game reference
 * @param {Phaser.Point} startPoint - starting location of the player
 * @constructor
 */
NinjaPlayer = function NinjaPlayer(game, startPoint) {
    "use strict";
    // We call the Phaser.Sprite passing in the game reference
    Phaser.Sprite.call(this, game, startPoint.x, startPoint.y, 'hayate');
    // Center the anchor at the half of the sprite
    this.anchor.setTo(0.5, 1);
    // Physics enabled
    game.physics.arcade.enable(this);
    // Modes of control
    this.controlMode = 'experimental';
    //this.controlMode = 'state-based';

    /** Will change current texture */
    var cached_sprite = '';
    this.switchSprite = function( newSprite ){
        if(newSprite != cached_sprite){
            this.loadTexture(newSprite, 0);
            cached_sprite = newSprite;
        }
        return this;
    };

    /** Will update the forms.result with all the states of the player */
    this.updateForm = function( separator ){
        var z = separator || '-';
        this.forms.result = this.forms.character + z + this.forms.action + z + this.forms.medium + z + this.forms.mode;
        return this;
    };

    // Register animations
    registerAnimations( this );

    /*
    var animationQueue = [];
    var cached_state = '';
    this.animationStateHandler = function( wait, newAnim ){
        this.updateForm();
        var anim = newAnim || this.forms.result; // idle-long ; falling ;
        var t = KageClone.game.time.now;

        if(cached_state !== anim){
            console.log('@'+t+' for: '+anim);
        }
        
        if(animationQueue.length === 0 && !wait){
            if(cached_state !== anim){
                // 1- Load new texture
                this.switchSprite( anim );
                // 2- Kick the animation
                this.animations.play( 'ninja-'+anim );
                //play(name, frameRate, loop, killOnComplete)
                //(name, frames, frameRate, loop, useNumericIndex) ???

                // 3- Update cache_state
                cached_state = this.forms.result;
            }
        } else {
            if(cached_state !== anim){
                // Add current animation to the Queue
                animationQueue.push( anim );
            } else {
                // something
                return;
            }
            // Play first animation in the Queue
            // Once finish, 
            // 1- remove it from the array
            // 2- Update cache_state
            cached_state = this.forms.result;
            // 3- Call this function recursively
        }

        //sprite.animations.currentAnim.onComplete.add(function () {  console.log('animation complete');}, this);
        //player.events.onAnimationComplete.add(function(){         console.log("complete")     }, this);
        /// sprite.animations.currentAnim.name returns the name of the current animation
    };
    */
    var cached_anim_name = '';
    this.hold = false;
    this.animationStateHandler = function( wait, newAnim ){
        this.updateForm();
        var anim = newAnim || this.forms.result; // idle-long ; falling ;
        var t = KageClone.game.time.now;

        if(cached_anim_name !== anim){
            //console.log('@'+t+' for: '+anim);
        }
        
        if(!this.hold){
            if(cached_anim_name !== anim){
                // 1- Load new texture
                this.switchSprite( anim );
                // 2- Kick the animation
                if(wait && !this.hold){
                    this.hold = true;
                    // Blocking animation
                    this
                        .animations.play( 'ninja-'+anim, null, false, false )
                        .onComplete.add(function () {
                            this.hold = false;
                            //console.log('@'+t+' animation complete');
                        }, this);
                    //play(name, frameRate, loop, killOnComplete)
                } else {
                    // standard non-blocking animation
                    this.animations.play( 'ninja-'+anim );
                }
                // 3- Update cache_state
                cached_anim_name = this.forms.result;
            }
        }
        //sprite.animations.currentAnim.onComplete.add(function () {  console.log('animation complete');}, this);
        //player.events.onAnimationComplete.add(function(){         console.log("complete")     }, this);
        /// sprite.animations.currentAnim.name returns the name of the current animation
    };

    // Will hold the state of the current player ie: 'hayate-still-aerial-attack'
    this.forms = {
        character : "hayate",  // hayate || kaede
        direction : "",        // left   || right
        action    : "",        // still  || movin
        medium    : "",        // ground || aereal || crouch
        mode      : ""         // calmed || attack
    };
    // Will hold the current weapon name
    this.currentWeapon = {
        display : 'BareHanded'
    }

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
    this.body.setSize(48, 48, 0, 0);
    // Finally add the sprite to the game
    game.add.existing(this);

    window.recordx = 0;
    window.recordy = 0;
};

// Inherit from Sprite
NinjaPlayer.prototype = Object.create(Phaser.Sprite.prototype);
NinjaPlayer.prototype.constructor = NinjaPlayer;

var lock = false;

//  Automatically called by World.update
NinjaPlayer.prototype.update = function() {
    "use strict";
    //  Collide the this with the platforms
    KageClone.game.physics.arcade.collide(this, KageClone.game.blockedLayer);
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

    switch(this.controlMode) {
        case 'experimental':

            // STEP 1: FACING ANIMATION (LEFT/RIGHT)
            if(!this.isPerformingAttack){
                if( preseedRight ){
                    this.scale.setTo(1,1);
                } else if( preseedLeft ) {
                    this.scale.setTo(-1,1);
                } else {
                    this.forms.action = 'still';
                    this.body.setSize(32, 32, 0, 0);
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

    if( this.body.velocity.x > window.recordx) { window.recordx = this.body.velocity.x };
    if( this.body.velocity.y > window.recordy) { window.recordy = this.body.velocity.y };
};

var registerAnimations = function( player ){
    // New state-based-animations
    player.animations.add('ninja-hayate-movin-aereal-attack', [1,2,3], 8, true)
    player.animations.add('ninja-hayate-movin-aereal-calmed', [0], 1, false);
    player.animations.add('ninja-hayate-movin-ground-attack', [1,2,3], 8, true)
    player.animations.add('ninja-hayate-movin-ground-calmed', [1,2,3,4], 8, true);
    player.animations.add('ninja-hayate-still-aereal-attack', [1,2,3], 8, true);
    player.animations.add('ninja-hayate-still-aereal-calmed', [0], 1, false);
    player.animations.add('ninja-hayate-still-ground-attack', [1,2,3], 8, true)
    player.animations.add('ninja-hayate-still-ground-calmed', [0], 1, false);
    player.animations.add('ninja-hayate-still-crouch-calmed', [0], 1, false);
    player.animations.add('ninja-hayate-still-crouch-attack', [1,2,3], 8, true)
    // Specials
    player.animations.add('ninja-hayate-special-idle', [0], 8, true);
    player.animations.add('ninja-hayate-special-die', [0], 8, true);
};
