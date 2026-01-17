#include "utils.hpp"
#include "globals.hpp"
#include "mesh.hpp"
#include "triangle.hpp"

#include <boost/algorithm/string.hpp>
#include <fstream>
#include <ostream>
#include <sstream>
#include <stdexcept>
#include <string>

bool isWhitespace(const std::string &str) {
	return all_of(str.begin(), str.end(),
				  [](unsigned char c) { return isspace(c); });
}

void printVector(std::vector<std::string> v) {
	for (int i = 0; i < v.size(); i++) {
		std::cout << v.at(i) << " // ";
	}
}

std::istream &getCleanLine(std::stringstream &file, std::string &line) {
	getline(file, line);
	line.erase(remove(line.begin(), line.end(), '\r'), line.end());
	boost::trim(line);
	if (!line.empty() && line[0] == ';') {
		return getCleanLine(file, line);
	} else {
		return file;
	}
}

std::string fileToString(std::string filepath) {
	std::ifstream file(filepath);
	if (!file.is_open()) {
		std::cerr << "Error: could not open file '" << filepath << "'"
				  << std::endl;
		exit(1);
	}
	std::stringstream buffer;
	buffer << file.rdbuf();
	file.close();
	return buffer.str();
}

bool stringToFile(std::string fileContent, std::string filename,
				  std::string extension, std::string quality) {
	std::string ext = "." + extension;
	if (!quality.empty()) {
		ext = "_" + quality + ext;
	}
	if (!(filename.length() >= ext.length() &&
		  filename.substr(filename.length() - ext.length()) == ext)) {
		filename = filename + ext;
	}
	std::ofstream fileOut(filename);
	if (fileOut.is_open()) {
		fileOut << fileContent;
		fileOut.close();
		return true;
	} else {
		std::cerr << "Could not create " << extension << " file." << std::endl;
		return false;
	}
}

bool isValidVertexQuality(std::string quality) {
	return floatVertexValueMap.count(quality) ||
		   intVertexValueMap.count(quality);
}

Mesh sectionsHandler(std::stringstream &file) {
	// general attributes
	int vertNum = 0;
	int triNum = 0;
	std::string id = "";
	generalAttributesSection(file, vertNum, triNum, id);

	// vertices
	std::vector<Vertex> verts(vertNum);
	verticesSection(file, verts);

	// triangles
	std::vector<Triangle> tris(triNum);
	trianglesSection(file, tris);

	// vertices properties 1
	verticesColorsSection(file, verts);

	// vertices properties 2
	verticesAttributesSection(file, verts);

	Mesh heart(verts, tris);

	return heart;
}

void generalAttributesSection(std::stringstream &file, int &vertNum,
							  int &triNum, std::string &id) {
	std::string line = "";
	bool found = false;
	while (getCleanLine(file, line)) {
		if (line == "[GeneralAttributes]") {
			found = true;
			break;
		}
	}
	if (!found) {
		throw std::runtime_error(
			"Could not find section '[GeneralAttributes]'");
	}
	while (getCleanLine(file, line) && !isWhitespace(line)) {
		std::vector<std::string> words;
		boost::split(words, line, boost::is_any_of(" "),
					 boost::token_compress_on);
		if (words.size() == 3) {
			if (words[0] == "NumVertex") {
				vertNum = stoi(words[2]);
			} else if (words[0] == "NumTriangle") {
				triNum = stoi(words[2]);
			}
		}
	}
}

void verticesSection(std::stringstream &file, std::vector<Vertex> &vertices) {
	std::string line = "";
	bool found = false;
	while (getCleanLine(file, line)) {
		if (line == "[VerticesSection]") {
			found = true;
			break;
		}
	}
	if (!found) {
		throw std::runtime_error("Could not find section '[VerticesSection]'");
	}
	bool found_first = false;
	int index = 0;
	while (getCleanLine(file, line)) {

		std::vector<std::string> words;
		boost::split(words, line, boost::is_any_of(" ="),
					 boost::token_compress_on);

		if (!found_first && words[0] != "0") {
			continue;
		} else {
			found_first = true;
		}
		if (isWhitespace(line)) {
			break;
		}
		if (index != stoi(words[0])) {
			throw std::runtime_error("Vertex " + std::to_string(index) +
									 " not found");
		}
		glm::vec3 pos(stof(words[1]), stof(words[2]), stof(words[3]));
		vertices.at(index) = Vertex(pos);
		vertices.at(index).groupID = stoi(words[7]);
		index++;
	}
}

void trianglesSection(std::stringstream &file,
					  std::vector<Triangle> &triangles) {
	std::string line = "";
	bool found = false;
	while (getCleanLine(file, line)) {
		if (line == "[TrianglesSection]") {
			found = true;
			break;
		}
	}
	if (!found) {
		throw std::runtime_error("Could not find section '[TrianglesSection]'");
	}

	bool found_first = false;
	int index = 0;
	while (getCleanLine(file, line)) {

		std::vector<std::string> words;
		boost::split(words, line, boost::is_any_of(" ="),
					 boost::token_compress_on);

		if (!found_first && words[0] != "0") {
			continue;
		} else {
			found_first = true;
		}
		if (isWhitespace(line)) {
			break;
		}

		if (index != stoi(words[0])) {
			throw std::runtime_error("Triangle " + std::to_string(index) +
									 " not found");
		}
		triangles.at(index) =
			Triangle(stoi(words[1]), stoi(words[2]), stoi(words[3]));
		triangles.at(index).groupID = stoi(words[7]);
		index++;
	}
}

void verticesColorsSection(std::stringstream &file,
						   std::vector<Vertex> &vertices) {
	std::string line = "";
	bool found = false;
	while (getCleanLine(file, line)) {
		if (line == "[VerticesColorsSection]") {
			found = true;
			break;
		}
	}
	if (!found) {
		throw std::runtime_error(
			"Could not find section '[VerticesColorsSection]'");
	}

	bool found_first = false;
	int index = 0;
	while (getCleanLine(file, line)) {

		std::vector<std::string> words;
		boost::split(words, line, boost::is_any_of(" ="),
					 boost::token_compress_on);

		if (!found_first && words[0] != "0") {
			continue;
		} else {
			found_first = true;
		}

		if (isWhitespace(line)) {
			break;
		}

		if (index != stoi(words[0])) {
			throw std::runtime_error("Vertex colors at index " +
									 std::to_string(index) + " not found");
		}

		vertices.at(index).unipolar = stof(words[1]);
		vertices.at(index).bipolar = stof(words[2]);
		vertices.at(index).LAT = stof(words[3]);
		index++;
	}
}

void verticesAttributesSection(std::stringstream &file,
							   std::vector<Vertex> &vertices) {
	std::string line = "";
	bool found = false;
	while (getCleanLine(file, line)) {
		if (line == "[VerticesAttributesSection]") {
			found = true;
			break;
		}
	}
	if (!found) {
		throw std::runtime_error(
			"Could not find section '[VerticesAttributesSection]'");
	}

	bool found_first = false;
	int index = 0;
	while (getCleanLine(file, line)) {

		std::vector<std::string> words;
		boost::split(words, line, boost::is_any_of(" ="),
					 boost::token_compress_on);

		if (!found_first && words[0] != "0") {
			continue;
		} else {
			found_first = true;
		}
		if (isWhitespace(line)) {
			break;
		}

		if (index != stoi(words[0])) {
			throw std::runtime_error("Vertex attributes at index " +
									 std::to_string(index) + " not found");
		}

		vertices.at(index).EML = stoi(words[1]);
		vertices.at(index).ExtEML = stoi(words[2]);
		vertices.at(index).SCAR = stoi(words[3]);
		index++;
	}
}

Mesh importMesh(std::string fileString) {
	std::stringstream file(fileString);

	Mesh h = sectionsHandler(file);
	return h;
}