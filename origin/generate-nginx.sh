#!/bin/bash
source /root/envs.sh

# Generate the NGINX config
/usr/bin/npm run generate-config /etc/nginx/nginx.conf.template /etc/nginx/nginx.conf 
echo "$(/bin/more /etc/nginx/nginx.conf)"
