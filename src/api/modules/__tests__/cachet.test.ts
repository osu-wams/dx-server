/* eslint-disable no-unused-vars */

import { rest } from 'msw';
import { server } from '@src/mocks/server';
import { getSystemsStatus, CACHET_BASE_URL } from '../cachet'; // eslint-disable-line no-unused-vars
import componentsResponse, { expectedResponse } from '../../../mocks/cachet/components';
import incidentsResponse from '../../../mocks/cachet/incidents';

/**
 * Use Nock to intercept API calls since this method fetches and combines multiple endpoints, which makes
 * it not currently possible to mock cache.get instead.
 */
beforeEach(() => {
  server.use(
    rest.get(`${CACHET_BASE_URL}/components`, async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(componentsResponse));
    }),
    rest.get(`${CACHET_BASE_URL}/incidents`, async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(incidentsResponse));
    }),
  );
});

describe('Cachet IT System status module', () => {
  it('fetches the current status of all systems', async () => {
    expect(await getSystemsStatus()).toMatchObject(expectedResponse);
  });
  it('will return the most recent stickied incident for a component', async () => {
    const response = await getSystemsStatus();
    expect(response).toMatchObject(expectedResponse);

    // The stickied=false incident for this component
    const improperExpectation = expectedResponse;
    improperExpectation[1].incidents = [
      {
        id: incidentsResponse.data[1].id,
        name: incidentsResponse.data[1].name,
        message: incidentsResponse.data[1].message,
        permalink: incidentsResponse.data[1].permalink,
        status: incidentsResponse.data[1].latest_status,
        statusText: incidentsResponse.data[1].latest_human_status,
        isResolved: incidentsResponse.data[1].is_resolved,
        duration: incidentsResponse.data[1].duration,
        updatedAt: incidentsResponse.data[1].updated_at,
      },
    ];
    expect(response).not.toMatchObject(improperExpectation);
  });
});
