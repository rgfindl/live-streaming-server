const fs = require('./fs');

const abrTemplate = () => {
  let line = `#EXTM3U\n#EXT-X-VERSION:3\n`
  line += `#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p/index.m3u8\n`
  line += `#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480\n480p/index.m3u8\n`
  line += `#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p/index.m3u8`
  return line
};

const createPlaylist = async (mediaRoot, name) => {
  console.log('create abr playlist');
  await fs.mkdir(`${mediaRoot}/${name}`, { recursive: true });
  await fs.writeFile(`${mediaRoot}/${name}/live.m3u8`, abrTemplate());
};

module.exports = {
  createPlaylist
};