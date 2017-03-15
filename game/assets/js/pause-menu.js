/**
 * PauseMenu Class
 * Creates a new PauseMenu
 *
 * @class PauseMenu
 * @constructor
 * @param {Object} game              - A Phaser.game reference
 * @param {Phaser.Point} startPos      - Starting coordinates for the menu creation
 * @param {String} assetName         - Asset name (must be previously defined)
 * @param {Object} config            - optional configuration object
 * @param {number} [config.cellh=48] - The height of a single cell
 * @param {number} [config.cellw=96] - The width of a single cell
 * @param {number} [config.maxCol=3] - The maximum number of columns
 * @param {number} [config.maxRow=2] - The maximum number of rows
 * @param {number} [config.xpos=0]   - Selector position X
 * @param {number} [config.ypos=0]   - Selector position Y
 */
var PauseMenu = function PauseMenu(game, startPos, assetName, config){
    var config = config || {}, props = {};
    // Call the Phaser.Group passing in the game reference
    Phaser.Group.call(this, game);
    // Will hold the background of the menu
    this.bkg = this.create(startPos.x, startPos.y, assetName);
    this.bkg.anchor.setTo(0, 0);
    // Will hold the weapons
    this.weaponArray = [];
    // Build the prop object and assign it
    props.cellh    = config.cellh  || 48;
    props.cellw    = config.cellw  || 96;
    props.maxCol   = config.maxCol || 3;
    props.maxRow   = config.maxRow || 2;
    props.initialx = startPos.x    || 0;
    props.initialy = startPos.y    || 0;
    props.xpos     = config.xpos   || 0;
    props.ypos     = config.ypos   || 0;
    this.props     = props;
};
// PauseMenu will extend Phaser.Group Class
PauseMenu.prototype = Object.create(Phaser.Group.prototype);
PauseMenu.prototype.constructor = PauseMenu;

/**
 * Will update the selector coordinates
 * @return {Phaser.Point} updated position of the selector
 */
PauseMenu.prototype.updateSelectorPos = function updateSelectorPos() {
    // Calculates the actual position of the selector
    if(!this.selectorSpr){ throw Error('No selector sprite created'); }
    this.selectorSpr.x = this.props.initialx + (this.props.xpos * this.props.cellw);
    this.selectorSpr.y = this.props.initialy + (this.props.ypos * this.props.cellh);
    return new Phaser.Point(this.selectorSpr.x, this.selectorSpr.y);
};

/**
 * Will add a sprite to the group
 * @param {Number} offsetx - position in the X axis correction, based on this.bkg coordinates
 * @param {Number} offsety - position in the Y axis correction, based on this.bkg coordinates
 * @param {String} assetName - the (must be previously registered)
 * @param {Boolean} isCursor - is the cursor sprite?
 * @return {Phaser.sprite} - the new created sprite
 */
PauseMenu.prototype.addSprite = function addSprite(offsetx, offsety, assetName, isCursor){
    var spr = this.create(offsetx+this.props.initialx, offsety+this.props.initialy, assetName);
    spr.anchor.setTo(0, 0);
    if(isCursor){
        this.selectorSpr = spr;
        this.updateSelectorPos();
    }
    return spr;
};

/**
 * Will populate the weaponArray property with the adecuate number of elements
 * @param {Array} guns - One dimmensional array (with guns objects)
 * @return {Array} - the resultant array
 */
PauseMenu.prototype.fillWeapons = function fillWeapons( guns ){
    var i = 0, j = 0, k = 0, wl = guns.length, capacity = this.props.maxCol * this.props.maxRow;
    if(wl > capacity){         throw Error('Out of bounds weapon array size ('+wl+')');}
    if(this.props.maxRow < 1){ throw Error('Weapon menu must have at least one row');}
    if(this.props.maxCol < 1){ throw Error('Weapon menu must have at least one column');}

    for (; j < this.props.maxRow; j++) {
        if(!this.weaponArray[ j ]){  this.weaponArray[ j ] = []; }
        for (k = 0; k < this.props.maxCol; k++) {
            //console.log('Pos: '+i+' (Row: '+j+', Col: '+k+') -> '+guns[ i ]);
            this.weaponArray[ j ][ k ] = guns[ i ];
            i++;
        }
    }
    return this.weaponArray;
};

/**
 * Will show the current selected weapon
 * @return {String} - Current selected weapon name
 */
PauseMenu.prototype.announceSelection = function announceSelection(){
    var currentWeapon = this.weaponArray[ this.props.ypos ][ this.props.xpos ];
    if(currentWeapon.display){
        console.log(currentWeapon.display+' is the selected weapon');
        // THIS must be de-coupled
        ninja.currentWeapon = currentWeapon;
        return currentWeapon.display;
    } else {
        return void 0;
    }
};

PauseMenu.prototype.registerKeys = function registerKeys(){
    //var downMenuKey, upMenuKey, rigthMenuKey, leftMenuKey;
    return void 0;
};

/**
 * Will move the selector cursor one position DOWN
 * @return {undefined}
 */
PauseMenu.prototype.moveDown = function moveDown() {
    if(this.props.ypos < this.props.maxRow -1 ){
        this.props.ypos++;
        this.updateSelectorPos();
        //this.announceSelection();
    }
    return void 0;
};

/**
 * Will move the selector cursor one position RIGHT
 * @return {undefined}
 */
PauseMenu.prototype.moveRight = function moveRight() {
    if(this.props.xpos < this.props.maxCol -1 ){
        this.props.xpos++;
        this.updateSelectorPos();
        //this.announceSelection();
    }
    return void 0;
};

/**
 * Will move the selector cursor one position UP
 * @return {undefined}
 */
PauseMenu.prototype.moveUp = function moveUp() {
    if(this.props.ypos > 0){
        this.props.ypos--;
        this.updateSelectorPos();
        //this.announceSelection();
    }
    return void 0;
};

/**
 * Will move the selector cursor one position LEFT
 * @return {undefined}
 */
PauseMenu.prototype.moveLeft = function moveLeft() {
    if(this.props.xpos > 0){
        this.props.xpos--;
        this.updateSelectorPos();
        //this.announceSelection();
    }
    return void 0;
};
