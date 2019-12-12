import config from 'config';

/**
 * Destructure the configs loaded and capture only configs that are not particularly sensitive
 * like API credentials, IDs, and the like.
 */
const configsForApi = (isAdmin: boolean) => {
  if (!isAdmin) return {};

  const {
    env,
    logLevel,
    appVersion,
    dxApi: { baseUrl: dxBaseUrl, cacheEndpointSec: dxCacheEndpointSec },
    osuApi: { baseUrl: osuBaseUrl, cacheEndpointSec: osuCacheEndpointSec },
    canvasApi: { baseUrl: canvasApiBaseUrl, cacheEndpointSec: canvasApiCacheEndpointSec },
    canvasOauth: {
      callbackUrl: canvasCallbackUrl,
      baseUrl: canvasBaseUrl,
      authUrl,
      tokenUrl,
      scope,
    },
    raveApi: { baseUrl: raveBaseUrl, cacheEndpointSec: raveCacheEndpointSec },
    localist: {
      campusIds,
      eventDaysAgo,
      eventDxQuery,
      cacheEndpointSec,
      baseUrl,
      academicCalendarRSS,
    },
    saml: { callbackUrl, logoutCallbackUrl },
    redis: { host, port },
    aws: {
      region,
      dynamodb: { endpoint, apiVersion, tablePrefix },
    },
  } = config.util.toObject();

  return {
    appVersion,
    aws: { dynamodb: { apiVersion, endpoint, tablePrefix }, region },
    canvasApi: { baseUrl: canvasApiBaseUrl, cacheEndpointSec: canvasApiCacheEndpointSec },
    canvasOauth: {
      authUrl,
      baseUrl: canvasBaseUrl,
      callbackUrl: canvasCallbackUrl,
      scope,
      tokenUrl,
    },
    dxApi: { baseUrl: dxBaseUrl, cacheEndpointSec: dxCacheEndpointSec },
    env,
    localist: {
      academicCalendarRSS,
      baseUrl,
      cacheEndpointSec,
      campusIds,
      eventDaysAgo,
      eventDxQuery,
    },
    logLevel,
    osuApi: { baseUrl: osuBaseUrl, cacheEndpointSec: osuCacheEndpointSec },
    raveApi: { baseUrl: raveBaseUrl, cacheEndpointSec: raveCacheEndpointSec },
    redis: { host, port },
    saml: { callbackUrl, logoutCallbackUrl },
  };
};

export default configsForApi;
