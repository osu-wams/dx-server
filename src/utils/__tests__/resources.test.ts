import { getDaysInDuration, computeTrendingResources } from '../resources';
import { fromApi } from '../../mocks/google/trendingResources';

describe('getDaysInDuration', () => {
  it('has one date', async () => {
    expect(getDaysInDuration('1daysAgo').length).toEqual(1);
  });
  it('has multiple dates', async () => {
    expect(getDaysInDuration('9daysAgo').length).toEqual(9);
  });
});

describe('computeTrendingResources', () => {
  it('groups and sums events', async () => {
    const resources = fromApi('2020-01-01', '2daysAgo');
    const result = computeTrendingResources(resources, '2020-01-01');
    expect(result[0].totalEvents).toEqual(resources[0].totalEvents);
  });
  it('computes all events', async () => {
    const resources = fromApi('2020-01-01', '2daysAgo');
    resources.push(resources[0]);
    const result = computeTrendingResources(resources, '2020-01-01');
    expect(result[0].totalEvents).toEqual(6);
  });
  it('computes events for an affiliation', async () => {
    const resources = fromApi('2020-01-01', '2daysAgo');
    const result = computeTrendingResources(resources, '2020-01-01', 'employee');
    expect(result.length).toEqual(1);
    expect(result[0].totalEvents).toEqual(3);
  });
  it('filters out non matching affiliations', async () => {
    const resources = fromApi('2020-01-01', '2daysAgo');
    const result = computeTrendingResources([resources[0]], '2020-01-01', 'student');
    expect(result.length).toEqual(0);
  });
});
