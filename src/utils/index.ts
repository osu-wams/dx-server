/**
 * A simple and performant way to group large arrays by a property
 * @param array Array of generic objects to group
 * @param key property name of the objects to group by
 */
export const groupBy = <T>(array: T[], key: string): { [key: string]: T[] } =>
  array.reduce((result, item) => {
    // eslint-disable-next-line
    result[item[key]] = result[item[key]] || [];
    result[item[key]].push(item);
    return result;
  }, {});

export default {
  groupBy,
};
