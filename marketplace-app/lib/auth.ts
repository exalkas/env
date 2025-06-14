import { jwtDecode } from "jwt-decode";

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  kyc_verified: boolean;
  subscription_type: string;
}

interface AuthToken {
  access_token: string;
  token_type: string;
}

export const login = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const response = await fetch(
      "http://localhost:8000/api/v1/auth/user-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email, // FastAPI OAuth2 uses 'username' for the email
          password,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();

    // Store the token in localStorage
    localStorage.setItem("token", data.access_token);

    // Return the user data from the response
    return data.user;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};

export const logout = (): void => {
  localStorage.removeItem("token");
};

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decodedToken: any = jwtDecode(token);
    return decodedToken.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getUserFromToken = (): User | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decodedToken: any = jwtDecode(token);
    // The token only contains user ID, we would need to fetch complete user data
    // from a /users/me endpoint in a real application
    return {
      id: parseInt(decodedToken.sub),
      email: "", // This would come from a /users/me endpoint
      full_name: "",
      is_active: true,
      is_admin: false,
      kyc_verified: false,
      subscription_type: "",
    };
  } catch {
    return null;
  }
};

export const getAuthHeader = (): { Authorization: string } | undefined => {
  if (typeof window === "undefined") return undefined;

  const token = localStorage.getItem("token");
  if (!token) return undefined;

  return {
    Authorization: `Bearer ${token}`,
  };
};
