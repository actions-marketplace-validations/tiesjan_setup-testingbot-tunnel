const fs = require('fs');
const path = require('path');
const {chdir} = require('process');
const {spawn} = require('child_process');

const core = require('@actions/core');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');


async function run() {
    /* Retrieve inputs */
    // Mandatory `testingbot-key` and `testingbot-secret` inputs for auth
    const testingBotKey = core.getInput('testingbot_key', {required: true});
    const testingBotSecret = core.getInput('testingbot_secret', {required: true});

    // Optional `testingbot-tunnel-download-url` input
    const testingBotTunnelURL = (
        core.getInput('testingbot_tunnel_download_url') ||
        'https://testingbot.com/downloads/testingbot-tunnel.zip'
    );

    /* Export the environment variables */
    core.info(
        'Exporting environment variables `TESTINGBOT_KEY` and `TESTINGBOT_SECRET`.'
    );
    core.exportVariable('TESTINGBOT_KEY', testingBotKey);
    core.exportVariable('TESTINGBOT_SECRET', testingBotSecret);

    /* Download and extract TestingBot Tunnel */
    core.info('Downloading TestingBot Tunnel...');
    const randomId = Math.round(Math.random() * 65536);
    const testingBotTunnelDir = `.testingbot-tunnel-${randomId}`;
    await io.mkdirP(testingBotTunnelDir);
    const zipFilePath = await tc.downloadTool(testingBotTunnelURL);
    await tc.extractZip(zipFilePath, testingBotTunnelDir);
    core.info('TestingBot Tunnel successfully downloaded.');

    /* Change into working directory */
    chdir(testingBotTunnelDir);

    /* Spawn detached process for TestingBot Tunnel */
    core.info('Starting TestingBot Tunnel...');
    const readyFile = 'testingbot-tunnel.ready';
    const jarFile = path.join('testingbot-tunnel/', 'testingbot-tunnel.jar');
    const args = [
        '-jar', jarFile,
        '--readyfile', readyFile,
    ];
    const tunnel = spawn('java', args, {detached: true});
    let consoleOutput = '';
    tunnel.stdout.setEncoding('utf8');
    tunnel.stdout.on('data', function(chunk) { consoleOutput += chunk; });
    tunnel.stderr.setEncoding('utf8');
    tunnel.stderr.on('data', function(chunk) { consoleOutput += chunk; });

    core.saveState('TUNNEL_PID', tunnel.pid);

    /* Wait until the readyfile exists */
    let readyFileCheckerTimeout = setTimeout(function() {
        if (readyFileChecker !== null) {
            clearInterval(readyFileChecker);
            readyFileChecker = null;
            readyFileCheckerTimeout = null;

            tunnel.stdout.destroy();
            tunnel.stderr.destroy();
            tunnel.unref();

            core.setFailed('TestingBot Tunnel failed to start within 60 seconds.');

            core.startGroup('Startup process console output');
            core.info(consoleOutput);
            core.endGroup();
        }
    }, 60 * 1000);

    let readyFileChecker = setInterval(function() {
        try {
            if (fs.statSync(readyFile).isFile()) {
                clearInterval(readyFileChecker);
                readyFileChecker = null;
                if (readyFileCheckerTimeout !== null) {
                    clearTimeout(readyFileCheckerTimeout);
                    readyFileCheckerTimeout = null;
                }

                tunnel.stdout.destroy();
                tunnel.stderr.destroy();
                tunnel.unref();

                core.info('TestingBot Tunnel successfully started.');

                core.startGroup('Startup process console output');
                core.info(consoleOutput);
                core.endGroup();
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                core.setFailed(error.code + ': ' + error.message);
            }
            else {
                // File does not yet exist
            }
        }
    }, 500);
}


run();
