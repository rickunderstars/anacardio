#include "mesh.hpp"
#include "triangle.hpp"
#include "utils.hpp"
#include "vertex.hpp"

#include <boost/algorithm/string.hpp>
#include <boost/algorithm/string/constants.hpp>
#include <cstdint>
#include <emscripten/val.h>
#include <glm/detail/qualifier.hpp>
#include <glm/ext/vector_float3.hpp>
#include <glm/geometric.hpp>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <vector>

Mesh::Mesh(std::vector<Vertex> &vertices, std::vector<Triangle> &triangles) {
	this->vertices = vertices;
	this->triangles = triangles;
}

std::string Mesh::toObjString() {
	std::ostringstream oss;
	oss << "# Obj file converted from proprietary mesh format";
	oss << "\n\n############\n# vertices #\n############\n\n";
	for (int i = 0; i < vertices.size(); i++) {
		oss << vertices.at(i).toObj() << "\n";
	}
	oss << "\n\n\n############\n# triangles #\n############\n\n";
	for (int i = 0; i < triangles.size(); i++) {
		oss << triangles.at(i).toObj() << "\n";
	}
	return oss.str();
}

std::string Mesh::toPlyString(std::string quality) {
	std::ostringstream oss;

	oss << "ply\nformat ascii 1.0\n";
	oss << "comment Ply file converted from proprietary mesh format\n";
	oss << "element vertex " << vertices.size() << "\n";
	oss << "property float x\nproperty float y\nproperty float "
		   "z\n";
	oss << "property float quality\n";
	oss << "element face " << triangles.size() << "\n";
	oss << "property list uchar int vertex_indices\n";
	oss << "end_header\n";

	for (int i = 0; i < vertices.size(); i++) {
		oss << vertices.at(i).toPly(quality) << "\n";
	}
	for (int i = 0; i < triangles.size(); i++) {
		oss << triangles.at(i).toPly() << "\n";
	}

	return oss.str();
}

bool Mesh::triangleFix(int face, int oldVertex, int newVertex) {
	if (face < 0 || face >= triangles.size()) {
		std::cout << "Face " << face << " out of bounds (0-"
				  << triangles.size() - 1 << ")";
		return false;
	}
	int v = -1;
	for (int i = 0; i < 3; i++) {
		if (oldVertex == triangles.at(face).vertices.at(i)) {
			v = i;
		}
	}
	if (v < 0) {
		std::cout << "Vertex " << oldVertex << " is not in face " << face
				  << ": (" << triangles.at(face).vertices.at(0) << ", "
				  << triangles.at(face).vertices.at(1) << ", "
				  << triangles.at(face).vertices.at(2) << " )";
		return false;
	}
	if (newVertex < 0 || newVertex >= vertices.size()) {
		std::cout << "Vertex " << newVertex << " out of bounds (0-"
				  << vertices.size() - 1 << ")";
		return false;
	}

	triangles.at(face).vertices.at(v) = newVertex;

	return true;
}

void Mesh::fixNMEdges() {
	int healthy = 0;
	for (int i = 0; i < triangles.size(); i++) {
		if (triangles.at(i).groupID != -1000000) {
			healthy++;
		}
	}

	std::vector<Triangle> newTris(healthy);

	for (int i = 0, k = 0; i < triangles.size(); i++) {
		if (triangles.at(i).groupID != -1000000) {
			newTris.at(k) = Triangle(triangles.at(i).vertices);
			newTris.at(k).groupID = triangles.at(i).groupID;
			k++;
		}
	}

	triangles = newTris;
}

emscripten::val Mesh::Float32ArrayOfVertices() const {
	std::vector<float> positions;
	positions.reserve(vertices.size() * 3);

	for (const auto &v : vertices) {
		positions.push_back(v.pos.x);
		positions.push_back(v.pos.y);
		positions.push_back(v.pos.z);
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(positions.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								positions.size(), positions.data())));

	return float32Array;
}

emscripten::val Mesh::Uint32ArrayOfTriangles() const {
	std::vector<uint32_t> indices;
	indices.reserve(triangles.size() * 3);

	for (const auto &t : triangles) {
		indices.push_back(static_cast<uint32_t>(t.vertices.at(0)));
		indices.push_back(static_cast<uint32_t>(t.vertices.at(1)));
		indices.push_back(static_cast<uint32_t>(t.vertices.at(2)));
	}

	emscripten::val uint32Array =
		emscripten::val::global("Uint32Array").new_(indices.size());

	uint32Array.call<void>("set", emscripten::val(emscripten::typed_memory_view(
									  indices.size(), indices.data())));

	return uint32Array;
}

emscripten::val Mesh::Float32ArrayOfTrianglesNormals() const {
	std::vector<float> normals;
	normals.reserve(triangles.size() * 3);

	for (const auto &t : triangles) {

		glm::vec3 v0 = vertices.at(t.vertices.at(0)).pos;
		glm::vec3 v1 = vertices.at(t.vertices.at(1)).pos;
		glm::vec3 v2 = vertices.at(t.vertices.at(2)).pos;

		glm::vec3 e1 = v1 - v0;
		glm::vec3 e2 = v2 - v0;

		glm::vec3 normal = glm::normalize(glm::cross(e1, e2));

		normals.push_back(normal.x);
		normals.push_back(normal.y);
		normals.push_back(normal.z);
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(normals.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>(
		"set", emscripten::val(emscripten::typed_memory_view(normals.size(),
															 normals.data())));

	return float32Array;
}

emscripten::val Mesh::Float32ArrayOfUnipolar() const {
	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	for (const auto &v : vertices) {
		valuesArray.push_back(v.unipolar);
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}

emscripten::val Mesh::Float32ArrayOfBipolar() const {
	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	for (const auto &v : vertices) {
		valuesArray.push_back(v.bipolar);
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}

emscripten::val Mesh::Float32ArrayOfLAT() const {
	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	for (const auto &v : vertices) {
		valuesArray.push_back(v.LAT);
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}

emscripten::val Mesh::Float32ArrayOfEML() const {
	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	for (const auto &v : vertices) {
		valuesArray.push_back(static_cast<float>(v.EML));
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}

emscripten::val Mesh::Float32ArrayOfExtEML() const {
	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	for (const auto &v : vertices) {
		valuesArray.push_back(static_cast<float>(v.ExtEML));
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}

emscripten::val Mesh::Float32ArrayOfSCAR() const {
	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	for (const auto &v : vertices) {
		valuesArray.push_back(static_cast<float>(v.SCAR));
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}
emscripten::val Mesh::Float32ArrayOfGroupID() const {
	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	for (const auto &v : vertices) {
		valuesArray.push_back(static_cast<float>(v.groupID));
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());
	emscripten::val memory = emscripten::val::module_property("HEAPF32");

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}
