cmake_minimum_required(VERSION 3.25)
# Before project(): static CRT so MSVC nightlies do not need the VC++ redistributable.
if(POLICY CMP0091)
  cmake_policy(SET CMP0091 NEW)
endif()
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded" CACHE STRING "MSVC CRT: /MT" FORCE)
project(abliterate-cxx VERSION 1.1.0 LANGUAGES CXX)

set(CMAKE_CXX_EXTENSIONS OFF)
option(ABLITERATE_ENABLE_HARDENING "Enable platform exploit mitigations" ON)
option(ABLITERATE_ENABLE_SANITIZERS "Enable AddressSanitizer and UndefinedBehaviorSanitizer" OFF)
option(ABLITERATE_WARNINGS_AS_ERRORS "Treat compiler warnings as errors" OFF)

# ISO C++26 only. CMake's CXX26 feature table does not know MSVC yet, so we
# pass /std:c++latest ourselves. Headers still static_assert __cplusplus >= 202400L.
if(MSVC)
  add_compile_options(/std:c++latest /Zc:__cplusplus /permissive- /W4 /utf-8)
  if(ABLITERATE_ENABLE_HARDENING)
    add_compile_options(/GS /sdl /guard:cf)
    add_link_options(/DYNAMICBASE /NXCOMPAT /guard:cf)
  endif()
  if(ABLITERATE_WARNINGS_AS_ERRORS)
    add_compile_options(/WX)
  endif()
else()
  set(CMAKE_CXX_STANDARD 26)
  set(CMAKE_CXX_STANDARD_REQUIRED ON)
  add_compile_options(-std=c++26 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wsign-conversion)
  if(ABLITERATE_ENABLE_HARDENING)
    add_compile_options(-fstack-protector-strong)
    if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
      add_compile_definitions(_FORTIFY_SOURCE=3)
      add_link_options(-Wl,-z,relro,-z,now)
    endif()
  endif()
  if(ABLITERATE_ENABLE_SANITIZERS)
    if(NOT CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
      message(FATAL_ERROR "Sanitizers require Clang or GCC")
    endif()
    add_compile_options(-fsanitize=address,undefined -fno-omit-frame-pointer -fno-sanitize-recover=all)
    add_link_options(-fsanitize=address,undefined -fno-sanitize-recover=all)
  endif()
  if(ABLITERATE_WARNINGS_AS_ERRORS)
    add_compile_options(-Werror)
  endif()
endif()

if(UNIX AND NOT APPLE AND NOT ABLITERATE_ENABLE_SANITIZERS)
  # Portable binaries on glibc. Apple Clang/LLVM rejects -static-libgcc.
  add_link_options(-static-libstdc++ -static-libgcc)
elseif(MINGW)
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
install(FILES
  ${CMAKE_CURRENT_SOURCE_DIR}/README.md
  ${CMAKE_CURRENT_SOURCE_DIR}/GETTING-STARTED.md
  DESTINATION share/doc/abliterate-cxx)
install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/examples DESTINATION share/abliterate-cxx)

enable_testing()
add_test(NAME ops COMMAND abliterate-cxx-tests)
add_test(NAME selfcheck COMMAND abliterate-cxx self-check)
add_test(NAME dialect COMMAND abliterate-cxx-dialect)
set_tests_properties(ops selfcheck dialect PROPERTIES ENVIRONMENT "NO_COLOR=1")
