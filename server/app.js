const NodeMediaServer = require('node-media-server');
const { join } = require('path');
const fs = require('./lib/fs');
const hls = require('./lib/hls');
const _ = require('lodash');

const publishAuthorizer = (id, publishStreamPath, publishStreamId) => {
  console.log('publishAuthorizer', id, publishStreamPath, publishStreamId);
  return true;
};
const playAuthorizer = (id, playStreamPath, playStreamId) => {
  console.log('playAuthorizer', id, playStreamPath, playStreamId);
  return false;
};

const config = {
  logType: 4,
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: process.env.MEDIA_ROOT || 'media',
    webroot: './www',
    allow_origin: '*',
    api: true
  },
  auth: {
    api: false,
    publishAuthorizer
  },
  relay: {
    ffmpeg: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'stream',
        mode: 'push',
        edge: 'rtmp://127.0.0.1/hls',
      },
    ],
  },
  trans: {
    ffmpeg: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'hls',
        hls: true,
        raw: [
          '-vf',
          'scale=w=640:h=360:force_original_aspect_ratio=decrease',
          '-c:a',
          'aac',
          '-ar',
          '48000',
          '-c:v',
          'h264',
          '-tune',
          'zerolatency',
          '-profile:v',
          'main',
          '-crf',
          '20',
          '-sc_threshold',
          '0',
          '-g',
          '48',
          '-keyint_min',
          '48',
          '-hls_time',
          '6',
          '-hls_list_size',
          '10',
          '-hls_flags',
          'delete_segments',
          '-max_muxing_queue_size',
          '1024',
          '-start_number',
          '${timeInMilliseconds}',
          '-b:v',
          '800k',
          '-maxrate',
          '856k',
          '-bufsize',
          '1200k',
          '-b:a',
          '96k',
          '-hls_segment_filename',
          '${mediaroot}/${streamName}/360p/%03d.ts',
          '${mediaroot}/${streamName}/360p/index.m3u8',
          '-vf',
          'scale=w=842:h=480:force_original_aspect_ratio=decrease',
          '-c:a',
          'aac',
          '-ar',
          '48000',
          '-c:v',
          'h264',
          '-tune',
          'zerolatency',
          '-profile:v',
          'main',
          '-crf',
          '20',
          '-sc_threshold',
          '0',
          '-g',
          '48',
          '-keyint_min',
          '48',
          '-hls_time',
          '6',
          '-hls_list_size',
          '10',
          '-hls_flags',
          'delete_segments',
          '-max_muxing_queue_size',
          '1024',
          '-start_number',
          '${timeInMilliseconds}',
          '-b:v',
          '1400k',
          '-maxrate',
          '1498k',
          '-bufsize',
          '2100k',
          '-b:a',
          '128k',
          '-hls_segment_filename',
          '${mediaroot}/${streamName}/480p/%03d.ts',
          '${mediaroot}/${streamName}/480p/index.m3u8',
          '-vf',
          'scale=w=1280:h=720:force_original_aspect_ratio=decrease',
          '-c:a',
          'aac',
          '-ar',
          '48000',
          '-c:v',
          'h264',
          '-tune',
          'zerolatency',
          '-profile:v',
          'main',
          '-crf',
          '20',
          '-sc_threshold',
          '0',
          '-g',
          '48',
          '-keyint_min',
          '48',
          '-hls_time',
          '6',
          '-hls_list_size',
          '10',
          '-hls_flags',
          'delete_segments',
          '-max_muxing_queue_size',
          '1024',
          '-start_number',
          '${timeInMilliseconds}',
          '-b:v',
          '2800k',
          '-maxrate',
          '2996k',
          '-bufsize',
          '4200k',
          '-b:a',
          '128k',
          '-hls_segment_filename',
          '${mediaroot}/${streamName}/720p/%03d.ts',
          '${mediaroot}/${streamName}/720p/index.m3u8'
        ],
        ouPaths: [
          '${mediaroot}/${streamName}/360p',
          '${mediaroot}/${streamName}/480p',
          '${mediaroot}/${streamName}/720p'
        ],
        hlsFlags: '',
        cleanup: false,
      },
    ]
  },
};

this.dynamicSessions = new Map();
this.streams = new Map();

const vodName = (streamName) => {
  if (!this.streams.has(streamName)) return false;
  return `vod-${this.streams.get(streamName)}.m3u8`;
};

let nms = new NodeMediaServer(config)
nms.run();
hls.s3Sync(config, vodName);

nms.on('preConnect', (id, args) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
});

nms.on('postConnect', (id, args) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('doneConnect', (id, args) => {
  console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
});

nms.on('postPublish', async (id, StreamPath, args) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  if (StreamPath.indexOf('/hls/') != -1) {
    const name = StreamPath.split('/').pop();
    this.streams.set(name, id);
    try {
      await hls.createAbrPlaylist(config.http.mediaroot, name);
    } catch (err) {
      console.log(err);
    }
  } else if (StreamPath.indexOf('/stream/') != -1) {
    // Relay to youtube, facebook, twitch ???
    let session;
    if (args.youtube) {
      session = nms.nodeRelaySession({
        ffmpeg: config.relay.ffmpeg,
        inPath: `rtmp://127.0.0.1:${config.rtmp.port}${StreamPath}`,
        ouPath: `rtmp://a.rtmp.youtube.com/live2/${decodeURI(args.youtube)}`
      });
      session.id = `youtube-${id}`;
    }
    if (args.facebook) {
      session = nms.nodeRelaySession({
        ffmpeg: config.relay.ffmpeg,
        inPath: `rtmp://127.0.0.1:${config.rtmp.port}${StreamPath}`,
        ouPath: `rtmps://live-api-s.facebook.com:443/rtmp/${decodeURI(args.facebook)}`
      });
      session.id = `facebook-${id}`;
    }
    if (args.twitch) {
      session = nms.nodeRelaySession({
        ffmpeg: config.relay.ffmpeg,
        inPath: `rtmp://127.0.0.1:${config.rtmp.port}${StreamPath}`,
        ouPath: `rtmp://live-jfk.twitch.tv/app/${decodeURI(args.twitch)}`,
        raw: [
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-c:a',
          'copy',
          '-b:v',
          '3500k',
          '-maxrate',
          '3750k',
          '-bufsize',
          '4200k',
          '-s',
          '1280x720',
          '-r',
          '30',
          '-f',
          'flv',
          '-max_muxing_queue_size',
          '1024',
        ]
      });
      session.id = `twitch-${id}`;
    }
    if (session) {
      session.on('end', (id) => {
        this.dynamicSessions.delete(id);
      });
      this.dynamicSessions.set(session.id, session);
      session.run();
    }
  }
});

const timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

nms.on('donePublish', async (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  if (StreamPath.indexOf('/hls/') != -1) {
    const name = StreamPath.split('/').pop();
    const timeoutMs = _.isEqual(process.env.NODE_ENV, 'development') ?
      1000 : 
      2 * 60 * 1000;
    await timeout(timeoutMs);
    try {
      // Cleanup directory
      console.log('[Delete HLS Directory]', `dir=${join(config.http.mediaroot, name)}`);
      this.streams.delete(name);
      fs.rmdirSync(join(config.http.mediaroot, name));
    } catch (err) {
      console.log(err);
    }
  } else if (StreamPath.indexOf('/stream/') != -1) {
    if (args.youtube) {
      let session = this.dynamicSessions.get(`youtube-${id}`);
      if (session) {
        session.end();
        this.dynamicSessions.delete(`youtube-${id}`);
      }
    }
    if (args.facebook) {
      let session = this.dynamicSessions.get(`facebook-${id}`);
      if (session) {
        session.end();
        this.dynamicSessions.delete(`facebook-${id}`);
      }
    }
    if (args.twitch) {
      let session = this.dynamicSessions.get(`twitch-${id}`);
      if (session) {
        session.end();
        this.dynamicSessions.delete(`twitch-${id}`);
      }
    }
  }
});

nms.on('prePlay', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
});

nms.on('postPlay', (id, StreamPath, args) => {
  console.log('[NodeEvent on postPlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

