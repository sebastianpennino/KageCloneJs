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
            {name: 'hitGroundEvent', from: 'falling', to: 'neutral'},
            {name: 'testEvent', from: '*', to: 'test'},
            {name: 'revertTestEvent', from: '*', to: 'neutral'}
        ],
        callbacks : {
            onentertest: function(event, from, to, obj) {
                console.log('climbing '+obj.dir);
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
                        //KageClone.game.physics.arcade.isPaused = false;
                        console.log('animation complete, returning to neutral');
                        obj.player.sm.revertTestEvent();
                        //obj.player.sm.transition();
                    }, obj.player);
                return StateMachine.ASYNC;
            },
            onenterneutral: function(event, from, to, msg) { 
                //console.log('entered neutral state! ' + msg); 
                animations.stop();
                animations.frame = 0;
                player.isAttacking = false;
            },
            onleaveneutral: function(event, from, to, msg) { 
                //console.log('leaving neutral state! ' + msg); 
            },
            onenterjumping: function(event, from, to, player){
                //animations.play( 'ninja-hayate-movin-aereal-calmed', null, false, false )
                //animations.stop();
                //animations.frame = 9;
                animations.play('jump');
                player.body.velocity.y -= player.jspd;
            },
            onenterfalling: function(event, from, to){
                //animations.stop();
                //animations.frame = 9;
                animations.play('jump');
            },
            onrunning: function(event, from, to, isInFloor){
                //player.body.velocity.x += player.scale.x * player.spd;
                //animations.play('ninja-hayate-movin-ground-calmed');
                animations.play('ground_mv');
            },
            onentergrnAttack: function(event, from, to){
                console.log('groundATTACK '+from)
                player.isAttacking = true;
                if(from === 'crouching'){
                    animations
                        .play('duck_at', 8, false, false)
                        .onComplete.add(function () {  
                            console.log('animation complete, stop attacking');
                            player.sm.returnToCalmEvent();
                            //player.sm.transition();
                        }, player);
                } else {
                    animations
                        .play('ground_at', 8, false, false)
                        .onComplete.add(function () {  
                            console.log('animation complete, stop attacking');
                            player.sm.returnToCalmEvent();
                            //player.sm.transition();
                        }, player);
                }
                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            },
            onenterairAttack: function(event, from, to, player){
                // Play air attack animation
                // trigger transition
                animations
                    //.play( 'ninja-hayate-movin-aereal-attack', null, false, false )
                    .play('jump_at', 8, false, false)
                    .onComplete.add(function () {  
                        console.log('animation complete, returning to calmness');
                        player.sm.returnToCalmEvent();
                        //player.sm.transition();
                    }, player);
                return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
            },
            oncrouching: function(){
                //console.log('duck!')
                //animations.frame = 5;
                animations.play('duck');
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

