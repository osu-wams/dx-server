/**
 * /api/masquerade
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { masqueradeId, masqueradeReason } = req.body;
  if (masqueradeId && masqueradeReason) {
    req.session.passport.user.masqueradeId = masqueradeId;
    req.session.passport.user.masqueradeReason = masqueradeReason;
    logger().info(
      `User:${req.session.passport.user.osuId}:${req.session.passport.user.email} masqueraded as ${masqueradeId}, '${masqueradeReason}'`,
      {
        adminAction: 'masquerade',
        osuId: req.session.passport.user.osuId,
        email: req.session.passport.user.email,
        masqueradeId,
        masqueradeReason
      }
    );
    res.send('Masquerade session started.');
  } else if (req.session.passport.user.masqueradeId) {
    delete req.session.passport.user.masqueradeId;
    res.send('Masquerade session ended.');
  } else {
    res.status(500).send({ message: 'No masqueradeId or masqueradeReason supplied.' });
  }
});

router.get('/', (req, res) => {
  if (req.session.passport.user.masqueradeId) {
    return res.send({
      masqueradeId: req.session.passport.user.masqueradeId || '',
      masqueradeReason: req.session.passport.user.masqueradeReason || ''
    });
  }
  return res.send({ masqueradeId: '', masqueradeReason: '' });
});

export default router;
