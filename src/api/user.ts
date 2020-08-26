/**
 * /api/user
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getClassification } from './modules/osu'; // eslint-disable-line no-unused-vars
import User from './models/user'; // eslint-disable-line no-unused-vars
import { getUserMessages, updateUserMessage } from './modules/dx-mcm';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  const {
    osuId,
    firstName,
    lastName,
    email,
    primaryAffiliation,
    affiliations,
    isCanvasOptIn,
    audienceOverride: userAudienceOverride,
    classification: userClassification,
    primaryAffiliationOverride,
    theme,
  } = req.user.masquerade || req.user;
  res.send({
    osuId,
    firstName,
    lastName,
    email,
    primaryAffiliation,
    affiliations,
    isAdmin: req.user.isAdmin,
    groups: req.user.groups,
    isCanvasOptIn,
    audienceOverride: userAudienceOverride || {},
    classification: userClassification || {},
    primaryAffiliationOverride,
    theme,
  });
});

router.get('/classification', async (req: Request, res: Response) => {
  let classification = {};
  try {
    const classificationPromise: Promise<Types.Classification> = asyncTimedFunction<
      Types.Classification
    >(getClassification, 'getClassification', [req.user]);
    const { id, attributes } = await classificationPromise;
    classification = { id, attributes };
    req.user.classification = classification;
    if (req.user.masquerade) req.user.masquerade.classification = classification;
  } catch (err) {
    logger().error(`api/user/classification failed: ${err.message}, trace: ${err.stack}`);
  }
  res.send(classification);
});

router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { audienceOverride, theme, primaryAffiliationOverride } = req.body;
    const user: User = req.user.masquerade || req.user; // eslint-disable-line prefer-destructuring
    const updatedUser: User = await User.updateSettings(user, {
      audienceOverride,
      primaryAffiliationOverride,
      theme,
    });

    if (req.user.masquerade) {
      if (audienceOverride !== undefined)
        req.session.passport.user.masquerade.audienceOverride = updatedUser.audienceOverride;
      if (primaryAffiliationOverride)
        req.session.passport.user.masquerade.primaryAffiliationOverride =
          updatedUser.primaryAffiliationOverride;
      if (theme !== undefined) req.session.passport.user.masquerade.theme = updatedUser.theme;
    } else {
      if (audienceOverride !== undefined)
        req.session.passport.user.audienceOverride = updatedUser.audienceOverride;
      if (primaryAffiliationOverride)
        req.session.passport.user.primaryAffiliationOverride =
          updatedUser.primaryAffiliationOverride;
      if (theme !== undefined) req.session.passport.user.theme = updatedUser.theme;
    }

    res.json({
      audienceOverride: updatedUser.audienceOverride,
      theme: updatedUser.theme,
      primaryAffiliationOverride: updatedUser.primaryAffiliationOverride,
    });
  } catch (err) {
    logger().error('api/user/settings failed:', err);
    res.status(500).send({ message: 'Failed to update users settings.' });
  }
});

router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { groups, masqueradeId, masquerade } = req.user;
    let { osuId, onid } = req.user;
    const isMasquerading = groups.includes('masquerade') && masqueradeId;
    if (isMasquerading) {
      osuId = masqueradeId;
      onid = masquerade?.onid; // eslint-disable-line
    }
    if (onid && onid !== '') {
      const response = await asyncTimedFunction<Types.UserMessageItems>(
        getUserMessages,
        'getUserMessages',
        [osuId, onid],
      );
      res.json(response);
    } else {
      if (isMasquerading) {
        logger().warn(
          `GET api/user/messages masqueraded as a user (${osuId}) who is not yet in the DX users table or the value is missing in the session, unable to fetch user multi-channel messages.`,
        );
      } else {
        logger().error(
          `GET api/user/messages unable to determine users onid, user (${osuId}) has a missing onid field in the users table. Unable to fetch user multi-channel messages. This error should be escalated to determine why there is no onid in the table or session for this user.`,
        );
      }
      res.json({ items: [] });
    }
  } catch (err) {
    logger().error(`GET api/user/messages failed: ${err.message}, trace: ${err.stack}`);
    res.status(500).send({ message: 'Failed to fetch user messages.' });
  }
});

router.post('/messages', async (req: Request, res: Response) => {
  try {
    if (req.user.masquerade) {
      throw new Error('Cannot mark message as read when masquerading as a user.');
    }
    const { status, messageId }: { status: string; messageId: string } = req.body;
    if (status.toLowerCase() !== 'read') {
      throw new Error(`User message status ${status} update unsupported.`);
    }
    const user: User = req.user; // eslint-disable-line prefer-destructuring
    const result = await asyncTimedFunction<Types.UserMessage>(
      updateUserMessage,
      'updateUserMessage',
      [status, messageId, user.osuId, user.onid],
    );
    res.json(result);
  } catch (err) {
    logger().error('POST api/user/messages failed:', err);
    res.status(500).send({ message: 'Failed to update user message.' });
  }
});

export default router;
