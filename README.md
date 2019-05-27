# live-streaming-server
Ingest RTMP - Encode into HLS - Live Streaming

## Build and Run
```
docker-compose build
docker-compose up
```

## Test RTMP Stream
```
ffmpeg -re -y -i ./20120626_181632.mp4 -vcodec libx264 -b:v 600k -r 25 \
  -filter:v yadif -ab 64k -ac 1 -ar 44100 -f flv \
  "rtmp://localhost:1935/live/randy"
```