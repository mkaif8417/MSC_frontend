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
import styles from "./VillageCityModal.module.css";

// Handles fields that may come back either as a raw ObjectId string
// or as a populated object (e.g. { _id, name }).
const idOf = (value) => value?._id || value || undefined;

function VillageCityModal({
  open,
  villageCityData,
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
  const [locationListsLoading, setLocationListsLoading] = useState(false);

  // Cascade selections — these are NOT submitted directly, they only
  // exist to narrow down the final "Taluka" field.
  const [selectedStateId, setSelectedStateId] = useState(undefined);
  const [selectedDivisionId, setSelectedDivisionId] = useState(undefined);
  const [selectedDistrictId, setSelectedDistrictId] = useState(undefined);

  const isEditMode = Boolean(
    villageCityData?._id
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
        ]);

        const [statesRes, divisionsRes, districtsRes, talukasRes] = results;

        const extractArray = (result) => {
          if (result.status !== "fulfilled") return [];
          const payload = result.value?.data?.data;
          return Array.isArray(payload) ? payload : [];
        };

        setStates(extractArray(statesRes));
        setDivisions(extractArray(divisionsRes));
        setDistricts(extractArray(districtsRes));
        setTalukas(extractArray(talukasRes));

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
    if (!open) {
      return;
    }

    if (villageCityData) {
      const talukaId = idOf(villageCityData.talukaId);

      form.setFieldsValue({
        talukaId,
        villageCityName: villageCityData.villageCityName || "",
        code: villageCityData.code || "",
        type: villageCityData.type || "VILLAGE",
      });

      // Walk the chain backwards using the already-loaded lists.
      if (talukaId && talukas.length && districts.length) {
        const taluka = talukas.find((t) => t._id === talukaId);
        const districtId = idOf(taluka?.districtId);

        const district = districts.find((d) => d._id === districtId);
        const divisionId = idOf(district?.divisionId);
        const stateId = idOf(district?.stateId);

        setSelectedStateId(stateId);
        setSelectedDivisionId(divisionId);
        setSelectedDistrictId(districtId);
      }
    } else {
      form.resetFields();

      form.setFieldsValue({
        type: "VILLAGE",
      });

      setSelectedStateId(undefined);
      setSelectedDivisionId(undefined);
      setSelectedDistrictId(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, villageCityData, form, talukas, districts]);

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

  // =========================
  // Cascade change handlers — each clears everything below it
  // =========================
  const handleStateChange = (value) => {
    setSelectedStateId(value);
    setSelectedDivisionId(undefined);
    setSelectedDistrictId(undefined);
    form.setFieldsValue({ talukaId: undefined });
  };

  const handleDivisionChange = (value) => {
    setSelectedDivisionId(value);
    setSelectedDistrictId(undefined);
    form.setFieldsValue({ talukaId: undefined });
  };

  const handleDistrictChange = (value) => {
    setSelectedDistrictId(value);
    form.setFieldsValue({ talukaId: undefined });
  };

  // =========================
  // Submit — payload is unchanged, only talukaId is sent
  // =========================
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        villageCityName: values.villageCityName.trim(),
        code: values.code.trim().toUpperCase(),
        talukaId: values.talukaId,
        type: values.type,
      };

      let response;

      if (isEditMode) {
        response = await axiosInstance.patch(
          `/locations/villages-cities/${villageCityData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          "/locations/villages-cities",
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEditMode
              ? "Village/City updated successfully."
              : "Village/City created successfully.")
        );

        form.resetFields();
        handleClose();
        onSuccess?.();
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to save village/city."
        );
      }
    } catch (error) {
      if (error?.code === "DUPLICATE_RESOURCE") {
        messageApi.error(
          error?.message ||
            "A record with this identifier already exists."
        );
      } else if (error?.code === "VALIDATION_ERROR") {
        messageApi.error(
          error?.message ||
            "Please check the entered information."
        );
      } else if (error?.code === "NOT_FOUND") {
        messageApi.error(
          error?.message ||
            "Village/City was not found."
        );
      } else {
        messageApi.error(
          error?.message ||
            "Unable to save village/city. Please try again."
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
    onClose();
  };

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={
          isEditMode
            ? "Edit Village / City"
            : "Add Village / City"
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
          {/* ===== Location cascade: State -> Division -> District -> Taluka ===== */}
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

          {/* Taluka is the actual field submitted */}
          <Form.Item
            label="Taluka"
            name="talukaId"
            rules={[
              {
                required: true,
                message: "Please select taluka.",
              },
            ]}
          >
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
              options={filteredTalukas.map((taluka) => ({
                value: taluka._id,
                label: taluka.name,
              }))}
            />
          </Form.Item>
          {/* ===== End location cascade ===== */}

          {/* Name */}
          <Form.Item
            label="Village / City Name"
            name="villageCityName"
            rules={[
              {
                required: true,
                message:
                  "Please enter village/city name.",
              },
              {
                min: 2,
                message:
                  "Village/city name must be at least 2 characters.",
              },
              {
                max: 100,
                message:
                  "Village/city name cannot exceed 100 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter village / city name"
              maxLength={100}
              size="large"
            />
          </Form.Item>

          {/* Code */}
          <Form.Item
            label="Village / City Code"
            name="code"
            rules={[
              {
                required: true,
                message:
                  "Please enter village/city code.",
              },
              {
                min: 2,
                message:
                  "Village/city code must be at least 2 characters.",
              },
              {
                max: 10,
                message:
                  "Village/city code cannot exceed 10 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter village / city code"
              maxLength={10}
              size="large"
              onChange={(event) => {
                form.setFieldValue(
                  "code",
                  event.target.value.toUpperCase()
                );
              }}
            />
          </Form.Item>

          {/* Type */}
          <Form.Item
            label="Type"
            name="type"
            rules={[
              {
                required: true,
                message:
                  "Please select type.",
              },
            ]}
          >
            <Select
              size="large"
              options={[
                {
                  value: "VILLAGE",
                  label: "Village",
                },
                {
                  value: "CITY",
                  label: "City",
                },
              ]}
            />
          </Form.Item>

          {/* Footer */}
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
                ? "Update Village / City"
                : "Create Village / City"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default VillageCityModal;