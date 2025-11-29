import axiosInstance from './axiosInstance'

export const apiRequest = async ({ body }) => {
    return await axiosInstance.post('', body)
        .then((res) => {
            return res.data;
        })
        .catch((err) => {
            console.error("API Error:", err?.response ? err.response.data : err.message);
            return null;
        });
};
