import config from 'config';
import Honeycomb from 'honeycomb-beeline';

const beeline = Honeycomb({
  writeKey: config.get('honeycomb.writeKey'),
  dataset: config.get('honeycomb.dataset')
  // ... additional optional configuration ...
});

export default beeline;
