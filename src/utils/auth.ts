import config from 'config';
import { GROUPS } from '../api/models/user'; // eslint-disable-line no-unused-vars

const ENV: string = config.get('env');

const parseSamlResult = (profile: any, done: any) => {
  const user = {
    osuId: parseInt(profile['urn:oid:1.3.6.1.4.1.5016.2.1.2.1'], 10),
    email: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'],
    primaryAffiliation: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.5'],
    nameID: profile.nameID,
    nameIDFormat: profile.nameIDFormat,
    firstName: profile['urn:oid:2.5.4.42'],
    lastName: profile['urn:oid:2.5.4.4'],
    groups: [],
    isAdmin: false,
  };

  const permissions = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.7'] || [];
  if (permissions.includes(GROUPS.admin)) {
    user.isAdmin = true;
    user.groups.push('admin');
  }
  if (permissions.includes(GROUPS.masquerade)) {
    // On production, only administrators can also have access to masquerade,
    // regardless of grouper group assignment.
    if (ENV === 'production') {
      if (user.isAdmin) user.groups.push('masquerade');
    } else {
      user.groups.push('masquerade');
    }
  }
  return done(null, user);
};

export default parseSamlResult;
