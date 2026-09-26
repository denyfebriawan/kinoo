# Deploying Kinoo

- **Frontend (`web/`)** goes to Vercel.
- **Socket.io server (`server/`)** runs on the Azure VM as a systemd service, behind Nginx with HTTPS.

The browser only allows a secure `wss://` connection from an HTTPS page, so the server must be reachable over HTTPS on a real domain.

Replace `kinoo-api.example.com` with your subdomain and `https://kinoo.vercel.app` with your real Vercel URL everywhere below.

## 1. DNS

Add an **A record** for `kinoo-api.example.com` pointing at the VM's public IP. Check it with `nslookup kinoo-api.example.com`.

## 2. Server on the VM

Node 20+ is required (`node -v`). systemd cannot see Node installed through nvm, so use a system Node (`which node` should print something like `/usr/bin/node`).

```bash
# service user and code location
sudo useradd --system --home /opt/kinoo --shell /usr/sbin/nologin kinoo
sudo mkdir /opt/kinoo && sudo chown $USER /opt/kinoo
git clone https://github.com/denyfebriawan/kinoo.git /opt/kinoo

# install dependencies and compile TypeScript to server/dist
cd /opt/kinoo/server
npm ci
npm run build

# config (edit the values)
sudo mkdir /etc/kinoo
sudo tee /etc/kinoo/server.env > /dev/null <<'EOF'
PORT=4000
HOST=127.0.0.1
CLIENT_ORIGIN=https://kinoo.vercel.app
EOF
```

- Pick a `PORT` nothing else uses (`sudo ss -ltnp` lists the busy ones). If you change it, change `proxy_pass` in the Nginx file too.
- `HOST=127.0.0.1` means only Nginx on the same machine can reach the Node process.
- `CLIENT_ORIGIN` is the exact origin of the site (scheme + host, no trailing slash). Several origins can be comma-separated.

Install and start the service:

```bash
sudo cp /opt/kinoo/deploy/kinoo.service /etc/systemd/system/kinoo.service
sudo systemctl daemon-reload
sudo systemctl enable --now kinoo
sudo systemctl status kinoo
journalctl -u kinoo -f          # live logs
```

## 3. Nginx and HTTPS

```bash
sudo cp /opt/kinoo/deploy/nginx-kinoo.conf /etc/nginx/sites-available/kinoo
sudo sed -i 's/kinoo-api.example.com/YOUR-SUBDOMAIN/' /etc/nginx/sites-available/kinoo
sudo ln -s /etc/nginx/sites-available/kinoo /etc/nginx/sites-enabled/kinoo
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d YOUR-SUBDOMAIN
```

The Azure network security group must allow inbound 80 and 443 (Ngajarin probably already opened them). Port 4000 does **not** need to be open.

Check it:

```bash
curl "https://kinoo-api.example.com/socket.io/?EIO=4&transport=polling"
# expected: 0{"sid":"...","upgrades":["websocket"],...}
```

## 4. Frontend on Vercel

1. Import the GitHub repo into Vercel.
2. Set **Root Directory** to `web`.
3. Add the environment variable `NEXT_PUBLIC_SOCKET_URL` = `https://kinoo-api.example.com`.
   It is baked in at build time, so after changing it you must redeploy.
4. Deploy, then make sure `CLIENT_ORIGIN` in `/etc/kinoo/server.env` matches the Vercel URL, and run `sudo systemctl restart kinoo`.

Vercel preview deployments have different URLs and will be blocked by CORS unless you add them to `CLIENT_ORIGIN`.

## Updating

```bash
cd /opt/kinoo && git pull
cd server && npm ci && npm run build
sudo systemctl restart kinoo
```

Restarting the service wipes all rooms, because room state lives only in memory.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Could not reach the server" in the app | `NEXT_PUBLIC_SOCKET_URL` wrong or not redeployed, Nginx or the service is down, or `CLIENT_ORIGIN` doesn't match the site's origin |
| 502 from Nginx | The service isn't running, or the port in `proxy_pass` differs from `PORT` |
| Connects but keeps dropping | Missing `Upgrade` / `Connection` headers in the Nginx config |
| Rooms disappear | The service restarted (`journalctl -u kinoo`) |
