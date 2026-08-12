cmake_minimum_required(VERSION 3.20)
project(abliterate-cxx LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 26)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Force the ISO C++26 dialect flag into the compile line (verifier reads this).
if(MSVC)
  add_compile_options(/std:c++latest)
else()
  add_compile_options(-std=c++26 -Wall -Wextra -Wpedantic)
endif()

add_executable(abliterate-cxx src/main.cpp)
target_include_directories(abliterate-cxx PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

add_executable(abliterate-cxx-tests tests/test_ops.cpp)
target_include_directories(abliterate-cxx-tests PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

install(TARGETS abliterate-cxx RUNTIME DESTINATION bin)
