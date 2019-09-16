export const academicStatusData = {
  links: {
    self: 'bogus'
  },
  data: [
    {
      id: '999999999-201901',
      attributes: {
        academicStanding: 'Good Standing',
        term: '201901',
        gpa: [
          {
            creditHoursAttempted: 99
          }
        ]
      }
    },
    {
      id: '999999999-202001',
      attributes: {
        academicStanding: null,
        term: '202001',
        gpa: [
          {
            creditHoursAttempted: 14
          }
        ]
      }
    }
  ]
};

export const classScheduleDataResponse = {
  links: {
    self: 'bogus'
  },
  data: [
    {
      type: 'class-schedule',
      id: '999999999-202001-14683',
      links: {
        self: null
      },
      attributes: {
        academicYear: '1920',
        academicYearDescription: 'Academic Year 2019-20',
        courseReferenceNumber: '14683',
        courseSubject: 'PSY',
        courseSubjectDescription: 'Psychology',
        courseNumber: '485',
        courseTitle: 'BEHAVIOR MODIFICATION',
        sectionNumber: '001',
        term: '202001',
        termDescription: 'Fall 2019',
        scheduleDescription: 'Lecture',
        scheduleType: 'A',
        creditHours: 4,
        registrationStatus: '**Web Registered**',
        gradingMode: 'Normal Grading Mode',
        continuingEducation: false,
        faculty: [
          {
            osuId: '999999999',
            name: 'Lastname, Firstname',
            email: 'noreply@onid.orst.edu',
            primary: true
          }
        ],
        meetingTimes: [
          {
            beginDate: '2019-09-25',
            beginTime: '10:00:00',
            endDate: '2019-12-06',
            endTime: '11:50:00',
            room: '132',
            building: 'WGND',
            buildingDescription: 'Wiegand Hall',
            campus: ' Oregon State - Corvallis',
            hoursPerWeek: 3.66,
            creditHourSession: 4,
            scheduleType: 'A',
            scheduleDescription: 'Lecture',
            weeklySchedule: ['M', 'W']
          }
        ]
      }
    }
  ]
};

export const classScheduleDataResult = [
  {
    attributes: {
      academicYear: '1920',
      academicYearDescription: 'Academic Year 2019-20',
      courseReferenceNumber: '14683',
      courseSubject: 'PSY',
      courseSubjectDescription: 'Psychology',
      courseNumber: '485',
      courseTitle: 'BEHAVIOR MODIFICATION',
      sectionNumber: '001',
      term: '202001',
      termDescription: 'Fall 2019',
      scheduleDescription: 'Lecture',
      scheduleType: 'A',
      creditHours: 4,
      registrationStatus: '**Web Registered**',
      gradingMode: 'Normal Grading Mode',
      continuingEducation: false,
      meetingTimes: [
        {
          beginDate: '2019-09-25',
          beginTime: '10:00:00',
          endDate: '2019-12-06',
          endTime: '11:50:00',
          room: '132',
          building: 'WGND',
          buildingDescription: 'Wiegand Hall',
          campus: ' Oregon State - Corvallis',
          hoursPerWeek: 3.66,
          creditHourSession: 4,
          scheduleType: 'A',
          scheduleDescription: 'Lecture',
          weeklySchedule: ['M', 'W']
        }
      ],
      faculty: [
        {
          name: 'Lastname, Firstname',
          email: 'noreply@onid.orst.edu',
          primary: true
        }
      ]
    },
    type: 'class-schedule',
    id: '999999999-202001-14683'
  }
];
