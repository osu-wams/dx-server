/**
 * /api/user
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getClassification, Classification } from './modules/osu'; // eslint-disable-line no-unused-vars
import User from './models/user'; // eslint-disable-line no-unused-vars

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  let classification;
  try {
    const response: Classification = await asyncTimedFunction<Classification>(
      getClassification,
      'getClassification',
      [req.user],
    );
    const { id, attributes } = response;
    classification = { id, attributes };
  } catch (err) {
    logger.error('api/user getClassification failed:', err);
  }
  res.send({
    osuId: req.user.osuId,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    isCanvasOptIn: req.user.isCanvasOptIn,
    audienceOverride: req.user.audienceOverride || {},
    classification: classification || undefined,
    theme: req.user.theme,
  });
});

router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { audienceOverride, theme } = req.body;
    const user: User = req.user; // eslint-disable-line prefer-destructuring
    const updatedUser: User = await User.updateSettings(user, { audienceOverride, theme });
    if (audienceOverride !== undefined)
      req.session.passport.user.audienceOverride = updatedUser.audienceOverride;
    if (theme !== undefined) req.session.passport.user.theme = updatedUser.theme;
    res.json({ audienceOverride: updatedUser.audienceOverride, theme: updatedUser.theme });
  } catch (err) {
    logger.error('api/user/settings failed:', err);
    res.status(500).send({ message: 'Failed to update users settings.' });
  }
});

export default router;
