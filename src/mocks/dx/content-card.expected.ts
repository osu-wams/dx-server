import { Types } from '@osu-wams/lib';
import data from './content-card.data.json';

export const cards: Types.DynamicCard[] = [
  {
    id: 'cb4d7516-15df-4af2-8a7a-f4ca2c182221',
    title: 'COVID-19 Resources',
    infoButtonId: 'content_card_corvallis_covid',
    locations: ['Corvallis'],
    affiliation: ['Employee', 'Student'],
    pages: ['Dashboard'],
    weight: 0,
    sticky: false,
    resources: [
      'a0fa3d09-62d6-448c-8123-5e117846aa4e',
      'ca4b98f2-4625-46c3-9d90-eb2ef14a2cb2',
      'e3586e4c-32f3-412d-8fd2-fd520ce290a4',
      '2fc0c59d-7a7f-4ea8-8f25-275b247531df',
      'dd8c3a4a-a8b3-4402-b063-300fcde594b1',
      'd359ccfb-2b53-4060-be65-a963e37a6052',
      '355df757-1600-43ad-b084-27d4ed89525d',
    ],
    icon: 'fal.virus',
    body:
      '<p><span>Oregon State University is taking a comprehensive approach to reduce the risk and spread of COVID-19. It will take everyone in Beaver Nation to help keep our community safe. Here are some resources to help you navigate campus life during this pandemic.</span></p>',
    audiences: [],
  },
  {
    id: '6b7c03d1-d0c0-42fd-ab25-a18875d8d78b',
    title: 'OSU-Cascades COVID-19 Resources',
    infoButtonId: 'content_card_cascades_covid',
    locations: ['Bend'],
    affiliation: ['Employee', 'Student'],
    pages: ['Dashboard'],
    weight: 0,
    sticky: false,
    resources: [
      'a0fa3d09-62d6-448c-8123-5e117846aa4e',
      '8380d4db-1b34-451d-a824-613a7589a726',
      'e3586e4c-32f3-412d-8fd2-fd520ce290a4',
      '2fc0c59d-7a7f-4ea8-8f25-275b247531df',
      'dd8c3a4a-a8b3-4402-b063-300fcde594b1',
      'd359ccfb-2b53-4060-be65-a963e37a6052',
      '127f3140-02e0-4b89-bc99-be452af60c53',
    ],
    icon: 'fal.virus',
    body:
      '<p><span>Oregon State University is taking a comprehensive approach to reduce the risk and spread of COVID-19. It will take everyone in Beaver Nation to help keep our community safe. Here are some resources to help you navigate campus life during this pandemic.</span></p>',
    audiences: ['Graduate Student'],
  },
];

export default data;
