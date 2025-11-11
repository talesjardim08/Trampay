import { API_URL } from "../api";

/**
 * Cadastro de novo usuário
 */
export async function registerUser(form) {
  const payload = {
    accountType: form.accountType,
    documentType: form.accountType === "pf" ? "CPF" : "CNPJ",
    documentNumber: form.documentNumber,
    legalName: form.legalName,
    displayName: form.displayName,
    birthDate: new Date().toISOString(), 
    email: form.email,
    phone: form.phone,
    addressStreet: form.addressStreet || "",
    addressNumber: form.addressNumber || "",
    addressComplement: form.addressComplement || "",
    addressNeighborhood: form.addressNeighborhood || "",
    addressCity: form.addressCity,
    addressState: form.addressState,
    addressZip: form.addressZip || "",
    senha: form.password, // ⚠️ o backend espera "senha"
  };

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    // Tenta converter em JSON (evita o erro "Unexpected end of input")
    try {
      return JSON.parse(text);
    } catch {
      return { error: true, message: "Erro inesperado: resposta vazia do servidor", raw: text };
    }
  } catch (error) {
    return { error: true, message: error.message };
  }
}

/**
 * Login de usuário
 */
export async function loginUser(email, senha) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }), // backend usa "Email" e "Senha" no DTO
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: true, message: "Erro inesperado na resposta do servidor", raw: text };
    }
  } catch (error) {
    return { error: true, message: error.message };
  }
}

/**
 * Solicitação de redefinição de senha
 */
export async function forgotPassword(email) {
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: true, message: "Erro inesperado na resposta do servidor", raw: text };
    }
  } catch (error) {
    return { error: true, message: error.message };
  }
}

/**
 * Redefinição de senha com token
 */
export async function resetPassword(token, newPassword) {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: true, message: "Erro inesperado na resposta do servidor", raw: text };
    }
  } catch (error) {
    return { error: true, message: error.message };
  }
}