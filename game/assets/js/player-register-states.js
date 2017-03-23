/**
 * registerStates register states for a given sprite
 * @param {NinjaPlayer} player - a instance of NinjaPlayer class
 */
var registerStates = function( player ){
    'use strict';
    var animations = player.animations;

    player.sm = StateMachine.create({
        initial: 'neutral',
        error: function(eventName, from, to, args, errorCode, errorMessage, originalException) {
            //return 'event ' + eventName + ' was naughty :- ' + errorMessage;
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
            {name: 'climbDownEvent'   , from: 'crouching', to: 'climbDown'},
            // Player control: Grappling and SoftPlatformUP
            {name: 'hookEvent'        , from: '*', to: 'grapplingStill'},
            {name: 'moveGrapEvent'    , from: 'grapplingStill', to: 'grapplingMove'},
            {name: 'stopGrapEvent'    , from: 'grapplingMove', to: 'grapplingStill'},
            {name: 'grapAttackEvent'  , from: ['grapplingStill', 'grapplingMove'], to: 'grapplingAttack'},
            {name: 'calmDownEvent'    , from: ['grapplingAttack'], to: 'grapplingStill'},
            {name: 'releaseGrapEvent' , from: ['grapplingStill', 'grapplingMove'], to: 'falling'},
            {name: 'climbUpEvent'     , from: ['grapplingStill', 'grapplingMove'], to: 'climbUp'},
            {name: 'adjustEvent'      , from: 'climbUp', to: 'crouching'},
            // Testing
            {name: 'testEvent'        , from: '*', to: 'test'},
            {name: 'revertTestEvent'  , from: '*', to: 'neutral'}
        ],
        callbacks : {
            onenterclimbUp: function(event, from, to, obj) {
                if(obj.dir === 'up'){
                    KageClone.game.add.tween( player ).to( {y: obj.player.body.y -40}, 400, "Sine.easeInOut", true);
                }
                animations
                    .play('climb_'+obj.dir, 8, false, false)
                    .onComplete.add(function () {
                        obj.player.sm.adjustEvent();
                    }, obj.player);
                return StateMachine.ASYNC;
            },
            onleaveclimbUp: function(event, from, to) {
                player.body.gravity.y = player.grav;
                player.grappling = false;
            },
            onenterclimbDown: function(event, from, to, obj) {
                if(obj.dir === 'down'){
                    KageClone.game.add.tween( player ).to( {y: obj.player.body.y +54}, 350, "Sine.easeOut", true);
                }
                animations
                    .play('climb_'+obj.dir, 8, false, false)
                    .onComplete.add(function () {
                        obj.player.grappling = true;
                        obj.player.sm.hookEvent();
                    }, obj.player);
                return StateMachine.ASYNC;
            },
            onentergrapplingStill: function(event, from, to, msg){
                player.body.velocity.y = 0;
                player.body.gravity.y = 0;
                animations.play('grapple');
            },
            ongrapplingMove: function(event, from, to, msg){
                animations.play('grapple_mv', 6, true, false);
            },
            onentergrapplingAttack: function(event, from, to, player){
                animations
                    .play('grapple_at', 8, false, false)
                    .onComplete.add(function () {  
                        player.sm.calmDownEvent();
                    }, player);

                return StateMachine.ASYNC;
            },
            onenterneutral: function(event, from, to, msg) { 
                animations.stop();
                animations.frame = 0;
                player.isAttacking = false;
            },
            onleaveneutral: function(event, from, to, msg) { 
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
            onleavefalling: function(){
            },
            onrunning: function(event, from, to){
                //player.body.velocity.x += player.scale.x * player.spd;
                animations.play('ground_mv');
            },
            onentergrnAttack: function(event, from, to){
                player.isAttacking = true;
                if(from === 'crouching'){
                    animations
                        .play('duck_at', 8, false, false)
                        .onComplete.add(function () {  
                            player.sm.calmDownEvent();
                        }, player);
                } else {
                    animations
                        .play('ground_at', 8, false, false)
                        .onComplete.add(function () {  
                            player.sm.calmDownEvent();
                        }, player);
                }
                return StateMachine.ASYNC;
            },
            onenterairAttack: function(event, from, to, player){
                animations
                    .play('jump_at', 8, false, false)
                    .onComplete.add(function () {  
                        player.sm.calmDownEvent();
                    }, player);

                return StateMachine.ASYNC;
            },
            oncrouching: function(){
                animations.play('duck');
            },
        }
    });
};

