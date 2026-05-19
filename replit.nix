{pkgs}: {
  deps = [
    pkgs.git-filter-repo
    pkgs.maven
    pkgs.jdk17
    pkgs.google-cloud-sdk
    pkgs.jq
    pkgs.postgresql
  ];
}
