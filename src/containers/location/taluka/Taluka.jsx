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

import axiosInstance from "../../../services/AxiosInstance";
import TalukaModal from "./TalukaModal";
import styles from "./Taluka.module.css";

function Taluka() {
  const [messageApi, contextHolder] = message.useMessage();

  const [talukas, setTalukas] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] =
    useState(false);

  const [searchName, setSearchName] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] =
    useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaluka, setSelectedTaluka] =
    useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // =========================
  // Get Active Districts
  // =========================
  const getDistricts = async () => {
    try {
      setDistrictsLoading(true);

      const response = await axiosInstance.get(
        "/locations/districts",
        {
          params: {
            page: 1,
            limit: 1000,
            isActive: true,
          },
        }
      );

      if (response?.data?.success) {
        setDistricts(response?.data?.data || []);
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to fetch districts."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch districts. Please try again."
      );
    } finally {
      setDistrictsLoading(false);
    }
  };

  // =========================
  // Get Talukas
  // =========================
  const getTalukas = async (
    page = pagination.current,
    limit = pagination.pageSize,
    name = searchName,
    districtId = selectedDistrictId
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
        isActive: true,
      };

      if (name?.trim()) {
        params.name = name.trim();
      }

      if (districtId) {
        params.districtId = districtId;
      }

      const response = await axiosInstance.get(
        "/locations/talukas",
        {
          params,
        }
      );

      if (response?.data?.success) {
        setTalukas(response?.data?.data || []);

        setPagination({
          current:
            response?.data?.pagination?.page || page,
          pageSize:
            response?.data?.pagination?.limit || limit,
          total:
            response?.data?.pagination?.total || 0,
        });
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to fetch talukas."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch talukas. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Initial Load
  // =========================
  useEffect(() => {
    getDistricts();
    getTalukas(
      1,
      pagination.pageSize,
      "",
      undefined
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Search
  // =========================
  const handleSearch = () => {
    getTalukas(
      1,
      pagination.pageSize,
      searchName,
      selectedDistrictId
    );
  };

  // =========================
  // Reset
  // =========================
  const handleReset = () => {
    setSearchName("");
    setSelectedDistrictId(undefined);

    getTalukas(
      1,
      pagination.pageSize,
      "",
      undefined
    );
  };

  // =========================
  // District Filter
  // =========================
  const handleDistrictChange = (value) => {
    setSelectedDistrictId(value);

    getTalukas(
      1,
      pagination.pageSize,
      searchName,
      value
    );
  };

  // =========================
  // Add Taluka
  // =========================
  const handleAddTaluka = () => {
    setSelectedTaluka(null);
    setModalOpen(true);
  };

  // =========================
  // Edit Taluka
  // =========================
  const handleEditTaluka = (record) => {
    setSelectedTaluka(record);
    setModalOpen(true);
  };

  // =========================
  // Delete Taluka
  // =========================
  const handleDeleteTaluka = async (record) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/locations/talukas/${record._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            "Taluka deleted successfully."
        );

        const currentPage = pagination.current;

        const isLastItemOnPage =
          talukas.length === 1 &&
          currentPage > 1;

        const nextPage = isLastItemOnPage
          ? currentPage - 1
          : currentPage;

        getTalukas(
          nextPage,
          pagination.pageSize,
          searchName,
          selectedDistrictId
        );
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to delete taluka."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to delete taluka. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Modal Success
  // =========================
  const handleModalSuccess = () => {
    setModalOpen(false);
    setSelectedTaluka(null);

    getTalukas(
      pagination.current,
      pagination.pageSize,
      searchName,
      selectedDistrictId
    );
  };

  // =========================
  // Modal Close
  // =========================
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTaluka(null);
  };

  // =========================
  // Table Change
  // =========================
  const handleTableChange = (tablePagination) => {
    getTalukas(
      tablePagination.current,
      tablePagination.pageSize,
      searchName,
      selectedDistrictId
    );
  };

  // =========================
  // Table Columns
  // =========================
  const columns = [
    {
      title: "Taluka Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.talukaName}>
          {name}
        </span>
      ),
    },
    {
      title: "Taluka Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span className={styles.code}>
          {code}
        </span>
      ),
    },
    {
      title: "District",
      key: "district",
      render: (_, record) => (
        <span>
          {record?.district?.name ||
            record?.districtName ||
            "-"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => {
        if (!createdAt) {
          return "-";
        }

        return new Date(
          createdAt
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() =>
              handleEditTaluka(record)
            }
            aria-label="Edit taluka"
          />

          <Popconfirm
            title="Delete Taluka"
            description="Are you sure you want to delete this taluka?"
            okText="Yes"
            cancelText="No"
            onConfirm={() =>
              handleDeleteTaluka(record)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Delete taluka"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {contextHolder}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>
            Talukas
          </h1>

          <p className={styles.subtitle}>
            Manage talukas under each district.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddTaluka}
        >
          Add Taluka
        </Button>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.filterArea}>
            <Input
              allowClear
              placeholder="Search taluka"
              prefix={<SearchOutlined />}
              value={searchName}
              onChange={(event) =>
                setSearchName(event.target.value)
              }
              onPressEnter={handleSearch}
              className={styles.searchInput}
              size="large"
            />

            <Select
              allowClear
              showSearch
              placeholder="Select district"
              value={selectedDistrictId}
              loading={districtsLoading}
              optionFilterProp="label"
              options={districts.map(
                (district) => ({
                  value: district._id,
                  label: district.name,
                })
              )}
              onChange={handleDistrictChange}
              className={styles.districtSelect}
              size="large"
            />

            <Button
              type="primary"
              icon={<SearchOutlined />}
              size="large"
              onClick={handleSearch}
            >
              Search
            </Button>

            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={talukas}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} talukas`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Modal */}
      <TalukaModal
        open={modalOpen}
        talukaData={selectedTaluka}
        districts={districts}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default Taluka;