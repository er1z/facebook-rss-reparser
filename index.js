var request = require('request');
var cheerio = require('cheerio');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var url = require('url');

var express = require('express'),
    app = express();

var port = require('./package.json').options.port;

app.locals.pretty = true;
app.set('port', process.env.PORT || port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(errorHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.route('/')
    .get(function(req, res) {
        res.render('index');
    })
    .post(function(req, res) {
      
        var pageUrl = req.body.pageUrl;
        request({
            url: pageUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
            },
        }, function(error, response, body) {
            var re = /page_id=(\d+)/;
            var match = re.exec(body);
            var pageId = match[1];
            res.redirect('/reparse?id=' + pageId);
        });
    });

app.route('/reparse').get(function(req, res) {


    if (!req.query.id) {
        res.status(404);
        return;
    }

    var source = request({
            url: 'http://www.facebook.com/feeds/page.php?format=atom10&id=' + req.query.id,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
            }
        },function(error, response, body) {

            if (response.statusCode !== 200) {
                res.status(response.statusCode);
                return
            }
            var $ = cheerio.load(body, {
                xmlMode: true
            });

            var contents = $('content');

            contents.each(function(i) {
                var content = contents.eq(i).html();

                content = content.replace(/<!\[CDATA\[([^\]]+)\]\]>/ig, "$1");

                var sub = cheerio.load(content);
                var subs = sub('a');

                subs.each(function(i, v) {
                    var href = subs.eq(i).attr('href');

                    var url_parts = url.parse(href, true);
                    var query = url_parts.query;

                    subs.eq(i).attr({
                        'href': query.u,
                        'onclick': '',
                        'onmouseover': ''
                    });

                });

                var imgs = sub('img');
                imgs.each(function(i, v) {
                    var href = imgs.eq(i).attr('src');

                    var url_parts = url.parse(href, true);
                    var query = url_parts.query;

                    console.log(href);

                    imgs.eq(i).attr({
                        'src': query.url,
                        'onclick': '',
                        'onmouseover': ''
                    });

                });

                contents.eq(i).html('<![CDATA[' + sub.html() + ']]>');
            });

            res.header("Content-Type", "application/rss+xml");
            res.status(200).send($.html());

        });
});

app.listen(app.get('port'), function() {
    console.log('Listening on: ' + app.get('port'));
});
