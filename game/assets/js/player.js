/**
 * NinjaPlayer Class
 * Creates a new NinjaPlayer
 * @param {Object} game - a Phaser.game reference
 * @param {Phaser.Point} startPoint - starting location of the player
 * @constructor
 */
NinjaPlayer = function NinjaPlayer(game, startPoint) {
    "use strict";
    //  We call the Phaser.Sprite passing in the game reference
    Phaser.Sprite.call(this, game, startPoint.x, startPoint.y, 'hayate');
    //this.anchor.setTo(0.5, 1);

    game.physics.arcade.enable(this);
    //  player physics properties. Give the little guy a slight bounce.
    this.body.bounce.y = WORLCONFIG.BOUNCE;
    this.body.gravity.y = WORLCONFIG.GRAVITY;
    this.body.collideWorldBounds = true;
    
    this.jump = 200;
    this.jumpMulti = 6;
    this.jumpX = 0;
    this.speedX = 400;
    this.speedStart = Math.floor( ( this.speedX - (this.speedX/10) ) / 2 );
    this.inTheFloor = false;
    this.frictionX = 0.7;
    this.jumpCount = 0;
    this.jumpTimer = KageClone.game.time.now;
    this.idleTimer = 0;

    this.controlMode = 'state-based';

    var old_anim = 'hayate_floor'
    this.switchTo = function( animation ){
        if(animation != old_anim){
            this.loadTexture(animation, 0);
            old_anim = animation;
        }
    }

    var cached_sprite = '';
    this.switchSprite = function( newSprite ){
        if(newSprite != cached_sprite){
            this.loadTexture(newSprite, 0);
            cached_sprite = newSprite;
        }
        return this;
    };

    this.updateForm = function( separator ){
        var z = separator || '-';
        this.forms.result = this.forms.char + z + this.forms.action + z + this.forms.medium + z + this.forms.mode;
        return this;
    };


    var animationQueue = [];
    var cached_state = '';
    this.animationStateHandler = function( newAnim, wait ){
        this.updateForm();
        var anim = newAnim || this.forms.result; // idle-long ; falling ;
        var t = KageClone.game.time.now;
        if(cached_state !== anim){
            //console.log('@'+t+' for: '+anim);
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

    // New state-based-animations
    this.animations.add('ninja-hayate-movin-aereal-attack', [1,2,3], 8, true);
    this.animations.add('ninja-hayate-movin-aereal-calmed', [0], 8, true);
    this.animations.add('ninja-hayate-movin-ground-attack', [1,2,3], 8, true);
    this.animations.add('ninja-hayate-movin-ground-calmed', [0,1,2,3], 8, true);
    this.animations.add('ninja-hayate-still-aereal-attack', [1,2,3], 8, true);
    this.animations.add('ninja-hayate-still-aereal-calmed', [0], 8, true);
    this.animations.add('ninja-hayate-still-ground-attack', [1,2,3], 8, true);
    this.animations.add('ninja-hayate-still-ground-calmed', [0], 8, true);
    // Specials
    this.animations.add('ninja-hayate-special-idle', [0], 8, true);
    //this.animations.add('ninja-hayate-special-falling', [0], 8, true);
    this.animations.add('ninja-hayate-special-die', [0], 8, true);

    var count  = 0;
    var output = function(msg, separate) {
        count = count + (separate ? 1 : 0);
        document.getElementById('output').value = document.getElementById('output').value+ count + ": " + msg + "\n" + (separate ? "\n" : "");
    }

    this.forms = {
        char      : "hayate",  // hayate (kaede, tommy)
        direction : "",      // left   ||  right
        action    : "",      // still  ||  movin
        medium    : "",      // ground ||  aereal
        mode      : "",      // calmed ||  attack
    };

    // legacy (needed by experimental control)
    this.currentState = {};

    //this.body.maxVelocity.y = 800;
    this.body.maxVelocity.x = Math.floor(this.speedX); //800
    this.body.maxVelocity.y = Math.floor(WORLCONFIG.GRAVITY/3); //3333

    //this = this;
    this.currentWeapon = {
        display : 'BareHanded'
    }
    //this.body.setSize(76, 96, 0, 0);
    this.body.setSize(48, 48, 0, 0);
    //this.body.setSize(40, 80, 20, 15);
    // Finally add the sprite to the game
    game.add.existing(this);

    window.recordx = 0;
    window.recordy = 0;
};

NinjaPlayer.prototype = Object.create(Phaser.Sprite.prototype);
NinjaPlayer.prototype.constructor = NinjaPlayer;

    var lastPressed = {
        dir : "",
        int : 0
    };
    var jumpUnlock = false;

//  Automatically called by World.update
NinjaPlayer.prototype.update = function() {
    "use strict";
    //  Collide the this with the platforms
    KageClone.game.physics.arcade.collide(this, KageClone.game.blockedLayer);
    // set the value once 
    //
    /*
    if(this.body.height !== 32){
        console.log('once!')
        this.body.setSize(32, 32, 0, 0);
    }
    */

    switch(this.controlMode) {
        case 'state-based':

            // Apply friction
            this.body.velocity.x = this.body.velocity.x * this.frictionX;
            // Check if is on the ground/air
            this.inTheFloor   = this.body.touching.down || this.body.blocked.down;
            this.forms.medium = this.inTheFloor ? 'ground' : 'aereal';

            var preseedLeft   = cursors.left.isDown;
            var preseedRight  = cursors.right.isDown;
            var pressedJump   = cursors.up.isDown || cursors.s.isDown;
            var pressedAttack = cursors.d.isDown;

            // CASE 1: FACING ANIMATION (LEFT/RIGHT)
            if( preseedRight  ){
                this.scale.setTo(1,1);
            } else if(preseedLeft) {
                this.scale.setTo(-1,1);
            } else {
                this.forms.action = 'still';
                this.body.setSize(32, 32, 0, 0);
            }

            // CASE 2: MOVEMENT (MOVEMENT/STILL) (Logical XOR)
            if( ( preseedLeft || preseedRight ) && !( preseedLeft && preseedRight ) ){
                    this.forms.action = 'movin';
                    this.animationStateHandler();
                if(!pressedAttack){ // Presset attack (CASE 4) will handle if is true
                    this.body.setSize(24, 32, 0, 0);
                    if(this.inTheFloor){ // Ground control
                        this.body.velocity.x += this.scale.x * this.speedX/2;
                    } else { // Air control (air friction)
                        this.body.velocity.x += this.scale.x * this.speedX * 0.8;
                    }
                }
            }

            // CASE 3: JUMP
            if( pressedJump ){
                if(this.inTheFloor){
                    // Initial jump boost from the ground
                    this.body.velocity.y -= this.jump/1.8 * this.jumpMulti;
                    this.jumpX = 0.9;
                } else {
                    this.animationStateHandler();
                    // Continue pressing (modular jump by boost) in the air
                    this.body.velocity.y -= this.jump/1.8 * this.jumpX;
                    if (this.jumpX > 0.1) {
                        this.jumpX *= 0.95;
                    } else {
                        this.jumpX = 0;
                        this.animationStateHandler();
                    }
                }
            }

            // CASE 4: MODE (ATTACK/NORMAL)
            if( pressedAttack && !this.isPunching && !this.isKicking){
                this.forms.mode = 'attack';
                this.animationStateHandler();

                if(!this.isKicking && !this.isPunching && this.inTheFloor){
                    if( ( preseedLeft || preseedRight ) && !( preseedLeft && preseedRight ) ){
                        // 50% of speed
                        this.body.velocity.x += this.scale.x * this.speedX/2 * 0.5;
                    }
                    // punching only allowed on the floor
                    this.punchX          = 400;
                    this.isPunching      = true;
                    this.attackTimer     = KageClone.game.time.now;
                }
                if(!this.isPunching && !this.isKicking && !this.inTheFloor){
                    // kicking only allowed on air
                    this.body.velocity.x += this.scale.x * this.speedX/3;
                    this.body.velocity.y -= this.speedX/10; // go downwards(?) a little bit
                    this.kickX          = 1;
                    this.isKicking      = true;
                }
            }

            // CASE 4: AUTOMATICALLY COMPLETE THE PUNCH ATTACK
            if(this.isPunching && !this.isKicking){
                if (KageClone.game.time.now - this.attackTimer < this.punchX) {
                    if( ( preseedLeft || preseedRight ) && !( preseedLeft && preseedRight ) ){
                        // 20% of speed
                        this.body.velocity.x += this.scale.x * this.speedX/2 * 0.2;
                    }
                } else {
                    this.isPunching = false;
                    this.forms.mode = 'calmed';
                    this.animationStateHandler();
                }
            }

            // CASE 4: AUTOMATICALLY COMPLETE THE KICK ATTACK
            if(this.isKicking && !this.isPunching){
                this.body.velocity.x += this.scale.x * this.speedX/7 * this.kickX;
                if (this.kickX > 0.1) {
                    this.kickX *= 0.95;
                } else {
                    this.kickX      = 0;
                    this.isKicking  = false;
                    this.forms.mode = 'calmed';
                    this.animationStateHandler();
                }
            }

            // CASE 5: DOING NOTHING (ELSE)
            if( !preseedLeft && !preseedRight && !pressedJump && !pressedAttack ){
                if(this.forms.result !== "good-still-ground-calmed"){
                    this.forms.mode   = 'calmed';
                    this.forms.action = 'still';
                    this.animationStateHandler();
                }
                if(this.idleTimer === 0){
                    this.idleTimer = KageClone.game.time.now;
                } else if( KageClone.game.time.now - this.idleTimer > 3000) {
                    //this.animationStateHandler('good-special-idle');
                } else {
                    if(this.inTheFloor){
                        // Completely still
                        //this.frame = 0;
                        this.animations.stop();
                    } else {
                        // Freefall
                    }
                }
            }

            // Updates the spritesheet name
            this.updateForm();

            break;
        default:
            //default code block
    }

    if( this.body.velocity.x > window.recordx) { window.recordx = this.body.velocity.x };
    if( this.body.velocity.y > window.recordy) { window.recordy = this.body.velocity.y };
};
