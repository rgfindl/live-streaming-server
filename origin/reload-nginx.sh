#!/bin/bash

# Regenerate NGINX config
/bin/bash /generate-nginx.sh

# Reload NGINX config
/usr/sbin/nginx -s reload
