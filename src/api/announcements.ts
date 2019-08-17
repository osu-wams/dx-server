/**
 * /api/announcements
 */
import config from 'config';
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import request from 'request-promise';

const baseUrl = config.get('dxApi.baseUrl');
const academicGuid = config.get('dxApi.academicGuid');
const financialGuid = config.get('dxApi.financialGuid');
const includes = 'include=field_announcement_image,field_announcement_image.field_media_image';
const announcementsUrl = `${baseUrl}/jsonapi/node/announcement?${includes}&sort=-created`;
const queueUrl = `${baseUrl}/jsonapi/entity_subqueue/announcements`;

const router: Router = Router();

const getData = async (url: string) => {
  const { data, included } = await request.get(url, { json: true });
  if (included) {
    included.forEach((item: any) => {
      const matchingAnnouncement = data.find((e: any) => {
        return (
          e.relationships.field_announcement_image.data &&
          e.relationships.field_announcement_image.data.id === item.id
        );
      });
      if (matchingAnnouncement) {
        const matchingMedia = included.find((e: any) => {
          return e.id === item.relationships.field_media_image.data.id;
        });
        if (matchingMedia) {
          data[data.indexOf(matchingAnnouncement)].attributes.background_image = `${baseUrl}${
            matchingMedia.attributes.uri.url
          }`;
        }
      }
    });
  }
  return data;
};

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await getData(announcementsUrl);
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/academic', async (_req: Request, res: Response) => {
  const academicUrl = `${queueUrl}/${academicGuid}/items?${includes}`;
  try {
    const result = await getData(academicUrl);
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/financial', async (_req: Request, res: Response) => {
  const financialUrl = `${queueUrl}/${financialGuid}/items?${includes}`;
  try {
    const result = await getData(financialUrl);
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
