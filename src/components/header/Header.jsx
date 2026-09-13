import { Navbar, Container, Button } from "react-bootstrap";
import { Menu, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../../redux/authslice.jsx";
import { logout } from "../../services/authService";
import styles from "./Header.module.css";

function Header({ setSidebarOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Even if the API fails, clear the local session.
    } finally {
      dispatch(logoutUser());
      navigate("/login", { replace: true });
    }
  };

  return (
    <Navbar className={styles.header}>
      <Container fluid className={styles.container}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Navbar.Brand className={styles.logo}>
            Masjid Study Center
          </Navbar.Brand>
        </div>

        <Button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </Button>
      </Container>
    </Navbar>
  );
}

export default Header;