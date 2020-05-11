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
        edge: 'rtmp://127.0.0.1/360p',
      },
      {
        app: 'stream',
        mode: 'push',
        edge: 'rtmp://127.0.0.1/480p',
      },
      {
        app: 'stream',
        mode: 'push',
        edge: 'rtmp://127.0.0.1/720p',
      },
    ],
  },
  trans: {
    ffmpeg: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: '360p',
        hls: true,
        raw: [
          '-c:v',
          'libx264',
          '-c:a',
          'aac',
          '-ac',
          '1',
          '-strict',
          '-2',
          '-crf',
          '18',
          '-vf',
          'scale=w=640:h=360:force_original_aspect_ratio=decrease',
          '-profile:v',
          'baseline',
          '-b:v',
          '800k',
          '-maxrate',
          '856k',
          '-bufsize',
          '1200k',
          '-b:a',
          '96k',
          '-pix_fmt',
          'yuv420p',
          '-flags',
          '-global_header',
          '-hls_time',
          '6',
          '-hls_list_size',
          '6',
          '-hls_flags',
          'delete_segments',
          '-max_muxing_queue_size',
          '1024',
          '-strftime',
          '1',
          '-hls_segment_filename',
          '${mediaroot}/${streamName}/${streamApp}/%Y%m%d-%s.ts'
        ],
        ouPath: '${mediaroot}/${streamName}/${streamApp}',
        hlsFlags: '',
        cleanup: false,
      },
      {
        app: '480p',
        hls: true,
        raw: [
          '-c:v',
          'libx264',
          '-c:a',
          'aac',
          '-ac',
          '1',
          '-strict',
          '-2',
          '-crf',
          '18',
          '-vf',
          'scale=w=842:h=480:force_original_aspect_ratio=decrease',
          '-profile:v',
          'baseline',
          '-b:v',
          '1400k',
          '-maxrate',
          '1498k',
          '-bufsize',
          '2100k',
          '-b:a',
          '128k',
          '-pix_fmt',
          'yuv420p',
          '-flags',
          '-global_header',
          '-hls_time',
          '6',
          '-hls_list_size',
          '6',
          '-hls_flags',
          'delete_segments',
          '-max_muxing_queue_size',
          '1024',
          '-strftime',
          '1',
          '-hls_segment_filename',
          '${mediaroot}/${streamName}/${streamApp}/%Y%m%d-%s.ts'
        ],
        ouPath: '${mediaroot}/${streamName}/${streamApp}',
        hlsFlags: '',
        cleanup: false,
      },
      {
        app: '720p',
        hls: true,
        raw: [
          '-c:v',
          'libx264',
          '-c:a',
          'aac',
          '-ac',
          '1',
          '-strict',
          '-2',
          '-crf',
          '18',
          '-vf',
          'scale=w=1280:h=720:force_original_aspect_ratio=decrease',
          '-profile:v',
          'baseline',
          '-b:v',
          '2800k',
          '-maxrate',
          '2996k',
          '-bufsize',
          '4200k',
          '-b:a',
          '128k',
          '-pix_fmt',
          'yuv420p',
          '-flags',
          '-global_header',
          '-hls_time',
          '6',
          '-hls_list_size',
          '6',
          '-hls_flags',
          'delete_segments',
          '-max_muxing_queue_size',
          '1024',
          '-strftime',
          '1',
          '-hls_segment_filename',
          '${mediaroot}/${streamName}/${streamApp}/%Y%m%d-%s.ts'
        ],
        ouPath: '${mediaroot}/${streamName}/${streamApp}',
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
  if (StreamPath.indexOf('/720p/') != -1) {
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
  if (StreamPath.indexOf('/720p/') != -1) {
    const name = StreamPath.split('/').pop();
    await timeout(15000);
    this.streams.delete(name);
    try {
      // Cleanup directory
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

