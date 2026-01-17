#include "vertex.hpp"

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

	std::string q;

	if (quality == "unipolar") {
		q = std::to_string(this->unipolar);
	} else if (quality == "bipolar") {
		q = std::to_string(this->bipolar);
	} else if (quality == "lat") {
		q = std::to_string(this->LAT);
	} else if (quality == "eml") {
		q = std::to_string(this->EML);
	} else if (quality == "exteml") {
		q = std::to_string(this->ExtEML);
	} else if (quality == "scar") {
		q = std::to_string(this->SCAR);
	} else {
		q = "-1";
	}

	std::ostringstream oss;
	oss << pos.x << " " << pos.y << " " << pos.z << " " << q;
	return oss.str();
}
