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
import DivisionModal from "./DivisionModal";
import styles from "./Division.module.css";

function Division() {
  const [messageApi, contextHolder] = message.useMessage();

  const [divisions, setDivisions] = useState([]);
  const [states, setStates] = useState([]);

  const [loading, setLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [selectedStateId, setSelectedStateId] = useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(null);

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
  // Get Divisions
  // =========================
  const getDivisions = async (
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
        "/locations/divisions",
        {
          params,
        }
      );

      if (response?.data?.success) {
        setDivisions(response?.data?.data || []);

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
            "Unable to fetch divisions."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch divisions. Please try again."
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
    getDivisions(1, pagination.pageSize, "", undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Search
  // =========================
  const handleSearch = () => {
    getDivisions(
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

    getDivisions(
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

    getDivisions(
      1,
      pagination.pageSize,
      searchName,
      value
    );
  };

  // =========================
  // Add Division
  // =========================
  const handleAddDivision = () => {
    setSelectedDivision(null);
    setModalOpen(true);
  };

  // =========================
  // Edit Division
  // =========================
  const handleEditDivision = (record) => {
    setSelectedDivision(record);
    setModalOpen(true);
  };

  // =========================
  // Delete Division
  // =========================
  const handleDeleteDivision = async (record) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/locations/divisions/${record._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            "Division deleted successfully."
        );

        const currentPage = pagination.current;

        const isLastItemOnPage =
          divisions.length === 1 &&
          currentPage > 1;

        const nextPage = isLastItemOnPage
          ? currentPage - 1
          : currentPage;

        getDivisions(
          nextPage,
          pagination.pageSize,
          searchName,
          selectedStateId
        );
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to delete division."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to delete division. Please try again."
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
    setSelectedDivision(null);

    getDivisions(
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
    setSelectedDivision(null);
  };

  // =========================
  // Table Pagination
  // =========================
  const handleTableChange = (tablePagination) => {
    getDivisions(
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
      title: "Division Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.districtName}>
          {name}
        </span>
      ),
    },
    {
      title: "Division Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span className={styles.code}>
          {code}
        </span>
      ),
    },
    {
      title: "HQ District",
      key: "hqDistrict",
      render: (_, record) => (
        <span>
          {record?.hqDistrictId?.name || "-"}
        </span>
      ),
    },
    {
      title: "State",
      key: "state",
      render: (_, record) => (
        <span>
          {record?.stateId?.name ||
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
              handleEditDivision(record)
            }
            aria-label="Edit division"
          />

          <Popconfirm
            title="Delete Division"
            description="Are you sure you want to delete this division?"
            okText="Yes"
            cancelText="No"
            onConfirm={() =>
              handleDeleteDivision(record)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Delete division"
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
            Divisions
          </h1>

          <p className={styles.subtitle}>
            Manage divisions and their districts.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddDivision}
        >
          Add Division
        </Button>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.filterArea}>
            <Input
              allowClear
              placeholder="Search division"
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
          dataSource={divisions}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} divisions`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
        />
      </div>

      {/* Division Modal */}
      <DivisionModal
        open={modalOpen}
        divisionData={selectedDivision}
        states={states}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default Division;