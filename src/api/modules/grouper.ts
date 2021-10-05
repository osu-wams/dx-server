import { Client, getMembers } from '@osu-wams/grouper';
import config from 'config';

export const getGrouperGroup = async (group: string, attributes: string[]) => {
  const client = new Client({
    host: config.get('grouper.host') ?? '',
    username: config.get('grouper.username'),
    password: config.get('grouper.password'),
  });

  const pageNumber = 1;
  const pageSize = 100;
  const results = await getMembers(client, [group], attributes, { pageNumber, pageSize });
  return results[0].subjects.map(({
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
}
