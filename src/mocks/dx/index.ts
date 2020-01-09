import mockedAlerts from './alerts.data.json';
import mockedAnnouncements from './announcements.data.json';
import mockedCategories from './categories.data.json';
import mockedCuratedResourcesFeatured from './resources-featured.data.json';
import mockedCuratedResourcesFeaturedEmployee from './resources-featured-employee.data.json';
import mockedCuratedResourcesFinancial from './resources-financial.data.json';
import mockedCuratedResourcesAcademic from './resources-academic.data.json';
import mockedInformation from './information.data.json';
import mockedResources from './resources.data.json';

// TODO: Add remaining categories from the entity_queue API
const mockedCuratedResources = (category: string) => {
  switch (category.toLowerCase()) {
    case 'featured':
      return mockedCuratedResourcesFeatured;
    case 'financial':
      return mockedCuratedResourcesFinancial;
    case 'academic':
      return mockedCuratedResourcesAcademic;
    case 'employee_featured':
      return mockedCuratedResourcesFeaturedEmployee;
    default:
      return mockedCuratedResourcesFeatured;
  }
};

export {
  mockedAlerts,
  mockedAnnouncements,
  mockedCategories,
  mockedCuratedResources,
  mockedInformation,
  mockedResources,
};
