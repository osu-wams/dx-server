import { Router } from 'express';
import Auth from '../auth';
import UserRouter from './user';
import MasqueradeRouter from './masquerade';
import EventsRouter from './events';
import StudentRouter from './student';
import ResourcesRouter from './resources';
import AlertsRouter from './alerts';
import JobsRouter from './jobs';
import AnnouncementsRouter from './announcements';
import PersonsRouter from './persons';

const router = Router();

router.use('/user', Auth.ensureAuthenticated, UserRouter);
router.use('/masquerade', Auth.ensureAdmin, MasqueradeRouter);
router.use('/student', Auth.ensureAuthenticated, StudentRouter);
router.use('/jobs', Auth.ensureAuthenticated, JobsRouter);
router.use('/persons', Auth.ensureAuthenticated, PersonsRouter);
router.use('/events', EventsRouter);
router.use('/resources', ResourcesRouter);
router.use('/alerts', AlertsRouter);
router.use('/announcements', AnnouncementsRouter);

export default router;
