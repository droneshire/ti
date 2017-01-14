'use strict';

exports.ServerStatus = {
    INITIALIZING: 'initializing',
    UP: 'up',
    READY: 'ready',
    DOWN: 'down'
};

exports.ConnectionState = {
    INITIALIZING: 'initalizing',
    OFFLINE: 'offline',
    CONNECTED: 'connected'
};

/**
 * Server state - may change during run-time (as opposed to vars.js)
 */
exports.ServerState = {
    serverStatus: exports.ServerStatus.DOWN,
    // 'localserver' only:
    useRemoteContent:  true,
    useOfflineContent: true,
    connectionState: exports.ConnectionState.INITIALIZING,

    updateConnectionState: function(state, config) {
        this.connectionState = state;

        // update the server status as it depends on the connection state
        this.updateServerStatus(this.serverStatus, config);
    },
    updateServerStatus: function(status, config) {
        this.serverStatus = status;

        // see if our status changes due to the connectionState
        var nextStatus = this
            ._getNextServerStatusForConnectionState(this.serverStatus,
            this.connectionState,
            config);
        if (nextStatus) {
            this.serverStatus = nextStatus;
        }
    },

    /**
     * serverStatus depends on connectionState; update the serverStatus for
     * the given connectionState.
     *
     * @param {exports.ServerStatus} serverStatus
     * @param {exports.ConnectionState} connectionState
     * @param config
     *
     */
    _getNextServerStatusForConnectionState: function(serverStatus,
                                                     connectionState,
                                                     config) {
        if (!config.mode || config.mode === 'remoteserver') {
            // remoteserver's serverStatus does not depend on connectionState
            return serverStatus === exports.ServerStatus.UP ?
                exports.ServerStatus.READY : serverStatus;
        }
        else {
            if (serverStatus === exports.ServerStatus.UP) {
                if (connectionState === exports.ConnectionState.CONNECTED ||
                    connectionState === exports.ConnectionState.OFFLINE) {
                    return exports.ServerStatus.READY;
                }
                else if (connectionState === exports.ConnectionState.INITIALIZING) {
                    return exports.ServerStatus.UP;
                }
                else {
                    // unhandled state, error
                    return null;
                }
            }
            else {
                // unhandled transition, error
                return null;
            }
        }
    }
};
