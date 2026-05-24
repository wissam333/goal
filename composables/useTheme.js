export const useTheme = () => {
  const primaryColor = useState("primaryColor", () => "#22c55e");

  const palettes = [
    { label: "Green", value: "#22c55e" },
    { label: "Red", value: "#ef4444" },
    { label: "Blue", value: "#3b82f6" },
    { label: "Purple", value: "#8b5cf6" },
    { label: "Orange", value: "#f97316" },
    { label: "Teal", value: "#14b8a6" },
  ];

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const applyPrimaryColor = (color) => {
    if (!import.meta.client) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", color);
    root.style.setProperty("--primary-soft", hexToRgba(color, 0.1));
    root.style.setProperty("--primary-mid", hexToRgba(color, 0.2));
    localStorage.setItem("theme-primary-color", color);
  };

  const setColor = (color) => {
    primaryColor.value = color;
    applyPrimaryColor(color);
  };

  const init = () => {
    if (!import.meta.client) return;
    const savedColor = localStorage.getItem("theme-primary-color") || "#22c55e";
    primaryColor.value = savedColor;
    applyPrimaryColor(savedColor);
  };

  return { primaryColor, palettes, setColor, init };
};
