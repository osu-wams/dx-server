import { Router } from 'express';
import Auth from '../auth';
import UserRouter from './user';
import MasqueradeRouter from './masquerade';
import EventsRouter from './events';
import StudentRouter from './student';
import ResourcesRouter from './resources';
import AlertsRouter from './alerts';
import AnnouncementsRouter from './announcements';
import PersonsRouter from './persons';
import AdminRouter from './admin';
import InformationRouter from './information';
import PageContentRouter from './pageContent';
import ErrorRouter from './errors';
import StatusRouter from './status';
import ReleaseNotesRouter from './releaseNotes';
import TrainingsRouter from './trainings';
import CardsRouter from './cards';
import PeopleRouter from './people';
import LocationsRouter from './locations';
import SearchIndexRouter from './searchIndex';
import GrouperRouter from './grouper';
import CollegesRouter from './colleges'
import { jwtUserHasToken } from '../utils/routing';

const router = Router();
// User API contains an endpoint requiring a 'refresh' scoped token, and others requiring 'api' scoped token
router.use('/user', Auth.ensureAuthenticated, UserRouter);
// All following endpoints should just require an 'api' scoped token
router.use(jwtUserHasToken('api'));
router.use('/admin', Auth.ensureAdmin, AdminRouter);
router.use('/masquerade', Auth.ensureAdmin, MasqueradeRouter);
router.use('/student', Auth.ensureAuthenticated, StudentRouter);
router.use('/persons', Auth.ensureAuthenticated, PersonsRouter);
router.use('/events', EventsRouter);
router.use('/resources', ResourcesRouter);
router.use('/alerts', AlertsRouter);
router.use('/announcements', AnnouncementsRouter);
router.use('/info-buttons', InformationRouter);
router.use('/errors', ErrorRouter);
router.use('/status', StatusRouter);
router.use('/page-content', PageContentRouter);
router.use('/release-notes', ReleaseNotesRouter);
router.use('/trainings', TrainingsRouter);
router.use('/cards', CardsRouter);
router.use('/people', PeopleRouter);
router.use('/locations', LocationsRouter);
router.use('/searchIndex', SearchIndexRouter);
router.use('/grouper', Auth.ensureAuthenticated, GrouperRouter);
router.use('/colleges', CollegesRouter);

export default router;
