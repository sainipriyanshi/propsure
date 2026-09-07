// a look up table map one value to another
const statusStyles = {
  "Verified": { bg: "#e6f4ea", color: "#1e7e34" },
  "Documents pending": { bg: "#fff4e5", color: "#b26a00" },
  "Action required": { bg: "#fde8e8", color: "#c62828" }
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || { bg: "#eee", color: "#333" }; //style => js obj
  return (
      {status}
  );
}