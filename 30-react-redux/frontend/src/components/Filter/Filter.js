import { useDispatch, useSelector } from "react-redux";
import {
  setTitleFilter,
  setAuthorFilter,
  setOnlyFavorite,
  resetFilters,
  selectTitleFilter,
  selectAuthorFilter,
  selectOnlyFavorite,
} from "../../redux/slices/filterSlice";
import "./Filter.css";
const Filter = () => {
  const dispatch = useDispatch();
  const titleFilter = useSelector(selectTitleFilter);
  const authorFilter = useSelector(selectAuthorFilter);
  const onlyFavorite = useSelector(selectOnlyFavorite);

  const handleTitleFilterChange = (event) => {
    dispatch(setTitleFilter(event.target.value));
  };

  const handleAuthorFilterChange = (event) => {
    dispatch(setAuthorFilter(event.target.value));
  };

  const handleOnlyFavoriteChange = () => {
    dispatch(setOnlyFavorite());
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
        <div className='buttons-row'>
          <button type='button' onClick={handleResetFilters}>
            Reset filters
          </button>
          <label>
            <input
              type='checkbox'
              checked={onlyFavorite}
              onChange={handleOnlyFavoriteChange}
            />
            Only favorite
          </label>
        </div>
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
