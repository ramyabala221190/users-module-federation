#!/bin/bash
cp /usr/share/nginx/html/assets/json/config-$(cat /config/env).json /usr/share/nginx/html/assets/json/config.json
#envsubst < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf
echo "Starting container. Runtime environment variables. target environment=$(cat /config/env)" 
nginx -g 'daemon off;'