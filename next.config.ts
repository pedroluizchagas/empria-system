import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // importações chegam como linhas já mapeadas (JSON);
      // um mês de rede pode passar de 10 mil linhas
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
