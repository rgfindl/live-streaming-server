# live-streaming-server
Ingest RTMP - Encode into HLS - Live Streaming

## TODO
- Move `server` to ECS cluster with some high performance GPU instances.
- Try this encoding for better performance, `h264_nvenc uses the NVidia hardware assisted H.264 video encoder`
- Reduce segment length for reduced latency?
- Add Redis to store [stream name : streaming server ip] mapping.
- Add HLS `origin` server with nginx proxy cache and cache lock. Fargate.
  - Use single node.js backend which performs an internal redirect using the `X-Accel-Redirect` header to an nginx location which points to the correct streaming server, based on the Redis [stream name : streaming server ip] mapping.
- Update live.finbits.io CDN to point to `origin` ALB.

## Send test stream
ffmpeg -stream_loop -1 -re -i ~/Downloads/test-video.mp4 -c copy -f flv "rtmp://localhost:1935/stream/test2"

ffmpeg -hide_banner -y -fflags nobuffer -i rtmp://127.0.0.1:1935/stream/test38 \
  -vf scale=w=640:h=360:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -tune zerolatency -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_list_size 6 -hls_flags delete_segments -max_muxing_queue_size 1024 -start_number 100 -b:v 800k -maxrate 856k -bufsize 1200k -b:a 96k -hls_segment_filename media/test/360p/%03d.ts media/test/360p.m3u8 \
  -vf scale=w=842:h=480:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -tune zerolatency -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_list_size 6 -hls_flags delete_segments -max_muxing_queue_size 1024 -start_number 100 -b:v 1400k -maxrate 1498k -bufsize 2100k -b:a 128k -hls_segment_filename media/test/480p/%03d.ts media/test/480p.m3u8 \
  -vf scale=w=1280:h=720:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -tune zerolatency -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_list_size 6 -hls_flags delete_segments -max_muxing_queue_size 1024 -start_number 100 -b:v 2800k -maxrate 2996k -bufsize 4200k -b:a 128k -hls_segment_filename media/test/720p/%03d.ts media/test/720p.m3u8 \
  -vf scale=w=1920:h=1080:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -tune zerolatency -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_list_size 6 -hls_flags delete_segments -max_muxing_queue_size 1024 -start_number 100 -b:v 5000k -maxrate 5350k -bufsize 7500k -b:a 192k -hls_segment_filename media/test/1080p/%03d.ts media/test/1080p.m3u8


/usr/local/bin/ffmpeg -y -fflags nobuffer -i rtmp://127.0.0.1:1935/720p/test23 -c:v libx264 -c:a aac -ac 1 -strict -2 -crf 18 -vf scale=w=1280:h=720:force_original_aspect_ratio=decrease -profile:v baseline -b:v 2800k -maxrate 2996k -bufsize 4200k -b:a 128k -pix_fmt yuv420p -flags -global_header -hls_time 6 -hls_list_size 6 -hls_flags delete_segments -max_muxing_queue_size 1024 -strftime 1 -hls_segment_filename ./media/test23/720p/%Y%m%d-%s.ts ./media/test23/720p/index.m3u8



# Try this:
h264_nvenc uses the NVidia hardware assisted H.264 video encoder