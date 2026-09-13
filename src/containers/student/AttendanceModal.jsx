import { useEffect, useState } from "react";
import {
  Form,
  Modal,
  Radio,
  DatePicker,
  Table,
  Tag,
  Spin,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import axiosInstance from "../../services/AxiosInstance";
import styles from "./AttendanceModal.module.css";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
];

function AttendanceModal({ open, studentId, studentName, onClose }) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState([]);

  const loadAttendance = async () => {
    try {
      setLoading(true);

      const endDate = dayjs();
      const startDate = dayjs().subtract(30, "day");

      const response = await axiosInstance.get(
        `/students/${studentId}/attendance`,
        {
          params: {
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: endDate.format("YYYY-MM-DD"),
          },
        }
      );

      if (response?.data?.success) {
        setRecords(response.data.data || []);
      }
    } catch (error) {
      console.error("Load attendance error:", error);
      messageApi.error(
        error?.message || "Unable to load attendance. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      loadAttendance();
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
        status: "PRESENT",
      });
    }
  }, [open, studentId]);

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        date: values.date.format("YYYY-MM-DD"),
        status: values.status,
      };

      const response = await axiosInstance.post(
        `/students/${studentId}/attendance`,
        payload
      );

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message || "Attendance marked successfully."
        );

        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          status: "PRESENT",
        });

        loadAttendance();
      }
    } catch (error) {
      console.error("Mark attendance error:", error);

      if (error?.code === "DUPLICATE_RESOURCE") {
        messageApi.error(
          error?.message ||
            "Attendance for this date is already marked."
        );
        return;
      }

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
        error?.message || "Unable to mark attendance. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "PRESENT" ? "green" : "red"}>{status}</Tag>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={
          studentName ? `Attendance — ${studentName}` : "Attendance"
        }
        footer={null}
        onCancel={onClose}
        destroyOnHidden
        width={720}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            className={styles.form}
            onFinish={handleSubmit}
          >
            <div className={styles.formRow}>
              <Form.Item
                label="Date"
                name="date"
                rules={[{ required: true, message: "Please select date." }]}
              >
                <DatePicker
                  format="DD MMM YYYY"
                  disabled
                  className={styles.fullWidth}
                />
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                rules={[
                  { required: true, message: "Please select status." },
                ]}
              >
                <Radio.Group
                  options={STATUS_OPTIONS}
                  optionType="button"
                  buttonStyle="solid"
                />
              </Form.Item>
            </div>

            <Button type="primary" htmlType="submit" loading={saving}>
              Mark Attendance
            </Button>
          </Form>

          <div className={styles.historySection}>
            <h4 className={styles.historyTitle}>Last 30 Days</h4>
            <Table
              rowKey="_id"
              size="small"
              columns={columns}
              dataSource={records}
              pagination={false}
              locale={{ emptyText: "No attendance records in this range." }}
              scroll={{ y: 240 }}
            />
          </div>
        </Spin>
      </Modal>
    </>
  );
}

export default AttendanceModal;