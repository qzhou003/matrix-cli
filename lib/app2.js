/**
 * lib/app.js
 */
var JSHINT = require('jshint').JSHINT;
var program = require('commander');
var prompt = require('prompt');
var _ = require('lodash');
var colors = require('colors/safe');
var fs = require('fs');
var tar = require('tar');
var fstream = require('fstream');


/**
Setup your local Matrix
DONE - matrix login -- stores key and secret of api in a file, when logging in /oauth2/*
DONE - matrix logout /oauth2/*

Device-Level
DONE - matrix list-devices -- shows devices under your account GET /device
DONE - matrix use device1 -- gets device token and stores locally -- stores locally /device/token

Matrix Console will use API, to deliver requests such as
DONE - matrix set-config POST /config?name=foo&val=bar
DONE - matrix set-env POST /env?name=foo&val=bar
DONE - matrix list-info GET /device?id=foo&token=foo
DONE - matrix list-config GET /config&token=foo
DONE - matrix list-apps GET/app&token=foo
DONE - matrix install app1 POST /app/install
DONE - matrix update app1 POST /app/update
DONE - matrix logs app1 GET/app/log?id=foo&token=foo
DONE - matrix uninstall app1 DELETE /app?id=foo
DONE - matrix reboot GET/device/reboot?token=foo
DONE - matrix shutdown GET/device/reboot?token=foo
matrix ssh

Deploy Apps
DONE - matrix deploy app1 POST /app/deploy
DONE - matrix start app1 POST /app/start
DONE - matrix stop app1 POST /app/stop
DONE - matrix restart app1 POST/app/restart
**/

program.command('list [target]', 'list apps, devices, groups'.grey)
program.command('set [target]', 'set env, config'.grey)
program.command('update <app> [version]', 'Update, update app1, update app1 v0.1'.grey)


// base cmd
//
// program
//   .version(Matrix.version)
//   .description(colors.yellow(
//     '\t      Anyway this cake is great\n\t     It\'s so delicious and moist' +
//     '\n\n' +
//     '\t            ,:/+/-\n' +
//     '\t            /M/              .,-=;//;-\n' +
//     '\t       .:/= ;MH/,    ,=/+%$XH@MM#@:\n' +
//     '\t      -$##@+$###@H@MMM#######H:.    -/H#\n' +
//     '\t .,H@H@ X######@ -H#####@+-     -+H###@x\n' +
//     '\t  .,@##H;      +XM##M/,     =%@###@X;-\n' +
//     '\tX%-  :M##########$.    .:%M###@%:\n' +
//     '\tM##H,   +H@@@$/-.  ,;$M###@%,          -\n' +
//     '\tM###M=,,---,.-%%H####M$:           ,+@##\n' +
//     '\t@##################@/.          :%##@$-\n' +
//     '\tM################H,         ;HM##M$=\n' +
//     '\t##################.    .=$M##M$=\n' +
//     '\t#################H..;XM##M$=         .:+\n' +
//     '\tM####################@%=          =+@MH%\n' +
//     '\t@#################M/.         =+H#X%=\n' +
//     '\t=+M###############M,     -/X#X+;.\n' +
//     '\t  .;XM###########H=    ,/X#H+:,\n' +
//     '\t    .=+HM#######M+/+HM@+=.\n' +
//     '\t         ,:/%XM####H/.\n' +
//     '\t              ,.:=-.'
//   ));
//
// /** Matrix - Login & Logout **/
program
  .command('login')
  .description('Log into the MATRIX platform.')
  .action(function() {
    prompt.delimiter = '';
    prompt.message = 'matrix login -- ';
    prompt.start();
    prompt.get(['username', 'password'], function(err, result) {
      if (err) throw err;

      /** set the creds **/
      Matrix.config.user = {
        username: result.username,
        password: result.password
      };

      /** set the client to empty **/
      Matrix.config.client = {}

      /** authenticate client and user **/
      Matrix.api.auth.client(Matrix.options, function(err, out) {
        if (err) throw err;
        // set client token
        Matrix.api.client.setToken(out.access_token);
        Matrix.api.auth.user(Matrix.config.user, function(err, state) {
          if (err) return console.error(err.message.red);
          Matrix.config.user.token = state.access_token;
          Matrix.config.client.token = out.access_token;
          Matrix.config.user.id = state.id;

          /** token stores, delete extra stuff **/
          // delete Matrix.config.user.username;
          delete Matrix.config.user.password;
          Matrix.api.user.setToken(Matrix.config.user.token);
          Matrix.helpers.saveConfig();
          // set user token
        });
      });
      /** save the creds if it's good **/

    });
  });


/** Matrix - Use Device **/
program
  .command('use')
  .description('[name or identifier] to indicate device.')
  .action(function(cmd) {
    Matrix.helpers.getConfig();

    Matrix.api.user.setToken(Matrix.config.user.token);

    Matrix.config.device = {}

    Matrix.api.auth.device({
      deviceId: cmd
    }, function(state) {
      console.log('matrix use --', cmd);
      // console.log('device token:', state.results.device_token);
      // Save the device token
      Matrix.config.device.identifier = cmd;
      // console.log('Active Device Id', cmd);
      Matrix.config.device.token = state.results.device_token;
      Matrix.helpers.saveConfig();
    });
  });
//

// /** Matrix - In App List **/
// program
//   .command('set-env [env]')
//   .description('Options: [development, staging, production]')
//   .action(function(value) {
//     if (value.match(/development|staging|production/)){
//       Matrix.config.environment = value;
//       Matrix.helpers.saveConfig();
//       // TODO: set-env [value] set a environment on the AdMatrix
//       console.log('Env:', Matrix.config.environment );
//     } else {
//       console.error('Valid Environments = [ development, staging, production ]')
//     }
//
//   });
//
// program
//   .command('set-config <app> [k=v]')
//   .description('Options: [info, config, apps] once using a device.')
//   .action(function setAppConfig(app, attrs) {
//     console.log(app, attrs);
//     var opts = attrs.split('=');
//     var options = {
//       deviceId: Matrix.config.device.identifier,
//       name: app,
//       key: opts[0],
//       value: opts[1]
//     }
//     Matrix.api.app.configure(options, function (err, resp) {
//       if (err) console.error(err);
//       console.log('['+ options.deviceId +']('+ options.name +')', options.key, '=', options.value);
//       setTimeout( process.exit, 1000 );
//     });
//   });
//
/** Matrix - In App - Install **/
program
  .command('install <app>')
  .description('Usage: install app1')
  .action(function(app) {
    console.log('Installing', app)
    // TODO: ensure if file is not found, we're hitting api directory
    Matrix.api.app.install(app, Matrix.deviceId, function(err, resp) {
      if (err) console.error(err);
      console.log('Installed', app + '...');
    });
  });
//
// /** Matrix - In App - Uninstall **/
// program
//   .command('uninstall <app>')
//   .description('Usage: uninstall app1')
//   .action(function(app) {
//     Matrix.api.app.uninstall(name, Matrix.deviceId, function(err, resp) {
//       if (err) console.error(err);
//       console.log('Installed', app + '...');
//     });
//   });
//
// /** Matrix - In App - Uninstall **/
// program
//   .command('log')
//   .option('-f, --follow', 'Follow the log')
//   .description('Usage: log [-f, --follow]')
//   .action(function(option) {
//     console.log(option);
//     // if (option.follow)
//     options.deviceId = Matrix.config.device.identifier;
//
//     var eq = '=';
//     for ( var i = 1; i < process.stdout.columns; i++ ){
//       eq += '=';
//     }
//
//     console.log(eq.grey);
//
//     Matrix.api.app.log(options, function(err, log){
//       if (err) console.error(err);
//       console.log(log.payload);
//       if (!option.follow){
//         process.exit();
//       }
//     });
//   });
//
//
// /** Log out a user **/
program
  .command('logout')
  .description('Log out of all MATRIX platform and devices.')
  .action(function() {
    Matrix.helpers.removeConfig();
  });
//
/** Update the App or the Matrix **/
program
  .command('reboot')
  .description('Reboots the MATRIX.')
  .action(function() {
    // TODO: reboot - Trigger reboot on the AdMatrix
    Matrix.api.device.reboot( Matrix.config.device.identifier, function(err){
      console.log('Device Rebooting');
    });
  });

/** App management **/
program
  .command('create <app>')
  .description('Creates a new scaffolding for a MATRIX App.')
  .action(function(app) {
    if (_.isUndefined(app)) {
      return console.error('Must specify app name');
    }

    function onError(err) {
      console.error('An error occurred:', err);
    }

    function onEnd() {
      console.log('App Folder Created:>'.grey, app.green + '/'.grey)
    }

    var extractor = tar.Extract({
        path: process.cwd() + "/" + app
      })
      .on('error', onError)
      .on('end', onEnd);

    fs.createReadStream(__dirname + "/../baseapp.tar")
      .on('error', onError)
      .pipe(extractor);
    // unzip baseApp.zip to named folder
  });
//
// // Run from current directory
program
  .command('deploy <dir>')
  .description('Deploys an app to the Matrix.')
  .action(function(dir) {
    var pwd = process.cwd();
    var detectFile = 'config.json';


    if (_.isUndefined(dir)) {
      // infer name from current directory
      dir = require('path').basename(pwd);
    } else {
      pwd += '/' + dir + '/';
    }

    var tmp = __dirname + '/../' + dir + '.zip';

    //TODO: IMPORTANT Make sure config file exists
    if (!fs.existsSync(pwd + detectFile)) {
      return console.error('No ', detectFile, ' found. Are you sure an AdMatrix app resides in ', pwd, '?');
    }


    var appFile = fs.readFileSync(pwd + 'app.js').toString();
    var configFile = fs.readFileSync(pwd + detectFile).toString();
    var configObject = JSON.parse(configFile);

    // run JSHINT on the application
    JSHINT(appFile);

    if(JSHINT.errors.length > 0){
      console.log('Cancel deploy due to errors & warnings'.red)
    _.each(JSHINT.errors, function(e){
      if (_.isNull(e)){ return; }
        var a = [];
      if (e.hasOwnProperty('evidence')){
        a[e.character-1] = '^';
        // regular error
      }
      e.evidence = e.evidence || '';
      console.log('\n' + '(error)'.red, e.raw, '[app.js]', e.line + ':' + e.character, '\n'+ e.evidence.grey, '\n' + a.join(' ').grey );
    })
      return;
    }

    console.log('Reading ', pwd);
    console.log('Writing ', tmp);

    var dirDest = fs.createWriteStream(tmp);


    // zip up the files in the app directory
    var archiver = require('archiver');
    var zip = archiver.create('zip', {});

    var files = fs.readdirSync(dir, function(file) {});
    _.each(files, function(file) {
      zip.append(fs.createReadStream(dir + '/' + file), {
        name: file
      });
    });

    zip.on('end', onEnd);
    zip.on('error', onError);
    zip.finalize();

    // send zip to the file
    zip.pipe(dirDest);

    function onError(err) {
      console.error('An error occurred:', err)
    }

    function onEnd() {
      console.log('Packed!');
      Matrix.api.app.deploy({
        appConfig: configObject,
        file: tmp,
        name: dir
      }, function(err, resp) {
        if (err) console.error(err);
        console.log('Deploy Complete'.green)
        resp.setEncoding();

        var data = '';
        resp.on('data', function(d) {
          data += d;
          console.log(data);
        });
        resp.on('end', function() {
          console.log(data);
          try {
            data = JSON.parse(data);
            var deployInfo = data.results;
          } catch (e) {
            console.error('Bad Deployment Info Payload', e);
          }

          deployInfo.name = dir;

          // Tell device to download app
          Matrix.api.app.install(deployInfo, Matrix.deviceId, function(err, resp) {
            if (err) {
              console.error('App Install Fail'.red, err);
            }
            console.log('App Installed'.green, dir, '--->', Matrix.deviceId, resp);
            endIt();
          })
        })
      })
    }
  });
//
program
  .command('publish <app> [version]')
  .description('Publishes a version of the App to the store.')
  .action(function(app, version) {
    console.log('Shutting down', app);
    Matrix.api.app.publish(app, version, function(err, res) {

    });
  });
//
program
  .command('start <app>')
  .description('Starts an app running on the MATRIX.')
  .action(function(app) {
    console.log('Starting: ', app);
    Matrix.api.app.start(app, Matrix.config.device.identifier, function(err, res) {
      if (err) return console.log(err);
      console.log('Started: ', app);
      endIt();
    });
  });
//
program
  .command('stop <app>')
  .description('Stops an app running on the MATRIX.')
  .action(function(app) {
    console.log('Stopping: ', app);
    Matrix.api.app.stop(app, Matrix.config.device.identifier, function(err, res) {
      console.log('Stopped:', app, res);
      endIt();
    });
  });
//
program
  .command('restart <app>')
  .description('Restarts an app running on the MATRIX.')
  .action(function(app) {
    console.log('Restarting: ', app);
    Matrix.api.app.restart(app, function(err, res) {
      console.log('Restarted:', app, res);
    });
  });
//
program
  .command('trigger <string>')
  .description('Runs a trigger test')
  .action(function(data){
    Matrix.api.app.trigger(Matrix.config.device.identifier, data, function(err){
      console.error(err);
    });
  })


// nonsensically complicated way to override the help text
if (process.argv.length === 2) {

  var helps = program.helpInformation().split('\n');
  var help = helps.slice(0, helps.length - 6);
  // console.log(cake.join('\n'));
  // console.log(help.join('\n'));

  console.log('\n')
  console.log(_.repeat(' ', 10), '_  _ ____ ___ ____ _ _  _')
  console.log(_.repeat(' ', 10), '|\\/| |__|  |  |__/ |  \\/   _ |', '[o]'.grey)
  console.log(_.repeat(' ', 10), '|  | |  |  |  |  \\ | _/\\_ |_ |_ |', 'v' + Matrix.version.grey)
  console.log(_.repeat('.||.', 20))
  console.log('\n')
    // TODO: Should we start with API? only if not logged in
  var log = ['API'.grey, Matrix.options.apiUrl];

  if (_.has(Matrix.config, 'user')) {
    log.push('\nUser'.grey, Matrix.config.user.username);
  }
  if (_.has(Matrix.config, 'device')) {
    log.push('Device'.grey, Matrix.config.device.identifier);
  }

  // TODO: add support for active group

  console.log(log.join(': '.blue))
  console.log('\n')

  help.forEach(function(l, i) {
    if (i > 5) {
      var splitIndex = l.lastIndexOf('  ');
      var desc = l.slice(splitIndex, l.length).trim();
      var command = l.slice(0, splitIndex).trim();
      var pad = 26 - command.length;
      console.log(_.repeat(' ', pad), command, '-', desc.grey);
    }
  });
  console.log();

  // this is how we override the built in help
  process.argv.push('donthelp')
}

program.parse(process.argv);



function endIt() {
  setTimeout(function() {
    process.nextTick(function() {
      process.exit(0);
    })
  }, 1000)
}