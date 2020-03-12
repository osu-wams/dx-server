import TrendingResource from '../api/models/trendingResource'; // eslint-disable-line no-unused-vars

export const getDaysInDuration = (duration: string): [number, Date][] => {
  const [number] = duration.toLowerCase().split('daysago');
  const now = new Date(Date.now());
  const days = [...Array(parseInt(number, 10))];
  return days.map((v, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (i + 1));
    return [i + 1, d];
  });
};

/**
 * Get a list of the most often clicked resources.
 * Filter, sum event counts, and return a sorted array of trending resources in descending order
 * based on the total unique click events found.
 * @param resources the list of trending resource records to calculate
 * @param affiliation the affiliation to be filtered
 * @param dateKey the current date formatted as YYYY-MM-DD
 */
export const computeTrendingResources = (
  resources: TrendingResource[],
  affiliation: string,
  dateKey: string,
): TrendingResource[] => {
  const summed: { [index: string]: TrendingResource } = resources
    .filter((tr: TrendingResource) => tr.affiliation?.toLowerCase() === affiliation)
    .reduce((p: { [index: string]: TrendingResource }, c) => {
      /* eslint-disable no-param-reassign */
      p[c.resourceId] = p[c.resourceId] || c;
      p[c.resourceId].totalEvents += c.totalEvents;
      p[c.resourceId].uniqueEvents += c.uniqueEvents;
      p[c.resourceId].date = dateKey;
      /* eslint-enable no-param-reassign */
      return p;
    }, Object.create(null));
  return Object.keys(summed)
    .sort((a, b) => summed[a].uniqueEvents - summed[b].uniqueEvents)
    .reverse()
    .map((key) => summed[key]);
};
