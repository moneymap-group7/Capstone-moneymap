export default function Spinner({ label = "Loading..." }) {
  return (
    <div style={{ padding: 16 }}>
      <span>{label}</span>
    </div>
  );
}