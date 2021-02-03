FROM python:3.8.5-alpine

ADD ./client/build /var/www
ADD ./backend /code

RUN apk add nginx gcc musl-dev python3-dev libffi-dev openssl-dev \
    && mkdir -p /run/nginx \
    && mkdir /data \
    && pip install -r /code/prod_requirements.txt \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && apk del gcc musl-dev python3-dev libffi-dev openssl-dev

ADD ./prod/start.sh /scripts/start.sh
ADD ./prod/setup.sh /scripts/bin/setup
ADD ./prod/localsettings.py /code/docker_registry_ui/localsettings.py
ADD ./prod/nginx.conf /etc/nginx/conf.d/default.conf

ENV PATH="/scripts/bin:${PATH}"
CMD ["sh", "/scripts/start.sh"]