/**
 * /api/user
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getClassification } from './modules/osu'; // eslint-disable-line no-unused-vars
import User from './models/user'; // eslint-disable-line no-unused-vars
import getUserMessages from './modules/dx-mcm';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  res.send({
    osuId: req.user.osuId,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    primaryAffiliation: req.user.primaryAffiliation,
    affiliations: req.user.affiliations,
    isAdmin: req.user.isAdmin,
    groups: req.user.groups,
    isCanvasOptIn: req.user.isCanvasOptIn,
    audienceOverride: req.user.audienceOverride || {},
    classification: req.user.classification || {},
    primaryAffiliationOverride: req.user.primaryAffiliationOverride,
    theme: req.user.theme,
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
  } catch (err) {
    logger().error(`api/user/classification failed: ${err.message}, trace: ${err.stack}`);
  }
  res.send(classification);
});

router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { audienceOverride, theme, primaryAffiliationOverride } = req.body;
    const user: User = req.user; // eslint-disable-line prefer-destructuring
    const updatedUser: User = await User.updateSettings(user, {
      audienceOverride,
      primaryAffiliationOverride,
      theme,
    });
    if (audienceOverride !== undefined)
      req.session.passport.user.audienceOverride = updatedUser.audienceOverride;
    if (primaryAffiliationOverride)
      req.session.passport.user.primaryAffiliationOverride = updatedUser.primaryAffiliationOverride;
    if (theme !== undefined) req.session.passport.user.theme = updatedUser.theme;
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
  let userMessages: Types.UserMessage[] = [];
  try {
    const osuId =
      req.user.groups.includes('masquerade') && req.user.masqueradeId
        ? req.user.masqueradedId
        : req.user.osuId;
    userMessages = await asyncTimedFunction<Types.UserMessage[]>(
      getUserMessages,
      'getUserMessages',
      [osuId],
    );
  } catch (err) {
    logger().error(`api/user/messages failed: ${err.message}, trace: ${err.stack}`);
  }
  res.json(userMessages);
});

export default router;
