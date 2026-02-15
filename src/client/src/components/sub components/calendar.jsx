import React, { useState, useEffect } from 'react';
import '../../static/styles/events.css';


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
      //day type
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

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  const days = renderCalendar();

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={previousMonth}
          aria-label="Previous month">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h3 className="calendar-month">{monthName}</h3>
        <button
          className="calendar-nav-btn"
          onClick={nextMonth}
          aria-label="Next month">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="calendar-weekdays">
        <div className="calendar-weekday">Mon</div>
        <div className="calendar-weekday">Tues</div>
        <div className="calendar-weekday">Wed</div>
        <div className="calendar-weekday">Thurs</div>
        <div className="calendar-weekday">Fri</div>
        <div className="calendar-weekday">Sat</div>
        <div className="calendar-weekday">Sun</div>
      </div>

      <div className="calendar-days">
        {days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day.isOtherMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''} ${day.hasEvents ? 'has-events' : ''}`}
            onClick={() => handleDateClick(day.dateStr)}
            data-date={day.dateStr}>
            {day.date}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;