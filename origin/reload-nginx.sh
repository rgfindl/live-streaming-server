#!/bin/bash

# Regenerate NGINX config
/bin/bash /generate-nginx.sh

# Reload NGINX config
nginx -s reload
