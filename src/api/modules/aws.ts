import { groupBy } from '../../utils';
import FavoriteResource from '../models/favoriteResource';
import TrendingResource from '../models/trendingResource';
import User from '../models/user';
import { getCache, setCache } from './cache';

const top10 = (resources: TrendingResource[], affiliation: string) => {
  const groupedByResourceId = groupBy(
    resources.filter((r) => r.affiliation === affiliation),
    'resourceId',
  );
  return Object.keys(groupedByResourceId)
    .map((k) => ({
      resourceId: k,
      title: groupedByResourceId[k][0].title,
      count: groupedByResourceId[k].reduce(
        (p, c) => p + parseInt(c.uniqueEvents.toString(), 10),
        0,
      ),
    }))
    .sort((a, b) => (a.count < b.count ? 1 : -1))
    .slice(0, 9);
};

export const getUsersMetrics = async (daysAgo: number) => {
  const d = new Date();
  const endDate = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() - daysAgo);
  const startDate = d.toISOString().slice(0, 10);
  const cacheKey = `metrics.${startDate}.to.${endDate}.${User.TABLE_NAME}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const users = await User.scanAll();
  const affiliations = groupBy(users, 'primaryAffiliation');
  const byAffiliation = Object.keys(affiliations)
    .map((k) => ({
      affiliation: k,
      count: affiliations[k].length,
    }))
    .sort((a, b) => (a.affiliation > b.affiliation ? 1 : -1));

  const loggedIn = users.filter((user) => user.lastLogin >= startDate);
  const dates = groupBy(loggedIn, 'lastLogin');
  const lastLoggedIn = Object.keys(dates)
    .map((k) => ({
      lastLogin: k,
      count: dates[k].length,
    }))
    .sort((a, b) => (a.lastLogin < b.lastLogin ? 1 : -1));
  const fromDate = lastLoggedIn.slice(-1)[0]?.lastLogin;
  const toDate = lastLoggedIn[0]?.lastLogin;

  const themes = groupBy(users, 'theme');
  const byTheme = Object.keys(themes)
    .map((k) => ({
      theme: k,
      count: themes[k].length,
    }))
    .sort((a, b) => (a.theme > b.theme ? 1 : -1));

  const metrics = {
    total: users.length,
    byAffiliation,
    byTheme,
    lastLoggedIn: [
      {
        fromDate,
        toDate,
      },
      ...lastLoggedIn,
    ],
  };

  setCache(cacheKey, JSON.stringify(metrics), {
    mode: 'EX',
    duration: 24 * 60 * 60,
    flag: 'NX',
  });
  return metrics;
};

export const getFavoritesMetrics = async () => {
  const resources = await FavoriteResource.scanAll();
  return {
    favorited: resources.filter((f) => f.active).length,
    unfavorited: resources.filter((f) => !f.active).length,
  };
};

export const getTrendingMetrics = async (daysAgo: number) => {
  const d = new Date();
  const endDate = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() - daysAgo);
  const startDate = d.toISOString().slice(0, 10);
  const cacheKey = `metrics.${startDate}.to.${endDate}.${TrendingResource.TABLE_NAME}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const t = await TrendingResource.scanAll();
  const resources = t.filter((resource) => resource.date >= startDate);

  const dates = groupBy(resources, 'date');
  const perDay = Object.keys(dates)
    .map((k) => ({
      date: k,
      count: dates[k].reduce((p, c) => p + parseInt(c.uniqueEvents.toString(), 10), 0),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const campuses = groupBy(resources, 'campus');
  const perCampus = Object.keys(campuses)
    .map((k) => ({
      campus: k,
      count: campuses[k].reduce((p, c) => p + parseInt(c.uniqueEvents.toString(), 10), 0),
    }))
    .sort((a, b) => (a.campus > b.campus ? 1 : -1));

  const metrics = {
    fromDate: perDay.slice(-1)[0].date,
    toDate: perDay[0].date,
    totalClicks: perDay.reduce((p, c) => p + c.count, 0),
    resourcesByAffiliation: {
      student: resources.filter((f) => f.affiliation === 'Student').length,
      employee: resources.filter((f) => f.affiliation === 'Employee').length,
    },
    perCampus,
    perDay,
    resourcesTop10ByAffiliation: {
      student: top10(resources, 'Student'),
      employee: top10(resources, 'Employee'),
    },
  };
  setCache(cacheKey, JSON.stringify(metrics), {
    mode: 'EX',
    duration: 24 * 60 * 60,
    flag: 'NX',
  });
  return metrics;
};

export default {
  getFavoritesMetrics,
  getTrendingMetrics,
  getUsersMetrics,
};
