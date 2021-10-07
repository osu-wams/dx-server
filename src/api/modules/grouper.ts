import { Client, getMembers } from '@osu-wams/grouper';
import config from 'config';
import { getCache, setCache } from '../modules/cache';

export const getGrouperGroup = async (group: string, attributes: string[]) => {
  const cacheName = `grouper-${group}`;
  const groupCache = await getCache(cacheName);
  if (groupCache) {
    return JSON.parse(groupCache);
  }

  const client = new Client({
    host: config.get('grouper.host') ?? '',
    username: config.get('grouper.username'),
    password: config.get('grouper.password'),
  });

  const results = await getMembers(client, [group], attributes);
  const groupMap = results[0].subjects.map(({
    memberId,
    id,
    name,
  }) => ({
    id: memberId,
    attributes: {
      onid: id,
      name,
    }
  }));
  setCache(cacheName, JSON.stringify(groupMap), {
    mode: 'EX',
    duration: 24 * 60 * 60, // 24 hours
    flag: 'NX',
  });
  return groupMap;
}
