/**
资源解析器「轻量版」
*/

var $parser = $parser || {};

// 可视化 UI
$parser.hashSchema = function () {
    var kind = $resource.type || "";
    var secs = [];
    
    if (kind === "server") {
        secs = [
            {
                type: "group",
                title: "节点处理",
                items: [
                    {
                        type: "text",
                        key: "keep",
                        label: "节点保留",
                        placeholder: "正则保留符合的节点"
                    },
                    {
                        type: "text",
                        key: "drop",
                        label: "节点排除",
                        placeholder: "正则排除符合的节点"
                    },
                    {
                        type: "text",
                        key: "name",
                        label: "节点改名",
                        placeholder: "如：香港HK:香港 分组用 +"
                    },
                    {
                        type: "text",
                        key: "sort",
                        label: "节点排序",
                        placeholder: "如：香港>台湾>韩国>美国"
                    },
                    {
                        type: "text",
                        key: "trim",
                        label: "删除名称",
                        placeholder: "匹配的名称会被删除"
                    },
                    {
                        type: "select",
                        key: "emoji",
                        label: "删除国旗",
                        options: [
                            { label: "关闭", value: "0" },
                            { label: "打开", value: "1" }
                        ]
                    }
                ]
            },
            {
                type: "group",
                title: "其他参数",
                items: [
                    {
                        type: "select",
                        key: "ua",
                        label: "拉取订阅",
                        description: "开启使用替换UA尝试获取完整节点",
                        options: [
                            { label: "关闭", value: "0" },
                            { label: "打开", value: "1" }
                        ]
                    },
                    {
                        type: "select",
                        key: "skip",
                        label: "跳过证书",
                        description: "控制TLS节点跳过证书校验",
                        options: [
                            { label: "关闭", value: "0" },
                            { label: "打开", value: "1" }
                        ]
                    },
                    {
                        type: "select",
                        key: "note",
                        label: "通知设置",
                        options: [
                            { label: "关闭", value: "0" },
                            { label: "打开", value: "1" }
                        ]
                    }
                ]
            }
        ];
    } else if (kind === "filter") {
        secs = [
            {
                type: "group",
                title: "分流处理",
                items: [
                    {
                        type: "text",
                        key: "keep",
                        label: "规则保留",
                        placeholder: "正则保留符合的规则"
                    },
                    {
                        type: "text",
                        key: "drop",
                        label: "规则排除",
                        placeholder: "正则排除符合的规则"
                    }
                ]
            }
        ];
    }
    return {
        version: 1,
        sections: secs
    };
};

$parser.hashToUI = function (hash) {
    if (!hash) return { version: 1, sections: [] };

    var form = $parser.hashSchema();
    var dict = {};
    var vals = {};
    var secs = [];

    form.sections.forEach(function (grp) {
        grp.items.forEach(function (item) { dict[item.key] = item; });
    });

    hash.split("&").forEach(function (pair) {
        if (!pair) return;
        var mark = pair.indexOf("=");
        var name = mark === -1 ? pair : pair.slice(0, mark);
        var val = mark === -1 ? "" : pair.slice(mark + 1);
        if (dict[name]) vals[name] = val;
    });

    form.sections.forEach(function (grp) {
        var rows = [];
        grp.items.forEach(function (item) {
            if (!(item.key in vals)) return;
            var node = JSON.parse(JSON.stringify(item));
            node.value = item.type === "switch" ? vals[item.key] === item.onValue : vals[item.key];
            rows.push(node);
        });
        if (rows.length) secs.push({ type: "group", title: grp.title, items: rows });
    });

    return { version: 1, sections: secs };
};

$parser.uiToHash = function (vals) {
    var form = $parser.hashSchema();
    var dict = {};
    var line = [];

    form.sections.forEach(function (grp) {
        grp.items.forEach(function (item) { dict[item.key] = item; });
    });

    Object.keys(vals).forEach(function (name) {
        var val = vals[name];
        var meta = dict[name];
        if (!meta) return;

        if (meta.type === "switch") {
            if (val) line.push(name + "=" + meta.onValue);
            else if (meta.offValue !== "") line.push(name + "=" + meta.offValue);
        } else {
            var text = String(val == null ? "" : val);
            if (text !== "") line.push(name + "=" + text);
        }
    });

    return line.join("&");
};

//工具函数
var res_info = read_res_info();
var raw_data = typeof res_info.content === "string" ? res_info.content : "";
var sub_link = typeof res_info.link === "string" ? res_info.link : "";
var res_type = res_info.type || "";
var cur_ua = typeof res_info.user_agent === "string" ? res_info.user_agent : "";
var has_ua = cur_ua.length > 0;
var hash_part = sub_link.indexOf("#") !== -1 ? sub_link.slice(sub_link.indexOf("#") + 1) : "";

function read_res_info() {
    return typeof $resource !== "undefined" && $resource ? $resource : {};
}

function get_ua() {
    return "Shadowrocket/3218 CFNetwork/3860.600.12 Darwin/25.5.0 iPhone18.1";
}

function notify(title, body) {
    if (typeof $notify === "function") $notify("资源解析器", title, body);
}

function hash_arg(name) {
    if (!hash_part) return null;
    var safe = name.replace(/[-[\]{}()*+?.,\^$|#\s]/g, "\\$&");
    var hit = hash_part.match(new RegExp("(?:^|&)" + safe + "=([^&]*)"));
    return hit ? decode_uri(hit[1]) : null;
}

function set_field(line, key, val) {
    var re = new RegExp("((?:^|,\\s*)" + key + "\\s*=\\s*)([^,]*)?", "i");
    if (re.test(line)) {
        return line.replace(re, function (_, head) { return head + val; });
    }
    var tag_pos = line.search(/,\s*tag\s*=/i);
    if (tag_pos !== -1) return line.slice(0, tag_pos) + ", " + key + "=" + val + line.slice(tag_pos);
    return line + ", " + key + "=" + val;
}

function has_tls(line) {
    return /(?:^|,)\s*(?:over-tls\s*=\s*true|obfs\s*=\s*(?:wss|over-tls|tls))/i.test(line);
}

function remove_emoji(text) {
    var raw = String(text || "");
    if (!raw) return "";
    var clean = raw
        .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, "")
        .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, "")
        .replace(/[\u2600-\u27BF\uFE00-\uFE0F\u200D]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    return clean || raw.trim();
}

function decode_utf8(raw) {
    try {
        return decodeURIComponent(
            raw.split("").map(function (ch) {
                return "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2);
            }).join("")
        );
    } catch (err) {
        return raw;
    }
}

function b64_bytes(text) {
    var pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var clean = String(text || "").replace(/[\r\n\s]/g, "").replace(/-/g, "+").replace(/_/g, "/");
    if (!clean || clean.length % 4 === 1) return "";
    while (clean.length % 4) clean += "=";

    var out = "", acc = 0, bits = 0;
    for (var i = 0; i < clean.length; i++) {
        var ch = clean.charAt(i);
        if (ch === "=") break;
        var code = pool.indexOf(ch);
        if (code < 0) return "";
        acc = ((acc << 6) | code) & 0xFFFFFF;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out += String.fromCharCode((acc >> bits) & 0xFF);
        }
    }
    return out;
}

function b64_decode(text) {
    var bytes = b64_bytes(text);
    return bytes ? decode_utf8(bytes) : "";
}

function decode_uri(text) {
    try { return decodeURIComponent(String(text || "")); } catch (err) { return String(text || ""); }
}

function parse_query(qs) {
    var map = {};
    if (!qs) return map;
    qs.split("&").forEach(function (pair) {
        if (!pair) return;
        var eq = pair.indexOf("=");
        var key = eq === -1 ? pair : pair.slice(0, eq);
        var val = eq === -1 ? "" : pair.slice(eq + 1);
        map[decode_uri(key).toLowerCase()] = decode_uri(val);
    });
    return map;
}

function is_on(val) {
    if (val === true || val === 1) return true;
    var word = String(val == null ? "" : val).trim().toLowerCase();
    return word === "1" || word === "true" || word === "yes" || word === "on";
}

function join_addr(host, port) {
    var h = String(host || "").trim();
    var p = String(port || "").trim();
    if (!h || !p) return "";
    if (h.indexOf(":") !== -1 && h.charAt(0) !== "[") h = "[" + h + "]";
    return h + ":" + p;
}

function split_addr(addr) {
    var raw = String(addr || "").trim();
    if (!raw) return { host: "", port: "" };
    if (raw.charAt(0) === "[") {
        var end = raw.indexOf("]");
        if (end !== -1) {
            var v6 = raw.slice(0, end + 1);
            var rest = raw.slice(end + 1);
            return { host: v6, port: rest.charAt(0) === ":" ? rest.slice(1) : "" };
        }
    }
    var col = raw.lastIndexOf(":");
    return col === -1 ? { host: raw, port: "" } : { host: raw.slice(0, col), port: raw.slice(col + 1) };
}

function parse_uri(body) {
    var h_pos = body.indexOf("#");
    var name = h_pos !== -1 ? decode_uri(body.slice(h_pos + 1)) : "";
    var main = h_pos !== -1 ? body.slice(0, h_pos) : body;
    var q_pos = main.indexOf("?");
    var core = q_pos !== -1 ? main.slice(0, q_pos) : main;
    var args = q_pos !== -1 ? parse_query(main.slice(q_pos + 1)) : {};
    var at_pos = core.lastIndexOf("@");
    return {
        name: name,
        core: core,
        args: args,
        user: at_pos !== -1 ? core.slice(0, at_pos) : "",
        addr_raw: at_pos !== -1 ? core.slice(at_pos + 1) : "",
        has_at: at_pos !== -1
    };
}

// 各协议独立转换函数
function ss(body) {
    var uri = parse_uri(body);
    var auth = "", hp_raw = "";
    if (uri.has_at) {
        hp_raw = uri.addr_raw;
        auth = uri.user.indexOf(":") === -1 ? (b64_decode(uri.user) || decode_uri(uri.user)) : decode_uri(uri.user);
    } else {
        var full = b64_decode(uri.core);
        var at_pos = full.lastIndexOf("@");
        if (at_pos === -1) return "";
        auth = full.slice(0, at_pos);
        hp_raw = full.slice(at_pos + 1);
    }

    var hp = split_addr(hp_raw);
    var addr = join_addr(hp.host, hp.port) || hp_raw;
    var col = auth.indexOf(":");
    if (col === -1) return "";

    var out = ["shadowsocks=" + addr, "method=" + auth.slice(0, col), "password=" + auth.slice(col + 1)];

    if (uri.args.plugin) {
        var parts = uri.args.plugin.split(";");
        var plugin = (parts[0] || "").toLowerCase();

        if (plugin === "obfs-local" || plugin === "simple-obfs") {
            for (var i = 1; i < parts.length; i++) {
                var eq = parts[i].indexOf("=");
                if (eq === -1) continue;
                var k = parts[i].slice(0, eq).trim().toLowerCase();
                var v = parts[i].slice(eq + 1).trim();
                if (v && (k === "obfs" || k === "obfs-host" || k === "obfs-uri")) {
                    out.push(k + "=" + v);
                }
            }
        } else if (plugin === "v2ray-plugin") {
            var tls_on = false, host = "", path = "/";
            for (var j = 1; j < parts.length; j++) {
                var eq2 = parts[j].indexOf("=");
                var k2 = (eq2 === -1 ? parts[j] : parts[j].slice(0, eq2)).trim().toLowerCase();
                var v2 = eq2 === -1 ? "" : parts[j].slice(eq2 + 1).trim();
                if (k2 === "tls") tls_on = true;
                else if (k2 === "host" && v2) host = v2;
                else if (k2 === "path" && v2) path = v2;
            }
            out.push("obfs=" + (tls_on ? "wss" : "ws"), "obfs-uri=" + path);
            if (host) out.push("obfs-host=" + host);
        }
    }

    out.push("udp-relay=true", "fast-open=false", "tag=" + (uri.name || addr));
    return out.join(", ");
}

function ssr(body) {
    var dec = b64_decode(body);
    if (!dec) return "";
    var q_pos = dec.indexOf("/?");
    var head = q_pos === -1 ? dec : dec.slice(0, q_pos);
    var segs = head.split(":");
    if (segs.length < 6) return "";

    var args = q_pos === -1 ? {} : parse_query(dec.slice(q_pos + 2));
    var addr = join_addr(segs[0], segs[1]);
    var proto = segs[2], method = segs[3], obfs = segs[4];
    var pass = b64_decode(segs.slice(5).join(":"));
    var name = args.remarks ? (b64_decode(args.remarks) || args.remarks) : addr;

    var out = ["shadowsocks=" + addr, "method=" + method, "password=" + pass];
    if (proto && proto !== "origin") {
        out.push("ssr-protocol=" + proto);
        if (args.protoparam) out.push("ssr-protocol-param=" + (b64_decode(args.protoparam) || args.protoparam));
    }
    if (obfs && obfs !== "plain") {
        out.push("obfs=" + obfs);
        if (args.obfsparam) out.push("obfs-host=" + (b64_decode(args.obfsparam) || args.obfsparam));
    }
    out.push("udp-relay=true", "fast-open=false", "tag=" + name);
    return out.join(", ");
}

function vmess(body) {
    var h_pos = body.indexOf("#");
    var main = h_pos === -1 ? body : body.slice(0, h_pos);
    var q_pos = main.indexOf("?");
    var json_str = b64_decode(q_pos === -1 ? main : main.slice(0, q_pos));
    if (!json_str || json_str.trim().charAt(0) !== "{") return "";

    var cfg = JSON.parse(json_str);
    var addr = join_addr(cfg.add, cfg.port);
    if (!addr || !cfg.id) return "";

    var method = (cfg.scy || "auto").toLowerCase() === "auto" ? "aes-128-gcm" : cfg.scy;
    var out = ["vmess=" + addr, "method=" + method, "password=" + cfg.id];

    var net = (cfg.net || "tcp").toLowerCase();
    var tls_on = cfg.tls === "tls" || cfg.tls === true;
    var path = cfg.path || "/";
    var host = cfg.host || cfg.sni || "";

    if (net === "ws" || net === "http" || cfg.type === "http") {
        out.push("obfs=" + (net === "ws" ? (tls_on ? "wss" : "ws") : "http"), "obfs-uri=" + path);
        if (host) out.push("obfs-host=" + host);
    } else if (tls_on) {
        out.push("obfs=over-tls");
        if (host) out.push("obfs-host=" + host);
    }

    if (tls_on) out.push("tls-verification=false");
    if (cfg.aid !== undefined && cfg.aid !== null && Number(cfg.aid) !== 0) out.push("aead=false");

    out.push("udp-relay=false", "fast-open=false", "tag=" + decode_uri(cfg.ps || addr));
    return out.join(", ");
}

function vless(body) {
    var uri = parse_uri(body);
    if (!uri.has_at) return "";
    var uuid = decode_uri(uri.user);
    var hp = split_addr(uri.addr_raw);
    var addr = join_addr(hp.host, hp.port);
    if (!addr || !uuid) return "";

    var args = uri.args;
    var out = ["vless=" + addr, "method=none", "password=" + uuid];
    var net = (args.type || "tcp").toLowerCase();
    var sec = (args.security || "").toLowerCase();
    var reality = sec === "reality" || Boolean(args.pbk);
    var tls_on = sec === "tls" || reality || is_on(args.tls);
    var host = args.sni || args.peer || args.host || "";
    var path = args.path || "/";

    if (net === "ws" || net === "http") {
        out.push("obfs=" + (net === "ws" ? (tls_on ? "wss" : "ws") : "http"));
        if (host) out.push("obfs-host=" + host);
        out.push("obfs-uri=" + path);
    } else if (tls_on) {
        out.push("obfs=over-tls");
        if (host) out.push("tls-host=" + host);
    }

    if (reality) {
        if (args.pbk) out.push("reality-base64-pubkey=" + args.pbk);
        if (args.sid) out.push("reality-hex-shortid=" + args.sid);
        out.push("udp-relay=true");
    } else {
        if (tls_on) out.push("tls-verification=" + (is_on(args.allowinsecure) ? "false" : "true"));
        out.push("udp-relay=" + (is_on(args.udp) ? "true" : "false"));
    }

    if (args.flow) out.push("vless-flow=" + args.flow);
    out.push("fast-open=" + (is_on(args.tfo) ? "true" : "false"), "tag=" + (uri.name || addr));
    return out.join(", ");
}

function trojan(body) {
    var uri = parse_uri(body);
    if (!uri.has_at) return "";
    var pass = decode_uri(uri.user);
    var hp = split_addr(uri.addr_raw);
    var addr = join_addr(hp.host, hp.port);
    if (!addr || !pass) return "";

    var args = uri.args;
    var out = ["trojan=" + addr, "password=" + pass];
    var net = (args.type || "tcp").toLowerCase();
    var host = args.sni || args.peer || args.host || "";

    if (net === "ws") {
        out.push("obfs=wss");
        if (host) out.push("obfs-host=" + host);
        out.push("obfs-uri=" + (args.path || "/"));
    } else {
        out.push("over-tls=true");
        if (host) out.push("tls-host=" + host);
    }

    if (args.pbk) {
        out.push("reality-base64-pubkey=" + args.pbk);
        if (args.sid) out.push("reality-hex-shortid=" + args.sid);
    } else {
        out.push("tls-verification=" + (is_on(args.allowinsecure) ? "false" : "true"));
    }

    out.push("udp-relay=" + (is_on(args.udp) ? "true" : "false"), "fast-open=" + (is_on(args.tfo) ? "true" : "false"), "tag=" + (uri.name || addr));
    return out.join(", ");
}

function anytls(body) {
    var uri = parse_uri(body);
    if (!uri.has_at) return "";
    var pass = decode_uri(uri.user);
    var hp = split_addr(uri.addr_raw);
    var addr = join_addr(hp.host, hp.port);
    if (!addr || !pass) return "";

    var args = uri.args;
    var out = ["anytls=" + addr, "password=" + pass, "over-tls=true"];
    var host = args.sni || args.peer || args.host || "";
    if (host) out.push("tls-host=" + host);

    if (args.pbk) {
        out.push("reality-base64-pubkey=" + args.pbk);
        if (args.sid) out.push("reality-hex-shortid=" + args.sid);
    } else {
        out.push("tls-verification=" + (is_on(args.allowinsecure) ? "false" : "true"));
    }

    var no_udp = args.udp === "0" || String(args.udp || "").toLowerCase() === "false";
    out.push("udp-relay=" + (no_udp ? "false" : "true"), "tag=" + (uri.name || addr));
    return out.join(", ");
}

function http(body, use_tls) {
    var uri = parse_uri(body);
    if (!uri.has_at) return "";
    var hp = split_addr(uri.addr_raw);
    var addr = join_addr(hp.host, hp.port);
    if (!addr) return "";

    var col = uri.user.indexOf(":");
    var out = ["http=" + addr];
    if (col !== -1) out.push("username=" + decode_uri(uri.user.slice(0, col)), "password=" + decode_uri(uri.user.slice(col + 1)));
    if (use_tls) out.push("over-tls=true", "tls-verification=false");
    out.push("fast-open=false", "tag=" + (uri.name || addr));
    return out.join(", ");
}

function socks(body, use_tls) {
    var uri = parse_uri(body);
    var name = uri.name || (uri.args.remarks ? decode_uri(uri.args.remarks) : "");
    var raw_part = uri.has_at ? uri.core : b64_decode(uri.core);
    var at_pos = raw_part.lastIndexOf("@");
    if (at_pos === -1) return "";

    var auth = raw_part.slice(0, at_pos);
    var hp = split_addr(raw_part.slice(at_pos + 1));
    var addr = join_addr(hp.host, hp.port);
    if (!addr) return "";

    var col = auth.indexOf(":");
    var out = ["socks5=" + addr];
    if (col !== -1) out.push("username=" + decode_uri(auth.slice(0, col)), "password=" + decode_uri(auth.slice(col + 1)));
    if (use_tls) out.push("over-tls=true", "tls-verification=false");
    out.push("fast-open=false", "tag=" + (name || addr));
    return out.join(", ");
}

// 协议调度入口
function to_qx(uri) {
    var raw = String(uri || "").trim();
    if (!raw) return "";
    var pos = raw.indexOf("://");
    if (pos === -1) return "";
    var scheme = raw.slice(0, pos).toLowerCase();
    var body = raw.slice(pos + 3);

    try {
        switch (scheme) {
            case "ss":     return ss(body);
            case "ssr":    return ssr(body);
            case "vmess":  return vmess(body);
            case "vless":  return vless(body);
            case "trojan": return trojan(body);
            case "anytls": return anytls(body);
            case "http":   return http(body, false);
            case "https":  return http(body, true);
            case "socks":  return socks(body, false);
            case "ssocks": return socks(body, true);
            default:       return "";
        }
    } catch (err) {
        return "";
    }
}

function load_nodes(text) {
    var body = String(text || "").trim();
    if (!body) return [];

    var qx_re = /^(shadowsocks|vmess|vless|trojan|http|socks5|anytls)=/i;
    var uri_re = /^(ss|ssr|vmess|vless|trojan|anytls|http|https|socks|ssocks):\/\//i;
    var lines = body.split(/\r?\n/);
    var has_plain = lines.some(function (line) {
        var t = line.trim();
        return t && (qx_re.test(t) || uri_re.test(t));
    });

    if (!has_plain) {
        var dec = b64_decode(body);
        if (dec && dec !== body) lines = dec.trim().split(/\r?\n/);
    }

    var nodes = [];
    for (var i = 0; i < lines.length; i++) {
        var item = lines[i].trim();
        if (!item) continue;
        if (qx_re.test(item)) nodes.push(item);
        else if (uri_re.test(item)) {
            var conv = to_qx(item);
            if (conv) nodes.push(conv);
        } else {
            var line_dec = b64_decode(item);
            if (line_dec && uri_re.test(line_dec.trim())) {
                var conv_b64 = to_qx(line_dec.trim());
                if (conv_b64) nodes.push(conv_b64);
            }
        }
    }
    return nodes;
}

//节点处理
var need_ua = res_type === "server" && hash_arg("ua") === "1";
var need_note = hash_arg("note") === "1";
var should_retry_ua = need_ua && !has_ua;

if (should_retry_ua) {
    $done({ retry: { user_agent: get_ua() } });
} else if (res_type === "server") {
    var keep_arg = hash_arg("keep"), drop_arg = hash_arg("drop"), trim_arg = hash_arg("trim");
    var name_arg = hash_arg("name"), sort_arg = hash_arg("sort");
    var no_emoji = hash_arg("emoji") === "1", skip_arg = hash_arg("skip");

    var keep_re = null, drop_re = null, trim_re = null;
    try { if (keep_arg) keep_re = new RegExp(keep_arg, "i"); } catch (err) {}
    try { if (drop_arg) drop_re = new RegExp(drop_arg, "i"); } catch (err) {}
    try { if (trim_arg) trim_re = new RegExp(trim_arg, "gi"); } catch (err) {}

    var rename_list = [];
    if (name_arg) {
        name_arg.split("+").forEach(function (rule) {
            var t = rule.trim(), col = t.indexOf(":");
            if (col > 0) rename_list.push({ from: t.slice(0, col), to: t.slice(col + 1) });
        });
    }

    var skip_val = skip_arg === "1" ? "false" : (skip_arg === "0" ? "true" : "");
    var pool = load_nodes(raw_data), out_list = [];
    var qx_re = /^(shadowsocks|vmess|vless|trojan|http|socks5|anytls)=/i;
    var fix_eq_re = /^([a-z0-9]+)\s*=\s*/i;
    var get_tag_re = /(?:^|,\s*)tag\s*=\s*([^,]*)/i;
    var set_tag_re = /((?:^|,\s*)tag\s*=\s*)([^,]*)/i;

    var keep_ok = 0, keep_skip = 0, drop_ok = 0, drop_skip = 0;
    var ua_fetched_count = 0;

    function set_tag(line, tag_name) {
        return line.replace(set_tag_re, function (_, head) { return head + tag_name; });
    }

    for (var i = 0; i < pool.length; i++) {
        var line = pool[i].trim();
        if (!line || !qx_re.test(line)) continue;

        if (need_ua && has_ua) ua_fetched_count++;

        line = line.replace(fix_eq_re, "$1=");
        var tag_name = ((line.match(get_tag_re) || [])[1] || "").trim();

        if (keep_re) {
            if (!keep_re.test(tag_name)) { keep_skip++; continue; }
            keep_ok++;
        }
        if (drop_re) {
            if (drop_re.test(tag_name)) { drop_skip++; continue; }
            drop_ok++;
        }

        if (no_emoji && tag_name) {
            var next_emoji = remove_emoji(tag_name);
            if (next_emoji !== tag_name) { tag_name = next_emoji; line = set_tag(line, tag_name); }
        }
        if (trim_re && tag_name) {
            var next_trim = tag_name.replace(trim_re, "").trim();
            if (next_trim && next_trim !== tag_name) { tag_name = next_trim; line = set_tag(line, tag_name); }
        }
        if (rename_list.length > 0 && tag_name) {
            var next_name = tag_name;
            for (var j = 0; j < rename_list.length; j++) {
                var rule = rename_list[j];
                if (rule.from && next_name.indexOf(rule.from) !== -1) {
                    next_name = next_name.split(rule.from).join(rule.to);
                }
            }
            if (next_name !== tag_name) { tag_name = next_name; line = set_tag(line, tag_name); }
        }

        if (skip_val && has_tls(line)) line = set_field(line, "tls-verification", skip_val);
        out_list.push(line);
    }

    if (sort_arg && out_list.length > 1) {
        var keys = sort_arg.split(">").map(function (s) { return s.trim(); }).filter(Boolean);
        if (keys.length > 0) {
            out_list = out_list.map(function (line) {
                var tag_name = ((line.match(get_tag_re) || [])[1] || "").trim();
                var rank = 9999;
                for (var k = 0; k < keys.length; k++) {
                    if (tag_name.indexOf(keys[k]) !== -1) { rank = k; break; }
                }
                return { line: line, rank: rank };
            }).sort(function (a, b) { return a.rank - b.rank; }).map(function (item) { return item.line; });
        }
    }

    if (need_note && need_ua && has_ua) {
        notify("", "已启用小火箭UA请求拉取更多订阅节点共计 " + ua_fetched_count + " 节点");
    }

    if (need_note && (keep_arg || drop_arg)) {
        var kept_count = keep_arg ? keep_ok : drop_ok;
        var dropped_count = keep_arg ? (drop_arg ? drop_skip : keep_skip) : drop_skip;
        notify("", "已保留" + kept_count + "个节点 >> 已排除" + dropped_count + "个节点");
    }

    $done({ content: out_list.join("\n") });

    
//分流处理
} else if (res_type === "filter") {

    var keep_arg = hash_arg("keep");
    var drop_arg = hash_arg("drop");
    var keep_re = null, drop_re = null;
    try { if (keep_arg) keep_re = new RegExp(keep_arg, "i"); } catch (err) {}
    try { if (drop_arg) drop_re = new RegExp(drop_arg, "i"); } catch (err) {}

    var raw_lines = raw_data.split(/\r?\n/);
    var out_rules = [];
    var rule_map = {
        "DOMAIN": "host",
        "DOMAIN-SUFFIX": "host-suffix",
        "DOMAIN-KEYWORD": "host-keyword",
        "DOMAIN-WILDCARD": "host-wildcard",
        "IP-CIDR6": "ip6-cidr",
        "IP-CIDR": "ip-cidr",
        "GEOIP": "geoip",
        "IP-ASN": "ip-asn",
        "USER-AGENT": "user-agent"
    };

    for (var i = 0; i < raw_lines.length; i++) {
        var line = raw_lines[i].trim().replace(/^-\s*/, "");
        if (!line || /^[#;//\[]/.test(line)) continue;

        var cols = line.split(",");
        var rule_type = rule_map[(cols[0] || "").trim().toUpperCase()];
        var target = cols[1] ? cols[1].trim() : "";
        if (!rule_type || !target) continue;

        var policy = (cols[2] && cols[2].trim()) ? cols[2].trim() : "proxy";
        var rule_line = rule_type + ", " + target + ", " + policy;

        if (keep_re && !keep_re.test(rule_line)) continue;
        if (drop_re && drop_re.test(rule_line)) continue;

        out_rules.push(rule_line);
    }

    $done({ content: out_rules.join("\n") });

} else {
    $done({ content: raw_data });
}
