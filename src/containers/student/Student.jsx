import { useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import axiosInstance from "../../services/AxiosInstance";
import StudentModal from "./StudentModal";
import GuardianModal from "../guardian/GuardianModal";
import AttendanceModal from "./AttendanceModal";
import styles from "./Student.module.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const classOptions = [
  { value: "8th", label: "8th" },
  { value: "9th", label: "9th" },
  { value: "10th", label: "10th" },
  { value: "11th", label: "11th" },
  { value: "12th", label: "12th" },
  { value: "Degree", label: "Degree" },
];

function Student() {
  const [messageApi, contextHolder] = message.useMessage();

  const [students, setStudents] = useState([]);
  const [studyCenters, setStudyCenters] = useState([]);

  const [loading, setLoading] = useState(false);
  const [studyCentersLoading, setStudyCentersLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [studyCenterId, setStudyCenterId] = useState(undefined);
  const [studentClass, setStudentClass] = useState(undefined);
  const [isActive, setIsActive] = useState(undefined);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // View details modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  // Guardian modal state
  const [guardianModalOpen, setGuardianModalOpen] = useState(false);
  const [guardianStudent, setGuardianStudent] = useState(null);

  // Attendance modal state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceStudent, setAttendanceStudent] = useState(null);

  // Contact history drawer state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);

  // ---------------------------------------------------------
  // LOAD STUDY CENTERS (for filter + form dropdown)
  // ---------------------------------------------------------
  const loadStudyCenters = async () => {
    try {
      setStudyCentersLoading(true);

      const response = await axiosInstance.get("/study-centers", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      if (response?.data?.success) {
        const activeStudyCenters = (response?.data?.data || []).filter(
          (studyCenter) => studyCenter.isActive === true
        );

        setStudyCenters(activeStudyCenters);
      }
    } catch (error) {
      console.error("Load study centers error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load study centers. Please try again."
      );
    } finally {
      setStudyCentersLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOAD STUDENTS
  // ---------------------------------------------------------
  const loadStudents = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pageSize,
      };

      if (studyCenterId) {
        params.studyCenterId = studyCenterId;
      }

      if (studentClass) {
        params.class = studentClass;
      }

      if (isActive !== undefined) {
        params.isActive = isActive;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await axiosInstance.get("/students", {
        params,
      });

      if (response?.data?.success) {
        setStudents(response?.data?.data || []);

        const paginationData = response?.data?.pagination;

        setPagination({
          current: paginationData?.page || page,
          pageSize: paginationData?.limit || pageSize,
          total: paginationData?.total || 0,
        });
      }
    } catch (error) {
      console.error("Load students error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------
  useEffect(() => {
    loadStudyCenters();
  }, []);

  useEffect(() => {
    loadStudents(1, pagination.pageSize);
  }, [studyCenterId, studentClass, isActive]);

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------
  const handleSearch = () => {
    loadStudents(1, pagination.pageSize);
  };

  // ---------------------------------------------------------
  // RESET
  // ---------------------------------------------------------
  const handleReset = () => {
    setSearch("");
    setStudyCenterId(undefined);
    setStudentClass(undefined);
    setIsActive(undefined);

    loadStudents(1, pagination.pageSize);
  };

  // ---------------------------------------------------------
  // TABLE PAGINATION
  // ---------------------------------------------------------
  const handleTableChange = (tablePagination) => {
    loadStudents(tablePagination.current, tablePagination.pageSize);
  };

  // ---------------------------------------------------------
  // ADD
  // ---------------------------------------------------------
  const handleAdd = () => {
    setSelectedStudent(null);
    setModalOpen(true);
  };

  // ---------------------------------------------------------
  // EDIT
  // ---------------------------------------------------------
  const handleEdit = async (record) => {
    try {
      setLoading(true);

      if (!record?._id) {
        messageApi.error("Unable to identify the student.");
        return;
      }

      // Actual backend controller supports:
      // GET /students/:id
      const response = await axiosInstance.get(`/students/${record._id}`);

      if (response?.data?.success) {
        setSelectedStudent(response.data.data);
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Load student details error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load student details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE / DEACTIVATE
  // ---------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      const response = await axiosInstance.delete(`/students/${id}`);

      if (response?.data?.success) {
        setStudents((previous) =>
          previous.filter((student) => student._id !== id)
        );

        messageApi.success(
          response?.data?.message || "Student deactivated successfully."
        );

        const isLastItem = students.length === 1 && pagination.current > 1;

        await loadStudents(
          isLastItem ? pagination.current - 1 : pagination.current,
          pagination.pageSize
        );
      }
    } catch (error) {
      console.error("Delete student error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete student. Please try again."
      );
    }
  };

  // ---------------------------------------------------------
  // GUARDIAN
  // ---------------------------------------------------------
  const handleOpenGuardian = (record) => {
    setGuardianStudent(record);
    setGuardianModalOpen(true);
  };

  // ---------------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------------
  const handleOpenAttendance = (record) => {
    setAttendanceStudent(record);
    setAttendanceModalOpen(true);
  };

  // ---------------------------------------------------------
  // CONTACT HISTORY
  // ---------------------------------------------------------
  const handleOpenHistory = (record) => {
    setHistoryStudent(record);
    setHistoryDrawerOpen(true);
  };

  // ---------------------------------------------------------
  // STUDY CENTER NAME
  // ---------------------------------------------------------
  const getStudyCenterName = (record) => {
    if (record?.studyCenterId && typeof record.studyCenterId === "object") {
      return record.studyCenterId?.name || "-";
    }

    const studyCenter = studyCenters.find(
      (item) => item._id === record?.studyCenterId
    );

    return studyCenter?.name || "-";
  };

  // ---------------------------------------------------------
  // VIEW STUDENT DETAILS
  // ---------------------------------------------------------
  const handleView = (record) => {
    setViewStudent(record);
    setViewModalOpen(true);
  };

  // ---------------------------------------------------------
  // DOWNLOAD STUDENT DETAILS AS PDF
  // ---------------------------------------------------------
  const handleDownload = async (record) => {
  try {
    // Fetch guardian details for this student (may not exist yet)
    let guardian = null;
    try {
      const guardianResponse = await axiosInstance.get(
        `/students/${record._id}/guardian`
      );
      if (guardianResponse?.data?.success) {
        guardian = guardianResponse.data.data;
      }
    } catch (error) {
  // 404 just means no guardian saved yet - not a failure for the PDF
  if (error?.status !== 404 && error?.code !== "NOT_FOUND") {
    console.error("Load guardian for PDF error:", error);
  }
}

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ---- Header banner ----
    doc.setFillColor(22, 119, 89); // deep green, matches your sidebar
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Masjid Study Center", 14, 12);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Student Details Report", 14, 20);

    doc.setTextColor(0, 0, 0);

    // ---- Student Information table ----
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Student Information", 14, 38);

    autoTable(doc, {
      startY: 42,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [22, 119, 89], textColor: 255 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      head: [["Field", "Details"]],
      body: [
        ["Registration No.", record?.regNo || "-"],
        ["Name", record?.name || "-"],
        ["Father/Guardian", record?.fatherGuardianName || "-"],
        ["Mobile Number", record?.mobileNumber || "-"],
        ["Age", record?.age ?? "-"],
        ["Study Center", getStudyCenterName(record)],
        ["Class", record?.class || "-"],
        ["Course Type", record?.courseType || "-"],
        ["Village/Locality", record?.villageLocality || "-"],
        ["School/College", record?.schoolCollegeName || "-"],
        ["Status", record?.isActive ? "Active" : "Inactive"],
      ],
    });

    // ---- Parent / Guardian Information table ----
    const afterStudentTableY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Parent / Guardian Information", 14, afterStudentTableY);

    autoTable(doc, {
      startY: afterStudentTableY + 4,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [22, 119, 89], textColor: 255 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      head: [["Field", "Details"]],
      body: guardian
        ? [
            ["Guardian Name", guardian?.guardianName || "-"],
            ["Relation to Student", guardian?.relationToStudent || "-"],
            ["Mobile Number", guardian?.mobileNumber || "-"],
            ["Alternate Mobile", guardian?.alternateMobileNumber || "-"],
            ["Address", guardian?.address || "-"],
          ]
        : [["Guardian Details", "Not recorded yet"]],
    });

    // ---- Footer ----
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      14,
      pageHeight - 10
    );

    doc.save(`${record?.regNo || record?.name || "student"}-details.pdf`);
  } catch (error) {
    console.error("Generate PDF error:", error);
    messageApi.error("Unable to generate PDF. Please try again.");
  }
};

  // ---------------------------------------------------------
  // TABLE COLUMNS
  // ---------------------------------------------------------
  const columns = [
    {
      title: "Reg No",
      dataIndex: "regNo",
      key: "regNo",
      fixed: "left",
      width: 110,
      render: (value) =>
        value ? <Tag color="geekblue">{value}</Tag> : "-",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.studentName}>{name || "-"}</span>
      ),
    },
    {
      title: "Father/Guardian",
      dataIndex: "fatherGuardianName",
      key: "fatherGuardianName",
      render: (value) => value || "-",
    },
    {
      title: "Mobile",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
      render: (value) => value || "-",
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      render: (value) => (value !== undefined && value !== null ? value : "-"),
    },
    {
      title: "Study Center",
      key: "studyCenter",
      render: (_, record) => getStudyCenterName(record),
    },
    {
      title: "Class",
      dataIndex: "class",
      key: "class",
      render: (value) => (value ? <Tag color="blue">{value}</Tag> : "-"),
    },
    {
      title: "Course Type",
      dataIndex: "courseType",
      key: "courseType",
      render: (value) => (value ? <Tag color="purple">{value}</Tag> : "-"),
    },
    {
      title: "Village/Locality",
      dataIndex: "villageLocality",
      key: "villageLocality",
      render: (value) => value || "-",
    },
    {
      title: "School/College",
      dataIndex: "schoolCollegeName",
      key: "schoolCollegeName",
      render: (value) => value || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (active) =>
        active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space onClick={(event) => event.stopPropagation()}>
          <Tooltip title="Guardian Details">
            <Button
              type="text"
              icon={<TeamOutlined />}
              onClick={() => handleOpenGuardian(record)}
            />
          </Tooltip>

          <Tooltip title="Attendance">
            <Button
              type="text"
              icon={<CalendarOutlined />}
              onClick={() => handleOpenAttendance(record)}
            />
          </Tooltip>

          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Deactivate Student"
            description="Are you sure you want to deactivate this student?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Students</h1>
            <p className={styles.subtitle}>
              Manage students registered under study centers.
            </p>
          </div>

          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Student
          </Button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <div className={styles.filterArea}>
              <Input
                className={styles.searchInput}
                placeholder="Search by name or guardian"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />

              <Select
                className={styles.studyCenterSelect}
                placeholder="Filter by Study Center"
                allowClear
                showSearch
                optionFilterProp="label"
                loading={studyCentersLoading}
                value={studyCenterId}
                onChange={setStudyCenterId}
                options={studyCenters.map((studyCenter) => ({
                  value: studyCenter._id,
                  label: studyCenter.name,
                }))}
              />

              <Select
                className={styles.classSelect}
                placeholder="Filter by Class"
                allowClear
                value={studentClass}
                onChange={setStudentClass}
                options={classOptions}
              />

              <Select
                className={styles.statusSelect}
                placeholder="Filter by Status"
                allowClear
                value={isActive}
                onChange={setIsActive}
                options={[
                  { value: true, label: "Active" },
                  { value: false, label: "Inactive" },
                ]}
              />

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Search
              </Button>

              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          <Table
            rowKey="_id"
            columns={columns}
            dataSource={students}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} students`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1500 }}
            expandable={{
              expandRowByClick: true,
              expandedRowRender: (record) => (
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => handleView(record)}
                  >
                    View Details
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(record)}
                  >
                    Download
                  </Button>
                </Space>
              ),
            }}
          />
        </div>
      </div>

      <StudentModal
        open={modalOpen}
        studentData={selectedStudent}
        studyCenters={studyCenters}
        onClose={() => {
          setModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setSelectedStudent(null);
          loadStudents(pagination.current, pagination.pageSize);
        }}
      />

      <GuardianModal
        open={guardianModalOpen}
        studentId={guardianStudent?._id}
        studentName={guardianStudent?.name}
        onClose={() => {
          setGuardianModalOpen(false);
          setGuardianStudent(null);
        }}
      />

      <AttendanceModal
        open={attendanceModalOpen}
        studentId={attendanceStudent?._id}
        studentName={attendanceStudent?.name}
        onClose={() => {
          setAttendanceModalOpen(false);
          setAttendanceStudent(null);
        }}
      />

      <Modal
        open={viewModalOpen}
        title={
          viewStudent?.name ? `Details — ${viewStudent.name}` : "Student Details"
        }
        onCancel={() => {
          setViewModalOpen(false);
          setViewStudent(null);
        }}
        footer={null}
        width={600}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Registration No.">
            {viewStudent?.regNo || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Name">
            {viewStudent?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Father/Guardian">
            {viewStudent?.fatherGuardianName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Mobile">
            {viewStudent?.mobileNumber || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Age">
            {viewStudent?.age ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Study Center">
            {viewStudent ? getStudyCenterName(viewStudent) : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Class">
            {viewStudent?.class || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Course Type">
            {viewStudent?.courseType || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Village/Locality">
            {viewStudent?.villageLocality || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="School/College">
            {viewStudent?.schoolCollegeName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {viewStudent?.isActive ? "Active" : "Inactive"}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
}

export default Student;