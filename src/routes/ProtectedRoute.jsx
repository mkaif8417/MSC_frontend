import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { checkLoginStatus } from "../utils/sessionHelper";
import { setLoginUser, logoutUser } from "../redux/authslice.jsx";

function ProtectedRoute() {
  const dispatch = useDispatch();

  const user = useSelector(
    (state) => state.auth.loggedInUserData
  );

  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const response = await checkLoginStatus();

      if (response?.success && response?.data?.user) {
        dispatch(setLoginUser(response.data.user));
        setIsAuthenticated(true);
      } else {
        dispatch(logoutUser());
        setIsAuthenticated(false);
      }

      setCheckingSession(false);
    };

    verifySession();
  }, [dispatch]);

  if (checkingSession) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
