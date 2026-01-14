#include "globals.hpp"
#include "mesh.hpp"
#include "triangle.hpp"
#include "utils.hpp"
#include "vertex.hpp"
#include <emscripten/bind.h>
#include <glm/ext/vector_float3.hpp>
#include <string>
#include <vector>

EMSCRIPTEN_BINDINGS(heart_module) {

	emscripten::constant("NULL_VALUE", NULL_VALUE);

	emscripten::function("importMesh", &importMesh);

	emscripten::value_object<glm::vec3>("vec3")
		.field("x", &glm::vec3::x)
		.field("y", &glm::vec3::y)
		.field("z", &glm::vec3::z);

	emscripten::class_<Vertex>("Vertex")
		.property("pos", &Vertex::pos)
		.property("groupID", &Vertex::groupID)
		.property("unipolar", &Vertex::unipolar)
		.property("bipolar", &Vertex::bipolar)
		.property("LAT", &Vertex::LAT)
		.property("EML", &Vertex::EML)
		.property("ExtEML", &Vertex::ExtEML)
		.property("SCAR", &Vertex::SCAR);

	emscripten::register_vector<Vertex>("VertexVector");

	emscripten::class_<Triangle>("Triangle")
		.constructor<int, int, int>()
		.property("groupID", &Triangle::groupID);

	emscripten::register_vector<Triangle>("TriangleVector");

	emscripten::class_<Mesh>("Mesh")
		.property("vertices", &Mesh::vertices)
		.property("triangles", &Mesh::triangles)
		.function("triangleFix", &Mesh::triangleFix)
		.function("fixNMEdges", &Mesh::fixNMEdges)
		.function("Float32ArrayOfVertices", &Mesh::Float32ArrayOfVertices)
		.function("Uint32ArrayOfTriangles", &Mesh::Uint32ArrayOfTriangles)
		.function("Float32ArrayOfSegmentNormals",
				  &Mesh::Float32ArrayOfSegmentNormals)
		.function("Float32ArrayOfGroupID", &Mesh::Float32ArrayOfGroupID)
		.function("Float32ArrayOfUnipolar", &Mesh::Float32ArrayOfUnipolar)
		.function("Float32ArrayOfBipolar", &Mesh::Float32ArrayOfBipolar)
		.function("Float32ArrayOfLAT", &Mesh::Float32ArrayOfLAT)
		.function("Float32ArrayOfEML", &Mesh::Float32ArrayOfEML)
		.function("Float32ArrayOfExtEML", &Mesh::Float32ArrayOfExtEML)
		.function("Float32ArrayOfSCAR", &Mesh::Float32ArrayOfSCAR);
	;
}