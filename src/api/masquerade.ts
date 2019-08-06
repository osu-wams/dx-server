/**
 * /api/masquerade
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { masqueradeId } = req.body;
  if (masqueradeId) {
    req.session.passport.user.masqueradeId = masqueradeId;
    res.send('Masquerade session started.');
  } else if (req.session.passport.user.masqueradeId) {
    delete req.session.passport.user.masqueradeId;
    res.send('Masquerade session ended.');
  } else {
    res.status(500).send({ message: 'No masqueradeId supplied.' });
  }
});

router.get('/', (req, res) => {
  if (req.session.passport.user.masqueradeId) {
    return res.send({ masqueradeId: req.session.passport.user.masqueradeId });
  }
  return res.send({ masqueradeId: null });
});

export default router;
