# Live Streaming Origin

## Docker
```
docker build -t video-streaming-origin .
docker run -p 3000:3000 video-streaming-origin


## Build/Deploy ECR Image
```

### Docker Login
```
aws ecr get-login --registry-ids 132093761664 --no-include-email --profile bluefin
```

### Build Image
```
docker build \
-t video-streaming-origin .
```

### Tag Version
```
docker tag video-streaming-origin 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-origin:1.0.6
```

### Push Image
```
docker push 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-origin:1.0.6
```

### ALL
```
docker build \
-t video-streaming-origin .
docker tag video-streaming-origin 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-origin:1.0.9
docker push 132093761664.dkr.ecr.us-east-1.amazonaws.com/video-streaming-origin:1.0.9
```