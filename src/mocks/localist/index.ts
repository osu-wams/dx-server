import mockedAcademicCalendar from './academic-calendar';
import mockedEventsDx from './events-dx.data';
import mockedEventsBend from './events-bend.data';
import mockedEventsCorvallis from './events-corvallis.data';
import mockedEventsEmployee from './events-employee';

const mockedCampusEvents = { corvallis: mockedEventsCorvallis, bend: mockedEventsBend };
export { mockedCampusEvents, mockedAcademicCalendar, mockedEventsDx, mockedEventsEmployee };
