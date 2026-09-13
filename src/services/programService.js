import axiosInstance from "./AxiosInstance";

const programService = {
    getAll: (filters = {}) =>
        axiosInstance.get("/programs", {
            params: filters,
        }),

    getById: (id) => axiosInstance.get(`/programs/${id}`),

    create: (payload) => axiosInstance.post("/programs", payload),

    update: (id, payload) => axiosInstance.put(`/programs/${id}`, payload),

    remove: (id) => axiosInstance.delete(`/programs/${id}`),
};

export default programService;