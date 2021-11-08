/**
 * API Endpoints
 */
import config from 'config';

import { mockCacheUrl } from '@src/api/modules/__mocks__/cache';

export const PLANNER_ITEMS_API = '*/planner/items';

export const OUTLOOK_API = 'https://outlook.office.com';

export const READY_EDUCATION_API =
  config.get('readyEducationApi.baseUrl') + '/public/v1/user/?user_token=abc';

export const CACHE_API = mockCacheUrl;
