const casper = require('casper').create({
    verbose: true,
    logLevel: 'error',
    pageSettings: {
        loadImages: false,
        loadPlugins: false
    }
}),
    config = require('config.json'),
    target_month = config['target_month'] || '2018-09',
    target_url_placeholder = config['target_url_placeholder'],
    url = config['url'],
    username = config['username'],
    password = config['password'],
    target_url = target_url_placeholder.replace(new RegExp('{{time}}', 'g'), '2018-03-02'),
    fs = require('fs');

casper.start(url, function login() {
    console.log('step 1: login');

    this.waitForSelector('form#login', function () {
        this.fill('form#login', {
            'userAccount': username,
            'password': password,
        }, true)
    });
});

casper.then(function open() {
    this.echo(`step 2. open url ${target_url}`);
    this.waitForText('食安追溯', function () {
        this.thenOpen(target_url, function () {
            this.waitForSelector('a.btn1', function () {
                this.capture('screenshots/export.png');
                // 导出
                this.click('.btn1');
            });
        })
    });
})

casper.run();

//Crawl------------------------
casper.on('remote.message', function (msg) {
    this.echo('remote.msg: ' + msg);
});

casper.on('error', function (msg) {
    this.die(msg);
});

casper.on('run.complete', function () {
    this.echo('Completed');
    this.exit();
});

// download
casper.on('resource.received', function (resource) {
    if ((resource.url.indexOf('exportAllWares.htm?schoolIdstr=') !== -1)) {
        const url = resource.url, file = '2018-03-02.xls';
        this.echo(`download url is ${url}`)
        try {
            const download = fs.workingDirectory + '/' + file;
            this.echo(`attempting to download file to ${download}`);
            this.download(url, download);
        } catch (e) {
            this.echo(e);
        }
    }
});