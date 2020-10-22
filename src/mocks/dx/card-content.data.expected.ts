import { Types } from '@osu-wams/lib';
import data from './card-content.data.json';

export const cards: Types.DynamicCard[] = [
  {
    id: 'af1e3a30-7c6c-4fba-a712-eb547bb14f19',
    title: 'Simple Card',
    infoButtonId: 'simple_card',
    locations: ['Corvallis'],
    affiliation: ['Employee'],
    pages: ['Academics'],
    weight: -50,
    sticky: false,
    resources: ['8ea9eaba-8942-4ff6-a075-585b2269c553', 'dad0b014-6a7d-40ba-88ce-970b52bacd27'],
    icon: 'fad fa-starship',
    body:
      "<p>Sensors indicate human life forms 30 meters below the planet's surface. Stellar flares are increasing in magnitude and frequency. Set course for Rhomboid Dronegar 006, warp seven. There's no evidence of an advanced communication network. Total guidance system failure, with less than 24 hours' reserve power. Shield effectiveness has been reduced 12 percent. We have covered the area in a spherical pattern which a ship without warp drive could cross in the given time.</p>",
    link: 'https://duckduckgo.com/',
    linkText: 'Better Search',
    audiences: [],
  },
  {
    id: 'c7363c12-d253-43cf-ac38-3077655a39d9',
    title: 'Test Card',
    infoButtonId: 'test_card',
    locations: ['Bend', 'Corvallis', 'Ecampus'],
    affiliation: ['Employee', 'Student'],
    pages: ['Academics'],
    weight: 0,
    sticky: false,
    resources: ['dd7a79cc-23f2-4a0d-b5c2-9cabc2cc1d17', '914193e9-eb9a-4966-87b3-70609edf7536'],
    icon: 'fa-test',
    body: '<p><strong>test </strong></p>',
    link: 'http://google.com',
    linkText: 'google link',
    audiences: ['First Year', 'Graduate Student'],
  },
];

export default data;
