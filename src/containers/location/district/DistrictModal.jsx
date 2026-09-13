import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";

import axiosInstance from "../../../services/AxiosInstance";
import styles from "./DistrictModal.module.css";

function DistrictModal({
  open,
  districtData,
  states,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] =
    message.useMessage();

  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(
    districtData?._id
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (districtData) {
      form.setFieldsValue({
        name: districtData.name || "",
        code: districtData.code || "",
        stateId:
          districtData.stateId ||
          districtData.state?._id ||
          undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, districtData, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        stateId: values.stateId,
      };

      let response;

      if (isEditMode) {
        response = await axiosInstance.patch(
          `/locations/districts/${districtData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          "/locations/districts",
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEditMode
              ? "District updated successfully."
              : "District created successfully.")
        );

        form.resetFields();

        onSuccess?.();
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to save district."
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
        error?.code ===
        "VALIDATION_ERROR"
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
            "District was not found."
        );
      } else {
        messageApi.error(
          error?.message ||
            "Unable to save district. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={
          isEditMode
            ? "Edit District"
            : "Add District"
        }
        centered
        destroyOnHidden
        onCancel={onClose}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
          className={styles.form}
        >
          {/* State */}
          <Form.Item
            label="State"
            name="stateId"
            rules={[
              {
                required: true,
                message:
                  "Please select state.",
              },
            ]}
          >
            <Select
              placeholder="Select state"
              size="large"
              showSearch
              optionFilterProp="label"
              options={states.map(
                (state) => ({
                  value: state._id,
                  label: state.name,
                })
              )}
            />
          </Form.Item>

          {/* District Name */}
          <Form.Item
            label="District Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Please enter district name.",
              },
              {
                min: 2,
                message:
                  "District name must be at least 2 characters.",
              },
              {
                max: 100,
                message:
                  "District name cannot exceed 100 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter district name"
              maxLength={100}
              size="large"
            />
          </Form.Item>

          {/* District Code */}
          <Form.Item
            label="District Code"
            name="code"
            rules={[
              {
                required: true,
                message:
                  "Please enter district code.",
              },
              {
                min: 2,
                message:
                  "District code must be at least 2 characters.",
              },
              {
                max: 10,
                message:
                  "District code cannot exceed 10 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter district code"
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

          {/* Footer */}
          <div className={styles.footer}>
            <Button
              onClick={onClose}
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
                ? "Update District"
                : "Create District"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default DistrictModal;