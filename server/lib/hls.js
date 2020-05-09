
const _ = require('lodash');
const chokidar = require('chokidar');
const { join } = require('path');
const fs = require('./fs');
const s3 = require('./s3');
const m3u8 = require('./m3u8');

const VOD_APP_NAME = '720p';

const abrTemplate = () => {
  let line = `#EXTM3U\n#EXT-X-VERSION:3\n`
  line += `#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p/index.m3u8\n`
  line += `#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480\n480p/index.m3u8\n`
  line += `#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p/index.m3u8`
  return line
};

// ABR - media/test4/index.m3u8
const handleMasterPlaylist = async (path, mediaRoot) => {
  const params = {
    Body: await fs.readFile(join(mediaRoot, path)),
    Bucket: process.env.ASSETS_BUCKET,
    Key: path,
    ContentType: 'application/x-mpegURL',
    CacheControl: 'max-age=3600'
  };
  await s3.putObject(params);
};

// HLS - test4/720p/index.m3u8
const handlePlaylist = async (path, mediaRoot) => {
  console.log('handlePlaylist', path);
  if (await fs.exists(join(mediaRoot, path))) {
    const liveM3u8 = await fs.readFile(join(mediaRoot, path));
    const params = {
      Body: liveM3u8,
      Bucket: process.env.ASSETS_BUCKET,
      Key: path,
      ContentType: 'application/x-mpegURL',
      CacheControl: 'max-age=0'
    };
    await s3.putObject(params);

    // TODO 
    // Put /vod.m3u8 with all segments and end tag.
    const paths = _.split(path, '/');
    const streamName = _.nth(paths, 0);
    const appName = _.nth(paths, 1);
    if (_.isEqual(appName, VOD_APP_NAME)) {
      let vodM3u8;
      const vodPath = join(mediaRoot, streamName, 'vod.m3u8');
      if (await fs.exists(vodPath)) {
        vodM3u8 = await fs.readFile(vodPath);
      }
      vodM3u8 = m3u8.sync_m3u8(liveM3u8, vodM3u8, appName);
      await fs.writeFile(vodPath, vodM3u8);
      const params = {
        Body: vodM3u8,
        Bucket: process.env.ASSETS_BUCKET,
        Key: `${streamName}/vod.m3u8`,
        ContentType: 'application/x-mpegURL',
        CacheControl: 'max-age=0'
      };
      await s3.putObject(params);
    }
  }
};

// TS  - media/test4/720p/20200504-1588591755.ts
const handleSegment = async (path, mediaRoot) => {
  // TODO Check if valid before uploading.
  // ffprobe -v error -i /Users/findleyr/Documents/code/live-streaming-server/mnt/hls/2a9dafff-2676-7090-8625-b7916a001969_hd/21.ts
  const params = {
    Body: fs.createReadStream(join(mediaRoot, path)),
    Bucket: process.env.ASSETS_BUCKET,
    Key: path,
    ContentType: 'video/MP2T',
    CacheControl: 'max-age=31536000'
  };
  await s3.putObject(params);
  await handlePlaylist(_.join(_.union(_.initial(_.split(path, '/')), ['index.m3u8']), '/'), mediaRoot);
};

// ABR - media/test4/live.m3u8
// HLS - media/test4/720p/index.m3u8
// TS  - media/test4/720p/20200504-1588591755.ts
// [360p, 480p, 720p]

const onFile = async (absolutePath, type, mediaRoot) => {
  try {
    const path = _.trim(_.replace(absolutePath, mediaRoot, ''), '/');
    console.log(`File ${path} has been added`);
    if (_.endsWith(path, 'live.m3u8')) {
      await handleMasterPlaylist(path, mediaRoot);
    } else if (_.endsWith(path, '.ts')) {
      await handleSegment(path, mediaRoot);
    }
  } catch (err) {
    console.log(err);
  }
};

const finalizeVod = async (mediaRoot, streamName) => {
  const vodPath = join(mediaRoot, streamName, 'vod.m3u8');
  const vodM3u8 = await fs.readFile(vodPath);
  const params = {
    Body: vodM3u8,
    Bucket: process.env.ASSETS_BUCKET,
    Key: `${streamName}/vod-${(new Date()).getTime()}.m3u8`,
    ContentType: 'application/x-mpegURL',
    CacheControl: 'max-age=31536000'
  };
  await s3.putObject(params);
};

const createAbrPlaylist = async (mediaRoot, name) => {
  console.log('create abr playlist');
  await fs.mkdir(`${mediaRoot}/${name}`, { recursive: true });
  await fs.writeFile(`${mediaRoot}/${name}/live.m3u8`, abrTemplate());
};

const s3Sync = (config) => {
  const mediaRoot = config.http.mediaroot;
  console.log(`Start watcher - ${process.env.NODE_ENV}, ${mediaRoot}`);
  chokidar.watch(mediaRoot, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  }).on('add', (path) => onFile(path, 'add', mediaRoot))
    .on('change', (path) => onFile(path, 'change', mediaRoot));
};

module.exports = {
  s3Sync,
  finalizeVod,
  createAbrPlaylist
};
