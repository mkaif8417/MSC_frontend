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
import StudyCenterModal from "./StudyCenterModal";
import styles from "./StudyCenter.module.css";

function StudyCenter() {
  const [messageApi, contextHolder] = message.useMessage();

  const [studyCenters, setStudyCenters] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [areaLocalities, setAreaLocalities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [mosquesLoading, setMosquesLoading] = useState(false);
  const [areaLocalitiesLoading, setAreaLocalitiesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [mosqueId, setMosqueId] = useState(undefined);
  const [isActive, setIsActive] = useState(undefined);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudyCenter, setSelectedStudyCenter] = useState(null);

  // ---------------------------------------------------------
  // LOAD MOSQUES
  // ---------------------------------------------------------
  const loadMosques = async () => {
    try {
      setMosquesLoading(true);

      const response = await axiosInstance.get("/locations/mosques", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      if (response?.data?.success) {
        const activeMosques = (response?.data?.data || []).filter(
          (mosque) => mosque.isActive === true
        );

        setMosques(activeMosques);
      }
    } catch (error) {
      console.error("Load mosques error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load mosques. Please try again."
      );
    } finally {
      setMosquesLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOAD AREA / LOCALITIES
  // ---------------------------------------------------------
  const loadAreaLocalities = async () => {
    try {
      setAreaLocalitiesLoading(true);

      const response = await axiosInstance.get(
        "/locations/areas-localities",
        {
          params: {
            page: 1,
            limit: 1000,
            isActive: true,
          },
        }
      );

      if (response?.data?.success) {
        const activeAreaLocalities = (response?.data?.data || []).filter(
          (areaLocality) => areaLocality.isActive === true
        );

        setAreaLocalities(activeAreaLocalities);
      }
    } catch (error) {
      console.error("Load area/localities error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load Area/Locality records."
      );
    } finally {
      setAreaLocalitiesLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOAD STUDY CENTERS
  // ---------------------------------------------------------
  const loadStudyCenters = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pageSize,
      };

      if (mosqueId) {
        params.mosqueId = mosqueId;
      }

      if (isActive !== undefined) {
        params.isActive = isActive;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await axiosInstance.get("/study-centers", {
        params,
      });

      if (response?.data?.success) {
        const activeStudyCenters = (response?.data?.data || []).filter(
          (studyCenter) => studyCenter.isActive !== false
        );

        setStudyCenters(activeStudyCenters);

        const paginationData = response?.data?.pagination;

        setPagination({
          current: paginationData?.page || page,
          pageSize: paginationData?.limit || pageSize,
          total: paginationData?.total || 0,
        });
      }
    } catch (error) {
      console.error("Load study centers error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load study centers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------
  useEffect(() => {
    loadMosques();
    loadAreaLocalities();
  }, []);

  useEffect(() => {
    loadStudyCenters(1, pagination.pageSize);
  }, [mosqueId, isActive]);

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------
  const handleSearch = () => {
    loadStudyCenters(1, pagination.pageSize);
  };

  // ---------------------------------------------------------
  // RESET
  // ---------------------------------------------------------
  const handleReset = () => {
    setSearch("");
    setMosqueId(undefined);
    setIsActive(undefined);

    loadStudyCenters(1, pagination.pageSize);
  };

  // ---------------------------------------------------------
  // TABLE PAGINATION
  // ---------------------------------------------------------
  const handleTableChange = (tablePagination) => {
    loadStudyCenters(
      tablePagination.current,
      tablePagination.pageSize
    );
  };

  // ---------------------------------------------------------
  // ADD
  // ---------------------------------------------------------
  const handleAdd = () => {
    setSelectedStudyCenter(null);
    setModalOpen(true);
  };

  // ---------------------------------------------------------
  // EDIT
  // ---------------------------------------------------------
  const handleEdit = async (record) => {
    try {
      setLoading(true);

      if (!record?._id) {
        messageApi.error("Unable to identify the study center.");
        return;
      }

      // Actual backend controller supports:
      // GET /study-centers/:id
      const response = await axiosInstance.get(
        `/study-centers/${record._id}`
      );

      if (response?.data?.success) {
        setSelectedStudyCenter(response.data.data);
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Load study center details error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load study center details. Please try again."
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
      const response = await axiosInstance.delete(
        `/study-centers/${id}`
      );

      if (response?.data?.success) {
        setStudyCenters((previous) =>
          previous.filter((studyCenter) => studyCenter._id !== id)
        );

        messageApi.success(
          response?.data?.message ||
            "Study center deactivated successfully."
        );

        const isLastItem =
          studyCenters.length === 1 && pagination.current > 1;

        await loadStudyCenters(
          isLastItem
            ? pagination.current - 1
            : pagination.current,
          pagination.pageSize
        );
      }
    } catch (error) {
      console.error("Delete study center error:", error);

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete study center. Please try again."
      );
    }
  };

  // ---------------------------------------------------------
  // MOSQUE NAME
  // ---------------------------------------------------------
  const getMosqueName = (record) => {
    if (
      record?.mosqueId &&
      typeof record.mosqueId === "object"
    ) {
      return record.mosqueId?.name || "-";
    }

    const mosque = mosques.find(
      (item) => item._id === record?.mosqueId
    );

    return mosque?.name || "-";
  };

  // ---------------------------------------------------------
  // TABLE COLUMNS
  // ---------------------------------------------------------
  const columns = [
    {
      title: "Study Center",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.studyCenterName}>
          {name || "-"}
        </span>
      ),
    },
    {
      title: "Mosque",
      key: "mosque",
      render: (_, record) => getMosqueName(record),
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      render: (grade) =>
        grade ? <Tag color="blue">{grade}</Tag> : "-",
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity) =>
        capacity !== undefined && capacity !== null
          ? capacity
          : "-",
    },
    {
      title: "Rooms",
      dataIndex: "roomsCount",
      key: "roomsCount",
      render: (roomsCount) =>
        roomsCount !== undefined && roomsCount !== null
          ? roomsCount
          : "-",
    },
    {
      title: "Tables",
      dataIndex: "tablesCount",
      key: "tablesCount",
      render: (tablesCount) =>
        tablesCount !== undefined && tablesCount !== null
          ? tablesCount
          : "-",
    },
    {
      title: "Chairs",
      dataIndex: "chairsCount",
      key: "chairsCount",
      render: (chairsCount) =>
        chairsCount !== undefined && chairsCount !== null
          ? chairsCount
          : "-",
    },
    {
      title: "Incharge",
      dataIndex: "inchargeName",
      key: "inchargeName",
      render: (inchargeName) => inchargeName || "-",
    },
    {
      title: "Contact",
      dataIndex: "contactNumber",
      key: "contactNumber",
      render: (contactNumber) => contactNumber || "-",
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
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Deactivate Study Center"
            description="Are you sure you want to deactivate this study center?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
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
            <h1 className={styles.title}>Study Centers</h1>
            <p className={styles.subtitle}>
              Manage study centers registered under mosques.
            </p>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Study Center
          </Button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <div className={styles.filterArea}>
              <Input
                className={styles.searchInput}
                placeholder="Search study center"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onPressEnter={handleSearch}
                allowClear
              />

              <Select
                className={styles.mosqueSelect}
                placeholder="Filter by Mosque"
                allowClear
                showSearch
                optionFilterProp="label"
                loading={mosquesLoading}
                value={mosqueId}
                onChange={setMosqueId}
                options={mosques.map((mosque) => ({
                  value: mosque._id,
                  label: mosque.name,
                }))}
              />

              <Select
                className={styles.statusSelect}
                placeholder="Filter by Status"
                allowClear
                value={isActive}
                onChange={setIsActive}
                options={[
                  {
                    value: true,
                    label: "Active",
                  },
                  {
                    value: false,
                    label: "Inactive",
                  },
                ]}
              />

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Search
              </Button>

              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </div>

          <Table
            rowKey="_id"
            columns={columns}
            dataSource={studyCenters}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} study centers`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1100 }}
          />
        </div>
      </div>

      <StudyCenterModal
        open={modalOpen}
        studyCenterData={selectedStudyCenter}
        mosques={mosques}
        areaLocalities={areaLocalities}
        onClose={() => {
          setModalOpen(false);
          setSelectedStudyCenter(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setSelectedStudyCenter(null);
          loadStudyCenters(
            pagination.current,
            pagination.pageSize
          );
        }}
      />
    </>
  );
}

export default StudyCenter;