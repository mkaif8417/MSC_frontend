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
import styles from "./ZoneModal.module.css";

function ZoneModal({
  open,
  zoneData,
  states,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] =
    message.useMessage();

  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(zoneData?._id);

  useEffect(() => {
    if (!open) return;

    if (zoneData) {
      form.setFieldsValue({
        stateId:
          zoneData.stateId ||
          zoneData.state?._id ||
          undefined,

        name: zoneData.name || "",

        code: zoneData.code || "",
      });
    } else {
      form.resetFields();
    }
  }, [open, zoneData, form]);

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
          `/locations/zones/${zoneData._id}`,
          {
            name: payload.name,
            code: payload.code,
          }
        );
      } else {
        response = await axiosInstance.post(
          "/locations/zones",
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEditMode
              ? "Zone updated successfully."
              : "Zone created successfully.")
        );

        form.resetFields();
        onSuccess?.();
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
            "Zone was not found."
        );
      } else {
        messageApi.error(
          error?.message ||
            "Unable to save zone. Please try again."
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
            ? "Edit Zone"
            : "Add Zone"
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

          <Form.Item
            label="Zone Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Please enter zone name.",
              },
              {
                min: 2,
                message:
                  "Zone name must be at least 2 characters.",
              },
              {
                max: 100,
                message:
                  "Zone name cannot exceed 100 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter zone name"
              maxLength={100}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Zone Code"
            name="code"
            rules={[
              {
                required: true,
                message:
                  "Please enter zone code.",
              },
              {
                min: 2,
                message:
                  "Zone code must be at least 2 characters.",
              },
              {
                max: 10,
                message:
                  "Zone code cannot exceed 10 characters.",
              },
            ]}
          >
            <Input
              placeholder="Enter zone code"
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
                ? "Update Zone"
                : "Create Zone"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default ZoneModal;