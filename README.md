# live-streaming-server
Ingest RTMP - Encode into HLS - Live Streaming

## TODO
- Reduce segment length for reduced latency?
- Auto scaling server - cost savings - handle dynamic load

## Send test stream
ffmpeg -stream_loop -1 -re -i ~/Downloads/test-video.mp4 -c copy -f flv "rtmp://localhost:1935/stream/test2"

## Test Stream with Social Sharing
```
ffmpeg -stream_loop -1 -re -i ~/Downloads/test-video.mp4 -c copy -f flv "rtmp://localhost:1935/stream/test104?twitch=<your twitch key>&youtube=<your youtube key>&facebook=<your facebook key>&facebook_s_bl=<your facebook bl>&facebook_s_sc=<your facebook s_sc>&facebook_s_sw=<your facebook sw>&facebook_s_vt=<your facebook vt>&facebook_a=<your facebook a>"
```

# Try this:
h264_nvenc uses the NVidia hardware assisted H.264 video encoder