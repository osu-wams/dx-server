/**
 * /api/user
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
  const userForApi = {
    osuId: req.user.osuId,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    isCanvasOptIn: req.user.isCanvasOptIn
  };
  res.send(userForApi);
});

export default router;
