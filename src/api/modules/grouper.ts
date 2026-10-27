import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { AWS_REGION, ENV } from '../../constants';

// these lambda functions only have dev and production environments
const AWS_ENV = ENV === 'production' ? 'production' : 'dev';

const lambda = new LambdaClient({ region: AWS_REGION });

export const hasMember = async (group: string, onid: string) => {
  const command = new InvokeCommand({
    FunctionName: `grouperDXPassthrough-${AWS_ENV}-hasMember`,
    Payload: Buffer.from(
      JSON.stringify({
        onid,
        group,
      }),
    ),
  });

  const result = await lambda.send(command);
  // payload comes in as a BLOB (Uint8Array) and needs to be converted to a string
  const payload = JSON.parse(Buffer.from(result.Payload ?? []).toString());
  if (payload.statusCode === 400) {
    throw new Error(payload.body.message);
  }

  return payload.body.isMember;
};

export default { hasMember };
