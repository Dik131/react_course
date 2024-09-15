import styles from './PercentageCounter.module.css';
import PropTypes from 'prop-types';

const PercentageCounter = ({
  everyday,
  currentDayTasks,
  weekly,
  todoList,
  monthTasks,
}) => {
  const calculatePercentage = (tasks) => {
    const completed = tasks.filter((task) => task.completed).length;
    const total = tasks.length;
    return total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00';
  };

  const percentageEveryday = calculatePercentage(everyday);
  const percentageCurrentDay = calculatePercentage(currentDayTasks);
  const percentageWeekly = calculatePercentage(weekly);
  const percentageTodoList = calculatePercentage(todoList);
  const percentageMonthTasks = calculatePercentage(monthTasks);

  return (
    <div className={styles.percentageCounter}>
      {percentageEveryday >= 50 && (
        <div>Everyday Tasks Completion: {percentageEveryday}%</div>
      )}
      {percentageCurrentDay >= 50 && (
        <div>
          {new Date().toLocaleDateString('en-US', { weekday: 'long' })} Tasks
          Completion: {percentageCurrentDay}%
        </div>
      )}
      {percentageWeekly >= 50 && (
        <div>Weekly Tasks Completion: {percentageWeekly}%</div>
      )}
      {percentageTodoList >= 50 && (
        <div>Todo List Completion: {percentageTodoList}%</div>
      )}
      {percentageMonthTasks >= 50 && (
        <div>Month Tasks Completion: {percentageMonthTasks}%</div>
      )}
    </div>
  );
};

PercentageCounter.propTypes = {
  everyday: PropTypes.array.isRequired,
  currentDayTasks: PropTypes.array.isRequired,
  weekly: PropTypes.array.isRequired,
  todoList: PropTypes.array.isRequired,
  monthTasks: PropTypes.array.isRequired,
};

export default PercentageCounter;
