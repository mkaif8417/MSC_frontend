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
import AreaLocalityModal from "./AreaLocalityModal";
import styles from "./AreaLocality.module.css";

function AreaLocality() {
  const [messageApi, contextHolder] = message.useMessage();

  const [areasLocalities, setAreasLocalities] = useState([]);
  const [villageCities, setVillageCities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [villageCitiesLoading, setVillageCitiesLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [selectedVillageCityId, setSelectedVillageCityId] =
    useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAreaLocality, setSelectedAreaLocality] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const getVillageCities = async () => {
    try {
      setVillageCitiesLoading(true);

      const response = await axiosInstance.get(
        "/locations/villages-cities",
        {
          params: {
            page: 1,
            limit: 1000,
            isActive: true,
          },
        }
      );

      if (response?.data?.success) {
        setVillageCities(response?.data?.data || []);
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to fetch villages/cities."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch villages/cities. Please try again."
      );
    } finally {
      setVillageCitiesLoading(false);
    }
  };

  const getAreasLocalities = async (
    page = pagination.current,
    limit = pagination.pageSize,
    name = searchName,
    villageCityId = selectedVillageCityId
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

      if (villageCityId) {
        params.villageCityId = villageCityId;
      }

      const response = await axiosInstance.get(
        "/locations/areas-localities",
        {
          params,
        }
      );

      if (response?.data?.success) {
        setAreasLocalities(response?.data?.data || []);

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
            "Unable to fetch areas/localities."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to fetch areas/localities. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getVillageCities();
    getAreasLocalities(
      1,
      pagination.pageSize,
      "",
      undefined
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    getAreasLocalities(
      1,
      pagination.pageSize,
      searchName,
      selectedVillageCityId
    );
  };

  const handleReset = () => {
    setSearchName("");
    setSelectedVillageCityId(undefined);

    getAreasLocalities(
      1,
      pagination.pageSize,
      "",
      undefined
    );
  };

  const handleVillageCityChange = (value) => {
    setSelectedVillageCityId(value);

    getAreasLocalities(
      1,
      pagination.pageSize,
      searchName,
      value
    );
  };

  const handleAddAreaLocality = () => {
    setSelectedAreaLocality(null);
    setModalOpen(true);
  };

  const handleEditAreaLocality = (record) => {
    setSelectedAreaLocality(record);
    setModalOpen(true);
  };

  const handleDeleteAreaLocality = async (record) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/locations/areas-localities/${record._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            "Area/Locality deleted successfully."
        );

        const currentPage = pagination.current;

        const isLastItemOnPage =
          areasLocalities.length === 1 &&
          currentPage > 1;

        const nextPage = isLastItemOnPage
          ? currentPage - 1
          : currentPage;

        getAreasLocalities(
          nextPage,
          pagination.pageSize,
          searchName,
          selectedVillageCityId
        );
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to delete area/locality."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to delete area/locality. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setSelectedAreaLocality(null);

    getAreasLocalities(
      pagination.current,
      pagination.pageSize,
      searchName,
      selectedVillageCityId
    );
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAreaLocality(null);
  };

  const handleTableChange = (tablePagination) => {
    getAreasLocalities(
      tablePagination.current,
      tablePagination.pageSize,
      searchName,
      selectedVillageCityId
    );
  };

  const columns = [
    {
      title: "Area / Locality Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.areaName}>
          {name}
        </span>
      ),
    },
    {
      title: "Area / Locality Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span className={styles.code}>
          {code}
        </span>
      ),
    },
    {
      title: "Village / City",
      key: "villageCity",
      render: (_, record) => (
        <span>
          {record?.villageCity?.name ||
            record?.villageCityName ||
            "-"}
        </span>
      ),
    },
    {
      title: "Pincode",
      dataIndex: "pincode",
      key: "pincode",
      render: (pincode) => pincode || "-",
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
        if (!createdAt) return "-";

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
              handleEditAreaLocality(record)
            }
            aria-label="Edit area/locality"
          />

          <Popconfirm
            title="Delete Area / Locality"
            description="Are you sure you want to delete this area/locality?"
            okText="Yes"
            cancelText="No"
            onConfirm={() =>
              handleDeleteAreaLocality(record)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Delete area/locality"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {contextHolder}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>
            Areas / Localities
          </h1>

          <p className={styles.subtitle}>
            Manage areas and localities under each
            village or city.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddAreaLocality}
        >
          Add Area / Locality
        </Button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.filterArea}>
            <Input
              allowClear
              placeholder="Search area/locality"
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
              placeholder="Select village/city"
              value={selectedVillageCityId}
              loading={villageCitiesLoading}
              optionFilterProp="label"
              options={villageCities.map(
                (villageCity) => ({
                  value: villageCity._id,
                  label: villageCity.name,
                })
              )}
              onChange={handleVillageCityChange}
              className={styles.villageCitySelect}
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

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={areasLocalities}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} areas/localities`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 950 }}
        />
      </div>

      <AreaLocalityModal
        open={modalOpen}
        areaLocalityData={selectedAreaLocality}
        villageCities={villageCities}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default AreaLocality;