var registerAnimations = function( player ){
    'use strict';

    player.animations.add(
        'ninja-hayate-movin-ground-calmed',
        Phaser.Animation.generateFrameNames('ground_run_', 1, 4),
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
