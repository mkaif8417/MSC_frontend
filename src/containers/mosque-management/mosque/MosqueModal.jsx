import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import axiosInstance from "../../../services/AxiosInstance";
import styles from "./MosqueModal.module.css";

// Handles fields that may come back either as a raw ObjectId string
// or as a populated object (e.g. { _id, name }).
const idOf = (value) => value?._id || value || undefined;

// Location flow: State -> Division -> Region -> District -> Taluka ->
// Village/City -> Area/Locality
const EMPTY_CHAIN = {
  stateId: undefined,
  divisionId: undefined,
  regionId: undefined,
  districtId: undefined,
  talukaId: undefined,
  villageCityId: undefined,
  areaLocalityId: undefined,
};

const LED_BY_OPTIONS = ["Govt Support", "Masjid Led", "Community Led"].map(
  (v) => ({ value: v, label: v })
);

const STUDY_CENTER_GRADE_OPTIONS = ["C", "C+", "B", "B+", "B++", "A", "A++"].map(
  (v) => ({ value: v, label: v })
);

const FACILITY_CONDITION_OPTIONS = ["Good", "Needs Repair", "Not Available"].map(
  (v) => ({ value: v, label: v })
);

const STAFF_ROLES = [
  { key: "khateeb", label: "Khateeb" },
  { key: "muazzin", label: "Muazzin" },
  { key: "assistantMuazzin", label: "Assistant Muazzin" },
  { key: "khadim", label: "Khadim" },
];

const FACILITY_FIELDS = [
  { key: "electricity", label: "Electricity" },
  { key: "fansAc", label: "Fans / AC" },
  { key: "lights", label: "Lights" },
  { key: "internetWifi", label: "Internet / WiFi" },
  { key: "drinkingWater", label: "Drinking Water" },
  { key: "toilets", label: "Toilets" },
  { key: "libraryBooks", label: "Library Books" },
];

function MosqueModal({
  open,
  mosqueData,
  areaLocalities,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  // Full lists loaded once per modal open, used to build each cascading
  // step (State -> Division -> Region -> District -> Taluka -> Village/City
  // -> Area/Locality).
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villageCities, setVillageCities] = useState([]);
  const [locationListsLoading, setLocationListsLoading] = useState(false);

  // Currently selected id at each step — drives which options the next
  // step shows, and which steps are enabled/disabled.
  const [chain, setChain] = useState(EMPTY_CHAIN);

  const isEdit = Boolean(mosqueData);

  // =========================
  // Load all location lists whenever the modal opens
  // =========================
  useEffect(() => {
    if (!open) return;

    const loadLocationLists = async () => {
      try {
        setLocationListsLoading(true);

        const commonParams = { page: 1, limit: 1000, isActive: true };
        // /locations/regions rejects limit > 100 (VALIDATION_ERROR), unlike
        // the other location endpoints — use a capped params object just
        // for this one call.
        const regionParams = { page: 1, limit: 100, isActive: true };

        const results = await Promise.allSettled([
          axiosInstance.get("/locations/states", { params: commonParams }),
          axiosInstance.get("/locations/divisions", { params: commonParams }),
          axiosInstance.get("/locations/regions", { params: regionParams }),
          axiosInstance.get("/locations/districts", { params: commonParams }),
          axiosInstance.get("/locations/talukas", { params: commonParams }),
          axiosInstance.get("/locations/villages-cities", { params: commonParams }),
        ]);

        const [
          statesRes,
          divisionsRes,
          regionsRes,
          districtsRes,
          talukasRes,
          villageCitiesRes,
        ] = results;

        const extractArray = (result) => {
          if (result.status !== "fulfilled") return [];
          const payload = result.value?.data?.data;
          return Array.isArray(payload) ? payload : [];
        };

        setStates(extractArray(statesRes));
        setDivisions(extractArray(divisionsRes));
        setRegions(extractArray(regionsRes));
        setDistricts(extractArray(districtsRes));
        setTalukas(extractArray(talukasRes));
        setVillageCities(extractArray(villageCitiesRes));

        const failedCount = results.filter(
          (r) => r.status === "rejected"
        ).length;

        if (failedCount > 0) {
          message.error(`Unable to load ${failedCount} location list(s).`);
        }
      } catch (error) {
        message.error("Unable to load location lists.");
      } finally {
        setLocationListsLoading(false);
      }
    };

    loadLocationLists();
  }, [open]);

  // =========================
  // Resolve the full ID chain backward from a chosen Area/Locality ID,
  // using the already-loaded lists. Used both by the quick-search box
  // and by edit mode (to pre-fill the seven selects).
  // =========================
  const resolveIdChainFromAreaLocalityId = (areaLocalityId) => {
    const areaLocality = (areaLocalities || []).find(
      (al) => al._id === areaLocalityId
    );
    const villageCityId = idOf(areaLocality?.villageCityId);

    const villageCity = villageCities.find((vc) => vc._id === villageCityId);
    const talukaId = idOf(villageCity?.talukaId);

    const taluka = talukas.find((t) => t._id === talukaId);
    const districtId = idOf(taluka?.districtId);

    const district = districts.find((d) => d._id === districtId);
    const regionId = idOf(district?.regionId);

    const region = regions.find((r) => r._id === regionId);
    const divisionId = idOf(region?.divisionId);
    const stateId = idOf(region?.stateId) || idOf(district?.stateId);

    return {
      stateId,
      divisionId,
      regionId,
      districtId,
      talukaId,
      villageCityId,
      areaLocalityId,
    };
  };

  // =========================
  // Populate form + chain when editing
  // =========================
  useEffect(() => {
    if (!open) return;

    if (mosqueData) {
      const areaLocalityId = idOf(mosqueData.areaLocalityId);

      const masjidStaffValues = {};
      STAFF_ROLES.forEach(({ key }) => {
        masjidStaffValues[key] = {
          name: mosqueData.masjidStaff?.[key]?.name || "",
          contactNumber: mosqueData.masjidStaff?.[key]?.contactNumber || "",
        };
      });

      const studyCenterFacilitiesValues = {};
      FACILITY_FIELDS.forEach(({ key }) => {
        studyCenterFacilitiesValues[key] = {
          available: mosqueData.studyCenterFacilities?.[key]?.available || false,
          condition:
            mosqueData.studyCenterFacilities?.[key]?.condition ||
            "Not Available",
        };
      });

      form.setFieldsValue({
        name: mosqueData.name || "",
        address: mosqueData.address || "",
        pincode: mosqueData.pincode || "",
        latitude:
          mosqueData.latitude !== undefined
            ? mosqueData.latitude
            : undefined,
        longitude:
          mosqueData.longitude !== undefined
            ? mosqueData.longitude
            : undefined,
        googleMapsUrl: mosqueData.googleMapsUrl || "",
        capacity:
          mosqueData.capacity !== undefined
            ? mosqueData.capacity
            : undefined,
        inchargeName: mosqueData.inchargeName || "",
        contactNumber: mosqueData.contactNumber || "",

        ledBy: mosqueData.ledBy || undefined,
        masjidStaff: masjidStaffValues,
        nearestUnemployedGraduatesAndDropouts:
          mosqueData.nearestUnemployedGraduatesAndDropouts || [],

        studyCenterName: mosqueData.studyCenterName || "",
        studyCenterStartDate: mosqueData.studyCenterStartDate
          ? dayjs(mosqueData.studyCenterStartDate)
          : undefined,
        studyCenterTablesCount:
          mosqueData.studyCenterTablesCount !== undefined
            ? mosqueData.studyCenterTablesCount
            : undefined,
        studyCenterChairsCount:
          mosqueData.studyCenterChairsCount !== undefined
            ? mosqueData.studyCenterChairsCount
            : undefined,
        studyCenterCapacity:
          mosqueData.studyCenterCapacity !== undefined
            ? mosqueData.studyCenterCapacity
            : undefined,
        studyCenterRoomsCount:
          mosqueData.studyCenterRoomsCount !== undefined
            ? mosqueData.studyCenterRoomsCount
            : undefined,
        studyCenterInchargeName: mosqueData.studyCenterInchargeName || "",
        studyCenterContactNumber: mosqueData.studyCenterContactNumber || "",
        studyCenterGrade: mosqueData.studyCenterGrade || undefined,
        studyCenterFacilities: studyCenterFacilitiesValues,
      });

      // Only resolvable once the lookup lists have actually loaded.
      if (
        areaLocalityId &&
        villageCities.length &&
        talukas.length &&
        districts.length &&
        regions.length &&
        divisions.length &&
        states.length
      ) {
        const resolvedIds = resolveIdChainFromAreaLocalityId(areaLocalityId);
        setChain(resolvedIds);
        form.setFieldsValue({
          stateId: resolvedIds.stateId,
          divisionId: resolvedIds.divisionId,
          regionId: resolvedIds.regionId,
          districtId: resolvedIds.districtId,
          talukaId: resolvedIds.talukaId,
          villageCityId: resolvedIds.villageCityId,
          areaLocalityId: resolvedIds.areaLocalityId,
        });
      }
    } else {
      form.resetFields();
      setChain(EMPTY_CHAIN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    mosqueData,
    villageCities,
    talukas,
    districts,
    regions,
    divisions,
    states,
    areaLocalities,
  ]);

  // =========================
  // Cascading options — each filtered by the step above it
  // =========================
  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s._id, label: s.name })),
    [states]
  );

  const divisionOptions = useMemo(
    () =>
      divisions
        .filter((d) => idOf(d.stateId) === chain.stateId)
        .map((d) => ({ value: d._id, label: d.name })),
    [divisions, chain.stateId]
  );

  const regionOptions = useMemo(
    () =>
      regions
        .filter((r) => idOf(r.divisionId) === chain.divisionId)
        .map((r) => ({ value: r._id, label: r.name })),
    [regions, chain.divisionId]
  );

  const districtOptions = useMemo(
    () =>
      districts
        .filter((d) => idOf(d.regionId) === chain.regionId)
        .map((d) => ({ value: d._id, label: d.name })),
    [districts, chain.regionId]
  );

  const talukaOptions = useMemo(
    () =>
      talukas
        .filter((t) => idOf(t.districtId) === chain.districtId)
        .map((t) => ({ value: t._id, label: t.name })),
    [talukas, chain.districtId]
  );

  const villageCityOptions = useMemo(
    () =>
      villageCities
        .filter((vc) => idOf(vc.talukaId) === chain.talukaId)
        .map((vc) => ({
          value: vc._id,
          label: vc.villageCityName || vc.name,
        })),
    [villageCities, chain.talukaId]
  );

  const areaLocalityOptions = useMemo(
    () =>
      (areaLocalities || [])
        .filter((al) => idOf(al.villageCityId) === chain.villageCityId)
        .map((al) => ({
          value: al._id,
          label: al.code ? `${al.name} (${al.code})` : al.name,
        })),
    [areaLocalities, chain.villageCityId]
  );

  // Unfiltered options for the quick-search box — searches every
  // Area/Locality's name AND code, regardless of what's picked below.
  const allAreaLocalityOptions = useMemo(
    () =>
      (areaLocalities || []).map((al) => ({
        value: al._id,
        label: al.code ? `${al.name} (${al.code})` : al.name,
      })),
    [areaLocalities]
  );

  // =========================
  // Step handlers — picking a step clears everything below it
  // =========================
  const handleStateChange = (value) => {
    setChain({ ...EMPTY_CHAIN, stateId: value });
    form.setFieldsValue({
      divisionId: undefined,
      regionId: undefined,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    });
  };

  const handleDivisionChange = (value) => {
    setChain((prev) => ({
      ...prev,
      divisionId: value,
      regionId: undefined,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    }));
    form.setFieldsValue({
      regionId: undefined,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    });
  };

  const handleRegionChange = (value) => {
    setChain((prev) => ({
      ...prev,
      regionId: value,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    }));
    form.setFieldsValue({
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    });
  };

  const handleDistrictChange = (value) => {
    setChain((prev) => ({
      ...prev,
      districtId: value,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    }));
    form.setFieldsValue({
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    });
  };

  const handleTalukaChange = (value) => {
    setChain((prev) => ({
      ...prev,
      talukaId: value,
      villageCityId: undefined,
      areaLocalityId: undefined,
    }));
    form.setFieldsValue({
      villageCityId: undefined,
      areaLocalityId: undefined,
    });
  };

  const handleVillageCityChange = (value) => {
    setChain((prev) => ({
      ...prev,
      villageCityId: value,
      areaLocalityId: undefined,
    }));
    form.setFieldsValue({ areaLocalityId: undefined });
  };

  const handleAreaLocalityChange = (value) => {
    setChain((prev) => ({ ...prev, areaLocalityId: value }));
  };

  // =========================
  // Quick search: pick an Area/Locality directly by name/code (e.g. "12"
  // for Shaheen_Colony, or "SH" for shaheen nagar) — auto-fills the whole
  // chain above it in one shot: State -> Division -> Region -> District ->
  // Taluka -> Village/City -> Area/Locality.
  // =========================
  const handleQuickAreaLocalitySearch = (value) => {
    if (!value) return;

    const resolvedIds = resolveIdChainFromAreaLocalityId(value);

    setChain(resolvedIds);
    form.setFieldsValue({
      stateId: resolvedIds.stateId,
      divisionId: resolvedIds.divisionId,
      regionId: resolvedIds.regionId,
      districtId: resolvedIds.districtId,
      talukaId: resolvedIds.talukaId,
      villageCityId: resolvedIds.villageCityId,
      areaLocalityId: resolvedIds.areaLocalityId,
    });
  };

  const handleQuickSearchClear = () => {
    setChain(EMPTY_CHAIN);
    form.setFieldsValue({
      stateId: undefined,
      divisionId: undefined,
      regionId: undefined,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
    });
  };

  // =========================
  // Live breadcrumb, built straight from the selects — no extra lookups
  // =========================
  const breadcrumb = useMemo(() => {
    const parts = [
      states.find((s) => s._id === chain.stateId)?.name,
      divisions.find((d) => d._id === chain.divisionId)?.name,
      regions.find((r) => r._id === chain.regionId)?.name,
      districts.find((d) => d._id === chain.districtId)?.name,
      talukas.find((t) => t._id === chain.talukaId)?.name,
      villageCities.find((vc) => vc._id === chain.villageCityId)
        ?.villageCityName ||
        villageCities.find((vc) => vc._id === chain.villageCityId)?.name,
      areaLocalities?.find((al) => al._id === chain.areaLocalityId)?.name,
    ].filter(Boolean);

    return parts.join(" › ");
  }, [
    chain,
    states,
    divisions,
    regions,
    districts,
    talukas,
    villageCities,
    areaLocalities,
  ]);

  // =========================
  // Submit — mosque fields unchanged, plus study-center / staff / ledBy /
  // unemployed-persons fields now merged into the same payload.
  // =========================
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        address: values.address.trim(),
        pincode: values.pincode.trim(),
        areaLocalityId: values.areaLocalityId,
      };

      if (
        values.latitude !== undefined &&
        values.latitude !== null &&
        values.latitude !== ""
      ) {
        payload.latitude = values.latitude;
      }

      if (
        values.longitude !== undefined &&
        values.longitude !== null &&
        values.longitude !== ""
      ) {
        payload.longitude = values.longitude;
      }

      if (values.googleMapsUrl?.trim()) {
        payload.googleMapsUrl = values.googleMapsUrl.trim();
      }

      if (
        values.capacity !== undefined &&
        values.capacity !== null &&
        values.capacity !== ""
      ) {
        payload.capacity = values.capacity;
      }

      if (values.inchargeName?.trim()) {
        payload.inchargeName = values.inchargeName.trim();
      }

      if (values.contactNumber?.trim()) {
        payload.contactNumber = values.contactNumber.trim();
      }

      // --- Led by ---
      if (values.ledBy) {
        payload.ledBy = values.ledBy;
      }

      // --- Masjid staff ---
      const masjidStaff = {};
      STAFF_ROLES.forEach(({ key }) => {
        const staff = values.masjidStaff?.[key];
        if (staff?.name?.trim() || staff?.contactNumber?.trim()) {
          masjidStaff[key] = {
            name: staff?.name?.trim() || undefined,
            contactNumber: staff?.contactNumber?.trim() || undefined,
          };
        }
      });
      if (Object.keys(masjidStaff).length) {
        payload.masjidStaff = masjidStaff;
      }

      // --- Nearby unemployed graduates / dropouts ---
      const unemployedPersons = (
        values.nearestUnemployedGraduatesAndDropouts || []
      ).filter((p) => p && p.name?.trim() && p.age !== undefined && p.contactNumber?.trim());
      if (unemployedPersons.length) {
        payload.nearestUnemployedGraduatesAndDropouts = unemployedPersons.map(
          (p) => ({
            name: p.name.trim(),
            age: p.age,
            contactNumber: p.contactNumber.trim(),
          })
        );
      }

      // --- Study Center fields ---
      if (values.studyCenterName?.trim()) {
        payload.studyCenterName = values.studyCenterName.trim();
      }
      if (values.studyCenterStartDate) {
        payload.studyCenterStartDate = values.studyCenterStartDate.toISOString();
      }
      if (
        values.studyCenterTablesCount !== undefined &&
        values.studyCenterTablesCount !== null &&
        values.studyCenterTablesCount !== ""
      ) {
        payload.studyCenterTablesCount = values.studyCenterTablesCount;
      }
      if (
        values.studyCenterChairsCount !== undefined &&
        values.studyCenterChairsCount !== null &&
        values.studyCenterChairsCount !== ""
      ) {
        payload.studyCenterChairsCount = values.studyCenterChairsCount;
      }
      if (
        values.studyCenterCapacity !== undefined &&
        values.studyCenterCapacity !== null &&
        values.studyCenterCapacity !== ""
      ) {
        payload.studyCenterCapacity = values.studyCenterCapacity;
      }
      if (
        values.studyCenterRoomsCount !== undefined &&
        values.studyCenterRoomsCount !== null &&
        values.studyCenterRoomsCount !== ""
      ) {
        payload.studyCenterRoomsCount = values.studyCenterRoomsCount;
      }
      if (values.studyCenterInchargeName?.trim()) {
        payload.studyCenterInchargeName = values.studyCenterInchargeName.trim();
      }
      if (values.studyCenterContactNumber?.trim()) {
        payload.studyCenterContactNumber = values.studyCenterContactNumber.trim();
      }
      if (values.studyCenterGrade) {
        payload.studyCenterGrade = values.studyCenterGrade;
      }

      const studyCenterFacilities = {};
      FACILITY_FIELDS.forEach(({ key }) => {
        const facility = values.studyCenterFacilities?.[key];
        if (facility) {
          studyCenterFacilities[key] = {
            available: !!facility.available,
            condition: facility.condition || "Not Available",
          };
        }
      });
      if (Object.keys(studyCenterFacilities).length) {
        payload.studyCenterFacilities = studyCenterFacilities;
      }

      let response;

      if (isEdit) {
        response = await axiosInstance.patch(
          `/locations/mosques/${mosqueData._id}`,
          payload
        );
      } else {
        response = await axiosInstance.post("/locations/mosques", payload);
      }

      if (response?.data?.success) {
        message.success(
          response?.data?.message ||
            `Mosque ${isEdit ? "updated" : "created"} successfully.`
        );

        form.resetFields();
        setChain(EMPTY_CHAIN);

        onSuccess();
      }
    } catch (error) {
      console.error("Mosque save error:", error);

      if (error?.code === "DUPLICATE_RESOURCE") {
        message.error(
          "A mosque with this name already exists in the selected area / locality."
        );
      } else {
        message.error(
          error?.message || "Unable to save mosque. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setChain(EMPTY_CHAIN);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Mosque" : "Register Mosque"}
      okText={isEdit ? "Update Mosque" : "Register Mosque"}
      cancelText="Cancel"
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className={styles.form}
      >
        <div className={styles.studyCenterModalDiv}>
          {/* ===== Quick search: know the area code? skip the cascade ===== */}
          <Form.Item label="Quick search (Area / Locality name or code)">
            <Select
              placeholder="e.g. type the code, like SH or 12"
              showSearch
              allowClear
              optionFilterProp="label"
              loading={locationListsLoading}
              options={allAreaLocalityOptions}
              onChange={handleQuickAreaLocalitySearch}
              onClear={handleQuickSearchClear}
            />
          </Form.Item>
          <div className={styles.quickSearchDivider}>
            or select step by step below
          </div>
          {/* ===== End quick search ===== */}

          {/* ===== Step-by-step location cascade ===== */}
          <div className={styles.locationSection}>
            <div className={styles.locationSectionTitle}>Location</div>

            <div className={styles.locationGrid}>
              <Form.Item
                label="State"
                name="stateId"
                rules={[{ required: true, message: "Select state." }]}
              >
                <Select
                  placeholder="Select state"
                  showSearch
                  optionFilterProp="label"
                  loading={locationListsLoading}
                  options={stateOptions}
                  onChange={handleStateChange}
                />
              </Form.Item>

              <Form.Item
                label="Division"
                name="divisionId"
                rules={[{ required: true, message: "Select division." }]}
              >
                <Select
                  placeholder="Select division"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={!chain.stateId}
                  options={divisionOptions}
                  onChange={handleDivisionChange}
                />
              </Form.Item>

              <Form.Item
                label="Region"
                name="regionId"
                rules={[{ required: true, message: "Select region." }]}
              >
                <Select
                  placeholder="Select region"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={!chain.divisionId}
                  options={regionOptions}
                  onChange={handleRegionChange}
                />
              </Form.Item>

              <Form.Item
                label="District"
                name="districtId"
                rules={[{ required: true, message: "Select district." }]}
              >
                <Select
                  placeholder="Select district"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={!chain.regionId}
                  options={districtOptions}
                  onChange={handleDistrictChange}
                />
              </Form.Item>

              <Form.Item
                label="Taluka"
                name="talukaId"
                rules={[{ required: true, message: "Select taluka." }]}
              >
                <Select
                  placeholder="Select taluka"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={!chain.districtId}
                  options={talukaOptions}
                  onChange={handleTalukaChange}
                />
              </Form.Item>

              <Form.Item
                label="Village / City"
                name="villageCityId"
                rules={[{ required: true, message: "Select village/city." }]}
              >
                <Select
                  placeholder="Select village / city"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={!chain.talukaId}
                  options={villageCityOptions}
                  onChange={handleVillageCityChange}
                />
              </Form.Item>

              <Form.Item
                label="Area / Locality"
                name="areaLocalityId"
                rules={[{ required: true, message: "Select area / locality." }]}
              >
                <Select
                  placeholder="Select area / locality"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={!chain.villageCityId}
                  options={areaLocalityOptions}
                  onChange={handleAreaLocalityChange}
                />
              </Form.Item>
            </div>

            {breadcrumb && (
              <div className={styles.locationBreadcrumb}>{breadcrumb}</div>
            )}
          </div>
          {/* ===== End location cascade ===== */}

          <Form.Item
            label="Mosque Name"
            name="name"
            rules={[{ required: true, message: "Please enter mosque name." }]}
          >
            <Input placeholder="Enter mosque name" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter address." }]}
          >
            <Input.TextArea rows={3} placeholder="Enter mosque address" />
          </Form.Item>

          <Form.Item
            label="Pincode"
            name="pincode"
            rules={[{ required: true, message: "Please enter pincode." }]}
          >
            <Input placeholder="Enter pincode" maxLength={6} />
          </Form.Item>

          <Form.Item label="Latitude" name="latitude">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter latitude"
              min={-90}
              max={90}
            />
          </Form.Item>

          <Form.Item label="Longitude" name="longitude">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter longitude"
              min={-180}
              max={180}
            />
          </Form.Item>

          <Form.Item label="Google Maps URL" name="googleMapsUrl">
            <Input placeholder="Enter Google Maps URL" />
          </Form.Item>

          <Form.Item label="Capacity" name="capacity">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter mosque capacity"
              min={0}
            />
          </Form.Item>

          <Form.Item label="In-charge Name" name="inchargeName">
            <Input placeholder="Enter in-charge name" />
          </Form.Item>

          <Form.Item label="Contact Number" name="contactNumber">
            <Input placeholder="Enter contact number" maxLength={15} />
          </Form.Item>

          <Form.Item label="Led By" name="ledBy">
            <Select
              placeholder="Select who leads/runs the mosque"
              allowClear
              options={LED_BY_OPTIONS}
            />
          </Form.Item>

          {/* ===== Masjid staff ===== */}
          <Divider orientation="left" plain>
            Masjid Staff
          </Divider>

          <div className={styles.locationGrid}>
            {STAFF_ROLES.map(({ key, label }) => (
              <div key={key} style={{ display: "flex", gap: 8 }}>
                <Form.Item
                  label={`${label} Name`}
                  name={["masjidStaff", key, "name"]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder={`Enter ${label.toLowerCase()} name`} />
                </Form.Item>

                <Form.Item
                  label={`${label} Contact`}
                  name={["masjidStaff", key, "contactNumber"]}
                  style={{ flex: 1 }}
                >
                  <Input
                    placeholder="Contact number"
                    maxLength={15}
                  />
                </Form.Item>
              </div>
            ))}
          </div>

          {/* ===== Nearby unemployed graduates / dropouts ===== */}
          <Divider orientation="left" plain>
            Nearby Unemployed Graduates / Dropouts
          </Divider>

          <Form.List name="nearestUnemployedGraduatesAndDropouts">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{ display: "flex", gap: 8, alignItems: "baseline" }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label="Name"
                      style={{ flex: 2 }}
                      rules={[{ required: true, message: "Name required." }]}
                    >
                      <Input placeholder="Full name" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, "age"]}
                      label="Age"
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: "Age required." }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        max={120}
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, "contactNumber"]}
                      label="Contact"
                      style={{ flex: 2 }}
                      rules={[
                        { required: true, message: "Contact required." },
                      ]}
                    >
                      <Input placeholder="Contact number" maxLength={15} />
                    </Form.Item>

                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    block
                  >
                    Add Person
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* ===== Study Center details ===== */}
          <Divider orientation="left" plain>
            Study Center Details
          </Divider>

          <Form.Item label="Study Center Name" name="studyCenterName">
            <Input placeholder="Enter study center name" />
          </Form.Item>

          <Form.Item label="Start Date" name="studyCenterStartDate">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <div className={styles.locationGrid}>
            <Form.Item label="Tables Count" name="studyCenterTablesCount">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item label="Chairs Count" name="studyCenterChairsCount">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item label="Seating Capacity" name="studyCenterCapacity">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item label="Rooms Count" name="studyCenterRoomsCount">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </div>

          <Form.Item
            label="Study Center In-charge Name"
            name="studyCenterInchargeName"
          >
            <Input placeholder="Enter in-charge name" />
          </Form.Item>

          <Form.Item
            label="Study Center Contact Number"
            name="studyCenterContactNumber"
          >
            <Input placeholder="Enter contact number" maxLength={15} />
          </Form.Item>

          <Form.Item label="Grade" name="studyCenterGrade">
            <Select
              placeholder="Select grade"
              allowClear
              options={STUDY_CENTER_GRADE_OPTIONS}
            />
          </Form.Item>

          {/* ===== Facilities ===== */}
          <Divider orientation="left" plain>
            Facilities
          </Divider>

          {FACILITY_FIELDS.map(({ key, label }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 12,
              }}
            >
              <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>

              <Form.Item
                name={["studyCenterFacilities", key, "available"]}
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="Available" unCheckedChildren="No" />
              </Form.Item>

              <Form.Item
                name={["studyCenterFacilities", key, "condition"]}
                style={{ marginBottom: 0, width: 180 }}
              >
                <Select
                  placeholder="Condition"
                  options={FACILITY_CONDITION_OPTIONS}
                />
              </Form.Item>
            </div>
          ))}
        </div>
      </Form>
    </Modal>
  );
}

export default MosqueModal;