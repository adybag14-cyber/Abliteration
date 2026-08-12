cmake_minimum_required(VERSION 3.20)
project(abliterate-cxx VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_EXTENSIONS OFF)

# ISO C++26 only. CMake's CXX26 feature table does not know MSVC yet, so we
# pass /std:c++latest ourselves. Headers still static_assert __cplusplus >= 202400L.
if(MSVC)
  add_compile_options(/std:c++latest /Zc:__cplusplus /permissive- /W4)
else()
  set(CMAKE_CXX_STANDARD 26)
  set(CMAKE_CXX_STANDARD_REQUIRED ON)
  add_compile_options(-std=c++26 -Wall -Wextra -Wpedantic)
endif()

if(NOT MSVC)
  # Portable binaries on glibc hosts (Linux/MinGW).
  add_link_options(-static-libstdc++ -static-libgcc)
endif()

set(ABLITERATE_TARGET "${CMAKE_SYSTEM_NAME}-${CMAKE_SYSTEM_PROCESSOR}" CACHE STRING "packaging triple")

add_executable(abliterate-cxx src/main.cpp)
target_include_directories(abliterate-cxx PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_definitions(abliterate-cxx PRIVATE
  ABLITERATE_VERSION="${PROJECT_VERSION}"
  ABLITERATE_TARGET="${ABLITERATE_TARGET}"
)

add_executable(abliterate-cxx-tests tests/test_ops.cpp)
target_include_directories(abliterate-cxx-tests PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

add_executable(abliterate-cxx-dialect tools/dialect.cpp)

install(TARGETS abliterate-cxx RUNTIME DESTINATION bin)
install(FILES ${CMAKE_CURRENT_SOURCE_DIR}/README.md DESTINATION share/doc/abliterate-cxx)

enable_testing()
add_test(NAME ops COMMAND abliterate-cxx-tests)
add_test(NAME selfcheck COMMAND abliterate-cxx self-check)
add_test(NAME dialect COMMAND abliterate-cxx-dialect)
