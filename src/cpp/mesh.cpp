#include "mesh.hpp"
#include "globals.hpp"
#include "triangle.hpp"
#include "utils.hpp"
#include "vertex.hpp"

#include <algorithm>
#include <boost/algorithm/string.hpp>
#include <boost/algorithm/string/constants.hpp>
#include <cctype>
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

emscripten::val
Mesh::Float32ArrayOfTangentFieldSegments(std::string quality) const {

	std::transform(quality.begin(), quality.end(), quality.begin(),
				   [](unsigned char c) { return std::tolower(c); });

	std::vector<float> segments;
	segments.reserve(triangles.size() * 6);

	auto floatIterator = floatVertexValueMap.find(quality);
	if (floatIterator != floatVertexValueMap.end()) {
		auto valuePointer = floatIterator->second;
		for (const auto &t : triangles) {
			Vertex v0 = vertices.at(t.vertices.at(0));
			Vertex v1 = vertices.at(t.vertices.at(1));
			Vertex v2 = vertices.at(t.vertices.at(2));

			glm::vec3 e1 = v1.pos - v0.pos;
			glm::vec3 e2 = v2.pos - v0.pos;

			glm::vec3 barycenter = (v0.pos + v1.pos + v2.pos) / 3.0f;
			glm::vec3 n = glm::normalize(glm::cross(e1, e2));

			float d1 = v1.*valuePointer - v0.*valuePointer;
			float d2 = v2.*valuePointer - v0.*valuePointer;

			glm::vec3 gradientVector =
				(d1 * (glm::cross(e2, n)) + d2 * (glm::cross(n, e1))) /
				glm::length(glm::cross(e1, e2));

			glm::vec3 secondPoint = barycenter + gradientVector * 3.0f;

			segments.push_back(barycenter.x);
			segments.push_back(barycenter.y);
			segments.push_back(barycenter.z);
			segments.push_back(secondPoint.x);
			segments.push_back(secondPoint.y);
			segments.push_back(secondPoint.z);
		}
	} else {
		auto intIterator = intVertexValueMap.find(quality);
		if (intIterator != intVertexValueMap.end()) {
			auto valuePointer = intIterator->second;
			for (const auto &t : triangles) {
				Vertex v0 = vertices.at(t.vertices.at(0));
				Vertex v1 = vertices.at(t.vertices.at(1));
				Vertex v2 = vertices.at(t.vertices.at(2));

				glm::vec3 e1 = v1.pos - v0.pos;
				glm::vec3 e2 = v2.pos - v0.pos;

				glm::vec3 barycenter = (v0.pos + v1.pos + v2.pos) / 3.0f;
				glm::vec3 n = glm::normalize(glm::cross(e1, e2));

				float d1 = static_cast<float>(v1.*valuePointer) -
						   static_cast<float>(v0.*valuePointer);
				float d2 = static_cast<float>(v2.*valuePointer) -
						   static_cast<float>(v0.*valuePointer);

				glm::vec3 gradientVector =
					(d1 * (glm::cross(e2, n)) + d2 * (glm::cross(n, e1))) /
					glm::length(glm::cross(e1, e2));

				glm::vec3 secondPoint =
					barycenter + glm::normalize(gradientVector);

				segments.push_back(barycenter.x);
				segments.push_back(barycenter.y);
				segments.push_back(barycenter.z);
				segments.push_back(secondPoint.x);
				segments.push_back(secondPoint.y);
				segments.push_back(secondPoint.z);
			}
		} else {
			throw std::runtime_error("Quality '" + quality +
									 "' was not found in global maps.");
		}
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(segments.size());

	float32Array.call<void>(
		"set", emscripten::val(emscripten::typed_memory_view(segments.size(),
															 segments.data())));

	return float32Array;
}

emscripten::val Mesh::Float32ArrayOfVerticesValues(std::string quality) const {

	std::transform(quality.begin(), quality.end(), quality.begin(),
				   [](unsigned char c) { return std::tolower(c); });

	std::vector<float> valuesArray;
	valuesArray.reserve(vertices.size());

	auto floatIterator = floatVertexValueMap.find(quality);
	if (floatIterator != floatVertexValueMap.end()) {
		auto valuePointer = floatIterator->second;
		for (const auto &v : vertices) {
			valuesArray.push_back(v.*valuePointer);
		}
	} else {
		auto intIterator = intVertexValueMap.find(quality);
		if (intIterator != intVertexValueMap.end()) {
			auto valuePointer = intIterator->second;
			for (const auto &v : vertices) {
				valuesArray.push_back(static_cast<float>(v.*valuePointer));
			}
		} else {
			throw std::runtime_error("Quality '" + quality +
									 "' was not found in global maps.");
		}
	}

	emscripten::val float32Array =
		emscripten::val::global("Float32Array").new_(valuesArray.size());

	float32Array.call<void>("set",
							emscripten::val(emscripten::typed_memory_view(
								valuesArray.size(), valuesArray.data())));

	return float32Array;
}
