#include "globals.hpp"
#include "vertex.hpp"

const std::unordered_map<std::string, float Vertex::*> floatVertexValueMap = {
	{"unipolar", &Vertex::unipolar},
	{"bipolar", &Vertex::bipolar},
	{"lat", &Vertex::LAT}};

const std::unordered_map<std::string, int Vertex::*> intVertexValueMap = {
	{"eml", &Vertex::EML},
	{"exteml", &Vertex::ExtEML},
	{"scar", &Vertex::SCAR},
	{"groupid", &Vertex::groupID}};
