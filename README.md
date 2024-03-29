# Registryo

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
      - ./certfile.pem:/certfile.pem
      # share configuration file
      - ./config.yml:/etc/docker/registry/config.yml

```

To deploy the UI we need a configuration file (in env format) and a docker-compose.yml

```yml
# docker-compose.yml
version: '3'

services:

  registry-web:
    restart: always
    image: inmagik/registryo:latest
    env_file:
      # Configuration file
      - ./config.env
    ports:
      - 8080:80
    volumes:
      # Persist user db
      - ./data:/data
      # Share private key to sign tokens
      - ./privkey.pem:/code/privkey.pem
      # Share certificate file to verify tokens
      - ./certfile.pem:/code/certfile.pem
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

Create two directories (one for registry and one for the web ui), with those configuration files, then run `docker-compose up -d` in both directories.

Finally, we need to create the first user in the web ui. This user will be the *superadmin* of your installation, so choose credentials carefully.

Move with the terminal in the directory where you put the web ui configuration files and run `docker-compose exec registry-web setup`, fill in the required information and you should be ready to access the web ui listening at `http://localhost:8080`! 

## Other deployment setups

In the `deploy` folder of this repository you can find some example configurations to deploy the registry and the authentication service in some common environments.

- **standard**: dual host configuration, as described in this readme
- **traefik**: single host with reverse proxy, using Traefik
- **nginx**: single host with reverse proxy, using Nginx

## Contributing

Contributions are always welcome, given the conformance to the [code of conduct](https://github.com/inmagik/docker-registry-ui/blob/main/CODE_OF_CONDUCT.md).

For instance, you may contribute by:

- fixing bugs
- adding new languages to the web interface
- adding new common deployment configurations

If you have some deployment configuration you wish to share, please remember to anonimize the FQDNs and DNSs entries. You can use `example.com` and subdomains to this extent. 