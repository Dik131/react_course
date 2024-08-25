import { useSelector } from 'react-redux';

const PercentageCounter = ({ everyday, currentDayTasks }) => {
  const completedEveryday = everyday.filter((task) => task.completed).length;
  const completedCurrentDay = currentDayTasks.filter(
    (task) => task.completed
  ).length;
  const totalEveryday = everyday.length;
  const totalCurrentDay = currentDayTasks.length;

  const calculatePercentage = (completed, total) => {
    return total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00';
  };

  const percentageEveryday = calculatePercentage(
    completedEveryday,
    totalEveryday
  );
  const percentageCurrentDay = calculatePercentage(
    completedCurrentDay,
    totalCurrentDay
  );

  return (
    <div className='percentage-counter'>
      {percentageEveryday >= 50 && (
        <div>Everyday Tasks Completion: {percentageEveryday}%</div>
      )}
      {percentageCurrentDay >= 50 && (
        <div>
          {new Date().toLocaleDateString('en-US', { weekday: 'long' })} Tasks
          Completion: {percentageCurrentDay}%
        </div>
      )}
    </div>
  );
};

export default PercentageCounter;
