#!/bin/bash
source /root/envs.sh

# Get the CloudMap service id from the CloudFormation stack output params
SERVER_SERVICE_ID="$(/usr/local/bin/aws cloudformation describe-stacks --region $AWS_REGION --stack-name video-streaming-server --query "Stacks[0].Outputs[?OutputKey=='ServiceDiscovery'].OutputValue" --output text || echo '')"
echo $SERVER_SERVICE_ID

# Get the IP addresses from the CloudMap service
SERVERS="$(/usr/local/bin/aws servicediscovery list-instances --region $AWS_REGION --service-id $SERVER_SERVICE_ID --query 'Instances[*].Attributes.AWS_INSTANCE_IPV4' --output text || echo '')"
echo $SERVERS

# Generate the haproxy.cfg config using the template and passing in the IP addresses
SERVERS=$SERVERS python /generate-haproxy.py -i /usr/local/etc/haproxy/haproxy.cfg.template -o /usr/local/etc/haproxy/haproxy.cfg
echo "$(/bin/more /usr/local/etc/haproxy/haproxy.cfg)"
