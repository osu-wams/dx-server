
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DYNAMODB } from '../../constants';
import dynamoDb from '../index';

console.info('Accessing dynamoDb:', DYNAMODB);
dynamoDb
  .send(new ListTablesCommand({}))
  .then((data) => console.info(data))
  .catch((err) => console.error(err));
