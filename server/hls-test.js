const _ = require('lodash');
const chokidar = require('chokidar');
const fs = require('./lib/fs');

const onFile = async (absolutePath, type, mediaRoot, vodName) => {
  try {
    const path = _.trim(_.replace(absolutePath, mediaRoot, ''), '/');
    console.log(`File ${path} has been ${type}`);
    // TODO Print contents.  See if we can catch when the segments are all ready.
    const liveM3u8 = await fs.readFile(absolutePath);
    console.log(liveM3u8);
  } catch (err) {
    console.log(err);
  }
};

const s3Sync = (config, vodName) => {
  const mediaRoot = config.http.mediaroot;
  console.log(`Start watcher - ${process.env.NODE_ENV}, ${mediaRoot}`);
  chokidar.watch(mediaRoot, {
    ignored: '**/*.ts', // ignore ts
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  }).on('add', (path) => onFile(path, 'add', mediaRoot, vodName))
    .on('change', (path) => onFile(path, 'change', mediaRoot, vodName));
};

s3Sync({
  http: {
    mediaroot: 'media'
  }
}, (streamName) => {
  return 'test.m3u8';
});