# nico_coment_capt_server
niconico coment capture server
# Install

Install Nodejs, Chromium, pm2.

```bash:install&#x20;nodejs&#x20;npm&#x20;
$ curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
$ apt update
$ sudo apt install -y nodejs Chromium
$ sudo npm install pm2 -g
```

Download & Install node modules

```bash:install&#x20;nico_come_capt_server
$ mkdir nico_come
$ cd nico_come
$ mkdir files
$ wget https://raw.githubusercontent.com/nisiharayosi/nico_coment_capt_server/main/nico_come_capt_server.js
$ npm init -y
$ npm install express body-parser puppeteer-core websocket date-utils
$ pm2 start nico_come_capt_server.js --name nico_come_capt
```

# Use

```diff_bash:Config&#x20;set&#x20;nico_come_capt_ctrl
$ cd EPGStation
$ mkdir node
$ cd node
$ wget https://raw.githubusercontent.com/nisiharayosi/nico_coment_capt_server/main/nico_come_capt_ctrl.js
$ vi ../config/config.yml
~~~~~~~~~~ - vim - ~~~~~~~~~~
@config.yml(以下2行を追加)

+ recordingPreStartCommand: '/bin/node ./node/nico_come_ctrl.js start'
+ recordingFinishCommand: '/bin/node ./node/nico_come_ctrl.js stop'

~~~~~~~~~~ - vim - ~~~~~~~~~~

$ pm2 restart epgstation
```

# Other Use

Start
```bash:Start&#x20;nico_come_capture
$ curl -X POST -H "Content-Type: application/json" -d '{\
    "c_name": "Channel Name",\
    "p_name": "Program Name",\
    "s_time": "Start Time",\
    "e_time": "End Time",\
    "p_url": "niconico URL"\
  }' localhost:12525/start
```

Stop
```bash:Stop&#x20;nico_come_capture
$ curl -X POST -H "Content-Type: application/json" -d '{\
    "p_name": "Program Name"\
  }' localhost:12525/stop
```
