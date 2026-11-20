var node = $environment.params;

function request() {
    return $task.fetch({
        url: "https://my.ippure.com/v1/info",
        method: "GET",
        timeout: 5000,
        headers: {
            "User-Agent": "Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
        },
        opts: { policy: node }
    }).then(function(res) {
        return res.body;
    }).catch(function() {
        return null;
    });
}

function risk(score) {
    var num = Number(score);
    if (score === null || score === undefined || score === "" || !isFinite(num)) return { color: "#999999", score: "?" };
    if (num >= 50) return { color: "#E54A4A", score: num };
    if (num >= 20) return { color: "#E58A20", score: num };
    return { color: "#3DC472", score: num };
}

(async function() {
    var body = await request();

    if (!body) {
        $done({
            title: "查询结果",
            htmlMessage: `
                <div style="text-align:center;font-family:-apple-system;">
                    <br>
                    <div style="font-size:15px;font-weight:600;color:#E58A20;">
                        节点「${node}」查询失败!
                    </div>
                </div>
            `
        });
        return;
    }

    var data = JSON.parse(body);
    var rslt = risk(data.fraudScore);
    var netw = data.isResidential ? "家庭宽带" : "数据中心";
    var bcas = data.isBroadcast ? "广播IP" : "非广播IP";

    var html = `
        <div style="text-align:center;font-family:-apple-system;">
            <div style="line-height:1.6;font-size:45px;font-family:Avenir Next;font-weight:600;color:${rslt.color};">${rslt.score}<span style="font-size:30px;">%</span>
            </div><br><br>
            
            <div style="text-align:center;font-size:15px;line-height:0.1;font-weight:500;">
                <div>IP ${data.ip}</div>
                <div style="color:#999;">—</div>
                <div>${netw}</div>
                <div style="color:#999;">—</div>
                <div>${bcas}</div>
                <div style="color:#999;">—</div>
                <div>节点${node}</div>
            </div>
        </div>
    `;

    $done({
        title: "查询结果",
        htmlMessage: html
    });
})();
