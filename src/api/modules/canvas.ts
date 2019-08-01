import request from 'request-promise';
import config from 'config';

const CANVAS_BASE_URL: string = config.get('canvasApi.baseUrl');
const CANVAS_TOKEN: string = config.get('canvasApi.token');

// TODO: properly specify the interface members
interface UpcomingAssignment {
  assignment: any;
}
/**
 * Gets upcoming assignments.
 * @param {Number} osuId - The OSU ID of the student to retrieve assignments for.
 */
export const getUpcomingAssignments = (osuId: number): Promise<UpcomingAssignment[]> => {
  return request({
    method: 'GET',
    url: `${CANVAS_BASE_URL}/users/self/upcoming_events?as_user_id=sis_user_id:${osuId}`,
    auth: { bearer: CANVAS_TOKEN }
  }).promise();
};

export default getUpcomingAssignments;
