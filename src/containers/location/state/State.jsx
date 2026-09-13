import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Popconfirm,
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
import StateModal from "./StateModal";
import styles from "./State.module.css";

function State() {
  const [messageApi, contextHolder] = message.useMessage();

  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingState, setEditingState] = useState(null);

  const [searchText, setSearchText] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const getStates = async (
    page = pagination.current,
    limit = pagination.pageSize,
    search = searchText
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
        isActive: true,
      };

      if (search?.trim()) {
        params.name = search.trim();
      }

      const response = await axiosInstance.get(
        "/locations/states",
        { params }
      );

      if (response?.data?.success) {
        setStates(response?.data?.data || []);

        setPagination((previous) => ({
          ...previous,
          current:
            response?.data?.pagination?.page || page,
          pageSize:
            response?.data?.pagination?.limit || limit,
          total:
            response?.data?.pagination?.total || 0,
        }));
      } else {
        setStates([]);

        messageApi.error(
          response?.data?.message ||
            "Unable to fetch states."
        );
      }
    } catch (error) {
      setStates([]);

      messageApi.error(
        error?.message ||
          "Unable to fetch states. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStates(1, 10, "");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    getStates(
      1,
      pagination.pageSize,
      searchText
    );
  };

  const handleReset = () => {
    setSearchText("");

    getStates(
      1,
      pagination.pageSize,
      ""
    );
  };

  const handleTableChange = (
    tablePagination
  ) => {
    getStates(
      tablePagination.current,
      tablePagination.pageSize,
      searchText
    );
  };

  const handleAddState = () => {
    setEditingState(null);
    setModalOpen(true);
  };

  const handleEditState = (record) => {
    setEditingState(record);
    setModalOpen(true);
  };

  const handleDeleteState = async (record) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/locations/states/${record._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            "State deleted successfully."
        );

        const shouldGoToPreviousPage =
          states.length === 1 &&
          pagination.current > 1;

        await getStates(
          shouldGoToPreviousPage
            ? pagination.current - 1
            : pagination.current,
          pagination.pageSize,
          searchText
        );
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to delete state."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to delete state. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = async () => {
    setModalOpen(false);
    setEditingState(null);

    await getStates(
      editingState
        ? pagination.current
        : 1,
      pagination.pageSize,
      searchText
    );
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingState(null);
  };

  const columns = [
    {
      title: "S.No.",
      key: "serialNumber",
      width: 80,
      render: (_, __, index) =>
        (pagination.current - 1) *
          pagination.pageSize +
        index +
        1,
    },

    {
      title: "State Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) =>
        a.name.localeCompare(b.name),
    },

    {
      title: "State Code",
      dataIndex: "code",
      key: "code",
      width: 160,
      render: (code) => (
        <Tag color="blue">{code}</Tag>
      ),
    },

    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive) =>
        isActive ? (
          <Tag color="success">
            Active
          </Tag>
        ) : (
          <Tag color="default">
            Inactive
          </Tag>
        ),
    },

    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt) =>
        createdAt
          ? new Date(
              createdAt
            ).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
    },

    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() =>
              handleEditState(record)
            }
            title="Edit State"
          />

          <Popconfirm
            title="Delete State"
            description="Are you sure you want to delete this state?"
            okText="Yes"
            cancelText="No"
            onConfirm={() =>
              handleDeleteState(record)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Delete State"
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
          <h2 className={styles.title}>
            State Management
          </h2>

          <p className={styles.subtitle}>
            Manage states in the location hierarchy.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddState}
        >
          Add State
        </Button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.filterArea}>
            <Input
              allowClear
              value={searchText}
              placeholder="Search state by name"
              prefix={<SearchOutlined />}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              onPressEnter={handleSearch}
              className={styles.searchInput}
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
          dataSource={states}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} states`,
          }}
        />
      </div>

      <StateModal
        open={modalOpen}
        stateData={editingState}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default State;