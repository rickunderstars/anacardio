#include "vertex.hpp"
#include "globals.hpp"

#include <glm/ext/vector_float3.hpp>
#include <glm/vec3.hpp>
#include <iostream>
#include <sstream>
#include <string>

Vertex::Vertex()
	: pos(glm::vec3(0, 0, 0)), unipolar(NULL_VALUE), bipolar(NULL_VALUE),
	  LAT(NULL_VALUE), EML(NULL_VALUE), ExtEML(NULL_VALUE), SCAR(NULL_VALUE),
	  groupID(NULL_VALUE) {}
Vertex::Vertex(glm::vec3 &pos) { this->pos = pos; }

std::string Vertex::toObj() {
	std::ostringstream oss;
	oss << "v  " << pos.x << " " << pos.y << " " << pos.z;
	return oss.str();
}

std::string Vertex::toPly(std::string quality) {

	std::string q = "-99999";

	auto floatIterator = floatVertexValueMap.find(quality);
	if (floatIterator != floatVertexValueMap.end()) {
		q = std::to_string(this->*(floatIterator->second));
	} else {
		auto intIterator = intVertexValueMap.find(quality);
		if (intIterator != intVertexValueMap.end()) {
			q = std::to_string(this->*(intIterator->second));
		}
	}

	std::ostringstream oss;
	oss << pos.x << " " << pos.y << " " << pos.z << " " << q;
	return oss.str();
}
