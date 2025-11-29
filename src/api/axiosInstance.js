// axiosInstance.js
import axios from "axios";

const headers = {
    'Content-Type': 'multipart/form-data',
};

const axiosInstance = axios.create({
    baseURL: "https://danishgoheer.com/farevet_app/api.php", // Replace with your API's base URL
});

axiosInstance.interceptors.request.use(
    (config) => {
        // const token = window.localStorage.getItem("admin_token");
        // if (token) {
        config.headers["Content-Type"] = 'multipart/form-data'
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export { headers };
export default axiosInstance;
