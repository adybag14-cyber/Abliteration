#pragma once

#include <cstdlib>
#include <memory>
#include <optional>
#include <string>
#include <string_view>

namespace abliteration {

/** Read an environment variable without exposing a borrowed CRT buffer. */
[[nodiscard]] inline std::optional<std::string> environment_value(std::string_view name) {
  const std::string key{name};
#if defined(_WIN32)
  char* raw = nullptr;
  std::size_t length = 0;
  const errno_t result = _dupenv_s(&raw, &length, key.c_str());
  const std::unique_ptr<char, decltype(&std::free)> owned(raw, &std::free);
  if (result != 0 || owned == nullptr) return std::nullopt;
  return std::string(owned.get());
#else
  const char* raw = std::getenv(key.c_str());
  if (raw == nullptr) return std::nullopt;
  return std::string(raw);
#endif
}

[[nodiscard]] inline bool environment_set(std::string_view name) {
  return environment_value(name).has_value();
}

}  // namespace abliteration
