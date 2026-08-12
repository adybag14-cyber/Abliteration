#pragma once

#include <cstdlib>
#include <iostream>
#include <string>
#include <string_view>

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <io.h>
#include <windows.h>
#else
#include <unistd.h>
#endif

namespace abliteration::ui {

inline bool stdout_tty() {
#ifdef _WIN32
  return _isatty(_fileno(stdout)) != 0;
#else
  return isatty(STDOUT_FILENO) != 0;
#endif
}

inline bool color_enabled() {
  if (std::getenv("NO_COLOR") != nullptr) return false;
  if (std::getenv("ABLITERATE_PLAIN") != nullptr) return false;
  if (std::getenv("CI") != nullptr) return false;
  if (const char* t = std::getenv("TERM"); t && std::string_view(t) == "dumb") return false;
  return stdout_tty();
}

#ifdef _WIN32
inline void enable_windows_vt() {
  HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);
  if (h == INVALID_HANDLE_VALUE) return;
  DWORD mode = 0;
  if (!GetConsoleMode(h, &mode)) return;
  SetConsoleMode(h, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}
#else
inline void enable_windows_vt() {}
#endif

inline const char* bold() { return color_enabled() ? "\033[1m" : ""; }
inline const char* dim() { return color_enabled() ? "\033[2m" : ""; }
inline const char* cyan() { return color_enabled() ? "\033[36m" : ""; }
inline const char* green() { return color_enabled() ? "\033[32m" : ""; }
inline const char* yellow() { return color_enabled() ? "\033[33m" : ""; }
inline const char* red() { return color_enabled() ? "\033[31m" : ""; }
inline const char* reset() { return color_enabled() ? "\033[0m" : ""; }

inline void banner() {
  std::cout << reset() << bold() << cyan()
            << "abliterate-cxx" << reset() << dim() << "  — ISO C++26 refusal-direction lab\n"
            << reset();
}

inline void hint(std::string_view s) {
  std::cout << dim() << "hint  " << reset() << s << '\n';
}

inline void next(std::string_view s) {
  std::cout << green() << "next  " << reset() << s << '\n';
}

inline void warn(std::string_view s) {
  std::cerr << yellow() << "warn  " << reset() << s << '\n';
}

inline void err(std::string_view s) {
  std::cerr << red() << "error " << reset() << s << '\n';
}

inline void die_hint(std::string_view err_s, std::string_view hint_s) {
  err(err_s);
  std::cerr << dim() << "hint  " << reset() << hint_s << '\n';
}

}  // namespace abliteration::ui
