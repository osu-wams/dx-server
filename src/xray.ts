import AWSXRay from 'aws-xray-sdk';

export function captureAsync(name: string, fn: Function, args: Array<any>) {
  return new Promise((resolve, reject) => {
    AWSXRay.captureAsyncFunc(name, seg => {
      fn.apply(this, args)
        .then(result => {
          seg.close();
          resolve(result);
        })
        .catch(err => {
          seg.close(err);
          reject(err);
        });
    });
  });
}

export default AWSXRay;
