#!/bin/bash

# Regenerate HAProxy config
/bin/bash /generate-haproxy.sh

# Reload HAProxy config
HA_PROXY_ID=$(more /var/run/haproxy.pid)
kill -USR2 $HA_PROXY_ID
