FROM python:3.11.1-alpine

ADD ./client/build /var/www
ADD ./backend /code

RUN pip install --upgrade pip \
    && apk add nginx gcc musl-dev python3-dev libffi-dev openssl-dev curl \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && source $HOME/.cargo/env \
    && mkdir -p /run/nginx \
    && mkdir /data \
    && pip install -r /code/prod_requirements.txt \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && rustup self uninstall -y \
    && apk del gcc musl-dev python3-dev libffi-dev openssl-dev curl

ADD ./prod/start.sh /scripts/start.sh
ADD ./prod/setup.sh /scripts/bin/setup
ADD ./prod/localsettings.py /code/docker_registry_ui/localsettings.py
ADD ./prod/nginx.conf /etc/nginx/http.d/default.conf

ENV PATH="/scripts/bin:${PATH}"
CMD ["sh", "/scripts/start.sh"]