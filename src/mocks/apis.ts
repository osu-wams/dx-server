/**
 * API Endpoints
 */
import config from 'config';

export const PLANNER_ITEMS_API = '*/planner/items';

export const OUTLOOK_API = 'https://outlook.office.com';

export const READY_EDUCATION_API =
  config.get('readyEducationApi.baseUrl') + '/public/v1/user/?user_token=abc';
