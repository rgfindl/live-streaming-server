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

ffmpeg -stream_loop -1 -re -i test-video.mp4 -c copy -f flv "rtmp://localhost:1935/live/randy"
```

View Stream
```
http://localhost:8181/hls/randy.m3u8
```

## TODO
On _new_ ABR playlist file (.m3u8), push to social destinations via spawn ffmpeg.
On _on-play-done_ use 'name' field to terminate push to social destinations.
```
{
  "app": "live",
  "flashver": "LNX 9,0,124,2",
  "swfurl": "",
  "tcurl": "rtmp://localhost:1935/live",
  "pageurl": "",
  "addr": "127.0.0.1",
  "clientid": "8",
  "call": "play_done",
  "name": "14262b1c-0794-9609-1a4a-4dd9a70a277e"
}
```