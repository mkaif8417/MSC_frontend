import { useEffect, useMemo, useState } from "react";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  message,
} from "antd";
import dayjs from "dayjs";
import axiosInstance from "../../services/AxiosInstance";
import styles from "./StudyCenterModal.module.css";

const facilityOptions = [
  { key: "electricity", label: "Electricity" },
  { key: "fansAc", label: "Fans / AC" },
  { key: "lights", label: "Lights" },
  { key: "internetWifi", label: "Internet / WiFi" },
  { key: "drinkingWater", label: "Drinking Water" },
  { key: "toilets", label: "Toilets" },
  { key: "libraryBooks", label: "Library Books" },
];

const conditionOptions = [
  { value: "Good", label: "Good" },
  { value: "Needs Repair", label: "Needs Repair" },
  { value: "Not Available", label: "Not Available" },
];

const gradeOptions = [
  { value: "C", label: "C" },
  { value: "C+", label: "C+" },
  { value: "B", label: "B" },
  { value: "B+", label: "B+" },
  { value: "B++", label: "B++" },
  { value: "A", label: "A" },
  { value: "A++", label: "A++" },
];

// Handles fields that may come back either as a raw ObjectId string
// or as a populated object (e.g. { _id, name }).
const idOf = (value) => value?._id || value || undefined;

const EMPTY_CHAIN = {
  stateId: undefined,
  divisionId: undefined,
  districtId: undefined,
  talukaId: undefined,
  villageCityId: undefined,
  areaLocalityId: undefined,
  mosqueId: undefined,
};

function StudyCenterModal({
  open,
  studyCenterData,
  mosques,
  areaLocalities,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);

  // Full location lists, loaded once per modal open — same pattern as
  // the mosque registration cascade.
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villageCities, setVillageCities] = useState([]);
  const [locationListsLoading, setLocationListsLoading] = useState(false);

  // Currently selected id at each step, including the final Mosque step.
  const [chain, setChain] = useState(EMPTY_CHAIN);

  const isEdit = Boolean(studyCenterData);

  // ---------------------------------------------------------
  // LOAD LOCATION LISTS (State/Division/District/Taluka/VillageCity)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    const loadLocationLists = async () => {
      try {
        setLocationListsLoading(true);

        const commonParams = { page: 1, limit: 1000, isActive: true };

        const results = await Promise.allSettled([
          axiosInstance.get("/locations/states", { params: commonParams }),
          axiosInstance.get("/locations/divisions", { params: commonParams }),
          axiosInstance.get("/locations/districts", { params: commonParams }),
          axiosInstance.get("/locations/talukas", { params: commonParams }),
          axiosInstance.get("/locations/villages-cities", { params: commonParams }),
        ]);

        const [statesRes, divisionsRes, districtsRes, talukasRes, villageCitiesRes] = results;

        const extractArray = (result) => {
          if (result.status !== "fulfilled") return [];
          const payload = result.value?.data?.data;
          return Array.isArray(payload) ? payload : [];
        };

        setStates(extractArray(statesRes));
        setDivisions(extractArray(divisionsRes));
        setDistricts(extractArray(districtsRes));
        setTalukas(extractArray(talukasRes));
        setVillageCities(extractArray(villageCitiesRes));

        const failedCount = results.filter((r) => r.status === "rejected").length;
        if (failedCount > 0) {
          messageApi.error(`Unable to load ${failedCount} location list(s).`);
        }
      } catch (error) {
        messageApi.error("Unable to load location lists.");
      } finally {
        setLocationListsLoading(false);
      }
    };

    loadLocationLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ---------------------------------------------------------
  // RESOLVE FULL ID CHAIN BACKWARD FROM A MOSQUE ID
  // ---------------------------------------------------------
  const resolveIdChainFromMosqueId = (mosqueId) => {
    const mosque = (mosques || []).find((m) => m._id === mosqueId);
    const areaLocalityId = idOf(mosque?.areaLocalityId);

    const areaLocality = (areaLocalities || []).find((al) => al._id === areaLocalityId);
    const villageCityId = idOf(areaLocality?.villageCityId);

    const villageCity = villageCities.find((vc) => vc._id === villageCityId);
    const talukaId = idOf(villageCity?.talukaId);

    const taluka = talukas.find((t) => t._id === talukaId);
    const districtId = idOf(taluka?.districtId);

    const district = districts.find((d) => d._id === districtId);
    const divisionId = idOf(district?.divisionId);
    const stateId = idOf(district?.stateId);

    return {
      stateId,
      divisionId,
      districtId,
      talukaId,
      villageCityId,
      areaLocalityId,
      mosqueId,
    };
  };

  // ---------------------------------------------------------
  // SET FORM DATA
  // ---------------------------------------------------------
  useEffect(() => {
    if (!open) {
      return;
    }

    if (studyCenterData) {
      const facilities = studyCenterData?.facilities || {};

      const facilityFormData = {};

      facilityOptions.forEach((facility) => {
        const facilityData = facilities?.[facility.key];

        facilityFormData[facility.key] = {
          available: facilityData?.available ?? false,
          condition: facilityData?.condition || "Not Available",
        };
      });

      const resolvedMosqueId =
        typeof studyCenterData?.mosqueId === "object"
          ? studyCenterData?.mosqueId?._id
          : studyCenterData?.mosqueId;

      form.setFieldsValue({
        name: studyCenterData?.name || "",
        startDate: studyCenterData?.startDate ? dayjs(studyCenterData.startDate) : null,
        tablesCount: studyCenterData?.tablesCount ?? 0,
        chairsCount: studyCenterData?.chairsCount ?? 0,
        capacity: studyCenterData?.capacity ?? 0,
        roomsCount: studyCenterData?.roomsCount ?? 0,
        inchargeName: studyCenterData?.inchargeName || "",
        contactNumber: studyCenterData?.contactNumber || "",
        grade: studyCenterData?.grade || undefined,
        facilities: facilityFormData,
      });

      // Only resolvable once the lookup lists have actually loaded.
      if (
        resolvedMosqueId &&
        villageCities.length &&
        talukas.length &&
        districts.length &&
        divisions.length &&
        states.length &&
        areaLocalities?.length
      ) {
        const resolvedIds = resolveIdChainFromMosqueId(resolvedMosqueId);
        setChain(resolvedIds);
        form.setFieldsValue({
          stateId: resolvedIds.stateId,
          divisionId: resolvedIds.divisionId,
          districtId: resolvedIds.districtId,
          talukaId: resolvedIds.talukaId,
          villageCityId: resolvedIds.villageCityId,
          areaLocalityId: resolvedIds.areaLocalityId,
          mosqueId: resolvedIds.mosqueId,
        });
      }
    } else {
      const defaultFacilities = {};

      facilityOptions.forEach((facility) => {
        defaultFacilities[facility.key] = {
          available: false,
          condition: "Not Available",
        };
      });

      setChain(EMPTY_CHAIN);

      form.setFieldsValue({
        name: "",
        stateId: undefined,
        divisionId: undefined,
        districtId: undefined,
        talukaId: undefined,
        villageCityId: undefined,
        areaLocalityId: undefined,
        mosqueId: undefined,
        startDate: null,
        tablesCount: 0,
        chairsCount: 0,
        capacity: 0,
        roomsCount: 0,
        inchargeName: "",
        contactNumber: "",
        grade: undefined,
        facilities: defaultFacilities,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studyCenterData, form, villageCities, talukas, districts, divisions, states, areaLocalities, mosques]);

  // ---------------------------------------------------------
  // CASCADING OPTIONS
  // ---------------------------------------------------------
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

  const districtOptions = useMemo(
    () =>
      districts
        .filter((d) => idOf(d.divisionId) === chain.divisionId)
        .map((d) => ({ value: d._id, label: d.name })),
    [districts, chain.divisionId]
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
        .map((vc) => ({ value: vc._id, label: vc.villageCityName || vc.name })),
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

  const mosqueOptions = useMemo(
    () =>
      (mosques || [])
        .filter((m) => idOf(m.areaLocalityId) === chain.areaLocalityId)
        .map((m) => ({
          value: m._id,
          label: m.code ? `${m.name} (${m.code})` : m.name,
        })),
    [mosques, chain.areaLocalityId]
  );

  // Unfiltered options for the quick-search box — searches every mosque
  // by name AND code, regardless of what's picked in the cascade below.
  const allMosqueOptions = useMemo(
    () =>
      (mosques || []).map((m) => ({
        value: m._id,
        label: m.code ? `${m.name} (${m.code})` : m.name,
      })),
    [mosques]
  );

  // ---------------------------------------------------------
  // STEP HANDLERS — picking a step clears everything below it
  // ---------------------------------------------------------
  const handleStateChange = (value) => {
    setChain({ ...EMPTY_CHAIN, stateId: value });
    form.setFieldsValue({
      divisionId: undefined,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    });
  };

  const handleDivisionChange = (value) => {
    setChain((prev) => ({
      ...prev,
      divisionId: value,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    }));
    form.setFieldsValue({
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    });
  };

  const handleDistrictChange = (value) => {
    setChain((prev) => ({
      ...prev,
      districtId: value,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    }));
    form.setFieldsValue({
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    });
  };

  const handleTalukaChange = (value) => {
    setChain((prev) => ({
      ...prev,
      talukaId: value,
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    }));
    form.setFieldsValue({
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    });
  };

  const handleVillageCityChange = (value) => {
    setChain((prev) => ({
      ...prev,
      villageCityId: value,
      areaLocalityId: undefined,
      mosqueId: undefined,
    }));
    form.setFieldsValue({ areaLocalityId: undefined, mosqueId: undefined });
  };

  const handleAreaLocalityChange = (value) => {
    setChain((prev) => ({ ...prev, areaLocalityId: value, mosqueId: undefined }));
    form.setFieldsValue({ mosqueId: undefined });
  };

  const handleMosqueChange = (value) => {
    setChain((prev) => ({ ...prev, mosqueId: value }));
  };

  // ---------------------------------------------------------
  // QUICK SEARCH — pick a Mosque directly by name/code, auto-fills
  // the whole chain above it: State -> ... -> Area/Locality -> Mosque.
  // ---------------------------------------------------------
  const handleQuickMosqueSearch = (value) => {
    if (!value) return;

    const resolvedIds = resolveIdChainFromMosqueId(value);

    setChain(resolvedIds);
    form.setFieldsValue({
      stateId: resolvedIds.stateId,
      divisionId: resolvedIds.divisionId,
      districtId: resolvedIds.districtId,
      talukaId: resolvedIds.talukaId,
      villageCityId: resolvedIds.villageCityId,
      areaLocalityId: resolvedIds.areaLocalityId,
      mosqueId: resolvedIds.mosqueId,
    });
  };

  const handleQuickSearchClear = () => {
    setChain(EMPTY_CHAIN);
    form.setFieldsValue({
      stateId: undefined,
      divisionId: undefined,
      districtId: undefined,
      talukaId: undefined,
      villageCityId: undefined,
      areaLocalityId: undefined,
      mosqueId: undefined,
    });
  };

  // ---------------------------------------------------------
  // LIVE BREADCRUMB
  // ---------------------------------------------------------
  const breadcrumb = useMemo(() => {
    const parts = [
      states.find((s) => s._id === chain.stateId)?.name,
      divisions.find((d) => d._id === chain.divisionId)?.name,
      districts.find((d) => d._id === chain.districtId)?.name,
      talukas.find((t) => t._id === chain.talukaId)?.name,
      villageCities.find((vc) => vc._id === chain.villageCityId)?.villageCityName ||
        villageCities.find((vc) => vc._id === chain.villageCityId)?.name,
      areaLocalities?.find((al) => al._id === chain.areaLocalityId)?.name,
      mosques?.find((m) => m._id === chain.mosqueId)?.name,
    ].filter(Boolean);

    return parts.join(" › ");
  }, [chain, states, divisions, districts, talukas, villageCities, areaLocalities, mosques]);

  // ---------------------------------------------------------
  // BUILD FACILITIES PAYLOAD
  // ---------------------------------------------------------
  const buildFacilitiesPayload = (facilities = {}) => {
    const payload = {};

    facilityOptions.forEach((facility) => {
      const facilityData = facilities?.[facility.key] || {};

      payload[facility.key] = {
        available: Boolean(facilityData?.available),
        condition: facilityData?.condition || "Not Available",
      };
    });

    return payload;
  };

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name?.trim(),
        tablesCount: values.tablesCount ?? 0,
        chairsCount: values.chairsCount ?? 0,
        capacity: values.capacity ?? 0,
        roomsCount: values.roomsCount ?? 0,
        inchargeName: values.inchargeName?.trim() || undefined,
        contactNumber: values.contactNumber?.trim() || undefined,
        grade: values.grade || undefined,
        facilities: buildFacilitiesPayload(values.facilities),
      };

      // Mosque ID is required only while creating.
      if (!isEdit) {
        payload.mosqueId = values.mosqueId;
      }

      // Actual backend field is startDate.
      if (values.startDate) {
        payload.startDate = values.startDate.format("YYYY-MM-DD");
      }

      let response;

      if (isEdit) {
        response = await axiosInstance.patch(`/study-centers/${studyCenterData._id}`, payload);
      } else {
        response = await axiosInstance.post("/study-centers", payload);
      }

      if (response?.data?.success) {
        messageApi.success(
          response?.data?.message ||
            (isEdit ? "Study Center updated successfully." : "Study Center created successfully.")
        );

        setChain(EMPTY_CHAIN);
        onSuccess();
      }
    } catch (error) {
      console.error("Study center submit error:", error);

      const errorData = error?.response?.data;
      const errorCode = errorData?.error?.code || error?.code;

      if (errorCode === "DUPLICATE_RESOURCE") {
        messageApi.error("A study center already exists for the selected mosque.");
        return;
      }

      if (errorCode === "VALIDATION_ERROR") {
        const details = errorData?.error?.details || error?.details || [];

        if (Array.isArray(details) && details.length > 0) {
          details.forEach((detail) => {
            messageApi.error(detail?.message || "Please check the entered values.");
          });
        } else {
          messageApi.error(errorData?.message || error?.message || "Please check the entered values.");
        }

        return;
      }

      messageApi.error(errorData?.message || error?.message || "Unable to save study center. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setChain(EMPTY_CHAIN);
    onClose();
  };

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={isEdit ? "Edit Study Center" : "Add Study Center"}
        okText={isEdit ? "Update" : "Create"}
        cancelText="Cancel"
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={loading}
        destroyOnHidden
        width={800}
      >
        <Form form={form} layout="vertical" className={styles.form} onFinish={handleSubmit}>
          {/* SCROLLABLE MODAL CONTENT */}
          <div className={styles.studyCenterModalDiv}>

            {/* NAME */}
            <Form.Item
              label="Study Center Name"
              name="name"
              rules={[{ required: true, message: "Please enter study center name." }]}
            >
              <Input placeholder="Enter study center name" maxLength={100} />
            </Form.Item>

            {/* QUICK SEARCH: know the mosque code? skip the cascade */}
            {!isEdit && (
              <>
                <Form.Item label="Quick search (Mosque name or code)">
                  <Select
                    placeholder="e.g. type the code, like SH-01"
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    loading={locationListsLoading}
                    options={allMosqueOptions}
                    onChange={handleQuickMosqueSearch}
                    onClear={handleQuickSearchClear}
                  />
                </Form.Item>
                <div className={styles.quickSearchDivider}>or select step by step below</div>
              </>
            )}

            {/* STEP-BY-STEP LOCATION + MOSQUE CASCADE */}
            <div className={styles.locationSection}>
              <div className={styles.locationSectionTitle}>Location & Mosque</div>

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
                    disabled={isEdit}
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
                    disabled={isEdit || !chain.stateId}
                    options={divisionOptions}
                    onChange={handleDivisionChange}
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
                    disabled={isEdit || !chain.divisionId}
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
                    disabled={isEdit || !chain.districtId}
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
                    disabled={isEdit || !chain.talukaId}
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
                    disabled={isEdit || !chain.villageCityId}
                    options={areaLocalityOptions}
                    onChange={handleAreaLocalityChange}
                  />
                </Form.Item>
              </div>

              {/* MOSQUE — final step, full width */}
              <Form.Item
                label="Mosque"
                name="mosqueId"
                rules={[{ required: true, message: "Please select a mosque." }]}
              >
                <Select
                  placeholder="Select mosque"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  disabled={isEdit || !chain.areaLocalityId}
                  options={mosqueOptions}
                  onChange={handleMosqueChange}
                />
              </Form.Item>

              {breadcrumb && <div className={styles.locationBreadcrumb}>{breadcrumb}</div>}
            </div>
            {/* END CASCADE */}

            {/* START DATE */}
            <Form.Item label="Start Date" name="startDate">
              <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
            </Form.Item>

            {/* TABLES */}
            <Form.Item label="Tables Count" name="tablesCount">
              <InputNumber style={{ width: "100%" }} min={0} placeholder="Enter tables count" />
            </Form.Item>

            {/* CHAIRS */}
            <Form.Item label="Chairs Count" name="chairsCount">
              <InputNumber style={{ width: "100%" }} min={0} placeholder="Enter chairs count" />
            </Form.Item>

            {/* CAPACITY */}
            <Form.Item label="Seating Capacity" name="capacity">
              <InputNumber style={{ width: "100%" }} min={0} placeholder="Enter seating capacity" />
            </Form.Item>

            {/* ROOMS */}
            <Form.Item label="Rooms Count" name="roomsCount">
              <InputNumber style={{ width: "100%" }} min={0} placeholder="Enter rooms count" />
            </Form.Item>

            {/* INCHARGE */}
            <Form.Item label="Incharge Name" name="inchargeName">
              <Input placeholder="Enter incharge name" maxLength={100} />
            </Form.Item>

            {/* CONTACT */}
            <Form.Item label="Contact Number" name="contactNumber">
              <Input placeholder="Enter contact number" maxLength={20} />
            </Form.Item>

            {/* GRADE */}
            <Form.Item label="Grade" name="grade">
              <Select placeholder="Select grade" allowClear options={gradeOptions} />
            </Form.Item>

            {/* FACILITIES */}
            <div className={styles.facilitiesSection}>
              <h3 className={styles.sectionTitle}>Facilities</h3>

              {facilityOptions.map((facility) => (
                <div key={facility.key} className={styles.facilityItem}>
                  <div className={styles.facilityHeader}>
                    <span className={styles.facilityName}>{facility.label}</span>

                    <Form.Item
                      name={["facilities", facility.key, "available"]}
                      valuePropName="checked"
                      className={styles.facilityField}
                      noStyle
                    >
                      <Switch checkedChildren="Available" unCheckedChildren="Not Available" />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label="Condition"
                    name={["facilities", facility.key, "condition"]}
                    className={styles.facilityField}
                    rules={[{ required: true, message: "Please select facility condition." }]}
                  >
                    <Select options={conditionOptions} />
                  </Form.Item>
                </div>
              ))}
            </div>

          </div>
        </Form>
      </Modal>
    </>
  );
}

export default StudyCenterModal;