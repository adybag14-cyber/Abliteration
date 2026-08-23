(() => {
  try {
    const stored = localStorage.getItem("abliteration-theme");
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", stored === "dark" || (!stored && prefersDark));
  } catch {
    document.documentElement.classList.remove("dark");
  }
})();
