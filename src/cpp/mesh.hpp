#pragma once

#include "triangle.hpp"
#include "vertex.hpp"

#include <emscripten/val.h>
#include <vector>

class Mesh {
  public:
	std::vector<Vertex> vertices;
	std::vector<Triangle> triangles;

	Mesh(std::vector<Vertex> &vertices, std::vector<Triangle> &triangles);

	bool triangleFix(int face, int oldVertex, int newVertex);

	void fixNMEdges();

	std::string toObjString();

	std::string toPlyString(std::string quality = "");

	emscripten::val Float32ArrayOfVertices() const;

	emscripten::val Uint32ArrayOfTriangles() const;
	emscripten::val Float32ArrayOfTrianglesNormals() const;

	emscripten::val Float32ArrayOfGroupID() const;

	emscripten::val Float32ArrayOfUnipolar() const;
	emscripten::val Float32ArrayOfBipolar() const;
	emscripten::val Float32ArrayOfLAT() const;
	emscripten::val Float32ArrayOfEML() const;
	emscripten::val Float32ArrayOfExtEML() const;
	emscripten::val Float32ArrayOfSCAR() const;
};