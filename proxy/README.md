# Live Streaming Proxy

## Docker
```
docker build -t video-streaming-proxy .
docker run -p 3000:3000 video-streaming-proxy


## Build/Deploy ECR Image
```

### Docker Login
```
aws ecr get-login --registry-ids 132093761664 --no-include-email --profile bluefin
```

### Build Image
```
docker build \
-t video-streaming-proxy .
```

### Tag Version
```
docker tag video-streaming-proxy 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-proxy:1.0.7
```

### Push Image
```
docker push 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-proxy:1.0.7
```

### All
```
docker build \
-t video-streaming-proxy .
docker tag video-streaming-proxy 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-proxy:1.0.9
docker push 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-proxy:1.0.9
```


### Get IP
aws ec2 describe-network-interfaces --network-interface-ids $(aws ecs describe-tasks --cluster video-streaming --tasks $(aws ecs list-tasks --cluster video-streaming --service-name video-streaming-proxy --query "taskArns" --output text) --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" --output text) --query "NetworkInterfaces[0].Association.PublicIp" --output text

aws ec2 describe-network-interfaces --network-interface-ids