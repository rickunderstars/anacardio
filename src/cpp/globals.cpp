#include "globals.hpp"
#include "vertex.hpp"

const std::vector<std::string> validQualities = {"unipolar", "bipolar", "lat",
												 "eml",		 "exteml",	"scar"};

const std::unordered_map<std::string, float Vertex::*> floatVertexValueMap = {
	{"unipolar", &Vertex::unipolar},
	{"bipolar", &Vertex::bipolar},
	{"LAT", &Vertex::LAT}};

const std::unordered_map<std::string, int Vertex::*> intVertexValueMap = {
	{"EML", &Vertex::EML},
	{"ExtEML", &Vertex::ExtEML},
	{"SCAR", &Vertex::SCAR},
	{"groupID", &Vertex::groupID}};
