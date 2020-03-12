import * as trendingResourcesResponse from './trendingResources.data.json';

const mockedTrendingResources: string[][] = trendingResourcesResponse.data['rows'];
const fromDynamoDb = (dateKey: string) =>
  mockedTrendingResources.map(([resourceId, concatenatedTitle, totalEvents, uniqueEvents]) => ({
    resourceId: { S: resourceId },
    date: { S: dateKey },
    affiliation: { S: concatenatedTitle.split(' || ')[0] },
    campus: { S: concatenatedTitle.split(' || ')[1] },
    title: { S: concatenatedTitle.split(' || ')[2] },
    totalEvents: { N: totalEvents },
    uniqueEvents: { N: uniqueEvents },
  }));

export { trendingResourcesResponse, mockedTrendingResources, fromDynamoDb };
