#pragma once

#include "globals.hpp"

#include <glm/detail/qualifier.hpp>
#include <glm/ext/vector_float3.hpp>
#include <glm/vec3.hpp>
#include <string>

class Vertex {
  public:
	glm::vec3 pos = glm::vec3();

	float unipolar = NULL_VALUE;
	float bipolar = NULL_VALUE;
	float LAT = NULL_VALUE;
	int EML = NULL_VALUE;
	int ExtEML = NULL_VALUE;
	int SCAR = NULL_VALUE;
	int groupID = NULL_VALUE;

	Vertex();
	Vertex(glm::vec3 &pos);

	std::string toObj();

	std::string toPly(std::string quality);
};