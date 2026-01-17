#pragma once

#include <iostream>
#include <vector>

class Mesh;
class Vertex;
class Triangle;

bool isValidVertexQuality(std::string quality);

bool isWhitespace(const std::string &str);

void printVector(std::vector<std::string> v);

std::istream &getCleanLine(std::stringstream &file, std::string &line);

std::string fileToString(std::string filepath);

bool stringToFile(std::string fileContent, std::string filename,
				  std::string extension, std::string quality = "");

Mesh sectionsHandler(std::stringstream &file);

void generalAttributesSection(std::stringstream &file, int &vertNum,
							  int &triNum, std::string &id);

void verticesSection(std::stringstream &file, std::vector<Vertex> &vertices);

void trianglesSection(std::stringstream &file, std::vector<Triangle> &triangle);

void verticesColorsSection(std::stringstream &file,
						   std::vector<Vertex> &vertices);

void verticesAttributesSection(std::stringstream &file,
							   std::vector<Vertex> &vertices);

Mesh importMesh(std::string fileString);
