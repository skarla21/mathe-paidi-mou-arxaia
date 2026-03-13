export function useTheme() {
  const themeCookie = useCookie<"light" | "dark">("theme", {
    default: () => "light",
    sameSite: "lax",
  });

  const colorMode = useState<"light" | "dark">(
    "theme",
    () => themeCookie.value ?? "light",
  );

  function apply(mode: "light" | "dark") {
    colorMode.value = mode;
    themeCookie.value = mode;
    if (import.meta.client && document.documentElement) {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(mode);
    }
  }

  function toggle() {
    const next = colorMode.value === "dark" ? "light" : "dark";
    apply(next);
    return next;
  }

  function init() {
    if (import.meta.client) {
      apply(colorMode.value);
    }
  }

  return { colorMode: readonly(colorMode), apply, toggle, init };
}
