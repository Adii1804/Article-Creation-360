const fs = require('fs');
const { PROCESSED_LOG } = require('./config');
const log = require('./logger');

let processed = new Set();

function load() {
  try {
    if (fs.existsSync(PROCESSED_LOG)) {
      const data = JSON.parse(fs.readFileSync(PROCESSED_LOG, 'utf8'));
      processed = new Set(Array.isArray(data) ? data : []);
      log.info(`Loaded ${processed.size} already-processed paths from ${PROCESSED_LOG}`);
    }
  } catch (e) {
    log.warn('Could not load processed log, starting fresh:', e.message);
    processed = new Set();
  }
}

function save() {
  try {
    fs.writeFileSync(PROCESSED_LOG, JSON.stringify([...processed], null, 2));
  } catch (e) {
    log.error('Failed to save processed log:', e.message);
  }
}

function has(filePath) {
  return processed.has(filePath);
}

function mark(filePath) {
  processed.add(filePath);
  save();
}

module.exports = { load, has, mark };
