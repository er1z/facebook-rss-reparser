var request = require('request');
var cheerio = require('cheerio');
var url = require('url');

var express = require('express'),
    app = express();

var router = express.Router();

var port = require('./package.json').options.port;

app.use(router);

app.get('/reparse', function(req,res){


    if(!req.query.id){
        res.status(404);
        return;
    }

    var source = request({
        url: 'http://www.facebook.com/feeds/page.php?format=atom10&id='+req.query.id,
        headers:
        {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
        }
    }, function(error, response, body){
        
        if(response.statusCode==200){
            
            var $ = cheerio.load(body, {
                xmlMode: true
            });
            
            var contents = $('content');
            
            contents.each(function(i){
                var content = contents.eq(i).html();
                
                content = content.replace(/<!\[CDATA\[([^\]]+)\]\]>/ig, "$1");
                
                var sub = cheerio.load(content);
                var subs = sub('a');
                
                subs.each(function(i,v){
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
                imgs.each(function(i,v){
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
                
                contents.eq(i).html('<![CDATA['+sub.html()+']]>');
            });
            
            
            res.header("Content-Type", "application/rss+xml");
            res.status(200).send($.html());
            
        }else{
            res.status(response.statusCode);
        }
        
    });
});

app.listen(port);
console.log('Listening on: '+port);