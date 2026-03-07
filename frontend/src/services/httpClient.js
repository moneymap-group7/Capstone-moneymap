import axios from "axios";

const httpClient = axios.create({
  baseURL: "http://localhost:3000",
});

httpClient.interceptors.request.use((config) => {
  const token =
<<<<<<< HEAD
    localStorage.getItem("mm_access_token") ||
    localStorage.getItem("token") ||    
=======
    localStorage.getItem("token") ||
>>>>>>> origin/main
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default httpClient;