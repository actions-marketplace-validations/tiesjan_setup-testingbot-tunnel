const {kill} = require('process');

const core = require('@actions/core');


async function run() {
    /* Retrieve TestingBot Tunnel PID */
    const tunnelPid = core.getState('TUNNEL_PID');

    core.info(`Stopping TestingBot Tunnel [${tunnelPid}]...`);
    try {
        kill(tunnelPid, 'SIGINT');
    }
    catch (error) {
        core.info(error.code, error.message);
    }

    /* Wait until the readyfile has been removed */
    let pidCheckerTimeout = setTimeout(function() {
        if (pidChecker !== null) {
            clearInterval(pidChecker);
            pidChecker = null;
            pidCheckerTimeout = null;

            core.setFailed('TestingBot Tunnel failed to stop within 60 seconds.');
        }
    }, 60 * 1000);

    let pidChecker = setInterval(function() {
        try {
            kill(tunnelPid, 0);
        }
        catch (error) {
            if (error.code === 'ESRCH') {
                clearInterval(pidChecker);
                pidChecker = null;
                if (pidCheckerTimeout !== null) {
                    clearTimeout(pidCheckerTimeout);
                    pidCheckerTimeout = null;
                }

                core.info('TestingBot Tunnel successfully stopped.');
            }
            else {
                core.setFailed(error.code + ': ' + error.message);
            }
        }
    }, 500);
}


run();
