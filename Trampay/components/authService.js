import { API_URL } from "../api";

/**
 * Cadastro de novo usuário
 */
export async function registerUser(form) {
  const payload = {
    AccountType: form.accountType,
    DocumentType: form.accountType === "pf" ? "CPF" : "CNPJ",
    DocumentNumber: form.documentNumber,
    LegalName: form.legalName,
    DisplayName: form.displayName || null,
    BirthDate: form.birthDate || new Date().toISOString(),
    Email: form.email,
    Phone: form.phone,
    AddressStreet: form.addressStreet || null,
    AddressNumber: form.addressNumber || null,
    AddressComplement: form.addressComplement || null,
    AddressNeighborhood: form.addressNeighborhood || null,
    AddressCity: form.addressCity,
    AddressState: form.addressState,
    AddressZip: form.addressZip || null,
    Senha: form.password, // ⚠️ nome exato do backend (C#)
  };

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
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
      body: JSON.stringify({ Email: email, Senha: senha }), // C# é case-sensitive
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
      body: JSON.stringify({ Email: email }), // letra maiúscula conforme DTO C#
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
      body: JSON.stringify({ Token: token, NewPassword: newPassword }),
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