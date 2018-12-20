const casper = require('casper').create({
    waitTimeout: 10000,
    verbose: true,
    logLevel: 'error',
    pageSettings: {
        loadImages: false,
        loadPlugins: false
    }
}),
    config = require('config.json'),
    target_month = config['target_month'] || '2018-09',
    target_url_placeholder = config["target_url_placeholder"],
    url = config['url'],
    username = config['username'],
    password = config['password'],
    target_url = target_url_placeholder.replace(new RegExp('{{time}}', 'g'), "2018-03-02");

casper.start(url, function login() {
    console.log('step 1: login');

    this.waitForSelector('form#login', function () {
        this.fill('form#login', {
            'userAccount': username,
            'password': password,
        }, true)
    });
});

// casper.then(function trace() {
//     console.log('step 2: trace');
//     this.waitForText("食安追溯", function() {
//         this.capture('screenshots/login.png');
//         // click on 1st result link
//         this.click('a.reviewed');
//     });
// });

// casper.then(function search() {
//     console.log('step 3: search');
//     this.waitForSelector('a#query', function(){
//         this.capture('screenshots/trace.png');
//         // set search time
//         this.sendKeys('input#datepicker', target_time);
//         // click on 1st result link
//         this.click('a#query');
//     });
// });

casper.then(function open() {
    console.log(`step 2. open url ${target_url}`);

    this.waitForText("食安追溯", function () {
        this.thenOpen(target_url, function () {
            this.wait(3000, function () {
                this.capture('screenshots/export.png');
            });


            // this.waitForText('食谱', function () {
            //     this.capture('screenshots/export.png');

            //     // 导出
            //     // this.click('.btn1');
            // });
        })
    });
})



// casper.then(function download() {
//     console.log('step 4: download');
//     this.waitForSelector('a#query', function(){
//         this.capture('screenshots/trace.png');
//         // set search time
//         this.sendKeys('input#datepicker', target_time);
//         // click on 1st result link
//         this.click('a#query');
//     });
// });

casper.run();

//Crawl------------------------
casper.on("remote.message", function (msg) {
    this.echo("remote.msg: " + msg);
});

casper.on("error", function (msg) {
    this.die(msg);
});

casper.on('run.complete', function () {
    this.echo('Completed');
    this.exit();
});
