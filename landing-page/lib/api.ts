import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://localhost:8000/api";

export const fetchUserData = async (): Promise<any> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        ...authHeader,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const updateUserProfile = async (userData: any): Promise<any> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Failed to update user data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

export const startKycVerification = async (kycData: any): Promise<any> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/kyc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(kycData),
    });

    if (!response.ok) {
      throw new Error("Failed to start KYC verification");
    }

    return await response.json();
  } catch (error) {
    console.error("Error starting KYC verification:", error);
    throw error;
  }
};
