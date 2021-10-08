/**
 * /api/grouper
 */
import config from 'config';
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getGrouperGroup, hasMember } from './modules/grouper';
import { getProfile } from './modules/osu'; // eslint-disable-line no-unused-vars

const router = Router();

const getGroupFullName = (groupName: string) => {
  const groups: Object = config.get('grouper.groups');
  if (groupName && groupName in groups) {
    return config.get(`grouper.groups.${groupName}`);
  }

  return null;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const group: string = req.query.group.toString();
    const groupName = getGroupFullName(group);
    if (!groupName) {
      res.status(400);
      res.send('Invalid grouper group');
    } else {
      const response = await asyncTimedFunction(
        getGrouperGroup,
        'getGrouperGroup',
        [config.get(`grouper.groups.${group}`), ['id']],
      );
      res.send(response);
    }
  } catch (err) {
    logger().error('api/grouper failed:', err);
    res.status(400).send({ message: 'Unable to retrieve grouper group.' });
  }
});

router.get('/hasMember', async (req: Request, res: Response) => {
  try {
    // run query to get current users onid
    const person: Types.Persons = await asyncTimedFunction(getProfile, 'getProfile', [req.user]);
    const { onid } = person.attributes;
    const group: string = req.query.group.toString();
    const groupName = getGroupFullName(group);
    if (!onid) {
      res.status(400);
      res.send('Invalid onid');
    } else if(!groupName) {
      res.status(400);
      res.send('Invalid grouper group');
    } else {
      const response = await asyncTimedFunction(
        hasMember,
        'isGroupMember',
        [groupName, onid],
      );
      res.send(response);
    }
  } catch (err) {
    logger().error('api/grouper/hasMember failed:', err);
    res.status(400).send({ message: 'Unable to retrieve grouper group.' });
  }
});

export default router;
