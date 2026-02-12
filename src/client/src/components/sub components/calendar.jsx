import React, { useState, useEffect } from 'react';
import 'src/client/src/static/styles/events.css';

const Calendar = ({ events = [], onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);

    // Get day of week
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    //loop to create calendar
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
        //day state checker
      const dayStr = day.toISOString().split('T')[0];
      const isToday = day.toDateString() === today.toDateString();
      const isOtherMonth = day.getMonth() !== month;
      const isSelected = selectedDate === dayStr;
      const hasEvents = events.some(e =>
        e.scheduledDate && e.scheduledDate.startsWith(dayStr)
      );

      days.push({
        date: day.getDate(),
        dateStr: dayStr,
        isToday,
        isOtherMonth,
        isSelected,
        hasEvents
      });
    }

    return days;
  };

 
export default Calendar;