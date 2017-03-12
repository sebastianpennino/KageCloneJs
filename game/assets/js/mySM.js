var StateMachine = function (initialState) {
    var states = {};
    var currentState = initialState;

    function setState(state) {
        var newState = states[state];
        if (!newState) {
            throw new Error('Invalid state: ' + state);
        }
        if (states[currentState].exit) {
            states[currentState].exit();
        }
        currentState = state;
        if (states[currentState].enter) {
            var _current;

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            args[0] = args[0] || {};
            (_current = states[currentState]).enter.apply(_current, args);
        }
    };

    function updateState() {
        var _current;
        states[currentState].update && (_current = states[currentState]).update.apply(_current, arguments);
    };

    function trigger(event) {
        var state = states[currentState];
        if (state && state.events && state.events[event]) {
            var cb = state.events[event];
            if (typeof cb === 'string') {
                setState(cb);
            } else {
                for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                }

                cb.apply(undefined, args);
            }
        }
    };

    function getCurrentState() {
        return currentState;
    };

    function addStates(newStates) {
        Object.assign(states, newStates);
    };

    return {
        addStates: addStates,
        getCurrentState: getCurrentState,
        setState: setState,
        updateState: updateState,
        trigger: trigger
    };
};
