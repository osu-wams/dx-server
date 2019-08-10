import config from 'config';
import Honeycomb from 'honeycomb-beeline';

Honeycomb({
  writeKey: config.get('honeycomb.writeKey'),
  dataset: config.get('honeycomb.dataset')
  // ... additional optional configuration ...
});
