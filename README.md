# Novus Mail
Please star this repo if you find it useful, thank you!
![image](https://github.com/user-attachments/assets/b1026444-5090-4221-a762-1be59548f10c)


# Purpose 🎯
Whenever you sign up with your email on a website, your email address is stored and sometimes sold to advertisers. This is where you get your bulk of spam emails. Whenever a data breach happens, you also risk having your primary email address leaked and informations stolen.

Using Novus Mail, you can create disposable email addresses that can be used to sign up to website that requires email verification. This is very useful when you just want to try out new website / services without giving away your real email address. It significantly enhances privacy, security and reduces spam. It's like running your own Gmail server.

# Why it's better than other similar services ⚡
Email servers are notoriously difficult to set up, Novus Mail aims to make it as simple as possible by making TLS optional and it can automatically detect your domain if you choose to use TLS. If you change your domain, it can automatically detect it and requires no additional configuration. If you want to move the data to another server, just copy the `data` folder, and update any MX records.

# Run with docker 🐋
This is an example docker-compose file:
```yaml
services:
  novusmail:
    image: ghcr.io/jamesmoore/novus-mail:main
    ports:
      - 25:25
      - 80:80
    volumes:
      - ./data:/app/data
```

In the `docker-compose.yaml` file, port `25:25` is mapped by default. It is recommended to not change this setting if you are using a reverse proxy as some of them cannot forward smtp packets.

## Configuration
Configuration is done through environment variables, which can be set in the docker-compose.yml, or in an .env it can referenced. All of them are optional.

| Environment Variable       | Example Value                                | Description                                   |
|----------------------------|--------------------------------------|-----------------------------------------------|
| MAIL_COUNT_PER_PAGE        | 50                                   | Number of emails displayed per page. When you scroll to the end of the page the next page will automatically load.         |
| OIDC_CLIENT_ID             | novusmail                            | OpenID Connect client identifier.            |
| OIDC_CLIENT_SECRET         | *your secret id*                   | Secret key for OpenID Connect client.        |
| OIDC_ISSUER                | https://auth.yourdomain.net          | Issuer URL of the OpenID Connect provider.    |
| REDIRECT_URI               | https://mail.yourdomain.net/auth/callback | Redirect URI after authentication completion. This must have `/auth/callback` at the end. |
| SESSION_SECRET             | *secret session key*                 | Optional secret key for session management (generated automatically if omitted). |
| CORS_ALLOW_ALL_ORIGINS     | false                                | ```true``` \| ```false``` Whether to allow all origins in CORS policy. This should only be needed for local development where the frontend and the api may be running on different ports.  |
| TRUST_PROXY                | true                                 | ```true``` \| ```false``` Whether the application trusts the proxy server to provide the correct X-FORWARDED headers. This is needed for the OIDC implementation to determine the scheme. |
|SESSION_STORE               |NONE           |```NONE```\|```LOKI```\|```REDIS``` Which session store to use. `NONE`: in memory session store will be used. `LOKI` (default): then on disk file will be used. `REDIS`: redis store will be used (requires `REDIS_URL` to work).|
|REDIS_URL|redis://redis:6379|Redis url if `REDIS` session store is to be used. See https://redis.io/docs/latest/develop/clients/nodejs/connect/| 
|POSTGRES_URL|postgres://user:pass@host:5432/db|Postgres URL if Postgres DB is to be used. If absent local Sqlite will be used.| 
|POSTGRES_LOG_SQL|false|```true``` \| ```false``` If set the Postgres SQL and parameters will be logged.|
# Adding TLS / Encryption (optional) 🔒
copy your certificate and private key files into the `data` folder (usually, the file extensions are `.crt` and `.key`). The file name and extension don't actually matter as Novus Mail can automatically detect which one is which

# Is it safe if I don't use TLS? 🔍
The current mail transfer protocol is very old and by default it doesn't require TLS to function. This means that when another server sends an email to your server, anyone in between can theoretically read the mail if they actively try to intercept. However, this is unlikely to happen as the people who have this capability are mostly ISPs and hosting providers. For better security, setting up TLS is still recommended.

# Hosting multiple domains
You can set the MX records for additional domains to point to the mail server host of the primary domain. 

# Developing
## API
Run `npm i` and then `npm run dev` in the /api folder. This will start node for api on port 80.

## Front end
Run `npm i` and then `npm run dev` in the /front-react folder. This will launch the front-end on port 5173. 

## API - Front end connectivity
The API can be set in the front-end by adding a file named `/front-react/.env.development.local`
```env
VITE_API_BASE_URL=http://localhost:80
```

With the API and front-end running on different ports this will trigger CORS issues. To work around this, add a file named `/api/.env` containing:
```env
CORS_ALLOW_ALL_ORIGINS=true
```

# Contributing 🤝
Contributions and suggestions are welcome.
