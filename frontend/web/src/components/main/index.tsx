import { Link } from 'react-router-dom';

const MainPage = () => {
  return (
    <div>
      <span>Main Page</span>
      <Link to='/'>Go to landing page</Link>
    </div>
  );
};

export default MainPage;
