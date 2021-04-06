# Setup TestingBot Tunnel

This GitHub Action sets up the Java based [TestingBot Tunnel][tunnel-info] in
your test environment. It downloads the Java binary from TestingBot's servers
or a provided custom URL, and starts it in the background. At the end of the
job the Tunnel is automatically shutdown.

For security reasons this action will export the two environment variables
`TESTINGBOT_KEY` and `TESTING_SECRET` prior to starting the Java binary. This
will prevent your tokens from leaking in commands like `ps`. Feel free to use
them in following steps of your job.


## Usage
1. Make sure Java has been set up according to the requirements specified on
   TestingBot's [information webpage][tunnel-info]:

   ```yaml
   - name: Set up Java for TestingBot Tunnel
     uses: actions/setup-java@v2
     with:
       distribution: 'zulu'
       java-version: '8'
   ```

   See the [`setup-java`][setup-java-action] action for more info.

2. Invoke action with your personal tokens:

   ```yaml
   - name: Set up TestingBot Tunnel
     uses: tiesjan/setup-testingbot-tunnel@v1
     with:
       testingbot_key: ${{ secrets.TESTINGBOT_KEY }}
       testingbot_secret: ${{ secrets.TESTINGBOT_SECRET }}
   ```

   The optional `testingbot_tunnel_download_url` input may be specified to
   download the Java binary from a different URL than TestingBot's own servers.


## License
The scripts and documentation in this project are released under the
[BSD-3-Clause License](LICENSE).


[setup-java-action]: https://github.com/actions/setup-java
[tunnel-info]: https://testingbot.com/support/other/tunnel
