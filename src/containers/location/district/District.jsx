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
import DistrictModal from "./DistrictModal";
import styles from "./District.module.css";

function District() {
  const [messageApi, contextHolder] = message.useMessage();

  const [districts, setDistricts] = useState([]);
  const [states, setStates] = useState([]);

  const [loading, setLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [selectedStateId, setSelectedStateId] = useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // =========================
  // Get States
  // =========================
  const getStates = async () => {
    try {
      setStatesLoading(true);

      const response = await axiosInstance.get(
        "/locations/states",
        {
          params: {
            page: 1,
            limit: 1000,
            isActive: true,
          },
        }
      );

      if (response?.data?.success) {
        setStates(response?.data?.data || []);
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to fetch states."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch states. Please try again."
      );
    } finally {
      setStatesLoading(false);
    }
  };

  // =========================
  // Get Districts
  // =========================
  const getDistricts = async (
    page = pagination.current,
    limit = pagination.pageSize,
    name = searchName,
    stateId = selectedStateId
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

      if (stateId) {
        params.stateId = stateId;
      }

      const response = await axiosInstance.get(
        "/locations/districts",
        {
          params,
        }
      );

      if (response?.data?.success) {
        setDistricts(response?.data?.data || []);

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
            "Unable to fetch districts."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch districts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Initial Load
  // =========================
  useEffect(() => {
    getStates();
    getDistricts(1, pagination.pageSize, "", undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Search
  // =========================
  const handleSearch = () => {
    getDistricts(
      1,
      pagination.pageSize,
      searchName,
      selectedStateId
    );
  };

  // =========================
  // Reset Filters
  // =========================
  const handleReset = () => {
    setSearchName("");
    setSelectedStateId(undefined);

    getDistricts(
      1,
      pagination.pageSize,
      "",
      undefined
    );
  };

  // =========================
  // State Filter
  // =========================
  const handleStateChange = (value) => {
    setSelectedStateId(value);

    getDistricts(
      1,
      pagination.pageSize,
      searchName,
      value
    );
  };

  // =========================
  // Add District
  // =========================
  const handleAddDistrict = () => {
    setSelectedDistrict(null);
    setModalOpen(true);
  };

  // =========================
  // Edit District
  // =========================
  const handleEditDistrict = (record) => {
    setSelectedDistrict(record);
    setModalOpen(true);
  };

  // =========================
  // Delete District
  // =========================
  const handleDeleteDistrict = async (record) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/locations/districts/${record._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            "District deleted successfully."
        );

        const currentPage = pagination.current;

        const isLastItemOnPage =
          districts.length === 1 &&
          currentPage > 1;

        const nextPage = isLastItemOnPage
          ? currentPage - 1
          : currentPage;

        getDistricts(
          nextPage,
          pagination.pageSize,
          searchName,
          selectedStateId
        );
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to delete district."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to delete district. Please try again."
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
    setSelectedDistrict(null);

    getDistricts(
      pagination.current,
      pagination.pageSize,
      searchName,
      selectedStateId
    );
  };

  // =========================
  // Modal Close
  // =========================
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDistrict(null);
  };

  // =========================
  // Table Pagination
  // =========================
  const handleTableChange = (tablePagination) => {
    getDistricts(
      tablePagination.current,
      tablePagination.pageSize,
      searchName,
      selectedStateId
    );
  };

  // =========================
  // Table Columns
  // =========================
  const columns = [
    {
      title: "District Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.districtName}>
          {name}
        </span>
      ),
    },
    {
      title: "District Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span className={styles.code}>
          {code}
        </span>
      ),
    },
    {
      title: "State",
      key: "state",
      render: (_, record) => (
        <span>
          {record?.state?.name ||
            record?.stateName ||
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

        return new Date(createdAt).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );
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
              handleEditDistrict(record)
            }
            aria-label="Edit district"
          />

          <Popconfirm
            title="Delete District"
            description="Are you sure you want to delete this district?"
            okText="Yes"
            cancelText="No"
            onConfirm={() =>
              handleDeleteDistrict(record)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Delete district"
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
            Districts
          </h1>

          <p className={styles.subtitle}>
            Manage districts under each state.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddDistrict}
        >
          Add District
        </Button>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.filterArea}>
            <Input
              allowClear
              placeholder="Search district"
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
              placeholder="Select state"
              value={selectedStateId}
              loading={statesLoading}
              optionFilterProp="label"
              options={states.map((state) => ({
                value: state._id,
                label: state.name,
              }))}
              onChange={handleStateChange}
              className={styles.stateSelect}
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
          dataSource={districts}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} districts`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </div>

      {/* District Modal */}
      <DistrictModal
        open={modalOpen}
        districtData={selectedDistrict}
        states={states}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default District;