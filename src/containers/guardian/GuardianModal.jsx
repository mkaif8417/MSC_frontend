import { useEffect, useState } from "react";
import { Form, Input, Modal, Spin, message } from "antd";
import axiosInstance from "../../services/AxiosInstance";
import styles from "./GuardianModal.module.css";

function GuardianModal({ open, studentId, studentName, onClose }) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Whether a Guardian record already exists for this student.
  // Decides POST (create) vs PATCH (update) on submit.
  const [hasExistingGuardian, setHasExistingGuardian] = useState(false);

  // ---------------------------------------------------------
  // LOAD GUARDIAN FOR THIS STUDENT
  // ---------------------------------------------------------
  const loadGuardian = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get(
        `/students/${studentId}/guardian`
      );

      if (response?.data?.success) {
        setHasExistingGuardian(true);

        form.setFieldsValue({
          guardianName: response.data.data?.guardianName || "",
          relationToStudent: response.data.data?.relationToStudent || "",
          mobileNumber: response.data.data?.mobileNumber || "",
          alternateMobileNumber:
            response.data.data?.alternateMobileNumber || "",
          address: response.data.data?.address || "",
        });
      }
    } catch (error) {
      // No guardian yet is expected for a brand-new student - not an error.
      // AxiosInstance's response interceptor rejects with a flat
      // { status, code, message, details } object, not a raw axios error,
      // so check error.status / error.code directly (no error.response).
      if (error?.status === 404 || error?.code === "NOT_FOUND") {
        setHasExistingGuardian(false);
        form.resetFields();
      } else {
        console.error("Load guardian error:", error);

        messageApi.error(
          error?.message ||
            "Unable to load guardian details. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      loadGuardian();
    }
  }, [open, studentId]);

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------
  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        guardianName: values.guardianName?.trim(),
        relationToStudent: values.relationToStudent?.trim() || undefined,
        mobileNumber: values.mobileNumber?.trim() || undefined,
        alternateMobileNumber:
          values.alternateMobileNumber?.trim() || undefined,
        address: values.address?.trim() || undefined,
      };

      let response;

      if (hasExistingGuardian) {
        response = await axiosInstance.patch(
          `/students/${studentId}/guardian`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          `/students/${studentId}/guardian`,
          payload
        );
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (hasExistingGuardian
              ? "Guardian details updated successfully."
              : "Guardian details saved successfully.")
        );

        onClose();
      }
    } catch (error) {
      console.error("Guardian submit error:", error);

      // Same flat error shape as loadGuardian above - error.code and
      // error.details come straight from the interceptor, not error.response.
      if (error?.code === "VALIDATION_ERROR") {
        const details = error?.details || [];

        if (Array.isArray(details) && details.length > 0) {
          details.forEach((detail) => {
            messageApi.error(
              detail?.message || "Please check the entered values."
            );
          });
        } else {
          messageApi.error(
            error?.message || "Please check the entered values."
          );
        }

        return;
      }

      messageApi.error(
        error?.message || "Unable to save guardian details. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={
          studentName ? `Guardian Details — ${studentName}` : "Guardian Details"
        }
        okText={hasExistingGuardian ? "Update" : "Save"}
        cancelText="Cancel"
        onCancel={onClose}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={600}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            className={styles.form}
            onFinish={handleSubmit}
          >
            {/* GUARDIAN NAME */}
            <Form.Item
              label="Guardian Name"
              name="guardianName"
              rules={[
                { required: true, message: "Please enter guardian name." },
              ]}
            >
              <Input placeholder="Enter guardian name" maxLength={150} />
            </Form.Item>

            {/* RELATION TO STUDENT */}
            <Form.Item label="Relation to Student" name="relationToStudent">
              <Input
                placeholder="e.g. Father, Mother, Uncle"
                maxLength={50}
              />
            </Form.Item>

            {/* MOBILE NUMBER */}
            <Form.Item label="Mobile Number" name="mobileNumber">
              <Input placeholder="Enter mobile number" maxLength={20} />
            </Form.Item>

            {/* ALTERNATE MOBILE NUMBER */}
            <Form.Item
              label="Alternate Mobile Number"
              name="alternateMobileNumber"
            >
              <Input
                placeholder="Enter alternate mobile number"
                maxLength={20}
              />
            </Form.Item>

            {/* ADDRESS */}
            <Form.Item label="Address" name="address">
              <Input.TextArea
                placeholder="Enter address"
                maxLength={300}
                rows={3}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}

export default GuardianModal;