import { useEffect, useState, useCallback } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Table,
    Button,
    Modal,
    Form,
    Badge,
    Spinner,
    Alert,
} from "react-bootstrap";
import { Plus, Pencil, Power } from "lucide-react";

import styles from "./Coordinator.module.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const EMPTY_FORM = {
    name: "",
    mobileNumber: "",
    qualification: "",
    subjects: "", // comma-separated in the UI, split into an array on submit
    areaLocalityId: "",
    studyCenterId: "",
    joiningDate: "",
    status: "Active",
};

function Coordinator() {
    const [coordinators, setCoordinators] = useState([]);
    const [areaLocalities, setAreaLocalities] = useState([]);
    const [studyCenters, setStudyCenters] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // NOTE: verify these two endpoint paths match your actual location/study-center routes.
    const fetchLookups = useCallback(async () => {
        try {
            const [localityRes, centerRes] = await Promise.all([
                fetch(`${BASE_URL}/locations/areas-localities`, { credentials: "include" }),
                fetch(`${BASE_URL}/study-centers`, { credentials: "include" }),
            ]);
            const localityJson = await localityRes.json();
            const centerJson = await centerRes.json();
            setAreaLocalities(localityJson.data || []);
            setStudyCenters(centerJson.data || []);
        } catch (err) {
            console.error("Failed to load lookups", err);
        }
    }, []);

    const fetchCoordinators = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${BASE_URL}/coordinators`, { credentials: "include" });
            const json = await res.json();
            if (!res.ok || json.success === false) {
                throw new Error(json?.error?.message || "Failed to fetch coordinators");
            }
            setCoordinators(json.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoordinators();
        fetchLookups();
    }, [fetchCoordinators, fetchLookups]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError("");
        setShowModal(true);
    };

    const openEditModal = (coordinator) => {
        setEditingId(coordinator._id);
        setForm({
            name: coordinator.name || "",
            mobileNumber: coordinator.mobileNumber || "",
            qualification: coordinator.qualification || "",
            subjects: (coordinator.subjects || []).join(", "),
            areaLocalityId: coordinator.areaLocalityId?._id || coordinator.areaLocalityId || "",
            studyCenterId: coordinator.studyCenterId?._id || coordinator.studyCenterId || "",
            joiningDate: coordinator.joiningDate
                ? coordinator.joiningDate.slice(0, 10)
                : "",
            status: coordinator.status || "Active",
        });
        setFormError("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError("");

        const payload = {
            name: form.name,
            mobileNumber: form.mobileNumber,
            qualification: form.qualification,
            subjects: form.subjects
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            areaLocalityId: form.areaLocalityId,
            studyCenterId: form.studyCenterId,
            joiningDate: form.joiningDate,
            status: form.status,
        };

        try {
            const url = editingId
                ? `${BASE_URL}/coordinators/${editingId}`
                : `${BASE_URL}/coordinators`;
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (!res.ok || json.success === false) {
                throw new Error(json?.error?.message || "Something went wrong");
            }

            await fetchCoordinators();
            setShowModal(false);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm("Deactivate this coordinator?")) return;
        try {
            const res = await fetch(`${BASE_URL}/coordinators/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const json = await res.json();
            if (!res.ok || json.success === false) {
                throw new Error(json?.error?.message || "Failed to deactivate");
            }
            await fetchCoordinators();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container fluid className={styles.wrapper}>
            <Row className="align-items-center mb-4">
                <Col>
                    <h2 className={styles.heading}>Coordinators</h2>
                    <p className={styles.subheading}>
                        Manage coordinator registration and status
                    </p>
                </Col>
                <Col xs="auto">
                    <Button variant="success" onClick={openCreateModal}>
                        <Plus size={16} className="me-1" />
                        Add Coordinator
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className={styles.card}>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="success" />
                        </div>
                    ) : coordinators.length === 0 ? (
                        <p className="text-muted text-center py-4 mb-0">
                            No coordinators registered yet.
                        </p>
                    ) : (
                        <Table responsive hover className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Mobile</th>
                                    <th>Qualification</th>
                                    <th>Locality</th>
                                    <th>Study Center</th>
                                    <th>Joining Date</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coordinators.map((c) => (
                                    <tr key={c._id}>
                                        <td>{c.name}</td>
                                        <td>{c.mobileNumber}</td>
                                        <td>{c.qualification || "—"}</td>
                                        <td>{c.areaLocalityId?.name || "—"}</td>
                                        <td>{c.studyCenterId?.name || "—"}</td>
                                        <td>
                                            {c.joiningDate
                                                ? new Date(c.joiningDate).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td>
                                            <Badge bg={c.status === "Active" ? "success" : "secondary"}>
                                                {c.status}
                                            </Badge>
                                        </td>
                                        <td className="text-end">
                                            <Button
                                                size="sm"
                                                variant="outline-secondary"
                                                className="me-2"
                                                onClick={() => openEditModal(c)}
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                disabled={c.status === "Inactive"}
                                                onClick={() => handleDeactivate(c._id)}
                                            >
                                                <Power size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingId ? "Edit Coordinator" : "Register Coordinator"}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {formError && <Alert variant="danger">{formError}</Alert>}

                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                minLength={2}
                                maxLength={100}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Mobile Number</Form.Label>
                            <Form.Control
                                name="mobileNumber"
                                value={form.mobileNumber}
                                onChange={handleChange}
                                required
                                pattern="[6-9]\d{9}"
                                title="10-digit mobile number starting with 6-9"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Qualification</Form.Label>
                            <Form.Control
                                name="qualification"
                                value={form.qualification}
                                onChange={handleChange}
                                maxLength={150}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Subjects (comma-separated)</Form.Label>
                            <Form.Control
                                name="subjects"
                                value={form.subjects}
                                onChange={handleChange}
                                placeholder="e.g. Quran, Arabic, Islamic Studies"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Area / Locality</Form.Label>
                            <Form.Select
                                name="areaLocalityId"
                                value={form.areaLocalityId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select locality</option>
                                {areaLocalities.map((loc) => (
                                    <option key={loc._id} value={loc._id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Study Center</Form.Label>
                            <Form.Select
                                name="studyCenterId"
                                value={form.studyCenterId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select study center</option>
                                {studyCenters.map((sc) => (
                                    <option key={sc._id} value={sc._id}>
                                        {sc.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Joining Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="joiningDate"
                                value={form.joiningDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={closeModal} disabled={saving}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit" disabled={saving}>
                            {saving ? "Saving..." : editingId ? "Save Changes" : "Register"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default Coordinator;