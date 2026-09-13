import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/header/Header.jsx";
import Footer from "../../components/footer/Footer.jsx";
import CustomSider from "../../components/custom-sider/CustomSider.jsx";
import CustomBreadCrumb from "../../components/custom-breadcrumb/CustomBreadCrumb.jsx";

function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex min-vh-100">
      <CustomSider
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-grow-1 d-flex flex-column">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="p-4 flex-grow-1">
          <CustomBreadCrumb />
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default RootLayout;