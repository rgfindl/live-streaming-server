

## Docker
```
docker build -t video-streaming-server .
docker run -p 3000:3000 video-streaming-server


## Build/Deploy ECR Image
```

### Docker Login
```
aws ecr get-login --registry-ids 132093761664 --no-include-email --profile bluefin
```

### Build Image
```
docker build \
-t video-streaming-server .
```

### Tag Version
```
docker tag video-streaming-server 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-server:1.0.1
```

### Push Image
```
docker push 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-server:1.0.1
```