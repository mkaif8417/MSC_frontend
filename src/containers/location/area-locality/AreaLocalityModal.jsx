import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";

import axiosInstance from "../../../services/AxiosInstance";
import styles from "./AreaLocalityModal.module.css";

// Handles fields that may come back either as a raw ObjectId string
// or as a populated object (e.g. { _id, name }).
const idOf = (value) => value?._id || value || undefined;

function AreaLocalityModal({
  open,
  areaLocalityData,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] =
    message.useMessage();

  const [loading, setLoading] = useState(false);

  // Full lists for each location level, loaded once per modal open.
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villageCities, setVillageCities] = useState([]);
  const [locationListsLoading, setLocationListsLoading] = useState(false);

  // Cascade selections — these are NOT submitted directly, they only
  // exist to narrow down the final "Village / City" field.
  const [selectedStateId, setSelectedStateId] = useState(undefined);
  const [selectedDivisionId, setSelectedDivisionId] = useState(undefined);
  const [selectedDistrictId, setSelectedDistrictId] = useState(undefined);
  const [selectedTalukaId, setSelectedTalukaId] = useState(undefined);

  const isEditMode = Boolean(
    areaLocalityData?._id
  );

  // =========================
  // Load all location lists whenever the modal opens
  // =========================
  useEffect(() => {
    if (!open) return;

    const loadLocationLists = async () => {
      try {
        setLocationListsLoading(true);

        const commonParams = { page: 1, limit: 1000, isActive: true };

        const results = await Promise.allSettled([
          axiosInstance.get("/locations/states", { params: commonParams }),
          axiosInstance.get("/locations/divisions", { params: commonParams }),
          axiosInstance.get("/locations/districts", { params: commonParams }),
          axiosInstance.get("/locations/talukas", { params: commonParams }),
          axiosInstance.get("/locations/villages-cities", { params: commonParams }),
        ]);

        const [
          statesRes,
          divisionsRes,
          districtsRes,
          talukasRes,
          villageCitiesRes,
        ] = results;

        const extractArray = (result) => {
          if (result.status !== "fulfilled") return [];
          const payload = result.value?.data?.data;
          return Array.isArray(payload) ? payload : [];
        };

        setStates(extractArray(statesRes));
        setDivisions(extractArray(divisionsRes));
        setDistricts(extractArray(districtsRes));
        setTalukas(extractArray(talukasRes));
        setVillageCities(extractArray(villageCitiesRes));

        const failedCount = results.filter(
          (r) => r.status === "rejected"
        ).length;

        if (failedCount > 0) {
          messageApi.error(`Unable to load ${failedCount} location list(s).`);
        }
      } catch (error) {
        messageApi.error("Unable to load location lists.");
      } finally {
        setLocationListsLoading(false);
      }
    };

    loadLocationLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // =========================
  // Populate form + reconstruct the cascade when editing
  // =========================
  useEffect(() => {
    if (!open) return;

    if (areaLocalityData) {
      const villageCityId =
        idOf(areaLocalityData.villageCityId) ||
        idOf(areaLocalityData.villageCity);

      form.setFieldsValue({
        villageCityId,
        name: areaLocalityData.name || "",
        code: areaLocalityData.code || "",
        pincode: areaLocalityData.pincode || "",
      });

      // Walk the chain backwards using the already-loaded lists.
      if (
        villageCityId &&
        villageCities.length &&
        talukas.length &&
        districts.length
      ) {
        const villageCity = villageCities.find(
          (vc) => vc._id === villageCityId
        );
        const talukaId = idOf(villageCity?.talukaId);

        const taluka = talukas.find((t) => t._id === talukaId);
        const districtId = idOf(taluka?.districtId);

        const district = districts.find((d) => d._id === districtId);
        const divisionId = idOf(district?.divisionId);
        const stateId = idOf(district?.stateId);

        setSelectedStateId(stateId);
        setSelectedDivisionId(divisionId);
        setSelectedDistrictId(districtId);
        setSelectedTalukaId(talukaId);
      }
    } else {
      form.resetFields();

      setSelectedStateId(undefined);
      setSelectedDivisionId(undefined);
      setSelectedDistrictId(undefined);
      setSelectedTalukaId(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, areaLocalityData, form, villageCities, talukas, districts]);

  // =========================
  // Cascade filtering (client-side, based on parent selection)
  // =========================
  const filteredDivisions = useMemo(
    () => divisions.filter((d) => idOf(d.stateId) === selectedStateId),
    [divisions, selectedStateId]
  );

  const filteredDistricts = useMemo(
    () => districts.filter((d) => idOf(d.divisionId) === selectedDivisionId),
    [districts, selectedDivisionId]
  );

  const filteredTalukas = useMemo(
    () => talukas.filter((t) => idOf(t.districtId) === selectedDistrictId),
    [talukas, selectedDistrictId]
  );

  const filteredVillageCities = useMemo(
    () => villageCities.filter((vc) => idOf(vc.talukaId) === selectedTalukaId),
    [villageCities, selectedTalukaId]
  );

  // =========================
  // Cascade change handlers — each clears everything below it
  // =========================
  const handleStateChange = (value) => {
    setSelectedStateId(value);
    setSelectedDivisionId(undefined);
    setSelectedDistrictId(undefined);
    setSelectedTalukaId(undefined);
    form.setFieldsValue({ villageCityId: undefined });
  };

  const handleDivisionChange = (value) => {
    setSelectedDivisionId(value);
    setSelectedDistrictId(undefined);
    setSelectedTalukaId(undefined);
    form.setFieldsValue({ villageCityId: undefined });
  };

  const handleDistrictChange = (value) => {
    setSelectedDistrictId(value);
    setSelectedTalukaId(undefined);
    form.setFieldsValue({ villageCityId: undefined });
  };

  const handleTalukaChange = (value) => {
    setSelectedTalukaId(value);
    form.setFieldsValue({ villageCityId: undefined });
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        villageCityId: values.villageCityId,
        pincode: values.pincode?.trim() || "",
      };

      let response;

      if (isEditMode) {
        response = await axiosInstance.patch(
          `/locations/areas-localities/${areaLocalityData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          "/locations/areas-localities",
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEditMode
              ? "Area/Locality updated successfully."
              : "Area/Locality created successfully.")
        );

        form.resetFields();
        handleClose();
        onSuccess?.();
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to save area/locality."
        );
      }
    } catch (error) {
      if (
        error?.code ===
        "DUPLICATE_RESOURCE"
      ) {
        messageApi.error(
          error?.message ||
            "A record with this identifier already exists."
        );
      } else if (
        error?.code === "VALIDATION_ERROR"
      ) {
        messageApi.error(
          error?.message ||
            "Please check the entered information."
        );
      } else if (
        error?.code === "NOT_FOUND"
      ) {
        messageApi.error(
          error?.message ||
            "Area/Locality was not found."
        );
      } else {
        messageApi.error(
          error?.message ||
            "Unable to save area/locality. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStateId(undefined);
    setSelectedDivisionId(undefined);
    setSelectedDistrictId(undefined);
    setSelectedTalukaId(undefined);
    onClose();
  };

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={
          isEditMode
            ? "Edit Area / Locality"
            : "Add Area / Locality"
        }
        centered
        destroyOnHidden
        onCancel={handleClose}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className={styles.form}
        >
          {/* ===== Location cascade: State -> Division -> District -> Taluka -> Village/City ===== */}
          <Form.Item label="State">
            <Select
              placeholder="Select state"
              size="large"
              showSearch
              allowClear
              loading={locationListsLoading}
              optionFilterProp="label"
              value={selectedStateId}
              onChange={handleStateChange}
              options={states.map((state) => ({
                value: state._id,
                label: state.name,
              }))}
            />
          </Form.Item>

          <Form.Item label="Division">
            <Select
              placeholder={
                selectedStateId ? "Select division" : "Select a state first"
              }
              size="large"
              showSearch
              allowClear
              disabled={!selectedStateId}
              optionFilterProp="label"
              value={selectedDivisionId}
              onChange={handleDivisionChange}
              options={filteredDivisions.map((division) => ({
                value: division._id,
                label: division.name,
              }))}
            />
          </Form.Item>

          <Form.Item label="District">
            <Select
              placeholder={
                selectedDivisionId
                  ? "Select district"
                  : "Select a division first"
              }
              size="large"
              showSearch
              allowClear
              disabled={!selectedDivisionId}
              optionFilterProp="label"
              value={selectedDistrictId}
              onChange={handleDistrictChange}
              options={filteredDistricts.map((district) => ({
                value: district._id,
                label: district.name,
              }))}
            />
          </Form.Item>

          <Form.Item label="Taluka">
            <Select
              placeholder={
                selectedDistrictId
                  ? "Select taluka"
                  : "Select a district first"
              }
              size="large"
              showSearch
              allowClear
              disabled={!selectedDistrictId}
              optionFilterProp="label"
              value={selectedTalukaId}
              onChange={handleTalukaChange}
              options={filteredTalukas.map((taluka) => ({
                value: taluka._id,
                label: taluka.name,
              }))}
            />
          </Form.Item>

          {/* Village/City is the actual field submitted */}
          <Form.Item
            label="Village / City"
            name="villageCityId"
            rules={[
              {
                required: true,
                message:
                  "Please select village/city.",
              },
            ]}
          >
            <Select
              placeholder={
                selectedTalukaId
                  ? "Select village/city"
                  : "Select a taluka first"
              }
              size="large"
              showSearch
              allowClear
              disabled={!selectedTalukaId}
              optionFilterProp="label"
              options={filteredVillageCities.map(
                (villageCity) => ({
                  value: villageCity._id,
                  label: villageCity.villageCityName,
                })
              )}
            />
          </Form.Item>
          {/* ===== End location cascade ===== */}

          <Form.Item
            label="Area / Locality Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Please enter area/locality name.",
              },
              {
                min: 2,
                message:
                  "Area/locality name must be at least 2 characters.",
              },
              {
                max: 100,
                message:
                  "Area/locality name cannot exceed 100 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter area/locality name"
              maxLength={100}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Area / Locality Code"
            name="code"
            rules={[
              {
                required: true,
                message:
                  "Please enter area/locality code.",
              },
              {
                min: 2,
                message:
                  "Area/locality code must be at least 2 characters.",
              },
              {
                max: 10,
                message:
                  "Area/locality code cannot exceed 10 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter area/locality code"
              maxLength={10}
              size="large"
              onChange={(event) =>
                form.setFieldValue(
                  "code",
                  event.target.value.toUpperCase()
                )
              }
            />
          </Form.Item>

          <Form.Item
            label="Pincode"
            name="pincode"
            rules={[
              {
                pattern: /^\d{6}$/,
                message:
                  "Please enter a valid 6-digit pincode.",
              },
            ]}
          >
            <Input
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              size="large"
              inputMode="numeric"
            />
          </Form.Item>

          <div className={styles.footer}>
            <Button
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {isEditMode
                ? "Update Area / Locality"
                : "Create Area / Locality"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default AreaLocalityModal;