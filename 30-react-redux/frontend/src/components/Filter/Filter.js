import './Filter.css';
const Filter = () => {
  return (
    <div className='app-block filter'>
      <div className='filter-group'>
        <input type='text' placeholder='Filter by title' />
      </div>
      <div className='filter-group'>
        <input type='text' placeholder='Filter by author' />
      </div>
    </div>
  );
};

export default Filter;
