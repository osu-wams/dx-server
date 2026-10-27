import { http, HttpResponse } from 'msw';
import { server } from '@src/mocks/server';
import { createJsonApiClient, deserialise, toQueryString } from '../jsonapi';

describe('jsonapi module', () => {
  describe('toQueryString', () => {
    it('serialises nested params with bracket notation', () => {
      const query = toQueryString({
        fields: { 'node--services': 'id,title' },
        include: 'field_audience',
        filter: {
          status: 1,
          field_expiration_date: { condition: { operator: '>', path: 'field_date', value: 'now' } },
        },
        page: { limit: 50, offset: 0 },
        sort: undefined,
      });
      expect(query).toBe(
        [
          'fields%5Bnode--services%5D=id%2Ctitle',
          'include=field_audience',
          'filter%5Bstatus%5D=1',
          'filter%5Bfield_expiration_date%5D%5Bcondition%5D%5Boperator%5D=%3E',
          'filter%5Bfield_expiration_date%5D%5Bcondition%5D%5Bpath%5D=field_date',
          'filter%5Bfield_expiration_date%5D%5Bcondition%5D%5Bvalue%5D=now',
          'page%5Blimit%5D=50',
          'page%5Boffset%5D=0',
        ].join('&'),
      );
    });
  });

  describe('deserialise', () => {
    it('flattens attributes and resolves relationships from included resources', () => {
      const document = {
        data: [
          {
            type: 'node--services',
            id: 's1',
            attributes: { title: 'Service', field_service_url: { uri: 'https://x', title: 'X' } },
            relationships: {
              field_audience: {
                data: [
                  { type: 'taxonomy_term--audience', id: 'a1' },
                  { type: 'taxonomy_term--audience', id: 'missing' },
                ],
                links: { self: { href: 'https://x/rel' } },
              },
              field_it_system: { data: null },
              field_image: { data: { type: 'media--image', id: 'm1' } },
            },
          },
        ],
        included: [
          { type: 'taxonomy_term--audience', id: 'a1', attributes: { name: 'Students' } },
          {
            type: 'media--image',
            id: 'm1',
            attributes: { name: 'Image' },
            relationships: { field_media_image: { data: { type: 'file--file', id: 'f1' } } },
          },
          { type: 'file--file', id: 'f1', attributes: { uri: { url: '/files/image.jpg' } } },
        ],
        links: { next: { href: 'https://x/next' } },
      };

      const { data, links } = deserialise(document as any);
      expect(links.next.href).toBe('https://x/next');
      expect(data).toHaveLength(1);
      const [service] = data;
      expect(service.id).toBe('s1');
      expect(service.title).toBe('Service');
      expect(service.field_service_url.uri).toBe('https://x');
      expect(service.field_audience.data.map((a) => a.name)).toEqual(['Students', undefined]);
      expect(service.field_audience.data[1]).toEqual({ type: 'taxonomy_term--audience', id: 'missing' });
      expect(service.field_audience.links.self.href).toBe('https://x/rel');
      expect(service.field_it_system.data).toBeNull();
      expect(service.field_image.data.field_media_image.data.uri.url).toBe('/files/image.jpg');
    });

    it('preserves already flattened resources and handles single resources', () => {
      const { data } = deserialise({
        data: { type: 'node--x', id: '1', title: 'Flat', field_pages: { data: [{ name: 'Home' }] } },
      } as any);
      expect(data).toEqual([
        { type: 'node--x', id: '1', title: 'Flat', field_pages: { data: [{ name: 'Home' }] } },
      ]);
    });

    it('returns an empty list for an empty document', () => {
      expect(deserialise({}).data).toEqual([]);
      expect(deserialise({ data: null }).data).toEqual([]);
    });
  });

  describe('createJsonApiClient', () => {
    const api = createJsonApiClient({ baseURL: 'https://dx.test/jsonapi/' });

    it('fetches and deserialises a document', async () => {
      let requestUrl: string;
      server.use(
        http.get('https://dx.test/jsonapi/node/information', ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json({
            data: [{ type: 'node--information', id: 'i1', attributes: { title: 'Info' } }],
          });
        }),
      );
      const { data } = await api.get('node/information', { page: { limit: 1 } });
      expect(data).toEqual([{ type: 'node--information', id: 'i1', title: 'Info' }]);
      expect(requestUrl).toBe('https://dx.test/jsonapi/node/information?page%5Blimit%5D=1');
    });

    it('throws on a failed response', async () => {
      server.use(
        http.get('https://dx.test/jsonapi/node/information', () => {
          return new HttpResponse('boom', { status: 500 });
        }),
      );
      await expect(api.get('node/information')).rejects.toMatchObject({
        response: { status: 500, body: 'boom' },
      });
    });
  });
});
