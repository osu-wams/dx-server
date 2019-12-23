import * as componentsData from './components.data.json';
import * as incidentData from './incidents.data.json';
import { ICachetComponent } from '../../api/modules/cachet.js';

export const expectedResponse: ICachetComponent[] = [
  {
    description: componentsData.data[0].description,
    id: componentsData.data[0].id,
    name: componentsData.data[0].name,
    statusText: componentsData.data[0].status_name,
    status: componentsData.data[0].status,
    updatedAt: componentsData.data[0].updated_at,
    incidents: [],
  },
  {
    description: componentsData.data[1].description,
    id: componentsData.data[1].id,
    name: componentsData.data[1].name,
    statusText: componentsData.data[1].status_name,
    status: componentsData.data[1].status,
    updatedAt: componentsData.data[1].updated_at,
    incidents: [
      // A component marked in a status other than "Operational", having the most recent incident that is marked as stickied=true
      {
        id: incidentData.data[2].id,
        name: incidentData.data[2].name,
        message: incidentData.data[2].message,
        permalink: incidentData.data[2].permalink,
        status: incidentData.data[2].latest_status,
        statusText: incidentData.data[2].latest_human_status,
        isResolved: incidentData.data[2].is_resolved,
        duration: incidentData.data[2].duration,
        updatedAt: incidentData.data[2].updated_at,
      },
    ],
  },
  {
    description: componentsData.data[2].description,
    id: componentsData.data[2].id,
    name: componentsData.data[2].name,
    statusText: componentsData.data[2].status_name,
    status: componentsData.data[2].status,
    updatedAt: componentsData.data[2].updated_at,
    incidents: [],
  },
  {
    description: componentsData.data[3].description,
    id: componentsData.data[3].id,
    name: componentsData.data[3].name,
    statusText: componentsData.data[3].status_name,
    status: componentsData.data[3].status,
    updatedAt: componentsData.data[3].updated_at,
    incidents: [],
  },
];

export default componentsData;
