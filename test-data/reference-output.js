"use strict";

var server = require("http").createServer(uriRouter),
    fs = require("fs");

function uriRouter(req, resp) {
    switch(req.url) {
        case "/css?family=Source+Sans+Pro:400,600,400italic,600italic":
            f959b03badf7c45230f47384f1aff30c268996ccc(req, resp);
            break;
        case "/styletoggle.js":
            f9615696c0a3f547cc8bcb1dd0c4eb5eef41fd936(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=79180":
            fee81fef5759562d24d03da9ed2c1d4df86712533(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=79419":
            f8d5aeb509f7622e95057468a8764042104da3ea3(req, resp);
            break;
        case "/imgnew/filmstrip_arrows-1221.png":
            f46783668a615cd668aaee0062dde08155db231f8(req, resp);
            break;
        case "/imgnew/topcomments-big.png":
            f8e6a028de9b300c1b99033e6b5f620a6cd178f24(req, resp);
            break;
        case "/imgnew/bg3.png":
            f3e280e55da049b86eb44383e99fb191de5e77dc8(req, resp);
            break;
        case "/imgnew/toplinks2.png":
            fbdd468fb3befdc4fa383c1dee307d79088549ef4(req, resp);
            break;
        case "/imgnew/morebg2.png":
            f9dd31b3ea98f26b5660c5dd55a9a887ed540390a(req, resp);
            break;
        case "/imgnew/style-toggle.png":
            f017ab055dc0a293f16c2859e9162242eef80eea0(req, resp);
            break;
        case "/javascript/customizebox.20140905.js":
            ffd466abdf9ae24b39cda435f4fd0513800a12a84(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=79302":
            fe3e8cf81838c2e0c95b24b85c8db679b3429b798(req, resp);
            break;
        case "/r.x/ssd-endurance-0513/drives1.jpg":
            f9e836e0216a96e8f370e48b1680531ef4cedb1fd(req, resp);
            break;
        case "/imgnew/fp/blog-line.png":
            f7a97b4be815b45c2cfbc6bdbb727f2b4b3091f72(req, resp);
            break;
        case "/imgnew/topcomments-callout.png":
            f2509676a1ffc43acb744dfc1f0fa64564d3ef258(req, resp);
            break;
        case "/thumbs.x/smnew/2015_4_17_Star_Wars_Battlefront_trailer_will_leave_your_jaw_on_the_desk/battlefront-feature.jpg":
            facef7c7e93a9934031a21703ebcb20c5bdc35968(req, resp);
            break;
        case "/imgnew/logo5.png":
            f134b636c6b0d74c99a958720c47cab8fb07440b4(req, resp);
            break;
        case "/imgnew/search-button.png":
            f0f5bb59ca057c3d8ee3afc71805049a636f89dba(req, resp);
            break;
        case "/imgnew/navarrows.png":
            f8242ae2952bc41c1683725d56051e71bad64b96c(req, resp);
            break;
        case "/css?family=Lato:400,700,900,400italic,700italic":
            f0c124a628ef71b70a6eff9d1a054d4311a45312d(req, resp);
            break;
        case "/review/24841/introducing-the-ssd-endurance-experiment":
            f32addb156f5c09834ee061e4c599299cf8ed5f11(req, resp);
            break;
        case "/javascript/jquery-1.10.2.min.js":
            f8ac0d794925f54f4ce167fc21ea22d75dac46617(req, resp);
            break;
        case "/javascript/jquery.cookie.js":
            f85b5717003ed730c3a1a7815ad51d4b38a814da2(req, resp);
            break;
        case "/gallery/gallery.js?20120901":
            f45ceadf0037a0251c6b82563af4cb1185c67acaf(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=79104":
            ff51f41b783bde895e41bce029f86229e4caa4c59(req, resp);
            break;
        case "/imgnew/filmstrip_listbox-1221.png":
            f012261e0d21ca4d06298e6bd4541a0e424f4d0ac(req, resp);
            break;
        case "/imgnew/fp/bubble-small.png":
            f32cab0e87e3fe6f6f4785574535d75bb1de9d2a1(req, resp);
            break;
        case "/imgnew/footer-bg.png":
            f223e5a04b52cc719e41b8941a26dd47acf8e0f5c(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=66139":
            f9dbfde65086f92e23082567bcda112acece951e7(req, resp);
            break;
        case "/imgnew/socialicons2.png":
            fb02a5fa84facea923a953c01c26560c7433a4d5a(req, resp);
            break;
        case "/imgnew/fullwidth-head2.png":
            fb623d465db10834d31101122340482ecea895f30(req, resp);
            break;
        case "/print.20140905.css":
            fa5bb3e1f81e66bfa1c29ebe1ee156c7f52bd3f75(req, resp);
            break;
        case "/javascript/tr_auto_affiliate.min.20141125.js":
            fa53308db074f35e755cc88bc85faa4eb56816a39(req, resp);
            break;
        case "/imgnew/subs/rightcolguide.png":
            fd0bace9aee2dd1563ec01bcf861250957d3db429(req, resp);
            break;
        case "/imgnew/fp/bullet.png":
            f90e4445f19789c74243f4c5996ed99752e9a6b58(req, resp);
            break;
        case "/imgnew/topcomments-fade.png":
            f8ad766b6853e8c48515c3a772485b43f41c55550(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=66140":
            fccd48d1883b2525b1e408c026707df0b64f560bf(req, resp);
            break;
        case "/imgnew/google_custom_search_watermark.gif":
            fb32dc732ddf4efab0998807c5a49604d772ff755(req, resp);
            break;
        case "/imgnew/subs/singlepage-print.png":
            f9b46b4ae74b5dacb57eb2aec8940eaecd0aa101b(req, resp);
            break;
        case "/metal/css/main.20140905.02.css":
            f34c2f31aaa1d302263ac0c9a3d3f5b2b6f5c0d04(req, resp);
            break;
        case "/include/yui/2.4/yahoo-min.js":
            f828d1484d9229089de8a1f1170d3d792376a9706(req, resp);
            break;
        case "/imgnew/subs/rightcolsub.png":
            fb1e4ea3fc409903fbd9ecd7bc12711c562818e3b(req, resp);
            break;
        case "/imgnew/rightcol-foot2.png":
            f29f32902ca98028eac6a7b4cecb418f498f196db(req, resp);
            break;
        case "/img/blank.gif":
            fc40a52c6121018f0bb5925bb89a49e546c102300(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=66141":
            ff8673e993e25fbc7d294cdd2469803d32cb25e22(req, resp);
            break;
        case "/imgnew/fullwidth-footer.png":
            fd53e1876fb561b1867edda4e1eadb5c0ff8b4444(req, resp);
            break;
        case "/imgnew/articles-discussions-footer.png":
            fac90cba1ec934199d49041c55e09d8145ab80742(req, resp);
            break;
        case "/stylenew.20141114.css":
            f0cd0a015361455a957f97389f4db5e02c93dfed9(req, resp);
            break;
        case "/include/yui/2.4/utilities.js":
            fcb5552a8808664212e4758a410139129a3684433(req, resp);
            break;
        case "/r.x/ssd-endurance-0513/software-anvil.jpg":
            f4cc5f2ae9ddf8796c77e81af989f8b5ef1e78482(req, resp);
            break;
        case "/imgnew/rightcol-head3.png":
            fc0a472ccba1f86939e778e1d48d2e81aaf592e18(req, resp);
            break;
        case "/imgnew/topcomments-small.png":
            f1f542ca5554012d8a22bf06f579fe20773cc5a2d(req, resp);
            break;
        case "/gallery/img.x?sz=gallery_thumb&id=66135":
            fedbb221e97a50a7fadc917cfd88925ed0c2e61e5(req, resp);
            break;
        case "/imgnew/navbar2.png":
            f7075b5d57b5ff4e74d595b79f8cc440a4a4b06af(req, resp);
            break;
        case "/imgnew/toplinks-toggle3.png":
            f5dfa5e28e7721ca13401df760bacf4f645839798(req, resp);
            break;
        case "/imgnew/articles-footer-bubble.png":
            f3716c5a39eaec1d415ddf8089e80729f94e7e453(req, resp);
            break;
    }
}
function f959b03badf7c45230f47384f1aff30c268996ccc(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(200, "OK", {"Content-Type":"text/css","Timing-Allow-Origin":"*","Expires":"Sat, 18 Apr 2015 20:04:47 GMT","Date":"Sat, 18 Apr 2015 20:04:47 GMT","Cache-Control":"private, max-age=86400","Content-Encoding":"gzip","Content-Length":"485","X-Content-Type-Options":"nosniff","X-Frame-Options":"SAMEORIGIN","X-XSS-Protection":"1; mode=block","Server":"GSE","Alternate-Protocol":"80:quic,p=1"});
        resp.end();
    });
    req.resume()
}

function f9615696c0a3f547cc8bcb1dd0c4eb5eef41fd936(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=150","ETag":"\"658f-2f8-439523bf731c0\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fee81fef5759562d24d03da9ed2c1d4df86712533(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(200, "OK", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","X-Powered-By":"PHP/5.3.3","Expires":"Sun, 19 Apr 2015 20:04:47 GMT","Cache-Control":"max-age=86400","Pragma":"public","Last-Modified":"Wed, 01 Apr 2015 19:36:15 GMT","Vary":"Accept-Encoding","Content-Encoding":"gzip","Keep-Alive":"timeout=1, max=149","Connection":"Keep-Alive","Transfer-Encoding":"chunked","Content-Type":"image/jpeg"});
        var body = fs.createReadStream("/home/johnny/working/git-clones/quick-http-repro/flows/096.126.115.201.00080-024.019.225.228.13836", {start:611, end:6505});
        body.on("data", function(chunk) {
            chunks.push(chunk);
            totalLen += chunk.length;
        });
        body.on("end", function() {
            chunks = Buffer.concat(chunks, totalLen);
            doChunkStream(chunks, resp);
        });
    });
    req.resume()
}

function f8d5aeb509f7622e95057468a8764042104da3ea3(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=148","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f46783668a615cd668aaee0062dde08155db231f8(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=147","ETag":"\"6ea043-5be-497e747ff5d00\""});
        resp.end();
    });
    req.resume()
}

function f8e6a028de9b300c1b99033e6b5f620a6cd178f24(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=146","ETag":"\"6ea084-360-4a0a6fac3e4c0\""});
        resp.end();
    });
    req.resume()
}

function f3e280e55da049b86eb44383e99fb191de5e77dc8(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=145","ETag":"\"6ea03c-12e-49711ac5f2f40\""});
        resp.end();
    });
    req.resume()
}

function fbdd468fb3befdc4fa383c1dee307d79088549ef4(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=144","ETag":"\"6ea08b-1da8-497005bdf5600\""});
        resp.end();
    });
    req.resume()
}

function f9dd31b3ea98f26b5660c5dd55a9a887ed540390a(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=143","ETag":"\"6ea05a-3b6-4973f9677a580\""});
        resp.end();
    });
    req.resume()
}

function f017ab055dc0a293f16c2859e9162242eef80eea0(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=142","ETag":"\"6ea07c-266-49c89ee1a5b80\""});
        resp.end();
    });
    req.resume()
}

function ffd466abdf9ae24b39cda435f4fd0513800a12a84(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=150","ETag":"\"6510-1511-502593b40ca40\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fe3e8cf81838c2e0c95b24b85c8db679b3429b798(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(200, "OK", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","X-Powered-By":"PHP/5.3.3","Expires":"Sun, 19 Apr 2015 20:04:47 GMT","Cache-Control":"max-age=86400","Pragma":"public","Last-Modified":"Mon, 06 Apr 2015 16:53:00 GMT","Vary":"Accept-Encoding","Content-Encoding":"gzip","Keep-Alive":"timeout=1, max=149","Connection":"Keep-Alive","Transfer-Encoding":"chunked","Content-Type":"image/jpeg"});
        var body = fs.createReadStream("/home/johnny/working/git-clones/quick-http-repro/flows/096.126.115.201.00080-024.019.225.228.14504", {start:612, end:3465});
        body.on("data", function(chunk) {
            chunks.push(chunk);
            totalLen += chunk.length;
        });
        body.on("end", function() {
            chunks = Buffer.concat(chunks, totalLen);
            doChunkStream(chunks, resp);
        });
    });
    req.resume()
}

function f9e836e0216a96e8f370e48b1680531ef4cedb1fd(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=148","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f7a97b4be815b45c2cfbc6bdbb727f2b4b3091f72(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=147","ETag":"\"1192c-128-496a19b2a8a00\""});
        resp.end();
    });
    req.resume()
}

function f2509676a1ffc43acb744dfc1f0fa64564d3ef258(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=146","ETag":"\"6ea085-166-4a0a6f22ea0c0\""});
        resp.end();
    });
    req.resume()
}

function facef7c7e93a9934031a21703ebcb20c5bdc35968(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=145","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f134b636c6b0d74c99a958720c47cab8fb07440b4(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=144","ETag":"\"6ea059-2fae-49bb85ec37c40\""});
        resp.end();
    });
    req.resume()
}

function f0f5bb59ca057c3d8ee3afc71805049a636f89dba(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=143","ETag":"\"6ea071-572-49707f41dc6c0\""});
        resp.end();
    });
    req.resume()
}

function f8242ae2952bc41c1683725d56051e71bad64b96c(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=142","ETag":"\"6ea05b-33b-4976c4f449740\""});
        resp.end();
    });
    req.resume()
}

function f0c124a628ef71b70a6eff9d1a054d4311a45312d(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(200, "OK", {"Content-Type":"text/css","Timing-Allow-Origin":"*","Expires":"Sat, 18 Apr 2015 20:04:47 GMT","Date":"Sat, 18 Apr 2015 20:04:47 GMT","Cache-Control":"private, max-age=86400","Content-Encoding":"gzip","Content-Length":"462","X-Content-Type-Options":"nosniff","X-Frame-Options":"SAMEORIGIN","X-XSS-Protection":"1; mode=block","Server":"GSE","Alternate-Protocol":"80:quic,p=1"});
        resp.end();
    });
    req.resume()
}

function f32addb156f5c09834ee061e4c599299cf8ed5f11(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(200, "OK", {"Date":"Sat, 18 Apr 2015 20:04:46 GMT","Server":"Apache/2.2.15 (CentOS)","X-Powered-By":"PHP/5.3.3","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Pragma":"no-cache","Vary":"Accept-Encoding","Content-Encoding":"gzip","Content-Length":"11719","Keep-Alive":"timeout=1, max=150","Connection":"Keep-Alive","Content-Type":"text/html; charset=UTF-8"});
        var body = fs.createReadStream("/home/johnny/working/git-clones/quick-http-repro/flows/096.126.115.201.00080-024.019.225.228.38222", {start:416, end:12134});
        body.on("data", function(chunk) {
            chunks.push(chunk);
            totalLen += chunk.length;
        });
        body.on("end", function() {
            chunks = Buffer.concat(chunks, totalLen);
            resp.end(chunks);
        });
    });
    req.resume()
}

function f8ac0d794925f54f4ce167fc21ea22d75dac46617(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:46 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=149","ETag":"\"6ee01c-16bb3-4e25bb7c6c100\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f85b5717003ed730c3a1a7815ad51d4b38a814da2(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=148","ETag":"\"6ee020-1097-4975697e21380\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f45ceadf0037a0251c6b82563af4cb1185c67acaf(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=147","ETag":"\"6e007b-1129-4c8098779a600\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function ff51f41b783bde895e41bce029f86229e4caa4c59(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(200, "OK", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","X-Powered-By":"PHP/5.3.3","Expires":"Sun, 19 Apr 2015 20:04:47 GMT","Cache-Control":"max-age=86400","Pragma":"public","Last-Modified":"Wed, 01 Apr 2015 01:34:45 GMT","Vary":"Accept-Encoding","Content-Encoding":"gzip","Keep-Alive":"timeout=1, max=146","Connection":"Keep-Alive","Transfer-Encoding":"chunked","Content-Type":"image/jpeg"});
        var body = fs.createReadStream("/home/johnny/working/git-clones/quick-http-repro/flows/096.126.115.201.00080-024.019.225.228.38222", {start:13174, end:17052});
        body.on("data", function(chunk) {
            chunks.push(chunk);
            totalLen += chunk.length;
        });
        body.on("end", function() {
            chunks = Buffer.concat(chunks, totalLen);
            doChunkStream(chunks, resp);
        });
    });
    req.resume()
}

function f012261e0d21ca4d06298e6bd4541a0e424f4d0ac(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=145","ETag":"\"6ea045-6d1-497e779f23a80\""});
        resp.end();
    });
    req.resume()
}

function f32cab0e87e3fe6f6f4785574535d75bb1de9d2a1(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=144","ETag":"\"11930-4d6-496c78c0a82c0\""});
        resp.end();
    });
    req.resume()
}

function f223e5a04b52cc719e41b8941a26dd47acf8e0f5c(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=143","ETag":"\"6ea049-bd-49714970a0900\""});
        resp.end();
    });
    req.resume()
}

function f9dbfde65086f92e23082567bcda112acece951e7(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=142","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fb02a5fa84facea923a953c01c26560c7433a4d5a(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=141","ETag":"\"6ea07a-685-497a6fc2cc380\""});
        resp.end();
    });
    req.resume()
}

function fb623d465db10834d31101122340482ecea895f30(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=140","ETag":"\"6ea04e-f23-49743fabaed00\""});
        resp.end();
    });
    req.resume()
}

function fa5bb3e1f81e66bfa1c29ebe1ee156c7f52bd3f75(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=150","ETag":"\"6ae0d0-600-502594a277cc0\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fa53308db074f35e755cc88bc85faa4eb56816a39(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=149","ETag":"\"6e601a-87e-508b687cd44c0\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fd0bace9aee2dd1563ec01bcf861250957d3db429(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=148","ETag":"\"1195a-2b99-4e4a2b1488f40\""});
        resp.end();
    });
    req.resume()
}

function f90e4445f19789c74243f4c5996ed99752e9a6b58(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=147","ETag":"\"11933-9f-496a1e98bd8c0\""});
        resp.end();
    });
    req.resume()
}

function f8ad766b6853e8c48515c3a772485b43f41c55550(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=146","ETag":"\"6ea086-171-4a0c30357df80\""});
        resp.end();
    });
    req.resume()
}

function fccd48d1883b2525b1e408c026707df0b64f560bf(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=145","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fb32dc732ddf4efab0998807c5a49604d772ff755(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=144","ETag":"\"6ea054-7e8-4f1342b4e7c80\""});
        resp.end();
    });
    req.resume()
}

function f9b46b4ae74b5dacb57eb2aec8940eaecd0aa101b(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=143","ETag":"\"11960-4e7-4e5a79781adc0\""});
        resp.end();
    });
    req.resume()
}

function f34c2f31aaa1d302263ac0c9a3d3f5b2b6f5c0d04(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=150","ETag":"\"10c5c-3d3b-502666ca18e00\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f828d1484d9229089de8a1f1170d3d792376a9706(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=149","ETag":"\"11ac9-16d8-446ef6dcb2300\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fb1e4ea3fc409903fbd9ecd7bc12711c562818e3b(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=148","ETag":"\"1195d-26e6-4e4a2629af540\""});
        resp.end();
    });
    req.resume()
}

function f29f32902ca98028eac6a7b4cecb418f498f196db(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=147","ETag":"\"6ea06f-fc-49711e93a6880\""});
        resp.end();
    });
    req.resume()
}

function fc40a52c6121018f0bb5925bb89a49e546c102300(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=146","ETag":"\"6e8061-2b-4388b44292780\""});
        resp.end();
    });
    req.resume()
}

function ff8673e993e25fbc7d294cdd2469803d32cb25e22(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=145","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fd53e1876fb561b1867edda4e1eadb5c0ff8b4444(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=144","ETag":"\"6ea04c-159-49727e537ca00\""});
        resp.end();
    });
    req.resume()
}

function fac90cba1ec934199d49041c55e09d8145ab80742(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=143","ETag":"\"6ea036-c52-497681d9c0600\""});
        resp.end();
    });
    req.resume()
}

function f0cd0a015361455a957f97389f4db5e02c93dfed9(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=150","ETag":"\"6ae0d4-f39d-509576225c340\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fcb5552a8808664212e4758a410139129a3684433(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=149","ETag":"\"11ac7-147a7-446ef6dcb2300\"","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f4cc5f2ae9ddf8796c77e81af989f8b5ef1e78482(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=148","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function fc0a472ccba1f86939e778e1d48d2e81aaf592e18(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=147","ETag":"\"6ea070-9e2-49743bc717dc0\""});
        resp.end();
    });
    req.resume()
}

function f1f542ca5554012d8a22bf06f579fe20773cc5a2d(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=146","ETag":"\"6ea087-26e-4a0a6eb0792c0\""});
        resp.end();
    });
    req.resume()
}

function fedbb221e97a50a7fadc917cfd88925ed0c2e61e5(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=145","Expires":"Thu, 19 Nov 1981 08:52:00 GMT","Cache-Control":"no-store, no-cache, must-revalidate, post-check=0, pre-check=0","Vary":"Accept-Encoding"});
        resp.end();
    });
    req.resume()
}

function f7075b5d57b5ff4e74d595b79f8cc440a4a4b06af(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=144","ETag":"\"6ea05f-654-497006704bac0\""});
        resp.end();
    });
    req.resume()
}

function f5dfa5e28e7721ca13401df760bacf4f645839798(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=143","ETag":"\"6ea08a-26b-49834f8848b80\""});
        resp.end();
    });
    req.resume()
}

function f3716c5a39eaec1d415ddf8089e80729f94e7e453(req, resp) {
    req.on("end", function() {
        var chunks = [], totalLen = 0;
        resp.writeHead(304, "Not Modified", {"Date":"Sat, 18 Apr 2015 20:04:47 GMT","Server":"Apache/2.2.15 (CentOS)","Connection":"Keep-Alive","Keep-Alive":"timeout=1, max=142","ETag":"\"6ea037-1ca-4976a59dfa840\""});
        resp.end();
    });
    req.resume()
}


function doChunkStream(chunks, resp) {
    var splitChunks = chunks.toString("ascii").split("\r\n"),
    i = 0,
    contentStart = 0, contentEnd = -2,
    currentLen;
    splitChunks.pop();
    splitChunks.pop();
    //console.log(splitChunks)
    while (i < splitChunks.length) {
        if (splitChunks[i] === "0" && i === splitChunks.length - 1) {
            //console.log("ended")
            resp.end();
            i += 1;
            continue;
        }
        else if (splitChunks[i+1] === splitChunks.length -1) {
            throw "unimplemented: chunk extension";
        }
        else if (/^[0-9a-fA-F]+$/.test(splitChunks[i])) {
            currentLen = splitChunks[i];
            contentStart = contentEnd + splitChunks[i].length + 4;
            contentEnd = contentStart + parseInt("0x"+currentLen, 16);
            i += 2;
        }
        else {
            contentEnd += 2+splitChunks[i].length;
            i += 1;
        }
        //console.log("i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16)+" contentlen: "+(contentEnd - contentStart))
        if (parseInt("0x"+currentLen, 16) === contentEnd-contentStart) {
            resp.write(chunks.slice(contentStart, contentEnd));
        }    }
    //console.log("OUT OF LOOP: i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16));
}

server.listen(8000);