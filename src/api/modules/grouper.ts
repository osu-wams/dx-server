import AWS from 'aws-sdk';
import { ENV } from '../../constants';

// these lambda functions only have dev and production environments
const AWS_ENV = ENV === 'production' ? 'production' : 'dev';

export const hasMember = async (group: string, onid: string) => {
  const params = {
    FunctionName: `grouperDXPassthrough-${AWS_ENV}-hasMember`,
    Payload: JSON.stringify({
      onid,
      group,
    }),
  };

  const result = await (new AWS.Lambda().invoke(params).promise());
  // payload comes in as a BLOB and needs to be converted to a string
  const payload = JSON.parse(result.Payload.toString());
  if (payload.statusCode === 400) {
    throw new Error(payload.body.message);
  }

  return payload.body.isMember;
}

export default { hasMember };
