import { useDispatch, useSelector } from "react-redux";
import {
  setTitleFilter,
  setAuthorFilter,
  resetFilters,
  selectTitleFilter,
  selectAuthorFilter,
} from "../../redux/slices/filterSlice";
import "./Filter.css";
const Filter = () => {
  const dispatch = useDispatch();
  const titleFilter = useSelector(selectTitleFilter);
  const authorFilter = useSelector(selectAuthorFilter);
  const handleTitleFilterChange = (event) => {
    dispatch(setTitleFilter(event.target.value));
  };

  const handleAuthorFilterChange = (event) => {
    dispatch(setAuthorFilter(event.target.value));
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
        <br></br>
        <div className='filter-group'>
          <input
            type='text'
            value={authorFilter}
            placeholder='Filter by author'
            onChange={handleAuthorFilterChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Filter;
