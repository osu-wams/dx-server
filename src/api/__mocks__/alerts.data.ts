/*
 * We are testing the getAlerts function here indirectly. If that change we need to
 * update this code. The Object.xml data is what the server returns, Object.response
 * is what we get after running our logic.
 */
export const alertPresent = {
  xml: `<?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0">
        <channel>
            <title>CVS - Web Test Channel</title>
            <link>http://content.getrave.com/rss/oregonstate/channel2</link>
            <description>RSS feed for web pages - Testing</description>
            <item>
                <title>Weather closure 10/12</title>
                <link />
                <description>Snow causes dangerous road conditions</description>
                <pubDate>Tue, 10 Dec 2018 18:47:39 GMT</pubDate>
                <guid />
                <dc:date>2018-05-29T18:47:39Z</dc:date>
            </item>
        </channel>
    </rss>
  `,
  response: [
    {
      date: '2018-05-29T18:47:39Z',
      title: 'Weather closure 10/12',
      link: '',
      pubDate: 'Tue, 10 Dec 2018 18:47:39 GMT',
      'dc:date': '2018-05-29T18:47:39Z',
      content: 'Snow causes dangerous road conditions',
      contentSnippet: 'Snow causes dangerous road conditions',
      guid: '',
      isoDate: '2018-12-10T18:47:39.000Z'
    }
  ]
};

export const alertClear: any = {
  xml: `<?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0">
        <channel>
            <title>CVS - Web Test Channel</title>
            <link>http://content.getrave.com/rss/oregonstate/channel2</link>
            <description>RSS feed for web pages - Testing</description>
            <item>
                <title>Z - CVS - Homepage - All Clear</title>
                <link />
                <description>All Clear</description>
                <pubDate>Tue, 29 May 2018 18:47:39 GMT</pubDate>
                <guid />
                <dc:date>2018-05-29T18:47:39Z</dc:date>
            </item>
        </channel>
    </rss>
  `,
  response: []
};

export const dxAlert: any = [
  {
    title: 'BobRoss',
    date: '2018-05-29T18:47:39+00:00',
    content: 'Lets paint some stuff.',
    type: 'info'
  }
];

export const dxAPIAlerts: any = [
  {
    type: 'node--alerts',
    id: '7c8a3c1b-6aa6-4299-a5db-8d1d49bd350c',
    drupal_internal__nid: 86,
    drupal_internal__vid: 741,
    langcode: 'en',
    revision_timestamp: '2019-08-26T18:03:38+00:00',
    revision_log: null,
    status: true,
    title: 'BobRoss',
    created: '2018-05-29T18:47:39+00:00',
    changed: '2019-08-26T18:03:38+00:00',
    promote: false,
    sticky: false,
    default_langcode: true,
    revision_translation_affected: true,
    moderation_state: null,
    path: {
      alias: null,
      pid: null,
      langcode: 'en'
    },
    field_alert_content: 'Lets paint some stuff.',
    field_alert_expiration_date: '2100-08-23T15:26:56-07:00',
    field_alert_type: 'info'
  }
];
