// import { useEffect, useMemo, useState } from "react";
// import {
//   Button,
//   Input,
//   Popconfirm,
//   Select,
//   Space,
//   Table,
//   Tag,
//   message,
// } from "antd";
// import {
//   DeleteOutlined,
//   EditOutlined,
//   PlusOutlined,
//   ReloadOutlined,
//   SearchOutlined,
// } from "@ant-design/icons";

// import axiosInstance from "../../../services/AxiosInstance";
// import MosqueModal from "./MosqueModal";
// import styles from "./Mosque.module.css";

// const idOf = (value) => value?._id || value || undefined;

// function Mosque() {
//   const [mosques, setMosques] = useState([]);
//   const [areaLocalities, setAreaLocalities] = useState([]);

//   const areaLocalityNameById = useMemo(() => {
//     const map = new Map();
//     areaLocalities.forEach((al) => map.set(al._id, al.name));
//     return map;
//   }, [areaLocalities]);

//   const [loading, setLoading] = useState(false);
//   const [areaLocalitiesLoading, setAreaLocalitiesLoading] =
//     useState(false);

//   const [search, setSearch] = useState("");
//   const [areaLocalityId, setAreaLocalityId] = useState(undefined);

//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });

//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedMosque, setSelectedMosque] = useState(null);

//   const [messageApi, contextHolder] = message.useMessage();

//   const loadAreaLocalities = async () => {
//     try {
//       setAreaLocalitiesLoading(true);

//       const response = await axiosInstance.get(
//         "/locations/areas-localities",
//         {
//           params: {
//             page: 1,
//             limit: 1000,
//             isActive: true,
//           },
//         }
//       );

//       if (response?.data?.success) {
//         const activeAreaLocalities = (
//           response?.data?.data || []
//         ).filter(
//           (areaLocality) => areaLocality.isActive === true
//         );

//         setAreaLocalities(activeAreaLocalities);
//       }
//     } catch (error) {
//       messageApi.error(
//         error?.message ||
//           "Unable to load Area/Locality records."
//       );
//     } finally {
//       setAreaLocalitiesLoading(false);
//     }
//   };

//   const loadMosques = async (
//     page = pagination.current,
//     pageSize = pagination.pageSize
//   ) => {
//     try {
//       setLoading(true);

//       const params = {
//         page,
//         limit: pageSize,
//         isActive: true,
//       };

//       if (search.trim()) {
//         params.search = search.trim();
//       }

//       if (areaLocalityId) {
//         params.areaLocalityId = areaLocalityId;
//       }

//       const response = await axiosInstance.get(
//         "/locations/mosques",
//         { params }
//       );

//       if (response?.data?.success) {
//         const activeMosques = (
//           response?.data?.data || []
//         ).filter(
//           (mosque) => mosque.isActive === true
//         );

//         setMosques(activeMosques);

//         setPagination({
//           current:
//             response?.data?.pagination?.page || page,
//           pageSize:
//             response?.data?.pagination?.limit || pageSize,
//           total:
//             response?.data?.pagination?.total ||
//             activeMosques.length,
//         });
//       }
//     } catch (error) {
//       messageApi.error(
//         error?.message ||
//           "Unable to load mosques."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadAreaLocalities();
//   }, []);

//   useEffect(() => {
//     loadMosques(1, pagination.pageSize);
//   }, [areaLocalityId]);

//   const handleSearch = () => {
//     loadMosques(1, pagination.pageSize);
//   };

//   const handleReset = () => {
//     setSearch("");
//     setAreaLocalityId(undefined);
//     loadMosques(1, pagination.pageSize);
//   };

//   const handleTableChange = (tablePagination) => {
//     loadMosques(
//       tablePagination.current,
//       tablePagination.pageSize
//     );
//   };

//   const handleAdd = () => {
//     setSelectedMosque(null);
//     setModalOpen(true);
//   };

//   const handleEdit = (mosque) => {
//     setSelectedMosque(mosque);
//     setModalOpen(true);
//   };

//   const handleDelete = async (mosque) => {
//     try {
//       setLoading(true);

//       const response = await axiosInstance.delete(
//         `/locations/mosques/${mosque._id}`
//       );

//       if (response?.data?.success) {
//         messageApi.success(
//           response?.data?.message ||
//             "Mosque deactivated successfully."
//         );

//         const currentPage = pagination.current;

//         await loadMosques(
//           mosques.length === 1 && currentPage > 1
//             ? currentPage - 1
//             : currentPage,
//           pagination.pageSize
//         );
//       } else {
//         messageApi.error(
//           response?.data?.message ||
//             "Unable to deactivate mosque."
//         );
//       }
//     } catch (error) {
//       messageApi.error(
//         error?.message ||
//           "Unable to deactivate mosque."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const columns = [
//     {
//       title: "Mosque Name",
//       dataIndex: "name",
//       key: "name",
//       render: (name) => (
//         <span className={styles.mosqueName}>
//           {name || "-"}
//         </span>
//       ),
//     },
//     {
//       title: "Mosque Code",
//       dataIndex: "code",
//       key: "code",
//       render: (code) => (
//         <span className={styles.code}>
//           {code || "-"}
//         </span>
//       ),
//     },
//     {
//       title: "Address",
//       dataIndex: "address",
//       key: "address",
//       ellipsis: true,
//     },
//     {
//       title: "Area / Locality",
//       key: "areaLocality",
//       render: (_, record) =>
//         record?.areaLocality?.name ||
//         record?.areaLocalityName ||
//         areaLocalityNameById.get(idOf(record?.areaLocalityId)) ||
//         "-",
//     },
//     {
//       title: "Pincode",
//       dataIndex: "pincode",
//       key: "pincode",
//     },
//     {
//       title: "Contact",
//       dataIndex: "contactNumber",
//       key: "contactNumber",
//       render: (contactNumber) =>
//         contactNumber || "-",
//     },
//     {
//       title: "Status",
//       dataIndex: "isActive",
//       key: "isActive",
//       render: (isActive) => (
//         <Tag color={isActive ? "green" : "default"}>
//           {isActive ? "Active" : "Inactive"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Created",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       render: (createdAt) =>
//         createdAt
//           ? new Date(createdAt).toLocaleDateString()
//           : "-",
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 120,
//       render: (_, record) => (
//         <Space>
//           <Button
//             type="text"
//             icon={<EditOutlined />}
//             onClick={() => handleEdit(record)}
//           />

//           <Popconfirm
//             title="Are you sure you want to delete this mosque?"
//             onConfirm={() => handleDelete(record)}
//             okText="Yes"
//             cancelText="No"
//           >
//             <Button
//               type="text"
//               danger
//               icon={<DeleteOutlined />}
//             />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <>
//       {contextHolder}

//       <div className={styles.page}>
//         <div className={styles.pageHeader}>
//           <div>
//             <h1 className={styles.title}>
//               Mosque Management
//             </h1>

//             <p className={styles.subtitle}>
//               Manage registered mosques
//             </p>
//           </div>

//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={handleAdd}
//           >
//             Add Mosque
//           </Button>
//         </div>

//         <div className={styles.tableCard}>
//           <div className={styles.tableToolbar}>
//             <div className={styles.filterArea}>
//               <Input
//                 className={styles.searchInput}
//                 placeholder="Search mosque name or address"
//                 prefix={<SearchOutlined />}
//                 value={search}
//                 onChange={(event) =>
//                   setSearch(event.target.value)
//                 }
//                 onPressEnter={handleSearch}
//                 allowClear
//               />

//               <Select
//                 className={styles.areaLocalitySelect}
//                 placeholder="Select Area / Locality"
//                 value={areaLocalityId}
//                 onChange={setAreaLocalityId}
//                 loading={areaLocalitiesLoading}
//                 showSearch
//                 allowClear
//                 optionFilterProp="label"
//                 options={areaLocalities.map(
//                   (areaLocality) => ({
//                     value: areaLocality._id,
//                     label: areaLocality.name,
//                   })
//                 )}
//               />

//               <Button
//                 type="primary"
//                 icon={<SearchOutlined />}
//                 onClick={handleSearch}
//               >
//                 Search
//               </Button>

//               <Button
//                 icon={<ReloadOutlined />}
//                 onClick={handleReset}
//               >
//                 Reset
//               </Button>
//             </div>
//           </div>

//           <Table
//             rowKey="_id"
//             columns={columns}
//             dataSource={mosques}
//             loading={loading}
//             pagination={pagination}
//             onChange={handleTableChange}
//             scroll={{ x: 1000 }}
//           />
//         </div>

//         <MosqueModal
//           open={modalOpen}
//           mosqueData={selectedMosque}
//           areaLocalities={areaLocalities}
//           onClose={() => {
//             setModalOpen(false);
//             setSelectedMosque(null);
//           }}
//           onSuccess={() => {
//             setModalOpen(false);
//             setSelectedMosque(null);
//             loadMosques(
//               pagination.current,
//               pagination.pageSize
//             );
//           }}
//         />
//       </div>
//     </>
//   );
// }

// export default Mosque;


import { useEffect, useMemo, useState } from "react";
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
  EnvironmentOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import axiosInstance from "../../../services/AxiosInstance";
import MosqueModal from "./MosqueModal";
import styles from "./Mosque.module.css";

const idOf = (value) => value?._id || value || undefined;

function Mosque() {
  const [mosques, setMosques] = useState([]);
  const [areaLocalities, setAreaLocalities] = useState([]);

  const areaLocalityNameById = useMemo(() => {
    const map = new Map();
    areaLocalities.forEach((al) => map.set(al._id, al.name));
    return map;
  }, [areaLocalities]);

  const [loading, setLoading] = useState(false);
  const [areaLocalitiesLoading, setAreaLocalitiesLoading] =
    useState(false);

  const [search, setSearch] = useState("");
  const [areaLocalityId, setAreaLocalityId] = useState(undefined);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();

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
        const activeAreaLocalities = (
          response?.data?.data || []
        ).filter(
          (areaLocality) => areaLocality.isActive === true
        );

        setAreaLocalities(activeAreaLocalities);
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to load Area/Locality records."
      );
    } finally {
      setAreaLocalitiesLoading(false);
    }
  };

  const loadMosques = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pageSize,
        isActive: true,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (areaLocalityId) {
        params.areaLocalityId = areaLocalityId;
      }

      const response = await axiosInstance.get(
        "/locations/mosques",
        { params }
      );

      if (response?.data?.success) {
        const activeMosques = (
          response?.data?.data || []
        ).filter(
          (mosque) => mosque.isActive === true
        );

        setMosques(activeMosques);

        setPagination({
          current:
            response?.data?.pagination?.page || page,
          pageSize:
            response?.data?.pagination?.limit || pageSize,
          total:
            response?.data?.pagination?.total ||
            activeMosques.length,
        });
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to load mosques."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreaLocalities();
  }, []);

  useEffect(() => {
    loadMosques(1, pagination.pageSize);
  }, [areaLocalityId]);

  const handleSearch = () => {
    loadMosques(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSearch("");
    setAreaLocalityId(undefined);
    loadMosques(1, pagination.pageSize);
  };

  const handleTableChange = (tablePagination) => {
    loadMosques(
      tablePagination.current,
      tablePagination.pageSize
    );
  };

  const handleAdd = () => {
    setSelectedMosque(null);
    setModalOpen(true);
  };

  const handleEdit = (mosque) => {
    setSelectedMosque(mosque);
    setModalOpen(true);
  };

  const handleDelete = async (mosque) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(
        `/locations/mosques/${mosque._id}`
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            "Mosque deactivated successfully."
        );

        const currentPage = pagination.current;

        await loadMosques(
          mosques.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage,
          pagination.pageSize
        );
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to deactivate mosque."
        );
      }
    } catch (error) {
      messageApi.error(
        error?.message ||
          "Unable to deactivate mosque."
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Mosque Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className={styles.mosqueName}>
          {name || "-"}
        </span>
      ),
    },
    {
      title: "Mosque Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span className={styles.code}>
          {code || "-"}
        </span>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Area / Locality",
      key: "areaLocality",
      render: (_, record) =>
        record?.areaLocality?.name ||
        record?.areaLocalityName ||
        areaLocalityNameById.get(idOf(record?.areaLocalityId)) ||
        "-",
    },
    {
      title: "Pincode",
      dataIndex: "pincode",
      key: "pincode",
    },
    {
      title: "Location",
      key: "googleMapsUrl",
      render: (_, record) =>
        record?.googleMapsUrl ? (
          <a
            href={record.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#0f5c4d",
              fontWeight: 500,
            }}
          >
            <EnvironmentOutlined />
            View on map
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Contact",
      dataIndex: "contactNumber",
      key: "contactNumber",
      render: (contactNumber) =>
        contactNumber || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "default"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) =>
        createdAt
          ? new Date(createdAt).toLocaleDateString()
          : "-",
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
            title="Are you sure you want to delete this mosque?"
            onConfirm={() => handleDelete(record)}
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
            <h1 className={styles.title}>
              Mosque Management
            </h1>

            <p className={styles.subtitle}>
              Manage registered mosques
            </p>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Mosque
          </Button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <div className={styles.filterArea}>
              <Input
                className={styles.searchInput}
                placeholder="Search mosque name or address"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onPressEnter={handleSearch}
                allowClear
              />

              <Select
                className={styles.areaLocalitySelect}
                placeholder="Select Area / Locality"
                value={areaLocalityId}
                onChange={setAreaLocalityId}
                loading={areaLocalitiesLoading}
                showSearch
                allowClear
                optionFilterProp="label"
                options={areaLocalities.map(
                  (areaLocality) => ({
                    value: areaLocality._id,
                    label: areaLocality.name,
                  })
                )}
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
            dataSource={mosques}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </div>

        <MosqueModal
          open={modalOpen}
          mosqueData={selectedMosque}
          areaLocalities={areaLocalities}
          onClose={() => {
            setModalOpen(false);
            setSelectedMosque(null);
          }}
          onSuccess={() => {
            setModalOpen(false);
            setSelectedMosque(null);
            loadMosques(
              pagination.current,
              pagination.pageSize
            );
          }}
        />
      </div>
    </>
  );
}

export default Mosque;
