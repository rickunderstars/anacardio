#pragma once

#include <string>
#include <unordered_map>
#include <vector>

inline constexpr int NULL_VALUE = -99999;

class Vertex;

extern const std::vector<std::string> validQualities;

extern const std::unordered_map<std::string, float Vertex::*>
	floatVertexValueMap;

extern const std::unordered_map<std::string, int Vertex::*> intVertexValueMap;
