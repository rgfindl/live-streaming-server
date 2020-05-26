// Timeout with promise
const timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  timeout
};