import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  message,
} from "antd";

import axiosInstance from "../../../services/AxiosInstance";
import styles from "./StateModal.module.css";

function StateModal({
  open,
  stateData,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(stateData?._id);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    if (stateData) {
      form.setFieldsValue({
        name: stateData.name || "",
        code: stateData.code || "",
      });
    } else {
      form.resetFields();
    }
  }, [open, stateData, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
      };

      let response;

      if (isEditMode) {
        response = await axiosInstance.patch(
          `/locations/states/${stateData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          "/locations/states",
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEditMode
              ? "State updated successfully."
              : "State created successfully.")
        );

        form.resetFields();
        onSuccess?.();
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to save state."
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
            "State was not found."
        );
      } else {
        messageApi.error(
          error?.message ||
            "Unable to save state. Please try again."
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
        title={isEditMode ? "Edit State" : "Add State"}
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
          <Form.Item
            label="State Name"
            name="name"
            rules={[
              {
                required: true,
                message: "Please enter state name.",
              },
              {
                min: 2,
                message:
                  "State name must be at least 2 characters.",
              },
              {
                max: 100,
                message:
                  "State name cannot exceed 100 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter state name"
              maxLength={100}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="State Code"
            name="code"
            rules={[
              {
                required: true,
                message: "Please enter state code.",
              },
              {
                min: 2,
                message:
                  "State code must be at least 2 characters.",
              },
              {
                max: 10,
                message:
                  "State code cannot exceed 10 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter state code"
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
                ? "Update State"
                : "Create State"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default StateModal;