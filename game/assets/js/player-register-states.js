var registerStates = function( player ){
    'use strict';
    var animations = player.animations;

    player.sm = StateMachine.create({
        initial: 'neutral',
        error: function(eventName, from, to, args, errorCode, errorMessage, originalException) {
            //return 'event ' + eventName + ' was naughty :- ' + errorMessage;
            ////console.log('.');
        },
        events: [
            // Damage
            {name: 'hitEvent'         , from: '*', to: 'inpain'},
            {name: 'killEvent'        , from: 'inpain', to: 'die'},
            {name: 'recoverEvent'     , from: 'inpain', to: 'neutral'},
            {name: 'recoverEvent'     , from: 'inpain', to: 'falling'},
            // Startup
            {name: 'startEvent'       , from: 'start', to: 'neutral'},
            // Player control: Normal
            {name: 'moveEvent'        , from: 'neutral', to: 'running'},
            {name: 'stopEvent'        , from: 'running', to: 'neutral'},
            {name: 'duckEvent'        , from: ['neutral', 'running'], to: 'crouching'},
            {name: 'standEvent'       , from: 'crouching', to: 'neutral'},
            {name: 'jumpEvent'        , from: ['neutral', 'running'], to: 'jumping'},
            {name: 'airAttackEvent'   , from: ['jumping', 'falling'], to: 'airAttack'},
            {name: 'grnAttackEvent'   , from: ['neutral', 'running', 'crouching'], to: 'grnAttack'},
            {name: 'calmDownEvent'    , from: ['grnAttack'], to: 'neutral'},
            {name: 'calmDownEvent'    , from: ['airAttack'], to: 'falling'},
            {name: 'fallEvent'        , from: ['neutral', 'running','jumping'], to: 'falling'},
            {name: 'hitGroundEvent'   , from: 'falling', to: 'neutral'},
            // Player control: SoftPlatformDown
            // Player control: Grappling and SoftPlatformUP
            {name: 'hookEvent'        , from: '*', to: 'grapplingStill'},
            {name: 'moveGrapEvent'    , from: 'grapplingStill', to: 'grapplingMove'},
            {name: 'stopGrapEvent'    , from: 'grapplingMove', to: 'grapplingStill'},
            {name: 'grapAttackEvent'  , from: ['grapplingStill', 'grapplingMove'], to: 'grapplingAttack'},
            {name: 'calmDownEvent'    , from: ['grapplingAttack'], to: 'grapplingStill'},
            {name: 'releaseGrapEvent' , from: ['grapplingStill', 'grapplingMove'], to: 'falling'},
            {name: 'climbUpEvent'     , from: ['grapplingStill', 'grapplingMove'], to: 'climbUp'},
            {name: 'adjustEvent'      , from: 'climbUp', to: 'neutral'},
            // Testing
            {name: 'testEvent'        , from: '*', to: 'test'},
            {name: 'revertTestEvent'  , from: '*', to: 'neutral'}
        ],
        callbacks : {
            onenterclimbUpEvent: function(event, from, to, obj) {
                // THIS HAS TO USE PHASER TWEENS ANIMATIONS INSTEAD OF CHANGING THE POSITION.

                //console.log('climbing '+obj.dir);
                if(obj.dir === 'up'){
                    obj.player.body.y = obj.player.body.y - 32;
                } else {
                    obj.player.body.y = obj.player.body.y + 16;
                }
                animations
                    .play('climb_'+obj.dir, 8, false, false)
                    .onComplete.add(function () {  

                        if(obj.dir === 'up'){
                            obj.player.body.y = obj.player.body.y - 32;
                        } else {
                            obj.player.body.y = obj.player.body.y + 16;
                        }
                        //console.log('animation complete, returning to neutral');
                        obj.player.sm.revertTestEvent();
                        //obj.player.sm.transition();
                    }, obj.player);
                return StateMachine.ASYNC;
            },
            onentergrapplingStill: function(event, from, to, msg){
                player.body.velocity.y = 0;
                player.body.gravity.y = 0;
                console.log('grappling mode entered!');
                animations.play('grapple');
            },
            ongrapplingMove: function(event, from, to, msg){
                animations.play('grapple_mv', 6, true, false);
            },
            onentergrapplingAttack: function(event, from, to, player){
                animations
                    .play('grapple_at', 8, false, false)
                    .onComplete.add(function () {  
                        //console.log('animation complete, returning to calmness');
                        player.sm.calmDownEvent();
                    }, player);

                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            },
            onenterneutral: function(event, from, to, msg) { 
                animations.stop();
                animations.frame = 0;
                player.isAttacking = false;
            },
            onleaveneutral: function(event, from, to, msg) { 
                ////console.log('leaving neutral state to: ' + to); 
            },
            onenterjumping: function(event, from, to, player){
                animations.play('jump');
                player.body.velocity.y -= player.jspd;
            },
            onenterfalling: function(event, from, to){
                player.body.gravity.y = player.grav;
                player.grappling = false;
                animations.play('jump');
            },
            onrunning: function(event, from, to, isInFloor){
                //player.body.velocity.x += player.scale.x * player.spd;
                animations.play('ground_mv');
            },
            onentergrnAttack: function(event, from, to){
                player.isAttacking = true;

                if(from === 'crouching'){
                    animations
                        .play('duck_at', 8, false, false)
                        .onComplete.add(function () {  
                            //console.log('animation complete, stop attacking');
                            player.sm.calmDownEvent();
                        }, player);
                } else {
                    animations
                        .play('ground_at', 8, false, false)
                        .onComplete.add(function () {  
                            //console.log('animation complete, stop attacking');
                            player.sm.calmDownEvent();
                        }, player);
                }

                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            },
            onenterairAttack: function(event, from, to, player){
                animations
                    .play('jump_at', 8, false, false)
                    .onComplete.add(function () {  
                        //console.log('animation complete, returning to calmness');
                        player.sm.calmDownEvent();
                    }, player);

                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            },
            oncrouching: function(){
                animations.play('duck');
            },
        }
    });
};

