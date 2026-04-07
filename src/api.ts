const API_URL = "/api";

const getAuthToken = () => localStorage.getItem("auth_token");
const getGoogleId = () => localStorage.getItem("google_id");

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const googleId = getGoogleId();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(googleId ? { "x-google-id": googleId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("google_id");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }
  return response.json();
};

export const signup = async (userData: any) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Signup failed");
  }
  return response.json();
};

export const login = async (credentials: any) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }
  return response.json();
};

export const getGoogleAuthUrl = async () => {
  const response = await fetch(`${API_URL}/auth/google/url`);
  return response.json();
};

export const getUserProfile = async () => {
  return fetchWithAuth("/user/profile");
};

export const updateUserProfile = async (userData: any) => {
  return fetchWithAuth("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(userData),
  });
};

export const getProjects = async () => {
  return fetchWithAuth("/projects");
};

export const addProject = async (projectData: any) => {
  return fetchWithAuth("/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  });
};

export const updateProject = async (projectId: string, projectData: any) => {
  return fetchWithAuth(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(projectData),
  });
};

export const deleteProject = async (projectId: string) => {
  return fetchWithAuth(`/projects/${projectId}`, {
    method: "DELETE",
  });
};

export const submitMentalHealthCheckin = async (checkinData: any) => {
  return fetchWithAuth("/user/profile", {
    method: "PATCH",
    body: JSON.stringify({
      mentalHealthCheckin: {
        ...checkinData,
        lastCheckin: new Date()
      }
    }),
  });
};

export const updateDSAProgress = async (dsaProgress: any) => {
  return fetchWithAuth("/user/profile", {
    method: "PATCH",
    body: JSON.stringify({ dsaProgress }),
  });
};

export const submitFeedback = async (feedbackData: any) => {
  return fetchWithAuth("/feedback", {
    method: "POST",
    body: JSON.stringify(feedbackData),
  });
};

export const getFeedbacks = async () => {
  return fetchWithAuth("/feedback");
};
