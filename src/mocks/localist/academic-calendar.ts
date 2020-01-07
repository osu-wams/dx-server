import { addDays, format } from 'date-fns';

const formatted = (date: Date): string => {
  return format(date, 'EEE, dd LLL yyyy HH:MM:ss XXX');
};

const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">
  <channel>
    <title>Oregon State University Calendar</title>
    <description></description>
    <link>https://events.oregonstate.edu/</link>
    <item>
      <title>Something Important Happens Today</title>
      <description>It happens.</description>
      <pubDate>${formatted(new Date())}</pubDate>
      <link>https://is.oregonstate.edu</link>
      <media:content url="https://images.localist.com/photos/586904/huge/4a4bbf739d801464d684cd0bedc8be0cf2d274bd.jpg" type="image/png" medium="image" isDefault="true"/>
    </item>
    <item>
      <title>Something to keep in mind</title>
      <description>It happens.</description>
      <pubDate>${formatted(addDays(new Date(), 2))}</pubDate>
      <link>https://is.oregonstate.edu</link>
      <media:content url="https://images.localist.com/photos/586904/huge/4a4bbf739d801464d684cd0bedc8be0cf2d274bd.jpg" type="image/png" medium="image" isDefault="true"/>
    </item>
    <item>
      <title>Today is the day</title>
      <description>It happens.</description>
      <pubDate>${formatted(addDays(new Date(), 3))}</pubDate>
      <link>https://is.oregonstate.edu</link>
      <media:content url="https://images.localist.com/photos/586904/huge/4a4bbf739d801464d684cd0bedc8be0cf2d274bd.jpg" type="image/png" medium="image" isDefault="true"/>
    </item>
    <item>
      <title>And this happens today</title>
      <description>It happens.</description>
      <pubDate>${formatted(addDays(new Date(), 3))}</pubDate>
      <link>https://is.oregonstate.edu</link>
      <media:content url="https://images.localist.com/photos/586904/huge/4a4bbf739d801464d684cd0bedc8be0cf2d274bd.jpg" type="image/png" medium="image" isDefault="true"/>
    </item>
    <item>
      <title>Last day for something else to happen</title>
      <description>It happens.</description>
      <pubDate>${formatted(addDays(new Date(), 4))}</pubDate>
      <link>https://is.oregonstate.edu</link>
      <media:content url="https://images.localist.com/photos/586904/huge/4a4bbf739d801464d684cd0bedc8be0cf2d274bd.jpg" type="image/png" medium="image" isDefault="true"/>
    </item>
    <item>
      <title>The start of this thing is today</title>
      <description>It happens.</description>
      <pubDate>${formatted(addDays(new Date(), 5))}</pubDate>
      <link>https://is.oregonstate.edu</link>
      <media:content url="https://images.localist.com/photos/586904/huge/4a4bbf739d801464d684cd0bedc8be0cf2d274bd.jpg" type="image/png" medium="image" isDefault="true"/>
    </item>
  </channel>
</rss>`;

export default xmlString;
