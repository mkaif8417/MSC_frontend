import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Switch, message } from "antd";

import axiosInstance from "../../../services/AxiosInstance";

function DivisionModal({ open, divisionData, states, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [submitting, setSubmitting] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  const isEditMode = Boolean(divisionData?._id);

  // =========================
  // Fetch districts for the "HQ District" dropdown, scoped to the chosen state
  // =========================
  const getDistrictsForState = async (stateId) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    try {
      setDistrictsLoading(true);

      const response = await axiosInstance.get(
        `/locations/divisions/by-state/${stateId}/districts`
      );

      if (response?.data?.success) {
        setDistricts(response?.data?.data || []);
      } else {
        setDistricts([]);
      }
    } catch (error) {
      setDistricts([]);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // =========================
  // Populate form when opening (create vs edit)
  // =========================
  useEffect(() => {
    if (!open) return;

    if (divisionData) {
      const stateId =
        divisionData?.stateId?._id || divisionData?.stateId;
      const hqDistrictId =
        divisionData?.hqDistrictId?._id || divisionData?.hqDistrictId;

      form.setFieldsValue({
        name: divisionData?.name,
        code: divisionData?.code,
        stateId,
        hqDistrictId,
        isActive: divisionData?.isActive ?? true,
      });

      if (stateId) {
        getDistrictsForState(stateId);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
      setDistricts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, divisionData]);

  // =========================
  // State changed inside the modal -> reload HQ district options
  // =========================
  const handleStateChange = (stateId) => {
    form.setFieldValue("hqDistrictId", undefined);
    getDistrictsForState(stateId);
  };

  // =========================
  // Submit
  // =========================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        name: values.name?.trim(),
        code: values.code?.trim(),
        stateId: values.stateId,
        hqDistrictId: values.hqDistrictId || null,
        isActive: values.isActive,
      };

      const response = isEditMode
        ? await axiosInstance.patch(
            `/locations/divisions/${divisionData._id}`,
            payload
          )
        : await axiosInstance.post("/locations/divisions", payload);

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            `Division ${isEditMode ? "updated" : "created"} successfully.`
        );
        onSuccess?.();
      } else {
        messageApi.error(
          response?.data?.message || "Unable to save division."
        );
      }
    } catch (error) {
      if (error?.errorFields) {
        // Antd form validation error — no toast needed, fields show inline errors
        return;
      }

      messageApi.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save division. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Modal
        title={isEditMode ? "Edit Division" : "Add Division"}
        open={open}
        onCancel={onClose}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={isEditMode ? "Update" : "Create"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Division Name"
            name="name"
            rules={[
              { required: true, message: "Division name is required" },
            ]}
          >
            <Input placeholder="e.g. Belagavi Division" size="large" />
          </Form.Item>

          <Form.Item
            label="Division Code"
            name="code"
            rules={[
              { required: true, message: "Division code is required" },
            ]}
          >
            <Input
              placeholder="e.g. BLGD"
              size="large"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            label="State"
            name="stateId"
            rules={[{ required: true, message: "State is required" }]}
          >
            <Select
              showSearch
              placeholder="Select state"
              optionFilterProp="label"
              size="large"
              onChange={handleStateChange}
              options={(states || []).map((state) => ({
                value: state._id,
                label: state.name,
              }))}
            />
          </Form.Item>

          <Form.Item label="HQ District" name="hqDistrictId">
            <Select
              allowClear
              showSearch
              placeholder="Select HQ district (optional)"
              optionFilterProp="label"
              size="large"
              loading={districtsLoading}
              notFoundContent={
                districtsLoading ? "Loading..." : "Select a state first"
              }
              options={districts.map((district) => ({
                value: district._id,
                label: district.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Active"
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default DivisionModal;