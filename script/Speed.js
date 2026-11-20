var node = $environment.params;

function request() {
    var start = Date.now();

    return $task.fetch({
        url: "https://speed.cloudflare.com/__down?bytes=50000000",
        method: "GET",
        timeout: 30000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
        },
        opts: { policy: node }
    }).then(function(res) {
        return {
            size: (res.body || "").length,
            time: Date.now() - start - 100,
            status: res.statusCode
        };
    }).catch(function() {
        return null;
    });
}

(async function() {
    var result = await request();

    if (!result || result.status !== 200 || result.size === 0 || result.time <= 0) {
        $done({
            title: "测速结果",
            htmlMessage: `
                <div style="text-align:center;font-family:-apple-system;">
                    <br>
                    <div style="font-size:15px;font-weight:600;color:#E54A4A;">
                        ${result ? "返回 HTTP:" + result.status : "未完成完整测速"}
                    </div>
                </div>
            `
        });
        return;
    }

    var speedMB = (result.size / 1000000) / (result.time / 1000);
    var speed = speedMB * 8;
    var color = speed >= 50 ? "#3DC472" : speed >= 20 ? "#E58A20" : "#E54A4A";

    var html = `
        <div style="text-align:center;font-family:-apple-system;"><br>
            <div style="line-height:1;font-size:38px;font-family:Avenir Next;font-weight:600;color:${color};">
                ${speed.toFixed(2)}<span style="font-size:30px;">Mbps</span>
            </div><br><br>

            <div style="text-align:center;font-size:15px;line-height:0.1;font-weight:500;">
                <div>平均速度 ${speedMB.toFixed(2)} MB</div>
                <div style="color:#999;">—</div>
                <div>节点${node}</div>
            </div>
        </div>
    `;

    $done({
        title: "测速结果",
        htmlMessage: html
    });
})();
