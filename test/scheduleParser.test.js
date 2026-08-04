import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScheduleCSV } from '../src/data/sheets.js';

test('parseScheduleCSV preserves all course blocks when a week has more than two unique courses', () => {
  const csv = [
    ',,2026 SCHEDULE B,,,',
    ',,Group A,Group B,Group C,Group D',
    '10,7-17,Bob O Link,Hilliard,Big Met,Big Met',
  ].join('\n');

  const [week10] = parseScheduleCSV(csv);

  assert.equal(week10.week, '10');
  assert.deepEqual(week10.courses, [
    { name: 'Bob O Link', groups: ['A'] },
    { name: 'Hilliard', groups: ['B'] },
    { name: 'Big Met', groups: ['C', 'D'] },
  ]);
  assert.deepEqual(week10.courses.flatMap((course) => course.groups).sort(), ['A', 'B', 'C', 'D']);
});

test('parseScheduleCSV normalizes Seneca and the two-day championship like schedule rounds', () => {
  const csv = [
    ',,2026 SCHEDULE B,,,',
    ',,Group A,Group B,Group C,Group D',
    'MAJOR,5-29,Seneca Open - May 30th,,,',
    ',8-7,Championship Aug 8th and 9th,,,',
  ].join('\n');

  const [seneca, championship] = parseScheduleCSV(csv);

  assert.deepEqual(seneca, {
    week: 'MAJOR',
    date: 'May 30',
    endDate: null,
    status: 'completed',
    isSpecialEvent: true,
    eventName: 'Seneca Open',
    courses: [{ name: 'Seneca Open', date: 'May 30', groups: ['A', 'B', 'C', 'D'] }],
    course1: { name: 'Seneca Open', date: 'May 30', groups: ['A', 'B', 'C', 'D'] },
    course2: null,
  });
  assert.equal(championship.week, 'CHAMPIONSHIP');
  assert.equal(championship.eventName, 'Championship');
  assert.equal(championship.date, 'Aug 8');
  assert.equal(championship.endDate, 'Aug 9');
  assert.deepEqual(championship.courses.map(({ name, date }) => ({ name, date })), [
    { name: 'Shawnee Hills', date: 'Aug 8' },
    { name: 'Pleasant Valley Country Club', date: 'Aug 9' },
  ]);
});
