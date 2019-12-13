export const resourcesData = [
  {
    id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
    drupal_internal__name: 'service--categories',
    title: 'Student Jobs',
    field_service_url: {
      uri: 'http://ask/jeeves',
    },
    field_service_category: [
      {
        name: 'category1',
      },
      {
        name: 'category2',
      },
    ],
    field_service_synonyms: ['blah', 'bob', 'ross'],
    field_audience: [
      {
        name: 'Corvallis',
      },
    ],
    field_affiliation: [],
    field_icon_name: 'osu.logo_sites_128px',
    field_icon: {
      field_media_image: {
        uri: {
          url: '/sites/default/files/2019-05/logo_sites_128px.png',
        },
      },
    },
  },
];

export const resourcesDataNoRelatedData = [
  {
    id: '2ff0aaa4-5ca2-4ad-beaa-decc8744396f',
    drupal_internal__name: 'service--categories',
    title: 'Something Bogus',
    field_service_url: {
      uri: '',
    },
    field_service_category: [],
    field_service_synonyms: [],
    field_audience: [],
    field_affiliation: [],
  },
];

export const categoriesData = [
  {
    id: '6b7cd598-d71e-45f7-911c-d71551ec0a7c',
    name: 'Featured',
    field_taxonomy_icon: {
      field_media_image: {
        uri: {
          url: '/sites/default/files/2019-05/star.svg',
        },
      },
    },
  },
  {
    id: '6b7cd598-d71e-45f7-911c-d71551ec0a7c',
    name: 'BadOne',
  },
];

export const resourcesFeaturedEntityQueueData = [
  {
    title: 'Liz',
    drupal_internal__name: 'featured',
    items: resourcesData,
  },
];

export const resourcesAcademicEntityQueueData = [
  {
    title: 'Liz',
    drupal_internal__name: 'academic',
    items: resourcesDataNoRelatedData,
  },
];

export default resourcesData;
