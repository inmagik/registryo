# Docker Registry Web

Web UI and authentication service for private Docker Registry v2

## Features

- Browse repositories, tags and image manifests
- Create and manage users and permissions
- Integrated password recovery workflow

## How to run

First thing to do is to generate a private key and a certificate for the corresponding pulbic key. Self signed certificates are fine as well. Please note that the private key must not be encrypted.

```sh
$ openssl genrsa -out privkey.pem 2048
$ openssl req -new -x509 -key privkey.pem -out certfile.pem -days 360
```

In the following, suppose we deploy the registry and the authentication server on the following addresses

- Registry: registry.example.com
- Auth and ui: ui.registry.example.com

> It is also possibile to use just one domain name and rely on reverse proxy, see later on

Then, you need to deploy a private docker registry with token authentication support. This is an example `config.yml` to configure token authentication on the registry

```yml
# config.yml
version: 0.1
log:
  fields:
    service: registry
storage:
  cache:
    blobdescriptor: inmemory
  filesystem:
    rootdirectory: /var/lib/registry
  delete:
    enabled: true
http:
  addr: :5000
auth:
  token:
    realm: https://ui.registry.example.com/v1/auth/
    service: registry.example.com
    issuer: ui.registry.example.com
    rootcertbundle: /certfile.pem
health:
  storagedriver:
    enabled: true
    interval: 10s
    threshold: 3
```

```yml
# docker-compose.yml
version: '3'

services:

  registry-srv:
    restart: always
    image: registry:2
    ports:
      - 80:5000
    volumes:
      # persist uploaded images
      - ./registry:/var/lib/registry
      # share certificate file for token validation
      - /srv/registry/certfile.pem:/certfile.pem
      # share configuration file
      - /srv/registry/config.yml:/etc/docker/registry/config.yml

```

To deploy the UI we need a configuration file (in env format) and a docker-compose.yml

```yml
# docker-compose.yml
version: '3'

services:

  registry-web:
    restart: always
    image: docker_registry_web
    env_file:
      # Configuration file
      - ./config.env
    ports:
      - 80:80
    volumes:
      # Persist user db
      - ./data:/data
      # Share private key to sign tokens
      - ./backend/privkey.pem:/code/privkey.pem
      # Share certificate file to verify tokens
      - ./backend/certfile.pem:/code/certfile.pem
```

```ini
# config.env
SERVER_FQDN=ui.registry.example.com
REGISTRY_NAME=registry.example.com
REGISTRY_URL=https://registry.example.com/v2
EMAIL_FROM=NoReply <noreply@example.com>

# If you want to use SendInBlue to send emails
EMAIL_DRIVER=sendinblue
SENDINBLUE_API_KEY=xkeysib-s3cr3t

# If you want to use plain SMTP
EMAIL_BACKEND=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=22
EMAIL_HOST_USER=example
EMAIL_HOST_PASSWORD=s3cr3t
EMAIL_USE_TLS=1             # Set this only if needed
EMAIL_USE_SSL=0             # Set this only if needed
EMAIL_TIMEOUT=              # Set this only if needed
EMAIL_SSL_KEYFILE=          # Set this only if needed
EMAIL_SSL_CERTFILE=         # Set this only if needed

# If you don't want emails
EMAIL_BACKEND=none
```