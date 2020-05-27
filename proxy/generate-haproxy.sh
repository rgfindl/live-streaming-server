#!/bin/bash
source /root/envs.sh

cd /

# Generate the HAProxy config
/usr/bin/npm run generate-config /usr/local/etc/haproxy/haproxy.cfg.template /usr/local/etc/haproxy/haproxy.cfg 
echo "$(/bin/more /usr/local/etc/haproxy/haproxy.cfg)"
