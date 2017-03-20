/**
 * HUD Class
 * Creates a new HUD
 *
 * @class HUD
 * @constructor
 * @param {Object} game              - A Phaser.game reference
 * @param {Phaser.Point} offset      - Starting coordinates for the menu creation
 * @param {String} assetName         - Asset name (must be previously defined)
 * @param {Object} config            - optional configuration object
 * @param {number} [config.state=0]           - the current display state (face sprite and text)
 * @param {number} [config.stateSprite=null]  - 
 * @param {number} [config.healthPercent=100] - 
 * @param {number} [config.healthMax=100]     - 
 */
var HUD = function HUD(game, startPos, assetName, config){
    var config = config || {}, props = {}, enums = {};
    // Call the Phaser.Group passing in the game reference
    Phaser.Group.call(this, game);
    // Will hold the background of the HUD
    this.bkg = this.create(startPos.x, startPos.y, assetName);
    this.bkg.anchor.setTo(0, 0);
    this.bkg.fixedToCamera = true
    // Different player states
    enums.stateText = [ "Hayate", "Hayate el rengo", "Hayate el lisiado", "Hayate el casi-fiambre", "Hayate el fiambre" ];
    // Different healt limits
    enums.healthLimits = [ 100, 100, 80, 30, 5 ];
    // Build the prop object
    props.state         = 0    || config.state;
    props.stateSprite   = null || config.stateSprite;
    props.healthPercent = 100  || config.healthPercent;
    props.healthMax     = 100  || config.healthMax;
    props.healtLong     = 395;  // px
    props.currentText   = enums.stateText[ config.state || 0 ];
    // Assign it
    this.props       = props;
    this.props.enums = enums;

    this.healthSprite = this.create(75, 5, 'hpx');
    this.healthSprite.anchor.setTo(0, 0);
    this.healthSprite.fixedToCamera = true
    this.healthSprite.scale.setTo( this.props.healtLong/14, 14/14);

    this.tlabel = KageClone.game.add.text( this.healthSprite.x+(this.props.healtLong/2), this.healthSprite.y+11, props.currentText, { font: '22px Lucida Console', fill: '#fff' });
    //tlabel.anchor.setTo(0, 0);
    this.tlabel.anchor.set(0.5);
    this.tlabel.fixedToCamera = true;
    //tlabel.setShadow(1, 1, 'rgba(0,0,0,0.5)', 1);

};
// HUD will extend Phaser.Group Class
HUD.prototype = Object.create(Phaser.Group.prototype);
HUD.prototype.constructor = HUD;

/**
 * Changes current state and text
 * @param {number} num - [description]
 */
HUD.prototype.setState = function setState( num ){
    this.props.state = num;
    this.props.currentText = this.props.enums.stateText[  num || 0 ];
    this.props.healthMax = this.props.enums.healthLimits[ num || 0 ];
    // check if this is valid
    this.tlabel._text = this.props.currentText;

    if(this.props.healthPercent > this.props.healthMax){
        this.props.healthPercent = this.props.healthMax;
    }
    return void 0;
};

/**
 * Will broadcast the current value of health
 * @return {props.healthPercent} - the current (updated) health value
 */
HUD.prototype.updateHealth = function updateHealth(){
    var percent = this.props.healtLong * this.props.healthPercent / 100;
    //console.log(this.props.healtLong*100/this.props.healthPercent)
    this.healthSprite.scale.setTo( percent/14, 14/14);
    // Send the info
    return this.props.healthPercent;
};

/**
 * Will set the value of the health to exactly zero.
 * @return {props.healthPercent} - the current (updated) health value
 */
HUD.prototype.instaKill = function instaKill(){
    this.props.healthPercent = 0;
    return void 0;
};

/**
 * Will set the health to a specific number
 * @param {Number} newVal - the new health value
 * @param {Boolean} force - force the value even if it breaks the max/min values
 * @return {props.healthPercent} - the current (updated) health value
 */
HUD.prototype.setHealth = function setHealth( newVal, force ){
    if(!force){
        if( newVal <= this.props.healthPercent){
            this.props.healthPercent = newVal;
        } else {
            throw new Error('New value '+newVal+' is over the maximum ('+this.props.healthMax+')');
        }
    } else {
        this.props.healthPercent = newVal;
    }
    // Send the update
    this.updateHealth();
    return this.props.healthPercent;
};

/**
 * Will add a value of health to the current value.
 * @param {Number} val - the value of health to add (it can't surpass the max)
 * @return {props.healthPercent} - the current (updated) health value
 */
HUD.prototype.addHealth = function addHealth( val ){
    if( this.props.healthPercent + val <= this.props.healthMax){
        this.props.healthPercent = this.props.healthPercent + val;
    } else {
        this.props.healthPercent = this.props.healthMax;
    }
    // Send the update
    this.updateHealth();
    return this.props.healthPercent;
};

/**
 * Will substract a value of health to the current value.
 * @param {Number} val - the value of health to substract (the result can't be lower than 0)
 * @return {props.healthPercent} - the current (updated) health value
 */
HUD.prototype.substractHealth = function substractHealth( val ){
    if( this.props.healthPercent - val <= 0){
        this.props.healthPercent = this.props.healthPercent - val;
    } else {
        // Kill the player
        this.instaKill();
    }
    // Send the update
    this.updateHealth();
    return this.props.healthPercent;
};
