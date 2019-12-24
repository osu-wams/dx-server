import mockedAcademicCalendar from './academic-calendar';
import mockedEventsDx from './events-dx.data.json';
import mockedEventsBend from './events-bend.data.json';
import mockedEventsCorvallis from './events-corvallis.data.json';

const mockedCampusEvents = { corvallis: mockedEventsCorvallis, bend: mockedEventsBend };
export { mockedCampusEvents, mockedAcademicCalendar, mockedEventsDx };
