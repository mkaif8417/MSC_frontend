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
import styles from "./TalukaModal.module.css";

function TalukaModal({
  open,
  talukaData,
  districts,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] =
    message.useMessage();

  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(
    talukaData?._id
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (talukaData) {
      form.setFieldsValue({
        name: talukaData.name || "",
        code: talukaData.code || "",
        districtId:
          talukaData.districtId ||
          talukaData.district?._id ||
          undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, talukaData, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        districtId: values.districtId,
      };

      let response;

      if (isEditMode) {
        response = await axiosInstance.patch(
          `/locations/talukas/${talukaData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          "/locations/talukas",
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEditMode
              ? "Taluka updated successfully."
              : "Taluka created successfully.")
        );

        form.resetFields();

        onSuccess?.();
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to save taluka."
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
            "Taluka was not found."
        );
      } else {
        messageApi.error(
          error?.message ||
            "Unable to save taluka. Please try again."
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
            ? "Edit Taluka"
            : "Add Taluka"
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
          {/* District */}
          <Form.Item
            label="District"
            name="districtId"
            rules={[
              {
                required: true,
                message:
                  "Please select district.",
              },
            ]}
          >
            <Select
              placeholder="Select district"
              size="large"
              showSearch
              optionFilterProp="label"
              options={districts.map(
                (district) => ({
                  value: district._id,
                  label: district.name,
                })
              )}
            />
          </Form.Item>

          {/* Taluka Name */}
          <Form.Item
            label="Taluka Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Please enter taluka name.",
              },
              {
                min: 2,
                message:
                  "Taluka name must be at least 2 characters.",
              },
              {
                max: 100,
                message:
                  "Taluka name cannot exceed 100 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter taluka name"
              maxLength={100}
              size="large"
            />
          </Form.Item>

          {/* Taluka Code */}
          <Form.Item
            label="Taluka Code"
            name="code"
            rules={[
              {
                required: true,
                message:
                  "Please enter taluka code.",
              },
              {
                min: 2,
                message:
                  "Taluka code must be at least 2 characters.",
              },
              {
                max: 10,
                message:
                  "Taluka code cannot exceed 10 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter taluka code"
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
                ? "Update Taluka"
                : "Create Taluka"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default TalukaModal;