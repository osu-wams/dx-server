/**
 * /api/user
 */
import { Router, Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getClassification } from './modules/osu'; // eslint-disable-line no-unused-vars
import { User, updateSettings } from './models/user'; // eslint-disable-line no-unused-vars
import { getUserMessages, markRead } from './modules/dx-mcm';
import { ENCRYPTION_KEY, JWT_KEY } from '../constants';
import { issueJWT } from '../utils/auth';
import { hasRefreshToken } from '../utils/routing';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  const {
    osuId,
    firstName,
    lastName,
    email,
    primaryAffiliation,
    affiliations,
    canvasOptIn,
    audienceOverride: userAudienceOverride,
    classification: userClassification,
    primaryAffiliationOverride,
    theme,
    colleges,
  } = req.user.masquerade || req.user;

  const isMasquerade = (req.user.isAdmin && (req.user.masqueradeId ?? 0) > 0) || undefined;
  const devTools = req.user.devTools || false;
  const audienceOverride = userAudienceOverride || {};
  const classification = userClassification || {};

  res.send({
    affiliations,
    audienceOverride,
    classification,
    colleges,
    devTools,
    email,
    firstName,
    groups: req.user.groups,
    isAdmin: req.user.isAdmin,
    isCanvasOptIn: canvasOptIn,
    isMasquerade,
    isMobile: req.session.isMobile,
    lastName,
    osuId,
    primaryAffiliation,
    primaryAffiliationOverride,
    theme,
  });
});

router.get('/classification', async (req: Request, res: Response) => {
  let classification = {};
  try {
    const classificationPromise: Promise<Types.Classification> = asyncTimedFunction<Types.Classification>(
      getClassification,
      'getClassification',
      [req.user],
    );
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
    const { audienceOverride, theme, devTools, primaryAffiliationOverride } = req.body;

    const user: User = req.user.masquerade || req.user; // eslint-disable-line prefer-destructuring
    const updatedUser: User = await updateSettings(user, {
      audienceOverride,
      primaryAffiliationOverride,
      theme,
      devTools: req.user.isAdmin ? devTools : false,
    });

    if (req.user.masquerade) {
      if (audienceOverride !== undefined)
        req.session.passport.user.masquerade.audienceOverride = updatedUser.audienceOverride;
      if (primaryAffiliationOverride)
        req.session.passport.user.masquerade.primaryAffiliationOverride =
          updatedUser.primaryAffiliationOverride;
      if (theme !== undefined) req.session.passport.user.masquerade.theme = updatedUser.theme;
      if (devTools !== undefined)
        req.session.passport.user.masquerade.devTools = updatedUser.devTools;
    } else {
      if (audienceOverride !== undefined)
        req.session.passport.user.audienceOverride = updatedUser.audienceOverride;
      if (primaryAffiliationOverride)
        req.session.passport.user.primaryAffiliationOverride =
          updatedUser.primaryAffiliationOverride;
      if (theme !== undefined) req.session.passport.user.theme = updatedUser.theme;
      if (devTools !== undefined) req.session.passport.user.devTools = updatedUser.devTools;
    }

    res.json({
      audienceOverride: updatedUser.audienceOverride,
      theme: updatedUser.theme,
      devTools: updatedUser.devTools,
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
    if (onid) {
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
    const { status, messageId }: { status: string; messageId?: string } = req.body;
    if (status.toLowerCase() !== 'read') {
      // TODO: Allow for different statuses to be posted?
      throw new Error(`User message status ${status} update unsupported.`);
    }
    const user: User = req.user; // eslint-disable-line prefer-destructuring
    const args = [user.osuId, user.onid];
    if (messageId) args.push(messageId);
    const result = await asyncTimedFunction<Types.UserMessage>(markRead, 'markRead', args);
    res.json(result);
  } catch (err) {
    logger().error('POST api/user/messages failed:', err);
    res.status(500).send({ message: 'Failed to update user message.' });
  }
});

router.get('/token', hasRefreshToken, async (req: Request, res: Response) => {
  const token = await issueJWT(req.user, ENCRYPTION_KEY, JWT_KEY);
  logger().debug(`api/user/token issuing new JWT for: ${req.user.email}`);
  res.send({ token });
});

export default router;
