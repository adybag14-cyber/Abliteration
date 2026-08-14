#pragma once

#include <cstdlib>
#include <filesystem>
#include <string>
#include <string_view>
#include <vector>

#if defined(_WIN32)
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#elif defined(__APPLE__)
#include <mach-o/dyld.h>
#include <cstdint>
#endif

namespace abliteration {

inline std::filesystem::path& exe_parent() {
  static std::filesystem::path p;
  return p;
}

inline void apply_exe_path(std::filesystem::path p) {
  if (p.empty()) return;
  std::error_code ec;
  if (!p.is_absolute()) {
    const auto abs = std::filesystem::absolute(p, ec);
    if (!ec) p = abs;
  }
  if (std::filesystem::is_symlink(p, ec)) {
    const auto c = std::filesystem::canonical(p, ec);
    if (!ec) p = c;
  } else {
    const auto c = std::filesystem::weakly_canonical(p, ec);
    if (!ec && !c.empty()) p = c;
  }
  exe_parent() = p.parent_path();
}

// Real executable path: Windows module name, Linux /proc/self/exe, macOS dyld.
// Empty if the platform query fails (caller may fall back to argv[0]).
[[nodiscard]] inline std::filesystem::path native_executable_path() {
#if defined(_WIN32)
  wchar_t buf[32768];
  const DWORD n = GetModuleFileNameW(nullptr, buf, static_cast<DWORD>(sizeof(buf) / sizeof(buf[0])));
  if (n == 0 || n >= static_cast<DWORD>(sizeof(buf) / sizeof(buf[0]))) return {};
  return std::filesystem::path(std::wstring(buf, buf + n));
#elif defined(__APPLE__)
  uint32_t size = 1;
  char probe[1]{};
  _NSGetExecutablePath(probe, &size);
  if (size == 0) return {};
  std::vector<char> buf(size);
  if (_NSGetExecutablePath(buf.data(), &size) != 0) return {};
  std::error_code ec;
  const auto abs = std::filesystem::absolute(buf.data(), ec);
  if (ec) return std::filesystem::path(buf.data());
  const auto c = std::filesystem::weakly_canonical(abs, ec);
  return ec ? abs : c;
#else
  std::error_code ec;
  auto p = std::filesystem::read_symlink("/proc/self/exe", ec);
  if (ec || p.empty()) return {};
  if (!p.is_absolute()) {
    const auto abs = std::filesystem::absolute(p, ec);
    if (!ec) p = abs;
  }
  return p;
#endif
}

inline void set_argv0(const char* argv0) {
  if (const auto n = native_executable_path(); !n.empty()) {
    apply_exe_path(n);
    return;
  }
  if (!argv0 || !*argv0) return;
  apply_exe_path(argv0);
}

inline void ensure_exe_parent() {
  if (!exe_parent().empty()) return;
  if (const auto n = native_executable_path(); !n.empty()) apply_exe_path(n);
}

inline bool is_examples(const std::filesystem::path& p) {
  return std::filesystem::exists(p / "tiny-bad.txt");
}

inline std::filesystem::path find_examples_dir() {
  if (const char* env = std::getenv("ABLITERATE_EXAMPLES")) {
    std::filesystem::path p(env);
    if (is_examples(p)) return std::filesystem::absolute(p);
  }
  ensure_exe_parent();
  const auto exe = exe_parent();
  if (!exe.empty()) {
    // zip/nightly next to the binary; source tree (exe in cxx/build);
    // cmake --install prefix/bin → prefix/share/abliterate-cxx/examples
    for (const auto& c : {exe / "examples", exe.parent_path() / "examples",
                          exe.parent_path() / "cxx" / "examples",
                          exe.parent_path().parent_path() / "examples",
                          exe.parent_path() / "share" / "abliterate-cxx" / "examples"}) {
      if (is_examples(c)) return std::filesystem::absolute(c);
    }
  }
  const std::vector<std::filesystem::path> cands = {
      "examples",
      "cxx/examples",
      "../examples",
      "../../cxx/examples",
      "../cxx/examples",
  };
  for (const auto& c : cands) {
    if (is_examples(c)) return std::filesystem::absolute(c);
  }
  return {};
}

// Nightly: exe/n, exe.parent/n. Then exe/docs/n. Then up to 3 parents
// (dir/n and dir/docs/n) so a repo build finds cxx/GETTING-STARTED.md and
// docs/cxx26-researcher-guide.md. Then cwd/n. Empty → caller prints basename.
inline std::filesystem::path find_shipped_file(std::string_view name) {
  const std::filesystem::path n{name};
  if (n.empty()) return {};
  ensure_exe_parent();
  const auto exe = exe_parent();
  std::vector<std::filesystem::path> cands;
  if (!exe.empty()) {
    cands.push_back(exe / n);
    cands.push_back(exe.parent_path() / n);
    cands.push_back(exe / "docs" / n);
    auto dir = exe;
    for (int i = 0; i < 3; ++i) {
      const auto parent = dir.parent_path();
      if (parent.empty() || parent == dir) break;
      dir = parent;
      cands.push_back(dir / n);
      cands.push_back(dir / "docs" / n);
    }
  }
  {
    std::error_code ec;
    const auto cwd = std::filesystem::current_path(ec);
    if (!ec) cands.push_back(cwd / n);
  }
  for (const auto& c : cands) {
    std::error_code ec;
    if (std::filesystem::is_regular_file(c, ec)) return std::filesystem::absolute(c);
  }
  return {};
}

// --jsonl: existing path; else examples/given; else strip a leading "examples/"
// (alien cwd still finds the toy); basename steal only when given has no parent.
// Otherwise return given unchanged so load_jsonl throws — do not score the toy
// for eval --jsonl no-such-dir/generations.jsonl.
inline std::filesystem::path resolve_eval_jsonl(std::string_view given) {
  std::filesystem::path p{given};
  std::error_code ec;
  if (!p.empty() && std::filesystem::exists(p, ec)) return std::filesystem::absolute(p);
  const auto ex = find_examples_dir();
  if (!ex.empty()) {
    const auto by_rel = ex / p;
    if (std::filesystem::exists(by_rel, ec)) return std::filesystem::absolute(by_rel);
    auto it = p.begin();
    if (it != p.end() && *it == std::filesystem::path("examples")) {
      std::filesystem::path rest;
      for (++it; it != p.end(); ++it) rest /= *it;
      if (!rest.empty()) {
        const auto stripped = ex / rest;
        if (std::filesystem::exists(stripped, ec)) return std::filesystem::absolute(stripped);
      }
    }
    if (!p.has_parent_path() && !p.filename().empty()) {
      const auto by_name = ex / p.filename();
      if (std::filesystem::exists(by_name, ec)) return std::filesystem::absolute(by_name);
    }
  }
  return p;
}

}  // namespace abliteration
