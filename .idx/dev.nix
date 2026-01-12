{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.postgresql
    pkgs.psmisc # Provee fuser
  ];
  env = {};
  idx = {
    extensions = [
      "dsznajder.es7-react-js-snippets"
      "bradlc.vscode-tailwindcss"
      "dbaeumer.vscode-eslint"
    ];
    workspace = {
      onCreate = {
        setup = ''
          npm install --prefix backend
          npm install --prefix frontend2
        '';
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["bash" "start.sh"];
          manager = "web";
          env = {
            PORT = "5173";
          };
        };
      };
    };
  };
}
