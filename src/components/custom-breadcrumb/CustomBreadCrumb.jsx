import { Breadcrumb } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import styles from "./CustomBreadCrumb.module.css";

function CustomBreadCrumb() {
  const location = useLocation();

  const currentPage =
    location.pathname === "/"
      ? "Dashboard"
      : location.pathname.replace("/", "");

  return (
    <Breadcrumb className={styles.breadcrumb}>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item active>
        {currentPage}
      </Breadcrumb.Item>
    </Breadcrumb>
  );
}

export default CustomBreadCrumb;