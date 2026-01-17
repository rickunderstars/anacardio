cmake_minimum_required(VERSION 3.13)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

project(heart VERSION 1.0)

set(SRC
    src/cpp/globals.hpp
    src/cpp/mesh.hpp
    src/cpp/utils.hpp
    src/cpp/vertex.hpp
    src/cpp/triangle.hpp
    src/cpp/globals.cpp
    src/cpp/main.cpp
    src/cpp/mesh.cpp
    src/cpp/utils.cpp
    src/cpp/triangle.cpp
    src/cpp/vertex.cpp
    src/cpp/bindings.cpp
)

add_executable(heart.out ${SRC})

if(DEFINED ENV{GLM_INCLUDE_DIR})
    target_include_directories(heart.out PRIVATE $ENV{GLM_INCLUDE_DIR})
else()
    find_path(GLM_INCLUDE_DIR glm/glm.hpp)
    if(GLM_INCLUDE_DIR)
        target_include_directories(heart.out PRIVATE ${GLM_INCLUDE_DIR})
    else()
        message(FATAL_ERROR "GLM not found.")
    endif()
endif()

if(EMSCRIPTEN)
    if(DEFINED ENV{BOOST_INCLUDE_DIR})
        target_include_directories(heart.out PRIVATE $ENV{BOOST_INCLUDE_DIR})
    else()
        find_path(BOOST_INCLUDE_DIR boost/algorithm/string.hpp)
        if(BOOST_INCLUDE_DIR)
            target_include_directories(heart.out PRIVATE ${BOOST_INCLUDE_DIR})
        else()
            message(FATAL_ERROR "Boost not found.")
        endif()
    endif()
else()
    find_package(Boost REQUIRED)
    target_include_directories(heart.out PRIVATE ${Boost_INCLUDE_DIRS})
    target_link_libraries(heart.out ${Boost_LIBRARIES})
endif()

if(EMSCRIPTEN)
    set_target_properties(heart.out PROPERTIES
        SUFFIX ".js"
        LINK_FLAGS "\
            -s WASM=1 \
            -s MODULARIZE=1 \
            -s EXPORT_NAME='HeartModule' \
            -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','HEAPF32'] \
			-s NO_DISABLE_EXCEPTION_CATCHING=1 \
            -s ALLOW_MEMORY_GROWTH=1 \
            -s USE_WEBGL2=1 \
            -s FULL_ES3=1 \
            --bind"
    )
endif()
