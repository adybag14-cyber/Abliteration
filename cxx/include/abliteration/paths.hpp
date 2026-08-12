#pragma once

#include <cstdlib>
#include <filesystem>
#include <string>
#include <vector>

namespace abliteration {

inline std::filesystem::path& exe_parent() {
  static std::filesystem::path p;
  return p;
}

inline void set_argv0(const char* argv0) {
  if (!argv0 || !*argv0) return;
  std::error_code ec;
  auto p = std::filesystem::absolute(argv0, ec);
  if (ec) return;
  if (std::filesystem::is_symlink(p, ec)) {
    const auto c = std::filesystem::canonical(p, ec);
    if (!ec) p = c;
  }
  exe_parent() = p.parent_path();
}

inline bool is_examples(const std::filesystem::path& p) {
  return std::filesystem::exists(p / "tiny-bad.txt");
}

inline std::filesystem::path find_examples_dir() {
  if (const char* env = std::getenv("ABLITERATE_EXAMPLES")) {
    std::filesystem::path p(env);
    if (is_examples(p)) return std::filesystem::absolute(p);
  }
  const auto exe = exe_parent();
  if (!exe.empty()) {
    for (const auto& c : {exe / "examples", exe.parent_path() / "examples",
                          exe.parent_path() / "cxx" / "examples"}) {
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

}  // namespace abliteration
