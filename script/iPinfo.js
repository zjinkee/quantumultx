if ($response.statusCode != 200) {
  $done(Null);
}

var obj = JSON.parse($response.body);

function maskIP(ip) {
  return ip.replace(/\.(\d+)$/, function(match, last) {
    return "." + "*".repeat(last.length);
  });
}

var title = " ";
var subtitle = obj.country + " IP:" + maskIP(obj.query);
var ip = maskIP(obj.query);
var description = "\n位置" + obj.country + " IP " + obj.query;

$done({title, subtitle, ip, description});
