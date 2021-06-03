const express = require("express");
const app  = express();
const port = 12525;
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-core');
const WebSocketClient = require('websocket').client;
const fs = require('fs');
require('date-utils');

let dir_Brwsr;
let dir_filesave = __dirname+'/files';
let worker = {};
let tasklist;

if(process.platform==='win32') dir_Brwsr = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
else if(process.platform==='darwin') dir_Brwsr = '/Application/Google Chrome.app';
else if(process.platform==='linux') dir_Brwsr = '/usr/bin/chromium';

const message_system_1 = '{"type":"startWatching","data":{"stream":{"quality":"abr","protocol":"hls","latency":"low","chasePlay":false},"room":{"protocol":"webSocket","commentable":true},"reconnect":false}}';
const message_system_2 = '{"type":"getAkashic","data":{"chasePlay":false}}';

setInterval(()=>{
    getdate = new Date();
    tasklist = '****Task List('+getdate.toFormat("HH24:MI:SS")+')****\n';
    if(Object.keys(worker).length != 0){
        for(let k in worker){
            tasklist += '@['+worker[k].channel_name+']'+k+'\n';
        }
    }
    else{
        tasklist += '@Non Task\n';
    }
    tasklist += '************End************';
    console.log(tasklist);
}, 1800000);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get("/", (req, res) =>{
    getdate = new Date();
    tasklist = '****Task List('+getdate.toFormat("HH24:MI:SS")+')****\n';
    if(Object.keys(worker).length != 0){
        for(let k in worker){
            tasklist += '@['+worker[k].channel_name+']'+k+'\n';
        }
    }
    else{
        tasklist += '@Non Task\n';
    }
    tasklist += '************End************';
    res.send('Welcome! "Nico Coment Chaptuer"...\n\n@http://address/start -> Chaptuer Start!\n---POST DATA(json){\n - c_name : "Channel Name"\n - p_name : "Program Name"\n - s_time : "Start Time"\n - e_time : "End Time"\n - p_url : "niconico URL"(OPTION)\n}\n\n@http://address/stop -> Chaptuer Stop!\n---POST DATA(json){\n - p_name : "Program Name"\n}\n\n'+tasklist);
});
app.post("/start", (req, res) =>{
    let channel_name;
    let url_page;
    if(req.body.c_name) {
        channel_name = req.body.c_name;
        console.log(channel_name);
        url_page = ch_url_conv(channel_name);
        console.log(url_page);
    }
    else if(url_page) {
        url_page = req.body.p_url;
        console.log(channel_name);
        console.log(url_page);
    }
    else {
        url_page = 'https://live.nicovideo.jp/watch/ch2646485';
    }
    program_name = req.body.p_name;
    prg_str_time = req.body.s_time;
    prg_end_time = req.body.e_time;
    sv_file_name = req.body.p_name+'.json';
    flg_end = 0;
    if(!worker[program_name]){
        worker[program_name] = new nico_come_reader(dir_filesave,sv_file_name,url_page,channel_name,program_name,prg_str_time,prg_end_time);
        res.send('Comment Logging Start! -->"'+program_name+'"');
        console.log('New Task -->"'+program_name+'"');
    }
    else {
        res.send('Error: Already exists! -->"'+program_name+'"');
        console.log('Error: Already exists! -->"'+program_name+'"');
    }
});
app.post("/stop", (req, res) =>{
    program_name = req.body.p_name;
    if(worker[program_name]){
        worker[program_name].nico_come_reader_close();
        delete worker[program_name];
        res.send('Comment Logging End! -->"'+program_name+'"');
        console.log('End Task -->"'+program_name+'"');
    }
    else{
        res.send('Error: Not Found! -->"'+program_name+'"');
        console.log('Error: Not Found!! -->"'+program_name+'"');
    }
});

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
});

function ch_url_conv(channel_name) {
    switch(true) {
      case /^NHK総合1.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646436';
      case /^NHKEテレ.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646437';
      case /^日テレ.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646438';
      case /^テレビ朝日.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646439';
      case /^TBS1.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646440';
      case /^テレビ東京.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646441';
      case /^フジテレビ.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646442';
      case /^TOKYO MX.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646485';
      case /^BS11イレブン.*$/.test(channel_name):
        return 'https://live.nicovideo.jp/watch/ch2646846';
    }
}



let nico_come_reader = function(file_dir,file_name,page_url,channel,program,s_time,e_time) {
    this.dir_filesave = file_dir;
    this.sv_file_name = file_name;
    this.url_page = page_url;
    this.channel_name = channel;
    this.program_name = program;
    this.prg_str_time = s_time;
    this.prg_end_time = e_time;
    this.client;
    this.comclient;
    this.socket_view;
    this.socket_come;
    this.flg_end = 0;
    this.lncbrwser(this.url_page);
}

//nico_come_reader.prototype.dir_Brwsr = dir_Brwsr;
//nico_come_reader.prototype.message_system_1 = '{"type":"startWatching","data":{"stream":{"quality":"abr","protocol":"hls","latency":"low","chasePlay":false},"room":{"protocol":"webSocket","commentable":true},"reconnect":false}}';
//nico_come_reader.prototype.message_system_2 = '{"type":"getAkashic","data":{"chasePlay":false}}';

nico_come_reader.prototype.nico_come_reader_close = function() {
    this.flg_end = 1;
    this.socket_come.close();
}

nico_come_reader.prototype.re_con_socket = function() {
    this.client = new WebSocketClient();
    this.comclient = new WebSocketClient();
}

nico_come_reader.prototype.lncbrwser = async function(url) {
    try {
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'],executablePath: (dir_Brwsr),ignoreDefaultArgs: ['--disable-extensions']});
        const page = await browser.newPage();
        let url_view;
        while(true){
            url_view = await this.getLatestDate(page, url);
            if(url_view) break;
        }
        browser.close();
  
        // filesave
        getdate = new Date();
        if (getdate.toFormat("HH24")-0 <= 3) {
            fs.writeFile(this.dir_filesave+'/'+(getdate.toFormat("YYYYMMDD")-1)+this.sv_file_name, '{"ChannelName":"'+this.channel_name+'","ProgramName":"'+this.program_name+'","StartTime":'+this.prg_str_time+',"EndTime":'+this.prg_end_time+',"logStartDate":'+getdate.getTime()+',"nico_URL":"'+this.url_page+'"}'+'\n', (err) => {
                if (err) throw err;
            });
        }
        else {//getdate.toFormat("YYYY/MM/DD HH24時MI分SS秒")
            fs.writeFile(this.dir_filesave+'/'+getdate.toFormat("YYYYMMDD")+this.sv_file_name, '{"ChannelName":"'+this.channel_name+'","ProgramName":"'+this.program_name+'","StartTime":'+this.prg_str_time+',"EndTime":'+this.prg_end_time+',"logStartDate":'+getdate.getTime()+',"nico_URL":"'+this.url_page+'"}'+'\n', (err) => {
                if (err) throw err;
            });
        }
        console.log("WebSocket Connection ==> " + url_view);
        // Media WebSocket Connection
        this.re_con_socket();
        this.viewsockcnct(url_view);
    } catch(e) {
        console.error(e);
    }
}

nico_come_reader.prototype.getLatestDate = async function(page, url){
    // Open URL Page
    await page.goto(url);
    // Browser JavaScript
    return await page.evaluate(() => JSON.parse(document.getElementById("embedded-data").getAttribute("data-props")).site.relive.webSocketUrl);
}

nico_come_reader.prototype.viewsockcnct = function(url_view) {
    const that = this;
    this.client.connect(url_view, null, null, {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'}, null);
    this.client.on('connectFailed', function(error) {
        console.log('View Session Connect Error: ' + error.toString());
    });
    this.client.on('connect', function(connection) {
        console.log('WebSocket Client Connected[View Session]: '+that.channel_name);
        that.socket_view = connection;
    
        connection.sendUTF(message_system_1);
        connection.sendUTF(message_system_2);
    
        connection.on('error', function(error) {
            console.log("View Session Connection Error: " + error.toString());
        });
    
        connection.on('close', function() {
            console.log('WebSocket Client Closed[View Session]: '+that.channel_name);
            if(that.socket_come)that.socket_come.close();
            getdate = new Date();
            if(that.prg_end_time >= getdate.getTime() && that.flg_end == 0)that.lncbrwser(that.url_page);
        });
    
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                
                // Get Comment WWS Addres & Option Data
                if(message.utf8Data.indexOf("room")>0) {
                    evt_data_json = JSON.parse(message.utf8Data);
                    uri_comment = evt_data_json.data.messageServer.uri
                    threadID = evt_data_json.data.threadId
                    message_comment = '[{"ping":{"content":"rs:0"}},{"ping":{"content":"ps:0"}},{"thread":{"thread":"'+threadID+'","version":"20061206","user_id":"guest","res_from":-150,"with_global":1,"scores":1,"nicoru":0}},{"ping":{"content":"pf:0"}},{"ping":{"content":"rf:0"}}]';
                    console.log("WebSocket Connection ==> " + uri_comment);
                    // Comment WebSocket Connection
                    that.comesockcnct(uri_comment,message_comment);
                }
                
                // Keep View Session
                if(message.utf8Data.indexOf("ping")>0) {
                    connection.sendUTF('{"type":"pong"}');
                    connection.sendUTF('{"type":"keepSeat"}');
                }
            }
        });
    });
}
  
// Comment Session: WebSocket Connection
nico_come_reader.prototype.comesockcnct = function(uri_comment,message_comment) {
    const that = this;
    this.comclient.connect(uri_comment, 'niconama', {
        headers: {
            'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
            'Sec-WebSocket-Protocol': 'msg.nicovideo.jp#json',
        },
    });
    this.comclient.on('connectFailed', function(comerror) {
        console.log('Comment Session Connect Error: ' + comerror.toString());
    });
    this.comclient.on('connect', function(connection) {
        console.log('WebSocket Client Connected[Comment Session]: '+that.program_name);
        that.socket_come = connection;
      
        connection.sendUTF(message_comment);
    
        // Comment Session Keep Alive
        setInterval((connection)=>{connection.sendUTF("");}, 60000, connection);
        setInterval((connection, end_time)=>{
            getdate = new Date();
            if(end_time < getdate.getTime() && that.flg_end == 0){
                connection.close();
            }
        }, 60000, connection, that.prg_end_time);
      
        connection.on('error', function(error) {
        console.log("Comment Session Connection Error: " + error.toString());
        });
    
        connection.on('close', function() {
            console.log('WebSocket Client Closed[Comment Session]: '+that.program_name);
            that.socket_view.close();
            /*fs.writeFile(this.dir_filesave+'/'+getdate.toFormat("YYYYMMDD")+this.sv_file_name, 'close', {flag:'a'}, (err) => {
                if (err) throw err;
            });*/
        });
    
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                if (message.utf8Data.indexOf("chat")>0){
                    let baff = JSON.parse(message.utf8Data);
                    if (baff.chat.content.indexOf('spi')<=0 && baff.chat.content.indexOf('nicoad')<=0){
                        getdate = new Date();
                        if (that.prg_str_time <= baff.chat.date*1000 && baff.chat.date*1000 <= that.prg_end_time) {
                            if (getdate.toFormat("HH24")-0 <= 3) {
                                fs.writeFile(that.dir_filesave+'/'+(getdate.toFormat("YYYYMMDD")-1)+that.sv_file_name, message.utf8Data+'\n', {flag:'a'}, (err) => {
                                    if (err) throw err;
                                });
                            }
                            else {
                                fs.writeFile(that.dir_filesave+'/'+getdate.toFormat("YYYYMMDD")+that.sv_file_name, message.utf8Data+'\n', {flag:'a'}, (err) => {
                                if (err) throw err;
                                });
                            }
                        }
  
                        //console.log('Received Coment: (TIME: '+baff.chat.date+', OPT: '+baff.chat.mail +') '+baff.chat.content);
                    }
                }
            }
        });
    });
}
