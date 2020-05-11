# live-streaming-server
Ingest RTMP - Encode into HLS - Live Streaming

## Send test stream
ffmpeg -stream_loop -1 -re -i ~/Downloads/test-video.mp4 -c copy -f flv "rtmp://localhost:1935/stream/test2"