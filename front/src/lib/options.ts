import type { PropertyCategory, PropertySubtype } from "./types";

export const categoryLabels: Record<PropertyCategory, string> = {
  apartamento: "Apartamentos para alugar",
  casa: "Casas para alugar",
  quarto: "Quartos para alugar",
};

export const subtypeLabels: Record<PropertySubtype, string> = {
  casa_condominio: "Casa de condomínio",
  casa_vila: "Casa de vila",
  cobertura: "Cobertura",
  duplex_triplex: "Duplex ou triplex",
  kitnet: "Kitnet",
  loft: "Loft",
  padrao: "Padrão",
};

/** Regiões administrativas do Distrito Federal (sugestões do campo de região). */
export const dfRegions = [
  "Plano Piloto", "Gama", "Taguatinga", "Brazlândia", "Sobradinho", "Planaltina", "Paranoá",
  "Núcleo Bandeirante", "Ceilândia", "Guará", "Cruzeiro", "Samambaia", "Santa Maria",
  "São Sebastião", "Recanto das Emas", "Lago Sul", "Riacho Fundo", "Lago Norte", "Candangolândia",
  "Águas Claras", "Riacho Fundo II", "Sudoeste/Octogonal", "Varjão", "Park Way", "SCIA/Estrutural",
  "Sobradinho II", "Jardim Botânico", "Itapoã", "SIA", "Vicente Pires", "Fercal", "Sol Nascente/Pôr do Sol",
  "Arniqueiras", "Arapoanga", "Água Quente",
];
