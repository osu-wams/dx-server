import fs from 'fs';
import path from 'path';

const clearLog = async () => {
  try {
    const testLog = path.join(__dirname, '../../logs/test.log');
    fs.truncateSync(testLog);
  } catch (error) {
    // no-op, it's likely the test.log file doesn't exist and couldn't get truncated
  }
};

export default clearLog;
