#pragma once

#include <cstdlib>
#include <filesystem>
#include <string>
#include <vector>

namespace abliteration {

inline std::filesystem::path find_examples_dir() {
  if (const char* env = std::getenv("ABLITERATE_EXAMPLES")) {
    std::filesystem::path p(env);
    if (std::filesystem::exists(p / "tiny-bad.txt")) return p;
  }
  const std::vector<std::filesystem::path> cands = {
      "examples",
      "cxx/examples",
      "../examples",
      "../../cxx/examples",
      "../cxx/examples",
  };
  for (const auto& c : cands) {
    if (std::filesystem::exists(c / "tiny-bad.txt")) return std::filesystem::absolute(c);
  }
  return {};
}

}  // namespace abliteration
