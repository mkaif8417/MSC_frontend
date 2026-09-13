import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import axiosInstance from "../../services/AxiosInstance";
import TeacherModal from "./TeacherModal";
import styles from "./Teacher.module.css";

function Teacher() {
  const [messageApi, contextHolder] = message.useMessage();

  const [teachers, setTeachers] = useState([]);
  const [studyCenters, setStudyCenters] = useState([]);
  const [areaLocalities, setAreaLocalities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [studyCentersLoading, setStudyCentersLoading] = useState(false);
  const [areaLocalitiesLoading, setAreaLocalitiesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [studyCenterId, setStudyCenterId] = useState(undefined);
  const [status, setStatus] = useState(undefined);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // ---------------------------------------------------------
  // LOAD STUDY CENTERS (for filter + form dropdown)
  // ---------------------------------------------------------
  const loadStudyCenters = async () => {
    try {
      setStudyCentersLoading(true);

      const response = await axiosInstance.get("/study-centers", {
        params: { page: 1, limit: 100 },
      });

      if (response?.data?.success) {
        const activeStudyCenters = (response?.data?.data || []).filter(
          (studyCenter) => studyCenter.isActive !== false
        );

        setStudyCenters(activeStudyCenters);
      }
    } catch (error) {
      console.error("Load study centers error:", error);
      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load study centers."
      );
    } finally {
      setStudyCentersLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOAD AREA/LOCALITIES (for form dropdown)
  // ---------------------------------------------------------
  const loadAreaLocalities = async () => {
    try {
      setAreaLocalitiesLoading(true);

      const response = await axiosInstance.get(
        "/locations/areas-localities",
        { params: { page: 1, limit: 1000, isActive: true } }
      );

      if (response?.data?.success) {
        const activeAreaLocalities = (response?.data?.data || []).filter(
          (areaLocality) => areaLocality.isActive === true
        );

        setAreaLocalities(activeAreaLocalities);
      }
    } catch (error) {
      console.error("Load area localities error:", error);
      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load area/locality records."
      );
    } finally {
      setAreaLocalitiesLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOAD TEACHERS
  // ---------------------------------------------------------
  const loadTeachers = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);

      const params = { page, limit: pageSize };

      if (studyCenterId) params.studyCenterId = studyCenterId;
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();

      const response = await axiosInstance.get("/teachers", { params });

      if (response?.data?.success) {
        setTeachers(response?.data?.data || []);

        const meta = response?.data?.meta;
        setPagination({
          current: meta?.page || page,
          pageSize: meta?.limit || pageSize,
          total: meta?.total || 0,
        });
      }
    } catch (error) {
      console.error("Load teachers error:", error);
      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load teachers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudyCenters();
    loadAreaLocalities();
  }, []);

  useEffect(() => {
    loadTeachers(1, pagination.pageSize);
  }, [studyCenterId, status]);

  const handleSearch = () => {
    loadTeachers(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSearch("");
    setStudyCenterId(undefined);
    setStatus(undefined);
    loadTeachers(1, pagination.pageSize);
  };

  const handleTableChange = (tablePagination) => {
    loadTeachers(tablePagination.current, tablePagination.pageSize);
  };

  const handleAdd = () => {
    setSelectedTeacher(null);
    setModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setModalOpen(true);
  };

  const handleDelete = async (teacher) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/teachers/${teacher._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message || "Teacher deactivated successfully."
        );

        const currentPage = pagination.current;

        await loadTeachers(
          teachers.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage,
          pagination.pageSize
        );
      }
    } catch (error) {
      console.error("Deactivate teacher error:", error);
      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to deactivate teacher."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStudyCenterName = (record) => {
    if (record?.studyCenterId && typeof record.studyCenterId === "object") {
      return record.studyCenterId?.name || "-";
    }
    const studyCenter = studyCenters.find(
      (item) => item._id === record?.studyCenterId
    );
    return studyCenter?.name || "-";
  };

  const columns = [
    {
      title: "Teacher Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.teacherName}>{name || "-"}</span>
      ),
    },
    {
      title: "Mobile Number",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },
    {
      title: "Qualification",
      dataIndex: "qualification",
      key: "qualification",
      render: (qualification) => qualification || "-",
    },
    {
      title: "Subjects",
      dataIndex: "subjects",
      key: "subjects",
      render: (subjects) =>
        subjects?.length
          ? subjects.map((subject) => (
              <Tag key={subject}>{subject}</Tag>
            ))
          : "-",
    },
    {
      title: "Study Center",
      key: "studyCenter",
      render: (_, record) => getStudyCenterName(record),
    },
    {
      title: "Joining Date",
      dataIndex: "joiningDate",
      key: "joiningDate",
      render: (joiningDate) =>
        joiningDate ? new Date(joiningDate).toLocaleDateString() : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "default"}>
          {status || "-"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Are you sure you want to deactivate this teacher?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
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
            <h1 className={styles.title}>Teachers</h1>
            <p className={styles.subtitle}>
              Manage teacher registration and records
            </p>
          </div>

          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Teacher
          </Button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <div className={styles.filterArea}>
              <Input
                className={styles.searchInput}
                placeholder="Search teacher name"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />

              <Select
                className={styles.studyCenterSelect}
                placeholder="Filter by Study Center"
                value={studyCenterId}
                onChange={setStudyCenterId}
                loading={studyCentersLoading}
                showSearch
                allowClear
                optionFilterProp="label"
                options={studyCenters.map((studyCenter) => ({
                  value: studyCenter._id,
                  label: studyCenter.name,
                }))}
              />

              <Select
                className={styles.statusSelect}
                placeholder="Filter by Status"
                value={status}
                onChange={setStatus}
                allowClear
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
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
            dataSource={teachers}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} teachers`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </div>
      </div>

      <TeacherModal
        open={modalOpen}
        teacherData={selectedTeacher}
        studyCenters={studyCenters}
        areaLocalities={areaLocalities}
        onClose={() => {
          setModalOpen(false);
          setSelectedTeacher(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setSelectedTeacher(null);
          loadTeachers(pagination.current, pagination.pageSize);
        }}
      />
    </>
  );
}``

export default Teacher;