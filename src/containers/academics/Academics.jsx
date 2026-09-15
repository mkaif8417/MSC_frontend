import { useEffect, useState } from "react";
import { Button, Input, Select, Space, Table, Tag, message } from "antd";
import { ReloadOutlined, SearchOutlined, BookOutlined } from "@ant-design/icons";

import axiosInstance from "../../services/AxiosInstance";

import styles from "./Academics.module.css";
  import { useNavigate } from "react-router-dom";

const AICU_CLASSES = ["8th", "9th", "10th"];

function Academics() {
  const [messageApi, contextHolder] = message.useMessage();

  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [studentClass, setStudentClass] = useState(undefined);


const navigate = useNavigate();

  // AICU-only, 8th/9th/10th only — fetched once, filtered/paginated client-side
  const loadStudents = async () => {
    try {
      setLoading(true);

    const response = await axiosInstance.get("/students", {
  params: { page: 1, limit: 100, isActive: true },
});

      if (response?.data?.success) {
        const aicuStudents = (response?.data?.data || []).filter(
          (student) =>
            student.courseType === "AICU" &&
            AICU_CLASSES.includes(student.class)
        );
        setAllStudents(aicuStudents);
      }
    } catch (error) {
      console.error("Load AICU students error:", error);
      messageApi.error(
        error?.message || "Unable to load students for Academics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = allStudents.filter((student) => {
    if (studentClass && student.class !== studentClass) return false;
    if (
      search.trim() &&
      !student.name?.toLowerCase().includes(search.trim().toLowerCase())
    )
      return false;
    return true;
  });

 const handleOpenSheets = (student) => {
  navigate(`/academics/${student._id}`);
};

  const columns = [
    {
      title: "Reg No",
      dataIndex: "regNo",
      key: "regNo",
      render: (value) => (value ? <Tag color="geekblue">{value}</Tag> : "-"),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className={styles.studentName}>{name}</span>,
    },
    {
      title: "Class",
      dataIndex: "class",
      key: "class",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Course Type",
      dataIndex: "courseType",
      key: "courseType",
      render: () => <Tag color="purple">AICU</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          icon={<BookOutlined />}
          onClick={() => handleOpenSheets(record)}
        >
          Weekly Sheets
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Academics</h1>
            <p className={styles.subtitle}>
              AICU weekly academic sheets — 8th, 9th &amp; 10th class students
            </p>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <div className={styles.filterArea}>
              <Input
                className={styles.searchInput}
                placeholder="Search student name"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
              <Select
                className={styles.classSelect}
                placeholder="Filter by Class"
                allowClear
                value={studentClass}
                onChange={setStudentClass}
                options={AICU_CLASSES.map((c) => ({ value: c, label: c }))}
              />
              <Button icon={<ReloadOutlined />} onClick={loadStudents}>
                Reset
              </Button>
            </div>
          </div>

          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredStudents}
            loading={loading}
            pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} AICU students` }}
          />
        </div>
      </div>

      
    </>
  );
}

export default Academics;