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
import RegionModal from "./RegionModal";
import styles from "./Region.module.css";

function Region() {
  const [messageApi, contextHolder] = message.useMessage();

  const [regions, setRegions] = useState([]);
  const [divisions, setDivisions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [divisionsLoading, setDivisionsLoading] =
    useState(false);

  const [searchName, setSearchName] = useState("");
  const [selectedDivisionId, setSelectedDivisionId] =
    useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] =
    useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // =========================
  // Get Active Divisions
  // =========================
  const getDivisions = async () => {
    try {
      setDivisionsLoading(true);

      const response = await axiosInstance.get(
        "/locations/divisions",
        {
          params: {
            page: 1,
            limit: 1000,
            isActive: true,
          },
        }
      );

      if (response?.data?.success) {
        setDivisions(response?.data?.data || []);
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
      setDivisionsLoading(false);
    }
  };

  // =========================
  // Get Regions
  // =========================
  const getRegions = async (
    page = pagination.current,
    limit = pagination.pageSize,
    name = searchName,
    divisionId = selectedDivisionId
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
        isActive: true,
      };

      if (name?.trim()) {
        params.search = name.trim();
      }

      if (divisionId) {
        params.divisionId = divisionId;
      }

      const response = await axiosInstance.get(
        "/locations/regions",
        {
          params,
        }
      );

      if (response?.data?.success) {
        setRegions(response?.data?.data || []);

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
            "Unable to fetch regions."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch regions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Initial Load
  // =========================
  useEffect(() => {
    getDivisions();
    getRegions(
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
    getRegions(
      1,
      pagination.pageSize,
      searchName,
      selectedDivisionId
    );
  };

  // =========================
  // Reset
  // =========================
  const handleReset = () => {
    setSearchName("");
    setSelectedDivisionId(undefined);

    getRegions(
      1,
      pagination.pageSize,
      "",
      undefined
    );
  };

  // =========================
  // Division Filter
  // =========================
  const handleDivisionChange = (value) => {
    setSelectedDivisionId(value);

    getRegions(
      1,
      pagination.pageSize,
      searchName,
      value
    );
  };

  // =========================
  // Add Region
  // =========================
  const handleAddRegion = () => {
    setSelectedRegion(null);
    setModalOpen(true);
  };

  // =========================
  // Edit Region
  // =========================
  const handleEditRegion = (record) => {
    setSelectedRegion(record);
    setModalOpen(true);
  };

  // =========================
  // Delete Region
  // =========================
  const handleDeleteRegion = async (record) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/locations/regions/${record._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            "Region deleted successfully."
        );

        const currentPage = pagination.current;

        const isLastItemOnPage =
          regions.length === 1 &&
          currentPage > 1;

        const nextPage = isLastItemOnPage
          ? currentPage - 1
          : currentPage;

        getRegions(
          nextPage,
          pagination.pageSize,
          searchName,
          selectedDivisionId
        );
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to delete region."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to delete region. Please try again."
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
    setSelectedRegion(null);

    getRegions(
      pagination.current,
      pagination.pageSize,
      searchName,
      selectedDivisionId
    );
  };

  // =========================
  // Modal Close
  // =========================
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRegion(null);
  };

  // =========================
  // Table Change
  // =========================
  const handleTableChange = (tablePagination) => {
    getRegions(
      tablePagination.current,
      tablePagination.pageSize,
      searchName,
      selectedDivisionId
    );
  };

  // =========================
  // Table Columns
  // =========================
  const columns = [
    {
      title: "Region Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.regionName}>
          {name}
        </span>
      ),
    },
    {
      title: "Region Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span className={styles.code}>
          {code}
        </span>
      ),
    },
    {
      title: "Division",
      key: "division",
      render: (_, record) => (
        <span>
          {record?.divisionId?.name ||
            record?.divisionName ||
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
              handleEditRegion(record)
            }
            aria-label="Edit region"
          />

          <Popconfirm
            title="Delete Region"
            description="Are you sure you want to delete this region?"
            okText="Yes"
            cancelText="No"
            onConfirm={() =>
              handleDeleteRegion(record)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Delete region"
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
            Regions
          </h1>

          <p className={styles.subtitle}>
            Manage regions under each division.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddRegion}
        >
          Add Region
        </Button>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.filterArea}>
            <Input
              allowClear
              placeholder="Search region"
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
              placeholder="Select division"
              value={selectedDivisionId}
              loading={divisionsLoading}
              optionFilterProp="label"
              options={divisions.map(
                (division) => ({
                  value: division._id,
                  label: division.name,
                })
              )}
              onChange={handleDivisionChange}
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
          dataSource={regions}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} regions`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Modal */}
      <RegionModal
        open={modalOpen}
        regionData={selectedRegion}
        divisions={divisions}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default Region;