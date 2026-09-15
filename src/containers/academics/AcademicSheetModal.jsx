import { useEffect, useState } from "react";
import {
  Modal,
  Table,
  Button,
  DatePicker,
  Select,
  Input,
  InputNumber,
  message,
  Tag,
  Space,
  Divider,
  Descriptions,
} from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import axiosInstance from "../../services/AxiosInstance";

const SUBJECTS = ["Maths", "Urdu", "English"];
const STATUS_OPTIONS = ["Regular", "Absent", "Holiday", "Program", "WeeklyOff"];

function AcademicSheetModal({ open, student, onClose }) {
  const [messageApi, contextHolder] = message.useMessage();

  const [view, setView] = useState("list"); // 'list' | 'sheet'
  const [loading, setLoading] = useState(false);

  const [sheets, setSheets] = useState([]);
  const [newWeek, setNewWeek] = useState({ weekStartDate: null, weekEndDate: null });

  const [activeSheet, setActiveSheet] = useState(null);

  // ---- daily entry form state ----
  const [entryDate, setEntryDate] = useState(null);
  const [entryStatus, setEntryStatus] = useState("Regular");
  const [entryNote, setEntryNote] = useState("");
  const [entrySubjects, setEntrySubjects] = useState(
    SUBJECTS.map((subject) => ({ subject, hw: null, cw: null, grade: "", pageNumber: null }))
  );
  const [topicPreview, setTopicPreview] = useState({}); // { Maths: "Fractions", ... }

  // ---- weekly result form state ----
  const [weeklyResultDraft, setWeeklyResultDraft] = useState(
    SUBJECTS.map((subject) => ({ subject, totalMarks: 0, obtainedMarks: 0 }))
  );

  const resetEntryForm = () => {
    setEntryDate(null);
    setEntryStatus("Regular");
    setEntryNote("");
    setEntrySubjects(SUBJECTS.map((subject) => ({ subject, hw: null, cw: null, grade: "", pageNumber: null })));
    setTopicPreview({});
  };

  const loadSheets = async () => {
    if (!student?._id) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/academic-sheets/student/${student._id}`);
      if (response?.data?.success) {
        setSheets(response.data.data || []);
      }
    } catch (error) {
      console.error("Load academic sheets error:", error);
      messageApi.error(error?.message || "Unable to load weekly sheets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && student?._id) {
      setView("list");
      setActiveSheet(null);
      loadSheets();
    }
  }, [open, student?._id]);

  const handleCreateWeek = async () => {
    if (!newWeek.weekStartDate || !newWeek.weekEndDate) {
      messageApi.warning("Pick both a week start and end date.");
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post("/academic-sheets", {
        studentId: student._id,
        weekStartDate: newWeek.weekStartDate.toISOString(),
        weekEndDate: newWeek.weekEndDate.toISOString(),
      });
      if (response?.data?.success) {
        messageApi.success("Week created.");
        setNewWeek({ weekStartDate: null, weekEndDate: null });
        await loadSheets();
      }
    } catch (error) {
      console.error("Create week error:", error);
      messageApi.error(error?.message || "Unable to create week.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSheet = (sheet) => {
    setActiveSheet(sheet);
    setWeeklyResultDraft(
      SUBJECTS.map((subject) => {
        const existing = sheet.weeklyResult?.find((r) => r.subject === subject);
        return {
          subject,
          totalMarks: existing?.totalMarks || 0,
          obtainedMarks: existing?.obtainedMarks || 0,
        };
      })
    );
    resetEntryForm();
    setView("sheet");
  };

  // Auto-fetch TP from the Topic collection when a page number is entered.
  // 404 just means no topic set yet for that subject/class/page — not a real error.
  const handlePageNumberBlur = async (subject, pageNumber) => {
    if (!pageNumber || !activeSheet?.class) return;
    try {
      const response = await axiosInstance.get("/topics/lookup", {
        params: { subject, class: activeSheet.class, pageNumber },
      });
      if (response?.data?.success) {
        setTopicPreview((prev) => ({ ...prev, [subject]: response.data.data.topic }));
      }
    } catch (error) {
      setTopicPreview((prev) => ({ ...prev, [subject]: "(no topic set)" }));
    }
  };

  const updateSubjectField = (subject, field, value) => {
    setEntrySubjects((prev) =>
      prev.map((row) => (row.subject === subject ? { ...row, [field]: value } : row))
    );
  };

  const handleSaveDailyEntry = async () => {
    if (!entryDate) {
      messageApi.warning("Pick a date for this entry.");
      return;
    }
    const day = dayjs(entryDate).format("ddd"); // auto-derived, per your call — "Mon", "Tue", ...
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        `/academic-sheets/${activeSheet._id}/daily-entry`,
        {
          date: entryDate.toISOString(),
          day,
          status: entryStatus,
          note: entryNote || null,
          subjects: entrySubjects,
        }
      );
      if (response?.data?.success) {
        messageApi.success("Daily entry saved.");
        setActiveSheet(response.data.data);
        resetEntryForm();
      }
    } catch (error) {
      console.error("Save daily entry error:", error);
      messageApi.error(error?.message || "Unable to save daily entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeeklyResult = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch(
        `/academic-sheets/${activeSheet._id}/weekly-result`,
        { weeklyResult: weeklyResultDraft }
      );
      if (response?.data?.success) {
        messageApi.success("Weekly result saved.");
        setActiveSheet(response.data.data);
      }
    } catch (error) {
      console.error("Save weekly result error:", error);
      messageApi.error(error?.message || "Unable to save weekly result.");
    } finally {
      setLoading(false);
    }
  };

  const weekColumns = [
    { title: "Week Start", dataIndex: "weekStartDate", key: "weekStartDate", render: (v) => dayjs(v).format("DD MMM YYYY") },
    { title: "Week End", dataIndex: "weekEndDate", key: "weekEndDate", render: (v) => dayjs(v).format("DD MMM YYYY") },
    { title: "Working Days", dataIndex: "workingDays", key: "workingDays" },
    { title: "Attendance", dataIndex: "attendance", key: "attendance" },
    { title: "Overall %", dataIndex: "overallPercentage", key: "overallPercentage", render: (v) => `${v || 0}%` },
    { title: "Grade", dataIndex: "overallGrade", key: "overallGrade", render: (v) => (v ? <Tag color="green">{v}</Tag> : "-") },
    { title: "Actions", key: "actions", render: (_, record) => <Button size="small" onClick={() => handleOpenSheet(record)}>Open</Button> },
  ];

// Pulls one subject's entry out of a daily entry's subjects array
const getSubjectEntry = (record, subject) =>
  record.subjects?.find((s) => s.subject === subject) || {};

// Builds the HW/CW/GD/PG/TP sub-columns for one subject group
const buildSubjectColumnGroup = (subject) => ({
  title: subject,
  children: [
    {
      title: "HW",
      key: `${subject}-hw`,
      width: 50,
      render: (_, record) => getSubjectEntry(record, subject).hw ?? "-",
    },
    {
      title: "CW",
      key: `${subject}-cw`,
      width: 50,
      render: (_, record) => getSubjectEntry(record, subject).cw ?? "-",
    },
    {
      title: "GD",
      key: `${subject}-grade`,
      width: 50,
      render: (_, record) => getSubjectEntry(record, subject).grade || "-",
    },
    {
      title: "PG",
      key: `${subject}-page`,
      width: 50,
      render: (_, record) => getSubjectEntry(record, subject).pageNumber ?? "-",
    },
    {
      title: "TP",
      key: `${subject}-topic`,
      width: 140,
      render: (_, record) => getSubjectEntry(record, subject).topic || "-",
    },
  ],
});

const dailyEntryColumns = [
  { title: "Day", dataIndex: "day", key: "day", fixed: "left", width: 60 },
  { title: "Date", dataIndex: "date", key: "date", fixed: "left", width: 70, render: (v) => dayjs(v).format("DD/MM") },
  { title: "Status", dataIndex: "status", key: "status", fixed: "left", width: 90 },
  ...SUBJECTS.map(buildSubjectColumnGroup),
];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      title={
        view === "list"
          ? `Weekly Sheets — ${student?.name || ""}`
          : `${student?.name || ""} — Week ${activeSheet ? dayjs(activeSheet.weekStartDate).format("DD MMM") : ""}`
      }
      destroyOnClose
    >
      {contextHolder}

      {view === "list" && (
        <>
          <Space style={{ marginBottom: 16 }}>
            <DatePicker placeholder="Week Start" value={newWeek.weekStartDate} onChange={(d) => setNewWeek((p) => ({ ...p, weekStartDate: d }))} />
            <DatePicker placeholder="Week End" value={newWeek.weekEndDate} onChange={(d) => setNewWeek((p) => ({ ...p, weekEndDate: d }))} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateWeek}>New Week</Button>
          </Space>
          <Table rowKey="_id" columns={weekColumns} dataSource={sheets} loading={loading} pagination={{ pageSize: 8 }} />
        </>
      )}

      {view === "sheet" && activeSheet && (
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setView("list")} style={{ marginBottom: 16 }}>Back to weeks</Button>

          <Descriptions size="small" column={4} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Class">{activeSheet.class}</Descriptions.Item>
            <Descriptions.Item label="Working Days">{activeSheet.workingDays}</Descriptions.Item>
            <Descriptions.Item label="Attendance">{activeSheet.attendance}</Descriptions.Item>
            <Descriptions.Item label="Overall">
              {activeSheet.overallObtained}/{activeSheet.overallTotal} ({activeSheet.overallPercentage}% — {activeSheet.overallGrade || "-"})
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Add Daily Entry</Divider>
          <Space style={{ marginBottom: 12 }} wrap>
            <DatePicker placeholder="Date" value={entryDate} onChange={setEntryDate} />
            <span>Day: <b>{entryDate ? dayjs(entryDate).format("ddd") : "-"}</b></span>
            <Select style={{ width: 140 }} value={entryStatus} onChange={setEntryStatus} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
            <Input placeholder="Note (e.g. Program, Independence Day)" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} style={{ width: 220 }} />
          </Space>

          <Table
            rowKey="subject"
            dataSource={entrySubjects}
            pagination={false}
            size="small"
            style={{ marginBottom: 12 }}
            columns={[
              { title: "Subject", dataIndex: "subject", key: "subject" },
              { title: "HW", key: "hw", render: (_, r) => <InputNumber min={0} value={r.hw} onChange={(v) => updateSubjectField(r.subject, "hw", v)} /> },
              { title: "CW", key: "cw", render: (_, r) => <InputNumber min={0} value={r.cw} onChange={(v) => updateSubjectField(r.subject, "cw", v)} /> },
              { title: "GD (Grade)", key: "grade", render: (_, r) => <Input value={r.grade} onChange={(e) => updateSubjectField(r.subject, "grade", e.target.value)} style={{ width: 60 }} /> },
              { title: "PG (Page No.)", key: "pageNumber", render: (_, r) => <InputNumber min={1} value={r.pageNumber} onChange={(v) => updateSubjectField(r.subject, "pageNumber", v)} onBlur={() => handlePageNumberBlur(r.subject, r.pageNumber)} /> },
              { title: "TP (Topic — auto)", key: "topic", render: (_, r) => <span style={{ color: "#6b7280" }}>{topicPreview[r.subject] || "-"}</span> },
            ]}
          />
          <Button type="primary" onClick={handleSaveDailyEntry} loading={loading}>Save Daily Entry</Button>

          <Divider orientation="left">This Week's Daily Entries</Divider>
          <Table rowKey={(r) => `${r.date}`} columns={dailyEntryColumns} dataSource={activeSheet.dailyEntries || []} pagination={false} size="small" />

          <Divider orientation="left">Weekly Test Result</Divider>
          <Table
            rowKey="subject"
            dataSource={weeklyResultDraft}
            pagination={false}
            size="small"
            style={{ marginBottom: 12 }}
            columns={[
              { title: "Subject", dataIndex: "subject", key: "subject" },
              { title: "Total Marks", key: "totalMarks", render: (_, r) => <InputNumber min={0} value={r.totalMarks} onChange={(v) => setWeeklyResultDraft((prev) => prev.map((row) => row.subject === r.subject ? { ...row, totalMarks: v } : row))} /> },
              { title: "Obtained Marks", key: "obtainedMarks", render: (_, r) => <InputNumber min={0} value={r.obtainedMarks} onChange={(v) => setWeeklyResultDraft((prev) => prev.map((row) => row.subject === r.subject ? { ...row, obtainedMarks: v } : row))} /> },
            ]}
          />
          <Button type="primary" onClick={handleSaveWeeklyResult} loading={loading}>Save Weekly Result</Button>
        </>
      )}
    </Modal>
  );
}

export default AcademicSheetModal;