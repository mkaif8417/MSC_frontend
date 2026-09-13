import { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col } from "react-bootstrap";
import { Spin, message } from "antd";
import {
  ChevronDown,
  Building2,
  GraduationCap,
  Users2,
  CalendarCheck2,
} from "lucide-react";
import { useSelector } from "react-redux";
import axiosInstance from "../../services/AxiosInstance";

import styles from "./Dashboard.module.css";

// ---------------------------------------------------------
// Counts a number up from 0 on mount. Respects reduced-motion.
// ---------------------------------------------------------
function useCountUp(value, durationMs = 900) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (typeof value !== "number") return undefined;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      setDisplay(value);
      return undefined;
    }

    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return display;
}

// ---------------------------------------------------------
// Small helper: hex -> rgba string, used for each stat card's tint wash
// ---------------------------------------------------------
function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function StatCard({ icon: Icon, label, value, suffix = "", accent, children }) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const tint = hexToRgba(accent, 0.07);

  return (
    <div
      className={styles.statCard}
      style={{ "--accent": accent, "--accent-tint": tint }}
    >
      <div className={styles.statIcon}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className={styles.statLabel}>{label}</p>
      {children ? (
        children
      ) : (
        <h3 className={styles.statValue}>
          {animated}
          {suffix}
        </h3>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Radial progress ring for the Attendance card — fill and the
// number inside are driven by the same count-up value, so they
// land in sync.
// ---------------------------------------------------------
function AttendanceRing({ value, size = 72, strokeWidth = 7 }) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, animated));
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className={styles.ringWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--brand-soft)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#C9932F"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={styles.ringValue}>{animated}%</span>
    </div>
  );
}

function DistrictRow({ district, maxStudents }) {
  const barWidth = maxStudents
    ? Math.max(4, Math.round((district.students / maxStudents) * 100))
    : 0;

  return (
    <tr>
      <td className={styles.districtName}>{district.name}</td>
      <td>{district.mosques}</td>
      <td>{district.studyCenters}</td>
      <td>{district.teachers}</td>
      <td>
        <div className={styles.miniBarCell}>
          <span className={styles.miniBarValue}>{district.students}</span>
          <div className={styles.miniBarTrack}>
            <div
              className={styles.miniBarFill}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      </td>
      <td>{district.aicuStudents}</td>
      <td>{district.selfStudyStudents}</td>
      <td>{district.specialCourseStudents}</td>
    </tr>
  );
}

function DivisionRow({ division, isOpen, onToggle }) {
  const districtMax = useMemo(
    () => Math.max(1, ...division.districts.map((d) => d.students || 0)),
    [division.districts]
  );

  return (
    <div className={styles.divisionBlock}>
      <button
        type="button"
        className={styles.divisionHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className={styles.divisionHeaderLeft}>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${
              isOpen ? styles.chevronOpen : ""
            }`}
          />
          <div>
            <p className={styles.divisionName}>{division.name}</p>
            <p className={styles.divisionMeta}>
              {division.districts.length} district
              {division.districts.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className={styles.divisionHeaderStats}>
          <div className={styles.divisionStat}>
            <span className={styles.divisionStatValue}>
              {division.mosques}
            </span>
            <span className={styles.divisionStatLabel}>Masjids</span>
          </div>

          <div className={styles.divisionStat}>
            <span className={styles.divisionStatValue}>
              {division.studyCenters}
            </span>
            <span className={styles.divisionStatLabel}>Study centers</span>
          </div>

          <div className={styles.divisionStat}>
            <span className={styles.divisionStatValue}>
              {division.teachers}
            </span>
            <span className={styles.divisionStatLabel}>Teachers</span>
          </div>

          <div className={styles.divisionStat}>
            <span className={styles.divisionStatValue}>
              {division.students}
            </span>
            <span className={styles.divisionStatLabel}>Students</span>
          </div>
        </div>
      </button>

      <div
        className={styles.districtPanel}
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className={styles.districtPanelInner}>
          <div className={styles.districtTableWrapper}>
            <table className={styles.districtTable}>
              <thead>
                <tr>
                  <th>District</th>
                  <th>Masjids</th>
                  <th>Study centers</th>
                  <th>Teachers</th>
                  <th>Students</th>
                  <th>AICU</th>
                  <th>Self study</th>
                  <th>Special course</th>
                </tr>
              </thead>
              <tbody>
                {division.districts.map((district) => (
                  <DistrictRow
                    key={district.districtId}
                    district={district}
                    maxStudents={districtMax}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [messageApi, contextHolder] = message.useMessage();
  const user = useSelector((state) => state.auth.loggedInUserData);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [divisionSummary, setDivisionSummary] = useState([]);
  const [divisionLoading, setDivisionLoading] = useState(true);
  const [openDivisionId, setOpenDivisionId] = useState(null);

  // ---------------------------------------------------------
  // LOAD SUMMARY CARDS
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummaryLoading(true);

        const response = await axiosInstance.get("/dashboard/summary");

        if (response?.data?.success) {
          setSummary(response.data.data);
        }
      } catch (error) {
        console.error("Load dashboard summary error:", error);

        messageApi.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load dashboard summary."
        );
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------
  // LOAD DIVISION-WISE SUMMARY
  // ---------------------------------------------------------
  useEffect(() => {
    const loadDivisionSummary = async () => {
      try {
        setDivisionLoading(true);

        const response = await axiosInstance.get(
          "/dashboard/division-summary"
        );

        if (response?.data?.success) {
          const data = response.data.data || [];
          setDivisionSummary(data);

          if (data.length) {
            setOpenDivisionId(data[0].divisionId);
          }
        }
      } catch (error) {
        console.error("Load division summary error:", error);

        messageApi.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load division-wise summary."
        );
      } finally {
        setDivisionLoading(false);
      }
    };

    loadDivisionSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className={styles.page}>
      {contextHolder}

      {/* Hero */}
      <div className={styles.hero}>
        <p className={styles.eyebrow}>{today}</p>
        <h1 className={styles.heroTitle}>
          Welcome back, {user?.name || "there"}
        </h1>
        <p className={styles.heroSubtitle}>
          Here's how the Karnataka study-center network is doing today.
        </p>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className={styles.loadingWrapper}>
          <Spin />
        </div>
      ) : (
        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} lg={3}>
            <StatCard
              icon={Building2}
              label="Study centers"
              value={summary?.studyCenters ?? 0}
              accent="#0F5C4D"
            />
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <StatCard
              icon={Users2}
              label="Students"
              value={summary?.students ?? 0}
              accent="#0F5C4D"
            />
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <StatCard
              icon={GraduationCap}
              label="Teachers"
              value={summary?.teachers ?? 0}
              accent="#0F5C4D"
            />
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <StatCard
              icon={CalendarCheck2}
              label="Attendance today"
              accent="#C9932F"
            >
              <AttendanceRing value={summary?.attendancePercent ?? 0} />
            </StatCard>
          </Col>
        </Row>
      )}

      {/* Division-wise Summary */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Network by division</h2>
          <p className={styles.sectionSubtitle}>
            Tap a division to see its districts.
          </p>
        </div>

        {divisionLoading ? (
          <div className={styles.loadingWrapper}>
            <Spin />
          </div>
        ) : divisionSummary.length === 0 ? (
          <p className={styles.emptyState}>
            No division data yet — add districts to a division to see it
            here.
          </p>
        ) : (
          <div className={styles.divisionList}>
            {divisionSummary.map((division) => (
              <DivisionRow
                key={division.divisionId}
                division={division}
                isOpen={openDivisionId === division.divisionId}
                onToggle={() =>
                  setOpenDivisionId((current) =>
                    current === division.divisionId
                      ? null
                      : division.divisionId
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;