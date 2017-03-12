var setPlayerStates = function (agent) {
    //var sprite = agent.sprite,
        var body = agent.body,
            animations = agent.animations,
            sm = agent.sm,
            getVelocity = agent.getVelocity,
            getMovement = agent.getMovement;


    function increase(val, amt) {
        return val < 0 ? val - amt : val + amt;
    }
    function decrease(val, amt) {
        return val < 0 ? Math.min(val + amt, 0) : Math.max(val - amt, 0);
    }

    var size = {
        setDefault: function setDefault() {
            return body.setSize(80, 250);
        },
        setCrouch: function setCrouch() {
            return body.setSize(130, 160);
        }
    };
    size.setDefault();

    return {
        standing: {
            enter: function enter() {
                animations.stop();
                //sprite.frame = 64;
            },
            events: {
                fall: 'falling',
                jump: 'jumping',
                move: 'running',
                down: 'crouching'
            }
        },
        crouching: {
            enter: function enter(_ref) {
                var wasSliding = _ref.wasSliding;

                size.setCrouch();
                if (!wasSliding) {
                    animations.play('crouch');
                }
            },
            exit: size.setDefault,
            events: {
                mid: 'standing',
                jump: 'jumping',
                fall: 'falling'
            }
        },
        running: {
            enter: function enter() {
                animations.play('ninja-hayate-movin-ground-calmed');
            },
            update: function update(_ref2) {
                var xm = _ref2.xm;

                var xv = body.velocity.x;
                // flip character
                //sprite.scale.x = xm;
                agent.scale.setTo(xm,1);
                //body.velocity.x = 1000 * xm;
                // gain speed up to max
                var max = 1000;
                var gain = 30;
                var newXv = xv;
                if (xm > 0) {
                    newXv = Math.max(xv, 0);
                    newXv = Math.min(newXv + gain, max);
                } else {
                    newXv = Math.min(xv, 0);
                    newXv = Math.max(newXv - gain, -max);
                }
                body.velocity.x = newXv;
            },
            events: {
                fall: 'falling',
                jump: 'jumping',
                stop: 'sliding'
            }
        },
        sliding: {
            enter: function enter() {
                animations.play('descend-stairs'); // in lieu of sliding
            },
            events: {
                move: 'running',
                down: 'slidingCrouched',
                jump: 'jumping',
                mid: 'standing',
                fall: 'falling'
            },
            update: function update() {
                if (body.velocity.x) {
                    body.velocity.x = decrease(body.velocity.x, 40);
                } else {
                    sm.setState('standing');
                }
            }
        },
        slidingCrouched: {
            enter: function enter() {
                // running to crouch adds some force to the slide
                body.velocity.x += body.velocity.x / 7;
                animations.play('crouch'); //todo: slidingCrouched animation
                size.setCrouch();
            },
            exit: function exit() {
                size.setDefault();
            },
            events: {
                mid: 'sliding',
                jump: 'jumping',
                fall: 'falling'
            },
            update: function update(_ref3) {
                var xv = _ref3.xv;

                body.velocity.x = decrease(body.velocity.x, 40);
                if (!body.velocity.x) {
                    sm.setState('crouching', { wasSliding: true });
                }
            }
        },
        falling: {
            enter: function enter() {
                animations.play('fall');
            },
            update: function update() {
                var _getVelocity = getVelocity(),
                        xv = _getVelocity.xv,
                        yv = _getVelocity.yv;

                var _getMovement = getMovement(),
                        xm = _getMovement.xm,
                        ym = _getMovement.ym;
                //agent.setVelocity(xv + 150*xm*dt, yv)

            },
            events: {
                hitground: function hitground() {
                    var _getMovement2 = getMovement(),
                            xm = _getMovement2.xm;

                    xm ? sm.setState('running') : sm.setState('sliding');
                }
            }
        },
        jumping: {
            enter: function enter() {
                animations.play('jump');
                body.velocity.y = -1600;
            },
            update: function update(_ref4) {
                var yv = _ref4.yv,
                        ym = _ref4.ym;

                if (ym < 1 && yv < 0) {
                    body.velocity.y = 0;
                }
            },
            events: {
                move: function move() {
                    var _getVelocity2 = getVelocity(),
                            xv = _getVelocity2.xv,
                            yv = _getVelocity2.yv;

                    var _getMovement3 = getMovement(),
                            xm = _getMovement3.xm;

                    //sprite.scale.x = xm;
                    agent.scale.x = xm;
                    if (xm > 0) {
                        body.velocity.x = Math.min(xv + 30, 1000);
                    } else if (xm < 0) {
                        body.velocity.x = Math.max(xv - 30, -1000);
                    }
                },
                hitground: function hitground() {
                    var _getMovement4 = getMovement(),
                            xm = _getMovement4.xm;

                    xm ? sm.setState('running') : sm.setState('sliding');
                }
            }
        }
    };
};
