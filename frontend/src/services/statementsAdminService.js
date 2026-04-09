import httpClient from "./api.js";

const BASE_URL = "/statements/admin/files";

export async function getAllStatementFiles() {
  const response = await httpClient.get(BASE_URL);
  return response.data;
}

export async function deleteStatementFile(statementId) {
  const response = await httpClient.delete(`${BASE_URL}/${statementId}`);
  return response.data;
}