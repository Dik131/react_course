import { useDispatch, useSelector } from 'react-redux';
import { setTitleFilter } from '../../redux/slices/filterSlice';
import './Filter.css';
const Filter = () => {
  const dispatch = useDispatch();
  const titleFilter = useSelector((state) => state.filter.title);
  const handleFilterChange = (event) => {
    dispatch(setTitleFilter(event.target.value));
  };
  return (
    <div className='app-block filter'>
      <div className='filter-group'>
        <input
          type='text'
          value={titleFilter}
          placeholder='Filter by title'
          onChange={handleFilterChange}
        />
      </div>
      <div className='filter-group'>
        <input type='text' placeholder='Filter by author' />
      </div>
    </div>
  );
};

export default Filter;
