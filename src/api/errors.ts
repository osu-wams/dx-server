/**
 * /api/errors
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib';
import logger from '../logger';
import { createTeamsPayload, sendTeamsMessage } from './modules/notifications';

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { error, stack } = req.body;
  logger().error('App Error', { error, stack });
  res.status(200).send();
  const payload = createTeamsPayload(
    'DX Frontend Exception',
    'Unhandled error causing the uh-oh page to render',
    [
      {
        name: 'Error',
        value: error,
      },
      {
        name: 'Stack',
        value: JSON.stringify(stack),
      },
    ],
  );
  sendTeamsMessage(payload);
});

router.post('/app-message', async (req: Request, res: Response) => {
  const { message }: { message: Types.Message } = req.body;
  logger().error('App Message', message);
  res.status(200).send();
  const payload = createTeamsPayload(
    'DX User Message',
    'User was presented an application message',
    [
      {
        name: 'Title',
        value: message.title,
      },
      {
        name: 'Body',
        value: message.body,
      },
      {
        name: 'Type',
        value: message.type,
      },
    ],
  );
  sendTeamsMessage(payload);
});

export default router;
