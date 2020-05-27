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
docker tag video-streaming-proxy 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-proxy:1.0.6
```

### Push Image
```
docker push 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-proxy:1.0.6
```
