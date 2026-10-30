# Native build/runtime libraries for both optional GUI adapters on NixOS.
# Uses the caller's Rust toolchain; token-only builds do not need this shell.
{ pkgs ? import <nixpkgs> {} }:
with pkgs;
mkShell {
  nativeBuildInputs = [ pkg-config clang ];
  buildInputs = [
    libclang fontconfig wayland libxkbcommon libx11 libxcb
    openssl zstd webkitgtk_4_1 libGL vulkan-loader mesa
  ];
  LIBCLANG_PATH = "${lib.getLib libclang}/lib";
  LD_LIBRARY_PATH = lib.makeLibraryPath [
    fontconfig wayland libxkbcommon libx11 libxcb libGL vulkan-loader mesa
  ];
}
