/**
 * /api/user
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send(req.user);
});

export default router;
