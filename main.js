const casper = require('casper').create({
    waitTimeout: 5000, // 5s
    verbose: true,
    logLevel: 'error',
    pageSettings: {
        loadImages: false,
        loadPlugins: false
    }
}),
    config = require('config.json'),
    start_month = config['start_month'] || formatMonth(),
    end_month = config['end_month'] || formatMonth(),
    preview_url_placeholder = config['preview_url_placeholder'],
    target_url_placeholder = config['target_url_placeholder'],
    url = config['url'],
    username = config['username'],
    password = config['password'],
    fs = require('fs'),
    previewlinks = resolvepreviewlinks();

casper.userAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36');

casper.start(url, function login() {
    this.echo('step 1: login');
    this.waitForSelector('form#login', function () {
        this.fill('form#login', {
            'userAccount': username,
            'password': password,
        }, true)
    });
});

casper.then(function open() {
    this.echo('step 2. download');
    this.waitForText('食安追溯', function () {
        // loop by date
        this.each(previewlinks, function (self, preview_url) {
            self.thenOpen(preview_url, function () {
                if (self.exists('.product__item')) {
                    var segments = preview_url.split('supplyDateMenu=');
                    if (segments.length != 2) {
                        return;
                    }

                    target_url = resolvedownloadlink(segments[1]);
                    self.echo('target url is ' + target_url);
                    self.thenOpen(target_url, function download() {
                        self.waitForSelector('a.btn1', function () {
                            // this.capture('screenshots/export.png');
                            // 导出
                            self.click('.btn1');
                        });
                    });
                }
            });
        });
    });
});

casper.run();

// ------------------------ event handlers ------------------------
casper.on('remote.message', function (msg) {
    this.echo('remote.msg: ' + msg);
});

casper.on('error', function (msg) {
    this.die(msg);
});

casper.on('run.complete', function () {
    this.echo('completed');
    this.exit();
});

// download
casper.on('resource.received', function (resource) {
    if ((resource.url.indexOf('exportAllWares.htm?schoolIdstr=') !== -1)) {
        const url = resource.url, file = resolvefilename(url);
        this.echo('download url is ' + url);
        this.echo('download file is ' + file);
        try {
            const download = fs.pathJoin(fs.workingDirectory, 'output', file);
            this.echo('attempting to download file to ' + download);
            this.download(url, download);
        } catch (e) {
            this.echo(e);
        }
    }
});

// ------------------------ helpers ------------------------
function formatMonth(date) {
    var d = new Date();
    if (date instanceof Date) {
        d = new Date(date);
    }
    var month = '' + (d.getMonth() + 1),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    return [year, month].join('-');
}

function formatDate(date) {
    var d = new Date(date);
    if (date instanceof Date) {
        d = new Date(date);
    }
    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function resolvepreviewlinks() {
    var links = [];
    const start = new Date(start_month.split('-')[0], start_month.split('-')[1]),
        end = new Date(end_month.split('-')[0], end_month.split('-')[1]);

    for (var m = start; m <= end; m.setMonth(m.getMonth() + 1)) {
        var target_month = formatDate(m);
        const year = target_month.split('-')[0],
            month = target_month.split('-')[1] - 1,
            firstDay = new Date(year, month, 1),
            lastDay = new Date(year, month + 1, 0),
            today = new Date();

        if (lastDay > today) {
            lastDay = today
        }

        for (var d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
            preview_url = preview_url_placeholder.replace(new RegExp('{{time}}', 'g'), formatDate(d));
            links.push(preview_url);
        }
    }

    return links;
}

function resolvedownloadlink(d) {
    return target_url_placeholder.replace(new RegExp('{{time}}', 'g'), d);
}

function resolvefilename(target_url) {
    const segments = target_url.split('supplyDateMenu=');
    if (segments.length != 2) {
        return '';
    }
    return segments[1] + '.xls';
}