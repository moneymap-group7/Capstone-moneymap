import api from "./api";

export async function fetchCategories() {
  const res = await api.get("/categories");
  return res.data;
}
