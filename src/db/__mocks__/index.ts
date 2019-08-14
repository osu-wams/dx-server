const original = jest.requireActual('../index');

export const { dbQuery } = original;

export const mockedQuery = jest.fn();

export const pool = {
  query: mockedQuery
};
