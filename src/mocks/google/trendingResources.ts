import * as trendingResourcesResponse from './trendingResources.data.json';

const mockedTrendingResources: string[][] = trendingResourcesResponse.data['rows'];
const fromDynamoDb = (date: string) =>
  mockedTrendingResources.map(([resourceId, concatenatedTitle, totalEvents, uniqueEvents]) => ({
    resourceId: { S: resourceId },
    date: { S: date },
    affiliation: { S: concatenatedTitle.split(' || ')[0] },
    campus: { S: concatenatedTitle.split(' || ')[1] },
    title: { S: concatenatedTitle.split(' || ')[2] },
    totalEvents: { N: totalEvents },
    uniqueEvents: { N: uniqueEvents },
  }));

const fromApi = (date: string, period: string) =>
  mockedTrendingResources
    .map(([resourceId, concatenatedTitle, totalEvents, uniqueEvents]) => ({
      resourceId: resourceId,
      date,
      affiliation: concatenatedTitle.split(' || ')[0],
      campus: concatenatedTitle.split(' || ')[1],
      title: concatenatedTitle.split(' || ')[2],
      totalEvents: parseInt(totalEvents, 10),
      uniqueEvents: parseInt(uniqueEvents, 10),
      period,
    }))
    .reverse();

export { trendingResourcesResponse, mockedTrendingResources, fromDynamoDb, fromApi };
