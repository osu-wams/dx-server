import tracer from 'dd-trace';
import { StatsD } from 'hot-shots';

// need to require before the tracer is initialized so that it will be traced automagically
require('mysql2');

const tracerOptions = {
  analytics: true
};
export const Tracer = tracer.init(tracerOptions);

const clientOptions = {
  globalTags: {
    env: process.env.NODE_ENV
  }
};
export const Datadog = new StatsD(clientOptions);

export const asyncTimedRequest = async (fn: Function, args: Array<any>, metricName: string) => {
  const promised = () =>
    new Promise((resolve, reject) => {
      fn(...args)
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
  try {
    const instrumented = await Datadog.asyncTimer(promised, metricName);
    return instrumented().then((v: any) => v);
  } catch (err) {
    throw err;
  }
};
