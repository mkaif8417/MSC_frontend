import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";
import Mosque from "./containers/mosque-management/mosque/Mosque.jsx";

import Login from "./containers/auth/login/Login.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RootLayout from "./layouts/root-layout/RootLayout.jsx";
import Dashboard from "./containers/dashboard/Dashboard.jsx";
import State from "./containers/location/state/State.jsx";
import Division from "./containers/location/division/Division.jsx";
import Region from "./containers/location/region/Region.jsx";
import District from "./containers/location/district/District.jsx";
import Taluka from "./containers/location/taluka/Taluka.jsx";
import VillageCity from "./containers/location/village-city/VillageCity.jsx";
import AreaLocality from "./containers/location/area-locality/AreaLocality.jsx";
import Teacher from "./containers/teachers/Teacher.jsx";
import Coordinator from "./containers/coordinators/Coordinator.jsx";
import Student from "./containers/student/Student.jsx";
import Program from "./containers/programs/Program.jsx";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/location/states"
              element={<State />}
            />
            <Route
              path="/location/divisions"
              element={<Division />}
            />
            <Route
              path="/location/regions"
              element={<Region />}
            />
            <Route
              path="/location/districts"
              element={<District />}
            />
            <Route
              path="/location/talukas"
              element={<Taluka />}
            />
            <Route
              path="/location/villages-cities"
              element={<VillageCity />}
            />
            <Route
              path="/location/areas-localities"
              element={<AreaLocality />}
            />
            <Route path="/mosque-management" element={<Mosque />} />
            <Route path="/teachers" element={<Teacher />} />
            <Route path="/coordinators" element={<Coordinator />} />
            <Route path="/students" element={<Student />} />
            <Route path="/program/:frequency" element={<Program />} />
            <Route path="/program" element={<Navigate to="/program/weekly" replace />} />
          </Route>
        </Route>

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;