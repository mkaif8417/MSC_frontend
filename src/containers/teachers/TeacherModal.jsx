import { useEffect, useState } from "react";
import {
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";
import dayjs from "dayjs";

import axiosInstance from "../../services/AxiosInstance";
import styles from "./TeacherModal.module.css";

function TeacherModal({
  open,
  teacherData,
  studyCenters,
  areaLocalities,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(teacherData);

  useEffect(() => {
    if (!open) return;

    if (teacherData) {
      form.setFieldsValue({
        name: teacherData.name || "",
        mobileNumber: teacherData.mobileNumber || "",
        qualification: teacherData.qualification || "",
        subjects: teacherData.subjects || [],
        areaLocalityId:
          teacherData.areaLocalityId?._id ||
          teacherData.areaLocalityId ||
          undefined,
        studyCenterId:
          teacherData.studyCenterId?._id ||
          teacherData.studyCenterId ||
          undefined,
        joiningDate: teacherData.joiningDate
          ? dayjs(teacherData.joiningDate)
          : undefined,
        status: teacherData.status || "Active",
      });
    } else {
      form.resetFields();
    }
  }, [open, teacherData, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        mobileNumber: values.mobileNumber.trim(),
        areaLocalityId: values.areaLocalityId,
        studyCenterId: values.studyCenterId,
        joiningDate: values.joiningDate.format("YYYY-MM-DD"),
        status: values.status,
      };

      if (values.qualification?.trim()) {
        payload.qualification = values.qualification.trim();
      }

      if (values.subjects?.length) {
        payload.subjects = values.subjects;
      }

      let response;

      if (isEdit) {
        response = await axiosInstance.patch(
          `/teachers/${teacherData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post("/teachers", payload);
      }

      if (response?.data?.success) {
        message.success(
          response?.data?.message ||
            `Teacher ${isEdit ? "updated" : "registered"} successfully.`
        );

        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error("Teacher save error:", error);

      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save teacher. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Teacher" : "Register Teacher"}
      okText={isEdit ? "Update Teacher" : "Register Teacher"}
      cancelText="Cancel"
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={650}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className={styles.form}
      >
        <Form.Item
          label="Teacher Name"
          name="name"
          rules={[{ required: true, message: "Please enter teacher name." }]}
        >
          <Input placeholder="Enter teacher name" />
        </Form.Item>

        <Form.Item
          label="Mobile Number"
          name="mobileNumber"
          rules={[
            { required: true, message: "Please enter mobile number." },
          ]}
        >
          <Input placeholder="Enter mobile number" maxLength={10} />
        </Form.Item>

        <Form.Item label="Qualification" name="qualification">
          <Input placeholder="Enter qualification" />
        </Form.Item>

        <Form.Item label="Subjects" name="subjects">
          <Select
            mode="tags"
            placeholder="Add subjects"
            tokenSeparators={[","]}
          />
        </Form.Item>

        <Form.Item
          label="Area / Locality"
          name="areaLocalityId"
          rules={[
            { required: true, message: "Please select area / locality." },
          ]}
        >
          <Select
            placeholder="Select area / locality"
            showSearch
            allowClear
            optionFilterProp="label"
            options={(areaLocalities || []).map((areaLocality) => ({
              value: areaLocality._id,
              label: areaLocality.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Study Center"
          name="studyCenterId"
          rules={[
            { required: true, message: "Please select a study center." },
          ]}
        >
          <Select
            placeholder="Select study center"
            showSearch
            allowClear
            optionFilterProp="label"
            options={(studyCenters || []).map((studyCenter) => ({
              value: studyCenter._id,
              label: studyCenter.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Joining Date"
          name="joiningDate"
          rules={[{ required: true, message: "Please select joining date." }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: "Please select status." }]}
        >
          <Select
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default TeacherModal;