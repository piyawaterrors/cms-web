import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

const config = {
  headers: {
    "content-type": "application/json",
  },
};

// เพิ่ม Interceptor เพื่อใส่ Token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handle401 = () => {
  localStorage.clear();
  window.location.href = "/";
};

const handleError = (error) => {
  if (error?.response) {
    console.groupEnd();
  } else if (error?.request) {
    console.log("API Network Error (No Response):", error.request);
  } else {
    console.log("API Request Setup Error:", error.message);
  }

  if (error?.response?.status === 401) {
    handle401();
  }

  throw error;
};

export const DownloadZip = async (url, name) => {
  try {
    const res = await axios.get(`${API_URL}${url}`, {
      ...config,
      headers: { ...config.headers, Accept: "application/zip" },
      responseType: "blob",
    });

    const fileUrl = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", `${name}.zip`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(fileUrl);

    return res;
  } catch (error) {
    handleError(error);
  }
};

export const DownloadExcel = async (url, fileName) => {
  try {
    const res = await axios.get(`${API_URL}${url}`, {
      ...config,
      headers: {
        ...config.headers,
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      responseType: "blob",
    });

    const fileUrl = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", `${fileName}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(fileUrl);

    return { status: 200, success: true };
  } catch (error) {
    handleError(error);
  }
};

export const DownloadCSV = async (url, params, fileName) => {
  try {
    const res = await axios.get(`${API_URL}${url}`, {
      ...config,
      params,
      headers: {
        ...config.headers,
        Accept: "text/csv",
      },
      responseType: "blob",
    });

    const fileUrl = window.URL.createObjectURL(
      new Blob([res.data], { type: "text/csv" }),
    );
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(fileUrl);

    return { status: 200, success: true };
  } catch (error) {
    handleError(error);
  }
};

export const Post = async (url, data) => {
  try {
    const isFormData = data instanceof FormData;
    const requestConfig = isFormData
      ? {
          ...config,
          headers: { "content-type": "multipart/form-data" },
          withCredentials: true,
        }
      : config;
    return await axios.post(`${API_URL}${url}`, data, requestConfig);
  } catch (error) {
    if (url === "/auth/admin/login") {
      return error;
    }
    handleError(error);
  }
};

export const Get = async (url) => {
  try {
    return await axios.get(`${API_URL}${url}`, config);
  } catch (error) {
    handleError(error);
  }
};

export const GetSearch = async (url, data) => {
  try {
    return await axios.get(`${API_URL}${url}`, { ...config, ...data });
  } catch (error) {
    handleError(error);
  }
};

export const Patch = async (url, data) => {
  try {
    const isFormData = data instanceof FormData;
    const requestConfig = isFormData
      ? {
          ...config,
          headers: { "content-type": "multipart/form-data" },
          withCredentials: true,
        }
      : config;
    return await axios.patch(`${API_URL}${url}`, data, requestConfig);
  } catch (error) {
    handleError(error);
  }
};

export const Update = async (url, data) => {
  try {
    const isFormData = data instanceof FormData;
    const requestConfig = isFormData
      ? {
          ...config,
          headers: { "content-type": "multipart/form-data" },
          withCredentials: true,
        }
      : config;
    return await axios.put(`${API_URL}${url}`, data, requestConfig);
  } catch (error) {
    handleError(error);
  }
};

export const Delete = async (url) => {
  try {
    return await axios.delete(`${API_URL}${url}`, config);
  } catch (error) {
    handleError(error);
  }
};
