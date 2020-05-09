const fs = require('fs');

const functions = {};

functions.readdir = (dirPath, options) => new Promise((resolve, reject) => {
  fs.readdir(dirPath, options, (err, files) => {
    if (err) return reject(err);
    return resolve(files);
  });
});

functions.writeFile = (file, data) => new Promise((resolve, reject) => {
  fs.writeFile(file, data, { encoding: 'utf8' }, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});

functions.readFile = (file) => new Promise((resolve, reject) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return reject(err);
    return resolve(data);
  });
});

functions.createReadStream = (file) => 
  fs.createReadStream(file);

functions.rename = (oldPath, newPath) => new Promise((resolve, reject) => {
  fs.rename(oldPath, newPath, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});

functions.mkdir = (path, options) => new Promise((resolve, reject) => {
  fs.mkdir(path, options, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});

functions.unlink = (file) => new Promise((resolve, reject) => {
  fs.unlink(file, (err) => {
    if (err) return reject(err);
    return resolve();
  });
});

functions.rmdirSync = (path) => {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        functions.rmdirSync(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

functions.exists = (file) => new Promise((resolve) => {
  fs.access(file, fs.constants.F_OK, (err) => {
    resolve(!err);
  });
});

module.exports = functions;
