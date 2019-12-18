import logger from './logger';

export const asyncTimedFunction = async <T>(
  fn: Function,
  metricName: string,
  args: Array<any>
): Promise<T> => {
  const promised = (): Promise<T> =>
    new Promise((resolve, reject) => {
      fn(...args)
        .then((data: T) => resolve(data))
        .catch(err => reject(err));
    });
  try {
    const started = process.hrtime();
    const result = await promised();
    const elapsed = process.hrtime(started);
    const elapsedMs = (elapsed[0] * 1000000 + elapsed[1] / 1000) / 1000;
    // Logs a useful message along with data that can be used to create charts (Cloudwatch Insights)
    logger().debug(`${metricName} took ${elapsedMs}ms`, {
      elapsedMs,
      metricName,
      metricType: 'timed-function'
    });
    return result;
  } catch (err) {
    throw err;
  }
};

export default asyncTimedFunction;
