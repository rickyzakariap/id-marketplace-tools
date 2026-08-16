import re, html, urllib.request, urllib.parse, base64, json, sys

def gnews_items(query, n=8):
    url = "https://news.google.com/rss/search?q=" + urllib.parse.quote(query) + "&hl=id&gl=ID&ceid=ID:id"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    t = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", errors="ignore")
    items = re.findall(r"<item>(.*?)</item>", t, flags=re.S)
    out = []
    for it in items[:n]:
        ti = re.search(r"<title>(.*?)</title>", it, flags=re.S)
        ln = re.search(r"<link>(.*?)</link>", it, flags=re.S)
        out.append((html.unescape(ti.group(1)).strip() if ti else "", ln.group(1).strip() if ln else ""))
    return out

def decode_gnews(url):
    payload = url.replace("https://news.google.com/rss/articles/", "").split("?")[0]
    inner = '["garturlreq",[["en-US","US",["FINANCE_TOP_INDICES","WEB_TEST_1_0_0"],null,null,1,1,"US:en",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],"en-US","US",1,[2,3,4,8],1,0,"655000234",0,0,null,0],"' + payload + '",1]'
    body = json.dumps([[["Fbv4je", inner]], "/"])
    req = urllib.request.Request("https://news.google.com/_/DotsSplashUi/data/batchexecute", data=body.encode(), headers={
        "User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"})
    resp = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", errors="ignore")
    m = re.search(r'https?://[^"\\]+', resp)
    if m:
        return m.group(0).replace("\\u003d", "=").replace("\\u0026", "&")
    return None

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "BPJS syarat pedagang marketplace insentif diskon"
    items = gnews_items(query, 6)
    for ti, ln in items:
        print("-", ti)
        real = decode_gnews(ln)
        print("  REAL:", real)
        print()
