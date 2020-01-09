import { addDays } from 'date-fns';
import data from './events-employee.data';
import { startDate, formatted } from './events-employee.data';

export const expectedEmployeeEvents = [
  {
    action: {
      link: 'https://events.oregonstate.edu/event/2019_oregon_employees_charitable_fund_drive',
    },
    bg_image:
      'https://images.localist.com/photos/31839819253203/huge/8ac2f984f613190a306d1323553c431aa65cf83f.jpg',
    date: formatted(startDate()),
    id: 31839819109196,
    title: "2019 Oregon Employees' Charitable Fund Drive",
    type: 'localist',
  },
  {
    action: {
      link:
        'https://events.oregonstate.edu/event/the_road_less_traveled_-_willamette_valley_photoarts_guild_exhibit',
    },
    bg_image:
      'https://images.localist.com/photos/31902001835222/huge/3a13c745f7e8b26f920279a7ab2578fcece4deca.jpg',
    date: formatted(addDays(startDate(), 2)),
    id: 31902001667478,
    title: 'The Road Less Traveled - Willamette Valley PhotoArts Guild Exhibit',
    type: 'localist',
  },
  {
    action: {
      link:
        'https://events.oregonstate.edu/event/bloodborne_pathogen_training_for_non-lab_workers_933',
    },
    bg_image:
      'https://images.localist.com/photos/31965230234332/huge/8873645d008fa36e46a627eed5c7401f08310306.jpg',
    date: formatted(addDays(startDate(), 3)),
    id: 31965230137778,
    title: 'Bloodborne Pathogen Training for Non-Lab Workers',
    type: 'localist',
  },
  {
    action: {
      link: 'https://events.oregonstate.edu/event/phd_preliminary_oral_exam_manjunath_kareppagoudr',
    },
    bg_image:
      'https://images.localist.com/photos/584345/huge/c130e0926ea1894f978182ad08511d35ff510696.jpg',
    date: formatted(addDays(startDate(), 4)),
    id: 32122778290228,
    title: 'PhD Preliminary Oral Exam',
    type: 'localist',
  },
  {
    action: {
      link: 'https://events.oregonstate.edu/event/transfer_tuesdays_at_cocc_4672',
    },
    bg_image:
      'https://images.localist.com/photos/30637613974227/huge/35ae3e14ebbbfaee91e1cecf49083525ca9f1259.jpg',
    date: formatted(addDays(startDate(), 5)),
    id: 31709247104655,
    title: 'Transfer Tuesdays at COCC',
    type: 'localist',
  },
];

export default data;
