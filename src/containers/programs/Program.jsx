import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Table, Modal, Form, Button, Badge } from "react-bootstrap";
import { Plus, Pencil, Trash2 } from "lucide-react";

import programService from "../../services/programService";
import axiosInstance from "../../services/AxiosInstance";
import styles from "./Program.module.css";

const FREQUENCIES = ["Weekly", "Monthly", "Quarterly"];
const GRADES = ["A", "B", "C"];

const emptyForm = {
    studyCenter: "",
    programName: "",
    topic: "",
    frequency: "",
    studentAttendance: "",
    committeeInvolvement: "",
    rewards: "",
};

// Turns the URL slug ("weekly") into the enum value stored in Mongo ("Weekly").
// Falls back to "Weekly" if the slug is missing or not one of the 3 valid values.
const resolveFrequencyFromSlug = (slug) => {
    if (!slug) return "Weekly";

    const normalized =
        slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

    return FREQUENCIES.includes(normalized) ? normalized : "Weekly";
};

function Program() {
    const { frequency: frequencySlug } = useParams();
    const frequency = resolveFrequencyFromSlug(frequencySlug);

    const [programs, setPrograms] = useState([]);
    const [studyCenters, setStudyCenters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm, frequency });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ---------------------------------------------------------
    // LOAD PROGRAMS - scoped to the current frequency tab
    // ---------------------------------------------------------
    const loadPrograms = async () => {
        setLoading(true);
        try {
            const { data } = await programService.getAll({ frequency });
            setPrograms(data.data || []);
        } catch (err) {
            setError("Could not load programs.");
        } finally {
            setLoading(false);
        }
    };

    const loadStudyCenters = async () => {
        try {
            // Adjust this endpoint/path if your study-center service uses a different route.
            const { data } = await axiosInstance.get("/study-centers");
            setStudyCenters(data.data || []);
        } catch (err) {
            // Non-fatal: the dropdown will just be empty.
        }
    };

    useEffect(() => {
        loadPrograms();
        loadStudyCenters();
        // Re-fetch whenever the tab (frequency) changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [frequency]);

    const openAddModal = () => {
        setEditingId(null);
        setForm({ ...emptyForm, frequency });
        setError("");
        setShowModal(true);
    };

    const openEditModal = (program) => {
        setEditingId(program._id);
        setForm({
            studyCenter: program.studyCenter?._id || program.studyCenter || "",
            programName: program.programName || "",
            topic: program.topic || "",
            // Locked to the current tab regardless of what's stored, since a
            // program shouldn't silently jump tabs while being edited here.
            frequency,
            studentAttendance: program.studentAttendance || "",
            committeeInvolvement: program.committeeInvolvement || "",
            rewards: program.rewards || "",
        });
        setError("");
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (
            !form.studyCenter ||
            !form.programName ||
            !form.topic ||
            !form.studentAttendance ||
            !form.committeeInvolvement
        ) {
            setError(
                "Please fill in study center, program name, topic, student attendance and committee involvement."
            );
            return;
        }

        setSaving(true);
        setError("");
        try {
            const payload = { ...form, frequency };

            if (editingId) {
                await programService.update(editingId, payload);
            } else {
                await programService.create(payload);
            }
            setShowModal(false);
            loadPrograms();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save program.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this program? This cannot be undone.")) return;
        try {
            await programService.remove(id);
            loadPrograms();
        } catch (err) {
            setError("Could not delete program.");
        }
    };

    // Colour hint for the A/B/C badges - green for top grade, fading down.
    const gradeBadgeVariant = (grade) => {
        if (grade === "A") return styles.gradeA;
        if (grade === "B") return styles.gradeB;
        if (grade === "C") return styles.gradeC;
        return "";
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.title}>{frequency} Programs</h1>
                <Button className={styles.addButton} onClick={openAddModal}>
                    <Plus size={16} />
                    Add {frequency} Program
                </Button>
            </div>

            {error && !showModal && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.tableCard}>
                <Table responsive hover className={styles.table}>
                    <thead>
                        <tr>
                            <th>Study Center</th>
                            <th>Program Name</th>
                            <th>Topic</th>
                            <th>Student Attendance</th>
                            <th>Committee Involvement</th>
                            <th>Rewards</th>
                            <th className={styles.actionsCol}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={7} className={styles.emptyState}>
                                    Loading programs…
                                </td>
                            </tr>
                        )}

                        {!loading && programs.length === 0 && (
                            <tr>
                                <td colSpan={7} className={styles.emptyState}>
                                    No {frequency.toLowerCase()} programs yet. Add one to get started.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            programs.map((program) => (
                                <tr key={program._id}>
                                    <td>{program.studyCenter?.name || "—"}</td>
                                    <td>{program.programName}</td>
                                    <td>{program.topic}</td>
                                    <td>
                                        {program.studentAttendance ? (
                                            <Badge
                                                className={`${styles.gradeBadge} ${gradeBadgeVariant(
                                                    program.studentAttendance
                                                )}`}
                                            >
                                                {program.studentAttendance}
                                            </Badge>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td>
                                        {program.committeeInvolvement ? (
                                            <Badge
                                                className={`${styles.gradeBadge} ${gradeBadgeVariant(
                                                    program.committeeInvolvement
                                                )}`}
                                            >
                                                {program.committeeInvolvement}
                                            </Badge>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td>{program.rewards || "—"}</td>
                                    <td className={styles.actionsCol}>
                                        <button
                                            className={styles.iconButton}
                                            onClick={() => openEditModal(program)}
                                            aria-label="Edit program"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            className={`${styles.iconButton} ${styles.deleteButton}`}
                                            onClick={() => handleDelete(program._id)}
                                            aria-label="Delete program"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingId ? `Edit ${frequency} Program` : `Add ${frequency} Program`}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        {error && <div className={styles.errorBanner}>{error}</div>}

                        <Form.Group className="mb-3">
                            <Form.Label>Study Center</Form.Label>
                            <Form.Select
                                name="studyCenter"
                                value={form.studyCenter}
                                onChange={handleChange}
                            >
                                <option value="">Select a study center</option>
                                {studyCenters.map((sc) => (
                                    <option key={sc._id} value={sc._id}>
                                        {sc.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Program Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="programName"
                                value={form.programName}
                                onChange={handleChange}
                                placeholder="e.g. Quran Memorization Circle"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Topic</Form.Label>
                            <Form.Control
                                type="text"
                                name="topic"
                                value={form.topic}
                                onChange={handleChange}
                                placeholder="e.g. Surah Al-Baqarah"
                            />
                        </Form.Group>

                        {/* Frequency is implied by the current tab - no radio
                            group needed. Shown here read-only for clarity. */}
                        <Form.Group className="mb-3">
                            <Form.Label>Duration</Form.Label>
                            <div>
                                <Badge className={styles.frequencyBadge}>
                                    {frequency}
                                </Badge>
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Student Attendance</Form.Label>
                            <Form.Select
                                name="studentAttendance"
                                value={form.studentAttendance}
                                onChange={handleChange}
                            >
                                <option value="">Select grade</option>
                                {GRADES.map((grade) => (
                                    <option key={grade} value={grade}>
                                        {grade}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Committee Involvement</Form.Label>
                            <Form.Select
                                name="committeeInvolvement"
                                value={form.committeeInvolvement}
                                onChange={handleChange}
                            >
                                <option value="">Select grade</option>
                                {GRADES.map((grade) => (
                                    <option key={grade} value={grade}>
                                        {grade}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Rewards</Form.Label>
                            <Form.Control
                                type="text"
                                name="rewards"
                                value={form.rewards}
                                onChange={handleChange}
                                placeholder="e.g. Certificate + gift voucher"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" className={styles.addButton} disabled={saving}>
                            {saving ? "Saving…" : "Save Program"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}

export default Program;