
const _ = require('lodash');
const logger = require('./logger');
const chokidar = require('chokidar');
const { join } = require('path');
const fs = require('./fs');
const s3 = require('./s3');

const handleMasterPlaylist = async path => {
  const uuid = _.replace(path, '.m3u8', '');
  const contents = await fs.readFile(join(process.env.HLS_PATH, path));
  const params = {
    Body: _.replace(_.replace(contents, new RegExp(`${uuid}_`,'g'), ''), new RegExp('index.m3u8','g'), 'live.m3u8'),
    Bucket: process.env.ASSETS_BUCKET,
    Key: _.replace(path, '.m3u8', '/live.m3u8'),
    ContentType: 'application/x-mpegURL',
    CacheControl: 'max-age=3600'
  };
  await s3.putObject(params);

  // TODO 
  // Put /vod.m3u8 with vod.m3u8 playlists.
};

const handlePlaylist = async path => {
  const params = {
    Body: await fs.readFile(join(process.env.HLS_PATH, path)),
    Bucket: process.env.ASSETS_BUCKET,
    Key: _.replace(_.replace(path, '_', '/'), 'index.m3u8', 'live.m3u8'),
    ContentType: 'application/x-mpegURL',
    CacheControl: 'max-age=0'
  };
  await s3.putObject(params);

  // TODO 
  // Put /vod.m3u8 with all segments and end tag.
};

const handleSegment = async path => {
  // TODO Check if valid before uploading.
  // ffprobe -v error -i /Users/findleyr/Documents/code/live-streaming-server/mnt/hls/2a9dafff-2676-7090-8625-b7916a001969_hd/21.ts
  const params = {
    Body: fs.createReadStream(join(process.env.HLS_PATH, path)),
    Bucket: process.env.ASSETS_BUCKET,
    Key: _.replace(path, '_', '/'),
    ContentType: 'video/MP2T',
    CacheControl: 'max-age=31536000'
  };
  await s3.putObject(params);
};

// 028a65b5-b6d3-605a-1594-270de5b84a0f_hd/index.m3u8
// 028a65b5-b6d3-605a-1594-270de5b84a0f_hd/8.ts
// 028a65b5-b6d3-605a-1594-270de5b84a0f.m3u8
// [mobile, sd, hd]

const onFile = async (absolutePath, type) => {
  try {
    const path = _.trim(_.replace(absolutePath, process.env.HLS_PATH, ''), '/');
    logger.debug(`File ${path} has been added`);
    if (_.endsWith(path, '.m3u8')) {
      if (_.includes(path, '_')) {
        await handlePlaylist(path);
      } else {
        await handleMasterPlaylist(path);
      }
    } else if (_.endsWith(path, '.ts')) {
      await handleSegment(path);
    }
  } catch (err) {
    logger.error(err);
  }
};

module.exports = () => {
  logger.debug(`Start watcher - ${process.env.NODE_ENV}, ${process.env.HLS_PATH}`);
  // chokidar.watch(process.env.HLS_PATH, {
  //   ignored: /(^|[\/\\])\../, // ignore dotfiles
  //   persistent: true,
  //   awaitWriteFinish: {
  //     stabilityThreshold: 2000,
  //     pollInterval: 100
  //   }
  // }).on('add', (path) => onFile(path, 'add')).on('change', (path) => onFile(path, 'change'));
};
