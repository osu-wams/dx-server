import { BASE_URL } from '../modules/dx';

export const resourcesData = {
  data: [
    {
      id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
      attributes: {
        title: 'Student Jobs',
        icon: '351f80a6-77c4-4d26-ba4f-59de040de6b5',
        field_service_url: {
          uri: '/image'
        }
      },
      relationships: {
        field_audience: {
          data: [
            {
              id: 'ed064109-1d73-40d1-b0bc-6a94b1f70f38'
            }
          ]
        },
        field_icon: {
          data: {
            type: 'media--image',
            id: '351f80a6-77c4-4d26-ba4f-59de040de6b5'
          }
        },
        field_service_category: {
          data: [
            {
              type: 'taxonomy_term--categories',
              id: '1b9b7a4b-5a64-41af-a40a-8bb01abedd19'
            },
            {
              type: 'taxonomy_term--categories',
              id: 'e2730988-0614-43b7-b3ce-0b047e8219e0'
            }
          ]
        }
      }
    }
  ],
  included: [
    {
      type: 'media--image',
      id: '351f80a6-77c4-4d26-ba4f-59de040de6b5',
      attributes: {
        name: 'logo_sites_128px'
      },
      relationships: {
        field_media_image: {
          data: {
            type: 'file--file',
            id: '16a9fe66-eca3-4f59-a7eb-7d04ae12d8fa'
          }
        }
      }
    },
    {
      type: 'file--file',
      id: '16a9fe66-eca3-4f59-a7eb-7d04ae12d8fa',
      attributes: {
        filename: 'logo_sites_128px.png',
        uri: {
          url: '/sites/default/files/2019-05/logo_sites_128px.png'
        }
      }
    }
  ]
};

export const resourcesDataNoMatchingMedia = {
  data: [
    {
      id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
      attributes: {
        title: 'Student Jobs',
        icon: 'some-invalid-id-that-is-not-in-the-included-data',
        field_service_url: {
          uri: '/image'
        }
      },
      relationships: {
        field_audience: {
          data: []
        },
        field_icon: {
          data: {
            type: 'media--image',
            id: 'iddoesntexistheresoitwontbefound'
          }
        },
        field_service_category: {
          data: [
            {
              type: 'taxonomy_term--categories',
              id: '1b9b7a4b-5a64-41af-a40a-8bb01abedd19'
            },
            {
              type: 'taxonomy_term--categories',
              id: 'e2730988-0614-43b7-b3ce-0b047e8219e0'
            }
          ]
        }
      }
    }
  ],
  included: [
    {
      type: 'media--image',
      id: 'thisIDISNTHEREeither',
      attributes: {
        name: 'logo_sites_128px'
      },
      relationships: {
        field_media_image: {
          data: {
            type: 'file--file',
            id: '-----THISHASNOMATCH----------------'
          }
        }
      }
    },
    {
      type: 'file--file',
      id: '---THISWONTFINDEITHER----',
      attributes: {
        filename: 'logo_sites_128px.png',
        uri: {
          url: '/sites/default/files/2019-05/logo_sites_128px.png'
        }
      }
    }
  ]
};

export const categoriesData = {
  data: [
    {
      type: 'taxonomy_term--categories',
      id: '6b7cd598-d71e-45f7-911c-d71551ec0a7c',
      attributes: {
        name: 'Featured',
        icon: 'e7cda0c1-fbb3-4773-a1d0-3dabae8113a6'
      },
      relationships: {
        field_taxonomy_icon: {
          data: {
            type: 'media--image',
            id: 'b23d828b-6e45-45a2-96a7-148757b4c88f'
          }
        }
      }
    }
  ],
  included: [
    {
      type: 'media--image',
      id: 'b23d828b-6e45-45a2-96a7-148757b4c88f',
      attributes: {
        name: 'star'
      },
      relationships: {
        field_media_image: {
          data: {
            type: 'file--file',
            id: 'e7cda0c1-fbb3-4773-a1d0-3dabae8113a6'
          }
        }
      }
    },
    {
      type: 'file--file',
      id: 'e7cda0c1-fbb3-4773-a1d0-3dabae8113a6',
      attributes: {
        filename: 'star.svg',
        uri: {
          url: '/sites/default/files/2019-05/star.svg'
        }
      }
    }
  ]
};

export const resourcesEntityQueueData = {
  data: [
    {
      id: '87b3927f-89c3-43bb-ab5d-ddecaf52c8b6',
      attributes: {
        title: 'Academic'
      },
      relationships: {
        items: {
          data: [
            {
              type: 'node--services',
              id: '25fbe2ea-006f-4fc9-ba65-d08192fd8805'
            },
            {
              type: 'node--services',
              id: '9fb802d8-cf4e-4916-8a72-9881f8b97879'
            }
          ]
        }
      }
    }
  ],
  included: [
    {
      type: 'node--services',
      id: '25fbe2ea-006f-4fc9-ba65-d08192fd8805',
      attributes: {
        title: 'Google Drive',
        field_service_url: {
          uri: 'https://drive.google.com/a/oregonstate.edu/'
        }
      },
      relationships: {
        field_audience: {
          data: [
            {
              id: 'ed064109-1d73-40d1-b0bc-6a94b1f70f38'
            }
          ]
        },
        field_icon: {
          data: {
            type: 'media--image',
            id: 'd89295b5-de09-4ae3-b057-aa84ed4ebbaf'
          }
        }
      }
    },
    {
      type: 'node--services',
      id: '9fb802d8-cf4e-4916-8a72-9881f8b97879',
      attributes: {
        title: 'Canvas',
        field_service_url: {
          uri: 'https://oregonstate.instructure.com'
        }
      },
      relationships: {
        field_audience: {
          data: []
        },
        field_icon: {
          data: null
        }
      }
    },
    {
      type: 'media--image',
      id: 'd89295b5-de09-4ae3-b057-aa84ed4ebbaf',
      attributes: {
        name: 'logo_drive_128px'
      },
      relationships: {
        field_media_image: {
          data: {
            type: 'file--file',
            id: '6b6618f8-2b57-47a8-83c6-3e855de551b5'
          }
        }
      }
    },
    {
      type: 'file--file',
      id: '6b6618f8-2b57-47a8-83c6-3e855de551b5',
      attributes: {
        filename: 'logo_drive_128px.png',
        uri: {
          url: '/sites/default/files/2019-05/logo_drive_128px.png'
        }
      }
    }
  ]
};

export const resourcesEntityQueueDataNoMatchingMedia = {
  data: [
    {
      id: '87b3927f-89c3-43bb-ab5d-ddecaf52c8b6',
      attributes: {
        title: 'Academic'
      },
      relationships: {
        items: {
          data: [
            {
              type: 'node--services',
              id: '25fbe2ea-006f-4fc9-ba65-d08192fd8805'
            },
            {
              type: 'node--services',
              id: 'serviceThatDoesntMatch'
            }
          ]
        }
      }
    }
  ],
  included: [
    {
      type: 'node--services',
      id: '25fbe2ea-006f-4fc9-ba65-d08192fd8805',
      attributes: {
        title: 'Google Drive',
        field_service_url: {
          uri: 'https://drive.google.com/a/oregonstate.edu/'
        }
      },
      relationships: {
        field_audience: {
          data: []
        },
        field_icon: {
          data: {
            type: 'media--image',
            id: 'noMatchingMedia'
          }
        }
      }
    },
    {
      type: 'media--image',
      id: 'mediaThatDoesntMatch',
      attributes: {
        name: 'logo_drive_128px'
      },
      relationships: {
        field_media_image: {
          data: {
            type: 'file--file',
            id: 'noMatchingFile'
          }
        }
      }
    },
    {
      type: 'file--file',
      id: 'fileThatDoesntMatch',
      attributes: {
        filename: 'logo_drive_128px.png',
        uri: {
          url: '/sites/default/files/2019-05/logo_drive_128px.png'
        }
      }
    }
  ]
};

export const filteredResourcesEntityQueueData = [
  {
    id: '25fbe2ea-006f-4fc9-ba65-d08192fd8805',
    title: 'Google Drive',
    icon: `${BASE_URL}/sites/default/files/2019-05/logo_drive_128px.png`,
    uri: 'https://drive.google.com/a/oregonstate.edu/',
    audiences: ['Bend']
  },
  {
    id: '9fb802d8-cf4e-4916-8a72-9881f8b97879',
    title: 'Canvas',
    uri: 'https://oregonstate.instructure.com',
    audiences: []
  }
];

export const filteredResourcesEntityQueueDataNoMatchingMedia = [
  {
    id: '25fbe2ea-006f-4fc9-ba65-d08192fd8805',
    title: 'Google Drive',
    uri: 'https://drive.google.com/a/oregonstate.edu/',
    audiences: []
  }
];

export const emptyData: any = {
  data: []
};

export const audienceData = {
  jsonapi: {
    version: '1.0',
    meta: { links: { self: { href: 'http://jsonapi.org/format/1.0/' } } }
  },
  data: [
    {
      type: 'taxonomy_term--audience',
      id: 'd8fddbf9-c1c3-485d-90b7-291f17161a4b',
      attributes: {
        name: 'Corvallis'
      }
    },
    {
      type: 'taxonomy_term--audience',
      id: 'ed064109-1d73-40d1-b0bc-6a94b1f70f38',
      attributes: {
        name: 'Bend'
      }
    }
  ],
  links: { self: { href: 'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience' } }
};

export default resourcesData;
