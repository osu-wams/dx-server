import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { asyncTimedFunction } from '../../tracer';
import { scan, updateItem, getItem, putItem } from '../../db';

class TrendingResource {
  resourceId: string;

  affiliation: string;

  campus: string;

  title: string;

  totalEvents: number;

  uniqueEvents: number;

  constructor(
    resourceId: string,
    concatenatedTitle: string,
    totalEvents: string,
    uniqueEvents: string,
  ) {
    this.resourceId = resourceId.trim();
    const [affiliation, campus, title] = concatenatedTitle.split(' || ');
    this.affiliation = affiliation.trim();
    this.campus = campus.trim();
    this.title = title.trim();
    this.totalEvents = parseInt(totalEvents, 10);
    this.uniqueEvents = parseInt(uniqueEvents, 10);
  }
}

export default TrendingResource;
