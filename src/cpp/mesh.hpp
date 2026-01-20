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
	emscripten::val
	Float32ArrayOfTangentFieldSegments(std::string quality,
									   float iqrThreshold) const;

	emscripten::val Float32ArrayOfVerticesValues(std::string quality) const;
};