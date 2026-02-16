{
  description = "AnaCardio Dev Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";
    emscripten-pin.url = "github:nixos/nixpkgs/6d662c5";
  };

  outputs =
    {
      self,
      nixpkgs,
      nixpkgs-unstable,
      emscripten-pin,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs-unstable {
        inherit system;
        config.allowUnfree = true;
      };
      stable = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
      pkgsEmscripten = import emscripten-pin {
        inherit system;
        config.allowUnfree = true;
      };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        name = "tirocinio";

        buildInputs = with pkgs; [
          gcc
          cmake
          bear
          boost
          llvmPackages.clang-tools
          vscode-extensions.ms-vscode.cpptools
          stable.meshlab
          pkgsEmscripten.emscripten
          glm
          python3
          nodejs
        ];

        shellHook = ''
                    export DEV_ENV_NAME="heart-dev-env"
                    export GLM_INCLUDE_DIR="${pkgs.glm}/include"
                    export BOOST_INCLUDE_DIR="${pkgs.boost.dev}/include"
                    export EM_CACHE="$PWD/.emscripten_cache"

                    if [ ! -f .clangd ]; then
                      cat > .clangd <<EOF
          CompileFlags:
            CompilationDatabase: build
          Diagnostics:
            UnusedIncludes: None
            MissingIncludes: None
          EOF
                    fi
        '';
      };
    };
}
