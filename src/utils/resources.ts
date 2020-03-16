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

const groupSum = (r: TrendingResource[], dateKey: string) =>
  r.reduce((p: { [index: string]: TrendingResource }, c) => {
    const key = `${c.resourceId}-${c.affiliation}-${c.campus}`;
    /* eslint-disable no-param-reassign */
    if (!p[key]) {
      p[key] = c;
      p[key].date = dateKey;
      return p;
    }
    p[key].totalEvents += c.totalEvents;
    p[key].uniqueEvents += c.uniqueEvents;
    /* eslint-enable no-param-reassign */
    return p;
  }, Object.create(null));
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
  dateKey: string,
  affiliation?: string,
): TrendingResource[] => {
  let groups: { [index: string]: TrendingResource };
  if (affiliation) {
    groups = groupSum(
      resources.filter((tr: TrendingResource) => tr.affiliation?.toLowerCase() === affiliation),
      dateKey,
    );
  } else {
    groups = groupSum(resources, dateKey);
  }

  return Object.keys(groups)
    .sort((a, b) => groups[a].uniqueEvents - groups[b].uniqueEvents)
    .reverse()
    .map((key) => groups[key]);
};
