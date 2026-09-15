import { Navigate } from 'react-router-dom';
import { getToken } from '../../lib/api';

// Sends anyone without a token back to the login page.
const ProtectedRoute = ({ children }) => {
  return getToken() ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
