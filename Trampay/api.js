const API_URL = "https://trampay-backend.onrender.com";

export async function registerUser(data) {
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Erro ao registrar usuário");
    }
    return res.json();
  } catch (error) {
    console.error("registerUser error:", error.message);
    return { error: error.message };
  }
}

export async function loginUser(data) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Erro ao logar usuário");
    }
    return res.json();
  } catch (error) {
    console.error("loginUser error:", error.message);
    return { error: error.message };
  }
}
