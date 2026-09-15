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
import styles from "./RegionModal.module.css";

function RegionModal({
  open,
  regionData,
  divisions,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] =
    message.useMessage();

  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(
    regionData?._id
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (regionData) {
      form.setFieldsValue({
        name: regionData.name || "",
        code: regionData.code || "",
        divisionId:
          regionData.divisionId?._id ||
          regionData.divisionId ||
          undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, regionData, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        divisionId: values.divisionId,
      };

      let response;

      if (isEditMode) {
        response = await axiosInstance.patch(
          `/locations/regions/${regionData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          "/locations/regions",
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEditMode
              ? "Region updated successfully."
              : "Region created successfully.")
        );

        form.resetFields();

        onSuccess?.();
      } else {
        messageApi.error(
          response?.data?.message ||
            "Unable to save region."
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
            "Region was not found."
        );
      } else {
        messageApi.error(
          error?.message ||
            "Unable to save region. Please try again."
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
            ? "Edit Region"
            : "Add Region"
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
          {/* Division */}
          <Form.Item
            label="Division"
            name="divisionId"
            rules={[
              {
                required: true,
                message:
                  "Please select division.",
              },
            ]}
          >
            <Select
              placeholder="Select division"
              size="large"
              showSearch
              optionFilterProp="label"
              options={divisions.map(
                (division) => ({
                  value: division._id,
                  label: division.name,
                })
              )}
            />
          </Form.Item>

          {/* Region Name */}
          <Form.Item
            label="Region Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Please enter region name.",
              },
              {
                min: 2,
                message:
                  "Region name must be at least 2 characters.",
              },
              {
                max: 100,
                message:
                  "Region name cannot exceed 100 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter region name"
              maxLength={100}
              size="large"
            />
          </Form.Item>

          {/* Region Code */}
          <Form.Item
            label="Region Code"
            name="code"
            rules={[
              {
                required: true,
                message:
                  "Please enter region code.",
              },
              {
                min: 2,
                message:
                  "Region code must be at least 2 characters.",
              },
              {
                max: 10,
                message:
                  "Region code cannot exceed 10 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter region code"
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
                ? "Update Region"
                : "Create Region"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default RegionModal;