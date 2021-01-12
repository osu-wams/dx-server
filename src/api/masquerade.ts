/**
 * /api/masquerade
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import User from './models/user';

const router: Router = Router();

/**
 * It is possible to masquerade as a user who doesn't have a current Users table record (partial masquerade)
 * or a user who does have a Users table record (full masquerade).
 *
 * Partial Masquerade: OSU, Canvas, and DX APIs will show contextual data for this user except for
 * any profile related overrides (theme, primaryAffiliation, etc).
 *
 * Full Masquerade: OSU, Canvas and DX APIs will show full contextual data and allow for some persistent functionality.
 * ! Important: User profile settings will be changed/persisted during full masquerade.
 *
 * * Limitation(s);
 * *   - Multi-Channel Messages cannot be marked as read
 */
router.post('/', async (req: Request, res: Response) => {
  const { masqueradeId, masqueradeReason } = req.body;
  if (masqueradeId && masqueradeReason) {
    const user = await User.find(parseInt(masqueradeId, 10));
    if (user) {
      const {
        lastName,
        lastLogin,
        affiliations,
        primaryAffiliationOverride,
        primaryAffiliation,
        onid,
        audienceOverride,
        firstName,
        theme,
        osuId,
        email,
        canvasOptIn,
      } = user;
      req.user.masquerade = {
        lastName,
        lastLogin,
        affiliations,
        primaryAffiliationOverride,
        primaryAffiliation,
        onid,
        audienceOverride,
        firstName,
        theme,
        osuId,
        email,
        canvasOptIn,
      };
    }
    req.user.masqueradeId = masqueradeId;
    req.user.masqueradeReason = masqueradeReason;
    logger().info(
      `User:${req.user.osuId}:${req.user.email} masqueraded as ${masqueradeId}, '${masqueradeReason}'`,
      {
        adminAction: 'masquerade',
        osuId: req.user.osuId,
        email: req.user.email,
        masqueradeId,
        masqueradeReason,
      },
    );
    res.send('Masquerade session started.');
  } else if (req.user.masqueradeId) {
    delete req.user.masqueradeId;
    delete req.user.masquerade;
    res.send('Masquerade session ended.');
  } else {
    res.status(500).send({ message: 'No masqueradeId or masqueradeReason supplied.' });
  }
});

router.get('/', (req, res) => {
  if (req.user.masqueradeId) {
    return res.send({
      masquerade: req.user.masquerade,
      masqueradeId: req.user.masqueradeId || '',
      masqueradeReason: req.user.masqueradeReason || '',
    });
  }
  return res.send({ masqueradeId: '', masqueradeReason: '' });
});

export default router;
