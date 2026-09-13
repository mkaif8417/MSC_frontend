import { useEffect, useState } from "react";
import {
    Button,
    Input,
    Modal,
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
import ZoneModal from "./ZoneModal";
import styles from "./Zone.module.css";

function Zone() {
    const [messageApi, contextHolder] = message.useMessage();

    const [zones, setZones] = useState([]);
    const [states, setStates] = useState([]);

    const [loading, setLoading] = useState(false);
    const [statesLoading, setStatesLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [stateId, setStateId] = useState(undefined);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);

    const loadStates = async () => {
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
            }
        } catch (error) {
            messageApi.error(
                error?.message ||
                "Unable to load states. Please try again."
            );
        } finally {
            setStatesLoading(false);
        }
    };

    const loadZones = async (
        page = pagination.current,
        pageSize = pagination.pageSize
    ) => {
        try {
            setLoading(true);

            const params = {
                page,
                limit: pageSize,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (stateId) {
                params.stateId = stateId;
            }

            const response = await axiosInstance.get(
                "/locations/zones",
                { params }
            );

            if (response?.data?.success) {
                setZones(response?.data?.data || []);

                const paginationData =
                    response?.data?.pagination;

                setPagination({
                    current: paginationData?.page || page,
                    pageSize: paginationData?.limit || pageSize,
                    total: paginationData?.total || 0,
                });
            }
        } catch (error) {
            messageApi.error(
                error?.message ||
                "Unable to load zones. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStates();
    }, []);

    useEffect(() => {
        loadZones(1, pagination.pageSize);
    }, [stateId]);

    const handleSearch = () => {
        loadZones(1, pagination.pageSize);
    };

    const handleReset = () => {
        setSearch("");
        setStateId(undefined);
        loadZones(1, pagination.pageSize);
    };

    const handleTableChange = (tablePagination) => {
        loadZones(
            tablePagination.current,
            tablePagination.pageSize
        );
    };

    const handleAdd = () => {
        setSelectedZone(null);
        setModalOpen(true);
    };

    const handleEdit = (record) => {
        setSelectedZone(record);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            const response = await axiosInstance.delete(
                `/locations/zones/${id}`
            );

            if (response?.data?.success) {
                messageApi.success(
                    response?.data?.message ||
                    "Zone deleted successfully."
                );

                const isLastItem =
                    zones.length === 1 &&
                    pagination.current > 1;

                loadZones(
                    isLastItem
                        ? pagination.current - 1
                        : pagination.current,
                    pagination.pageSize
                );
            }
        } catch (error) {
            messageApi.error(
                error?.message ||
                "Unable to delete zone. Please try again."
            );
        }
    };

    const columns = [
        {
            title: "Zone Name",
            dataIndex: "name",
            key: "name",
            render: (name) => (
                <span className={styles.zoneName}>
                    {name}
                </span>
            ),
        },
        {
            title: "Code",
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
            render: (_, record) =>
                record?.state?.name ||
                record?.stateName ||
                "-",
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
            render: (date) =>
                date
                    ? new Date(date).toLocaleDateString()
                    : "-",
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />

                    <Popconfirm
                        title="Are you sure you want to delete this zone?"
                        onConfirm={() =>
                            handleDelete(record._id)
                        }
                        okText="Yes"
                        cancelText="No"
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
                        <h2 className={styles.title}>
                            Zone Management
                        </h2>

                        <p className={styles.subtitle}>
                            Manage zones under each state.
                        </p>
                    </div>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        Add Zone
                    </Button>
                </div>

                <div className={styles.tableCard}>
                    <div className={styles.tableToolbar}>
                        <div className={styles.filterArea}>
                            <Input
                                className={styles.searchInput}
                                placeholder="Search zone name or code"
                                prefix={<SearchOutlined />}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onPressEnter={handleSearch}
                                allowClear
                            />

                            <Select
                                className={styles.stateSelect}
                                placeholder="Select state"
                                value={stateId}
                                onChange={setStateId}
                                allowClear
                                showSearch
                                loading={statesLoading}
                                optionFilterProp="label"
                                options={states.map((state) => ({
                                    value: state._id,
                                    label: state.name,
                                }))}
                            />

                            <Button onClick={handleSearch}>
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
                        dataSource={zones}
                        loading={loading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showTotal: (total) =>
                                `Total ${total} zones`,
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 800 }}
                    />
                </div>
            </div>

            <ZoneModal
                open={modalOpen}
                zoneData={selectedZone}
                states={states}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    loadZones(
                        pagination.current,
                        pagination.pageSize
                    );
                }}
            />
        </>
    );
}

export default Zone;