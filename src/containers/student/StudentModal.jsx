import { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  message,
} from "antd";
import axiosInstance from "../../services/AxiosInstance";
import styles from "./StudentModal.module.css";

const classOptions = [
  { value: "8th", label: "8th" },
  { value: "9th", label: "9th" },
  { value: "10th", label: "10th" },
  { value: "11th", label: "11th" },
  { value: "12th", label: "12th" },
  { value: "Degree", label: "Degree" },
];

// class-driven courseType rules (must mirror backend student.model.js)
const lowerGroup = ["8th", "9th", "10th"];
const upperGroup = ["11th", "12th", "Degree"];

const lowerGroupCourseOptions = [
  { value: "AICU", label: "AICU" },
  { value: "Self Study", label: "Self Study" },
];

const upperGroupCourseOptions = [
  { value: "Self Study", label: "Self Study" },
  { value: "Special Course", label: "Special Course" },
];

const getCourseOptionsForClass = (studentClass) => {
  if (lowerGroup.includes(studentClass)) {
    return lowerGroupCourseOptions;
  }

  if (upperGroup.includes(studentClass)) {
    return upperGroupCourseOptions;
  }

  return [];
};

function StudentModal({
  open,
  studentData,
  studyCenters,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(studentData);

  // Watch the class field so the courseType radio options update live.
  const selectedClass = Form.useWatch("class", form);

  const courseOptions = getCourseOptionsForClass(selectedClass);

  // ---------------------------------------------------------
  // SET FORM DATA
  // ---------------------------------------------------------
  useEffect(() => {
    if (!open) {
      return;
    }

    if (studentData) {
      form.setFieldsValue({
        name: studentData?.name || "",

        fatherGuardianName: studentData?.fatherGuardianName || "",

        mobileNumber: studentData?.mobileNumber || "",

        age: studentData?.age ?? undefined,

        studyCenterId:
          typeof studentData?.studyCenterId === "object"
            ? studentData?.studyCenterId?._id
            : studentData?.studyCenterId,

        villageLocality: studentData?.villageLocality || "",

        schoolCollegeName: studentData?.schoolCollegeName || "",

        currentEducationalLevel:
          studentData?.currentEducationalLevel || "",

        class: studentData?.class || undefined,

        courseType: studentData?.courseType || undefined,
      });
    } else {
      form.setFieldsValue({
        name: "",
        fatherGuardianName: "",
        mobileNumber: "",
        age: undefined,
        studyCenterId: undefined,
        villageLocality: "",
        schoolCollegeName: "",
        currentEducationalLevel: "",
        class: undefined,
        courseType: undefined,
      });
    }
  }, [open, studentData, form]);

  // ---------------------------------------------------------
  // RESET courseType WHEN THE CLASS GROUP CHANGES
  // (e.g. switching from 9th -> 12th should clear an invalid
  // courseType selection like "AICU")
  // ---------------------------------------------------------
  const handleClassChange = (value) => {
    const validOptions = getCourseOptionsForClass(value).map(
      (option) => option.value
    );

    const currentCourseType = form.getFieldValue("courseType");

    if (!validOptions.includes(currentCourseType)) {
      form.setFieldsValue({ courseType: undefined });
    }
  };

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name?.trim(),
        fatherGuardianName: values.fatherGuardianName?.trim(),
        mobileNumber: values.mobileNumber?.trim() || undefined,
        age: values.age ?? undefined,
        villageLocality: values.villageLocality?.trim() || undefined,
        schoolCollegeName: values.schoolCollegeName?.trim() || undefined,
        currentEducationalLevel:
          values.currentEducationalLevel?.trim() || undefined,
        class: values.class,
        courseType: values.courseType,
      };

      // Study Center is required only while creating (immutable after that).
      if (!isEdit) {
        payload.studyCenterId = values.studyCenterId;
      }

      let response;

      if (isEdit) {
        response = await axiosInstance.patch(
          `/students/${studentData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post("/students", payload);
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEdit
              ? "Student updated successfully."
              : "Student registered successfully.")
        );

        onSuccess();
      }
    } catch (error) {
      console.error("Student submit error:", error);

      const errorData = error?.response?.data;
      const errorCode = errorData?.error?.code || error?.code;

      if (errorCode === "VALIDATION_ERROR") {
        const details = errorData?.error?.details || error?.details || [];

        if (Array.isArray(details) && details.length > 0) {
          details.forEach((detail) => {
            messageApi.error(
              detail?.message || "Please check the entered values."
            );
          });
        } else {
          messageApi.error(
            errorData?.message ||
              error?.message ||
              "Please check the entered values."
          );
        }

        return;
      }

      if (errorCode === "NOT_FOUND") {
        messageApi.error(
          errorData?.message || "Selected Study Center does not exist."
        );

        return;
      }

      messageApi.error(
        errorData?.message ||
          error?.message ||
          "Unable to save student. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={isEdit ? "Edit Student" : "Add Student"}
        okText={isEdit ? "Update" : "Create"}
        cancelText="Cancel"
        onCancel={onClose}
        onOk={() => form.submit()}
        confirmLoading={loading}
        destroyOnHidden
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.form}
          onFinish={handleSubmit}
        >
          {/* SCROLLABLE MODAL CONTENT */}
          <div className={styles.studentModalDiv}>
            {/* NAME */}
            <Form.Item
              label="Student Name"
              name="name"
              rules={[
                { required: true, message: "Please enter student name." },
              ]}
            >
              <Input placeholder="Enter student name" maxLength={150} />
            </Form.Item>

            {/* FATHER / GUARDIAN NAME */}
            <Form.Item
              label="Father/Guardian Name"
              name="fatherGuardianName"
              rules={[
                {
                  required: true,
                  message: "Please enter father/guardian name.",
                },
              ]}
            >
              <Input
                placeholder="Enter father/guardian name"
                maxLength={150}
              />
            </Form.Item>

            {/* MOBILE NUMBER */}
            <Form.Item label="Mobile Number" name="mobileNumber">
              <Input placeholder="Enter mobile number" maxLength={20} />
            </Form.Item>

            {/* AGE */}
            <Form.Item label="Age" name="age">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={120}
                placeholder="Enter age"
              />
            </Form.Item>

            {/* STUDY CENTER */}
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
                optionFilterProp="label"
                disabled={isEdit}
                options={studyCenters.map((studyCenter) => ({
                  value: studyCenter._id,
                  label: studyCenter.name,
                }))}
              />
            </Form.Item>

            {/* VILLAGE / LOCALITY */}
            <Form.Item label="Village/Locality" name="villageLocality">
              <Input placeholder="Enter village/locality" maxLength={150} />
            </Form.Item>

            {/* SCHOOL / COLLEGE NAME */}
            <Form.Item label="School/College Name" name="schoolCollegeName">
              <Input
                placeholder="Enter school/college name"
                maxLength={200}
              />
            </Form.Item>

            {/* CURRENT EDUCATIONAL LEVEL */}
            <Form.Item
              label="Current Educational Level"
              name="currentEducationalLevel"
            >
              <Input
                placeholder="Enter current educational level"
                maxLength={100}
              />
            </Form.Item>

            {/* CLASS */}
            <Form.Item
              label="Class"
              name="class"
              rules={[{ required: true, message: "Please select class." }]}
            >
              <Select
                placeholder="Select class"
                options={classOptions}
                onChange={handleClassChange}
              />
            </Form.Item>

            {/* COURSE TYPE - depends on selected class */}
            <Form.Item
              label="Course Type"
              name="courseType"
              rules={[
                { required: true, message: "Please select course type." },
              ]}
            >
              <Radio.Group disabled={!selectedClass} options={courseOptions} />
            </Form.Item>

            {!selectedClass && (
              <p className={styles.helperText}>
                Select a class first to choose the course type.
              </p>
            )}
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default StudentModal;