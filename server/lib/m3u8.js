const _ = require('lodash');

const functions = {};

functions.isMaster = data => !_.includes(data, '#EXT-X-MEDIA-SEQUENCE');

functions.parseSegments = (data) => {
  if (_.isEmpty(data) || _.isEqual(data, '')) {
    return [];
  }
  const lines = _.split(data, '\n');
  const segments = [];
  _.forEach(lines, (line) => {
    if (_.startsWith(line, '#EXTINF')) {
      segments.push({
        EXTINF: line
      });
    }
    else if (!_.startsWith(line, '#') && !_.isEqual(_.trim(line), '')) {
      _.last(segments).FILE = line;
    }
  });
  return segments;
};

functions.getTargetDurationLine = (data) => {
  let targetDurationLine = '#EXT-X-TARGETDURATION:10';
  if (_.isEmpty(data) || _.isEqual(data, '')) {
    return targetDurationLine;
  }
  const lines = _.split(data, '\n');
  _.forEach(lines, (line) => {
    if (_.startsWith(line, '#EXT-X-TARGETDURATION')) {
      targetDurationLine = line;
    }
  });
  console.log('target duration found');
  return targetDurationLine;
};

functions.sync_m3u8 = (live_m3u8, vod_m3u8, path) => {
  // Lets parse the segments.
  const live_segments = functions.parseSegments(live_m3u8);
  const vod_segments = functions.parseSegments(vod_m3u8);
  _.forEach(live_segments, (live_segment) => {
    const vod_segment = _.find(vod_segments, { FILE: `${path}/${live_segment.FILE}` });
    if (vod_segment) {
      vod_segment.EXTINF = live_segment.EXTINF;
    }
    else {
      vod_segments.push(_.assign({}, live_segment, {
        FILE: `${path}/${live_segment.FILE}`
      }));
    }
  });
  const first_sequence_num = _.trimStart(
    _.last(
      _.split(
        _.replace(
          _.replace(
            _.first(vod_segments).FILE,
            '.ts',
            ''),
          `${path}/`,
          ''),
        '_')
      ),
    '0');
  let output = '#EXTM3U\n' +
    '#EXT-X-VERSION:3\n' +
    `${functions.getTargetDurationLine(live_m3u8)}\n` +
    `#EXT-X-MEDIA-SEQUENCE:${first_sequence_num}\n`;
  _.forEach(vod_segments, (segment) => {
    output += `${segment.EXTINF}\n`;
    output += `${segment.FILE}\n`;
  });
  output += '#EXT-X-ENDLIST\n';
  return output;
};

module.exports = functions;
