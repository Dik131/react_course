import { useDispatch, useSelector } from 'react-redux';
import {
  setTitleFilter,
  resetFilters,
  selectTitleFilter,
} from '../../redux/slices/filterSlice';
import './Filter.css';
const Filter = () => {
  const dispatch = useDispatch();
  const titleFilter = useSelector(selectTitleFilter);
  const handleTitleFilterChange = (event) => {
    dispatch(setTitleFilter(event.target.value));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  return (
    <div className='app-block filter'>
      <div className='filter-row'>
        <div className='filter-group'>
          <input
            type='text'
            value={titleFilter}
            placeholder='Filter by title'
            onChange={handleTitleFilterChange}
          />
        </div>
        <button type='button' onClick={handleResetFilters}>
          Reset filters
        </button>
        <div className='filter-group'>
          <input type='text' placeholder='Filter by author' />
        </div>
      </div>
    </div>
  );
};

export default Filter;
