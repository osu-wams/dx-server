/**
 * /api/announcements
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import {
  getAnnouncements,
  getAcademicAnnouncements,
  getFinancialAnnouncements
} from './modules/dx';
import { asyncTimedFunction } from '../tracer';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';

const router: Router = Router();

export interface IAnnouncementResult {
  id: string;
  date: null;
  title: string;
  body: string;
  bg_image?: string; // eslint-disable-line camelcase
  action: {
    title: string;
    link: string;
  };
  audiences:string[]; 
}

const filterResults = (data: any): IAnnouncementResult[] => {

  return data.map((item: any) => {
    let audiences: string[] = [];
    const action = item.attributes.field_announcement_action
      ? {
          title: item.attributes.field_announcement_action.title,
          link: item.attributes.field_announcement_action.uri
        }
      : {
          title: null,
          link: null
        };
        
    // console.log('data -> ', item)
    const myAudience = item.relationships.field_campus.data;

    // console.log('Audiences -> ', audiences)

    myAudience.forEach( e => {
      audiences.push(e.full_name)
    })

    // console.log('NEW Audiences -> ', audiences)

    
    return {
      id: item.id,
      date: null,
      title: item.attributes.title,
      body: item.attributes.field_announcement_body,
      bg_image: item.attributes.background_image,
      action,
      audiences,
    };
  });
};

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getAnnouncements, 'getAnnouncements', []);
    const filteredResult = filterResults(result);
    console.log('non-filtered results --', result[0].relationships.field_campus)
    console.log('filtered results --', filteredResult)
    
    res.send(filteredResult);
  } catch (err) {
    logger.error(`api/announcements fetching announcements failed: ${err}`);
    res.status(500).send('Unable to retrieve announcements.');
  }
});

router.get('/academic', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(
      getAcademicAnnouncements,
      'getAcademicAnnouncements',
      []
    );
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements/academic fetching academic announcements failed: ${err}`);
    res.status(500).send('Unable to retrieve academic announcements.');
  }
});

router.get('/financial', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(
      getFinancialAnnouncements,
      'getFinancialAnnouncements',
      []
    );
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements/financial fetching financial announcements failed: ${err}`);
    res.status(500).send('Unable to retrieve financial announcements.');
  }
});

export default router;
