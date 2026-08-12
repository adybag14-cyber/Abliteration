#include <iostream>

int main() {
  std::cout << "cplusplus=" << __cplusplus << '\n';
#if defined(__clang__)
  std::cout << "compiler=clang " << __clang_major__ << '.' << __clang_minor__ << '\n';
#elif defined(__GNUC__)
  std::cout << "compiler=gcc " << __GNUC__ << '.' << __GNUC_MINOR__ << '\n';
#elif defined(_MSC_VER)
  std::cout << "compiler=msvc " << _MSC_VER << '\n';
#else
  std::cout << "compiler=unknown\n";
#endif
  return (__cplusplus >= 202400L) ? 0 : 1;
}
