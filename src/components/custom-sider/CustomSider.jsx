import { useState } from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { PiMosqueThin } from "react-icons/pi";
import {
    Home,
    MapPin,
    Building2,
    School,
    GraduationCap,
    UserCog,
    Users,
    ListChecks,
    BookOpen,
    BarChart3,
    Settings,
    ChevronDown,
} from "lucide-react";

import styles from "./CustomSider.module.css";

function CustomSider({ sidebarOpen, setSidebarOpen }) {
    const [locationOpen, setLocationOpen] = useState(false);
    const [programOpen, setProgramOpen] = useState(false);
    const { pathname } = useLocation();

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Router-version-proof active check.
    const isActive = (path) => pathname === path;

    const linkCls = (path) =>
        `${styles.link} ${isActive(path) ? styles.linkActive : ""}`;

    const subLinkCls = (path) =>
        `${styles.subLink} ${isActive(path) ? styles.linkActive : ""}`;

    // Items that render BEFORE the Program collapsible section.
    const itemsBeforeProgram = [
       { to: "/mosque-management", label: "Mosque Management", Icon: PiMosqueThin },
        { to: "/study-center", label: "Study Center", Icon: School },
        { to: "/teachers", label: "Teachers", Icon: GraduationCap },
        { to: "/coordinators", label: "Coordinators", Icon: UserCog },
        { to: "/students", label: "Students", Icon: Users },
    ];

    // Items that render AFTER the Program collapsible section.
    const itemsAfterProgram = [
        { to: "/academics", label: "Academics", Icon: BookOpen },
        { to: "/reports", label: "Reports", Icon: BarChart3 },
        { to: "/settings", label: "Settings", Icon: Settings },
    ];

    const locationLinks = [
        { to: "/location/states", label: "State" },
        { to: "/location/divisions", label: "Division" },
        { to: "/location/districts", label: "District" },
        { to: "/location/talukas", label: "Taluka" },
        { to: "/location/villages-cities", label: "Village / City" },
        { to: "/location/areas-localities", label: "Area / Locality" },
    ];

    const programLinks = [
        { to: "/program/weekly", label: "Weekly" },
        { to: "/program/monthly", label: "Monthly" },
        { to: "/program/quarterly", label: "Quarterly" },
    ];

    return (
        <>
            {sidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`${styles.sidebar} ${sidebarOpen ? styles.mobileOpen : ""
                    }`}
            >
                <div className={styles.title}>M</div>

                {/* Nav is used purely as a flex-column layout wrapper here —
                    we use plain <Link> (not Nav.Link) below so Bootstrap's
                    own .nav-link color rules never compete with our styles. */}
                <Nav className="flex-column">

                    {/* Dashboard */}
                    <Link
                        to="/dashboard"
                        className={linkCls("/dashboard")}
                        onClick={closeSidebar}
                    >
                        <span className={styles.icon}>
                            <Home size={18} />
                        </span>
                        <span className={styles.text}>
                            Dashboard
                        </span>
                    </Link>

                    {/* Location Management */}
                    <button
                        className={styles.menuButton}
                        onClick={() =>
                            setLocationOpen(!locationOpen)
                        }
                    >
                        <span className={styles.icon}>
                            <MapPin size={18} />
                        </span>

                        <span className={styles.text}>
                            Location Management
                        </span>

                        <span
                            className={`${styles.arrow} ${locationOpen ? styles.arrowOpen : ""
                                }`}
                        >
                            <ChevronDown size={16} />
                        </span>
                    </button>

                    {/* Location Submenu */}
                    {locationOpen && (
                        <div className={styles.submenu}>
                            {locationLinks.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={subLinkCls(to)}
                                    onClick={closeSidebar}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Items before Program */}
                    {itemsBeforeProgram.map(({ to, label, Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={linkCls(to)}
                            onClick={closeSidebar}
                        >
                            <span className={styles.icon}>
                                <Icon size={18} />
                            </span>
                            <span className={styles.text}>
                                {label}
                            </span>
                        </Link>
                    ))}

                    {/* Program (collapsible: Weekly / Monthly / Quarterly) */}
                    <button
                        className={styles.menuButton}
                        onClick={() =>
                            setProgramOpen(!programOpen)
                        }
                    >
                        <span className={styles.icon}>
                            <ListChecks size={18} />
                        </span>

                        <span className={styles.text}>
                            Program
                        </span>

                        <span
                            className={`${styles.arrow} ${programOpen ? styles.arrowOpen : ""
                                }`}
                        >
                            <ChevronDown size={16} />
                        </span>
                    </button>

                    {/* Program Submenu */}
                    {programOpen && (
                        <div className={styles.submenu}>
                            {programLinks.map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={subLinkCls(to)}
                                    onClick={closeSidebar}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Items after Program */}
                    {itemsAfterProgram.map(({ to, label, Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={linkCls(to)}
                            onClick={closeSidebar}
                        >
                            <span className={styles.icon}>
                                <Icon size={18} />
                            </span>
                            <span className={styles.text}>
                                {label}
                            </span>
                        </Link>
                    ))}

                </Nav>
            </aside>
        </>
    );
}

export default CustomSider;