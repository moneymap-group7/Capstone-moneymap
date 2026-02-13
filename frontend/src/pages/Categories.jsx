import { useEffect, useMemo, useState } from "react";
import { fetchCategories } from "../services/categoriesService";
import CategoryDropdown from "../components/CategoryDropdown";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Optional: make it nicer (sort)
  const sorted = useMemo(() => {
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [categories]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchCategories();
        if (!mounted) return;

        setCategories(data);
        setSelected((prev) => prev || data[0] || "");
      } catch (err) {
        console.error("Failed to load categories:", err);

        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load categories";
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading categories...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 10 }}>Categories</h2>

      {error ? (
        <div style={{ color: "red" }}>Error: {error}</div>
      ) : (
        <>
          <CategoryDropdown
            categories={sorted}
            value={selected}
            onChange={setSelected}
            label="Select a category"
          />

          <div style={{ marginTop: 16 }}>
            <div>
              Selected: <b>{selected}</b>
            </div>

            <h3 style={{ marginTop: 18 }}>All Categories</h3>
            <ul style={{ lineHeight: "1.8" }}>
              {sorted.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
