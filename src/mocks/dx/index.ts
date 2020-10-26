import mockedAlerts from './alerts.data.json';
import mockedAnnouncements from './announcements.data.json';
import mockedAnnouncementsExpected from './announcements.data.expected';
import mockedAnnouncementsFinancesExpected from './announcements-finances.data.expected';
import mockedAnnouncementsAcademicsExpected from './announcements-academics.data.expected';
import mockedCategories from './categories.data.json';
import mockedCategoriesExpected from './categories.data.expected';
import mockedCuratedResourcesFeatured from './resources-featured.data.json';
import mockedCuratedResourcesFeaturedExpected from './resources-featured.data.expected';
import mockedCuratedResourcesFeaturedEmployee from './resources-featured-employee.data.json';
import mockedCuratedResourcesFinancial from './resources-financial.data.json';
import mockedCuratedResourcesAcademic from './resources-academic.data.json';
import mockedCuratedResourcesAcademicExpected from './resources-academic.data.expected';
import mockedCards from './content-card.data.json';
import { cards as mockedCardsExpected } from './content-card.expected';
import mockedInformation from './information.data.json';
import mockedResources from './resources.data.json';
import mockedResourcesExpected from './resources.data.expected';
import mockedPageContent from './page-content.data.json';
import mockedReleaseNotes from './release-notes.data.json';
import mockedTrainings from './trainings.data.json';
import mockedTrainingsExpected from './trainings.data.expected';
import mockedTrainingTags from './training-tags.data.json';
import mockedTrainingTagsExpected from './training-tags.data.expected';

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
  mockedAnnouncementsExpected,
  mockedAnnouncementsAcademicsExpected,
  mockedAnnouncementsFinancesExpected,
  mockedCards,
  mockedCardsExpected,
  mockedCategories,
  mockedCategoriesExpected,
  mockedCuratedResources,
  mockedCuratedResourcesFeaturedExpected,
  mockedCuratedResourcesAcademicExpected,
  mockedInformation,
  mockedResources,
  mockedResourcesExpected,
  mockedPageContent,
  mockedReleaseNotes,
  mockedTrainings,
  mockedTrainingsExpected,
  mockedTrainingTags,
  mockedTrainingTagsExpected,
};
