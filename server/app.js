const NodeMediaServer = require('node-media-server');
const _ = require('lodash');
const { join } = require('path');
const querystring = require('querystring');
const fs = require('./lib/fs');
const hls = require('./lib/hls');
const abr = require('./lib/abr');
const ecs = require('./lib/ecs');
const cache = require('./lib/cache');
const logger = require('./lib/logger');
const utils = require('./lib/utils');

const LOG_TYPE = 4;
logger.setLogType(LOG_TYPE);

// init RTMP server
const init = async () => {
  try {
    // Fetch the container server address (IP:PORT)
    // The IP is from the EC2 server.  The PORT is from the container.
    const SERVER_ADDRESS = process.env.NODE_ENV === 'production' ? await ecs.getServer() : '';

    // Set the Node-Media-Server config.
    const config = {
      logType: LOG_TYPE,
      rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
      },
      http: {
        port: 8080,
        mediaroot: process.env.MEDIA_ROOT || 'media',
        allow_origin: '*',
        api: true
      },
      auth: {
        api: false
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
              'libx264',
              '-preset',
              'veryfast',
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
              'libx264',
              '-preset',
              'veryfast',
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
              'libx264',
              '-preset',
              'veryfast',
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

    // Construct the NodeMediaServer
    const nms = new NodeMediaServer(config);

    // Create the maps we'll need to track the current streams.
    this.dynamicSessions = new Map();
    this.streams = new Map();

    // Start the VOD S3 file watcher and sync.
    hls.recordHls(config, this.streams);

    //
    // HLS callbacks
    //
    hls.on('newHlsStream', async (name) => {
      await abr.createPlaylist(config.http.mediaroot, name);
      await cache.set(name, SERVER_ADDRESS);
    });

    //
    // RTMP callbacks
    //
    nms.on('preConnect', (id, args) => {
      logger.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
      // Pre connect authorization
      // let session = nms.getSession(id);
      // session.reject();
    });
    
    nms.on('postConnect', (id, args) => {
      logger.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });
    
    nms.on('doneConnect', (id, args) => {
      logger.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });
    
    nms.on('prePublish', (id, StreamPath, args) => {
      logger.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      // Pre publish authorization
      // let session = nms.getSession(id);
      // session.reject();
    });
    
    nms.on('postPublish', async (id, StreamPath, args) => {
      logger.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      if (StreamPath.indexOf('/hls/') != -1) {
        const name = StreamPath.split('/').pop();
        this.streams.set(name, id);
      } else if (StreamPath.indexOf('/stream/') != -1) {
        // Relay to youtube, facebook, twitch ???
        if (args.youtube) {
          const params = utils.getParams(args, 'youtube_');
          const query = _.isEmpty(params) ? '' : `?${querystring.stringify(params)}`;
          const url = `rtmp://a.rtmp.youtube.com/live2/${args.youtube}${query}`;
          const session = nms.nodeRelaySession({
            ffmpeg: config.relay.ffmpeg,
            inPath: `rtmp://127.0.0.1:${config.rtmp.port}${StreamPath}`,
            ouPath: url
          });
          session.id = `youtube-${id}`;
          session.on('end', (id) => {
            this.dynamicSessions.delete(id);
          });
          this.dynamicSessions.set(session.id, session);
          session.run();
        }
        if (args.facebook) {
          const params = utils.getParams(args, 'facebook_');
          const query = _.isEmpty(params) ? '' : `?${querystring.stringify(params)}`;
          const url = `rtmps://live-api-s.facebook.com:443/rtmp/${args.facebook}${query}`;
          session = nms.nodeRelaySession({
            ffmpeg: config.relay.ffmpeg,
            inPath: `rtmp://127.0.0.1:${config.rtmp.port}${StreamPath}`,
            ouPath: url
          });
          session.id = `facebook-${id}`;
          session.on('end', (id) => {
            this.dynamicSessions.delete(id);
          });
          this.dynamicSessions.set(session.id, session);
          session.run();
        }
        if (args.twitch) {
          const params = utils.getParams(args, 'twitch_');
          const query = _.isEmpty(params) ? '' : `?${querystring.stringify(params)}`;
          const url = `rtmp://live-jfk.twitch.tv/app/${args.twitch}${query}`;
          session = nms.nodeRelaySession({
            ffmpeg: config.relay.ffmpeg,
            inPath: `rtmp://127.0.0.1:${config.rtmp.port}${StreamPath}`,
            ouPath: url,
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
          session.on('end', (id) => {
            this.dynamicSessions.delete(id);
          });
          this.dynamicSessions.set(session.id, session);
          session.run();
        }
      }
    });
    
    nms.on('donePublish', async (id, StreamPath, args) => {
      logger.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      if (StreamPath.indexOf('/hls/') != -1) {
        const name = StreamPath.split('/').pop();
        await cache.del(name);
        const timeoutMs = _.isEqual(process.env.NODE_ENV, 'development') ?
          1000 : 
          2 * 60 * 1000;
        await utils.timeout(timeoutMs);
        try {
          // Cleanup directory
          logger.log('[Delete HLS Directory]', `dir=${join(config.http.mediaroot, name)}`);
          this.streams.delete(name);
          fs.rmdirSync(join(config.http.mediaroot, name));
        } catch (err) {
          logger.error(err);
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
      logger.log('[NodeEvent on prePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      // Pre play authorization
      // let session = nms.getSession(id);
      // session.reject();
    });
    
    nms.on('postPlay', (id, StreamPath, args) => {
      logger.log('[NodeEvent on postPlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
    });
    
    nms.on('donePlay', (id, StreamPath, args) => {
      logger.log('[NodeEvent on donePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
    });

    // Run the NodeMediaServer
    nms.run();
  } catch (err) {
    logger.log('Can\'t start app', err);
    process.exit();
  }
};
init();

