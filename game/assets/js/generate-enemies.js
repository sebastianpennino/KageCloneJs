/**
 * Generate enemies
 * @param {*} KageClone 
 */
var generateEnemies = function( KageClone ){
    enemyGroup = KageClone.game.add.group();
    enemyGroup.enableBody = true;
    enemyGroup.physicsBodyType = Phaser.Physics.ARCADE;
    enemyGroup.create(567, 88, 'fakeEnemy');
    enemyGroup.create(921, 16, 'fakeEnemy').scale.setTo(-1,1);;
    enemyGroup.create(1206, 104, 'fakeEnemy');
    enemyGroup.create(1569, 112, 'fakeEnemy').scale.setTo(-1,1);
};
