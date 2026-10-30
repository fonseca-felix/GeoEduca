/* Catálogo revisado em 27/10/2026. Histórico: REVISAO_LOCAIS.csv.
   Disponibilidade observada nesta data; o provedor pode alterar os panoramas. */
const dadosEstados = {
  "AC": {
    "nome": "Acre",
    "capital": "Rio Branco",
    "regiao": "norte"
  },
  "AP": {
    "nome": "Amapá",
    "capital": "Macapá",
    "regiao": "norte"
  },
  "AM": {
    "nome": "Amazonas",
    "capital": "Manaus",
    "regiao": "norte"
  },
  "PA": {
    "nome": "Pará",
    "capital": "Belém",
    "regiao": "norte"
  },
  "RO": {
    "nome": "Rondônia",
    "capital": "Porto Velho",
    "regiao": "norte"
  },
  "RR": {
    "nome": "Roraima",
    "capital": "Boa Vista",
    "regiao": "norte"
  },
  "TO": {
    "nome": "Tocantins",
    "capital": "Palmas",
    "regiao": "norte"
  },
  "AL": {
    "nome": "Alagoas",
    "capital": "Maceió",
    "regiao": "nordeste"
  },
  "BA": {
    "nome": "Bahia",
    "capital": "Salvador",
    "regiao": "nordeste"
  },
  "CE": {
    "nome": "Ceará",
    "capital": "Fortaleza",
    "regiao": "nordeste"
  },
  "MA": {
    "nome": "Maranhão",
    "capital": "São Luís",
    "regiao": "nordeste"
  },
  "PB": {
    "nome": "Paraíba",
    "capital": "João Pessoa",
    "regiao": "nordeste"
  },
  "PE": {
    "nome": "Pernambuco",
    "capital": "Recife",
    "regiao": "nordeste"
  },
  "PI": {
    "nome": "Piauí",
    "capital": "Teresina",
    "regiao": "nordeste"
  },
  "RN": {
    "nome": "Rio Grande do Norte",
    "capital": "Natal",
    "regiao": "nordeste"
  },
  "SE": {
    "nome": "Sergipe",
    "capital": "Aracaju",
    "regiao": "nordeste"
  },
  "DF": {
    "nome": "Distrito Federal",
    "capital": "Brasília",
    "regiao": "centro-oeste"
  },
  "GO": {
    "nome": "Goiás",
    "capital": "Goiânia",
    "regiao": "centro-oeste"
  },
  "MT": {
    "nome": "Mato Grosso",
    "capital": "Cuiabá",
    "regiao": "centro-oeste"
  },
  "MS": {
    "nome": "Mato Grosso do Sul",
    "capital": "Campo Grande",
    "regiao": "centro-oeste"
  },
  "ES": {
    "nome": "Espírito Santo",
    "capital": "Vitória",
    "regiao": "sudeste"
  },
  "MG": {
    "nome": "Minas Gerais",
    "capital": "Belo Horizonte",
    "regiao": "sudeste"
  },
  "RJ": {
    "nome": "Rio de Janeiro",
    "capital": "Rio de Janeiro",
    "regiao": "sudeste"
  },
  "SP": {
    "nome": "São Paulo",
    "capital": "São Paulo",
    "regiao": "sudeste"
  },
  "PR": {
    "nome": "Paraná",
    "capital": "Curitiba",
    "regiao": "sul"
  },
  "RS": {
    "nome": "Rio Grande do Sul",
    "capital": "Porto Alegre",
    "regiao": "sul"
  },
  "SC": {
    "nome": "Santa Catarina",
    "capital": "Florianópolis",
    "regiao": "sul"
  }
};

const descobertasRegioes = {
  "norte": "A Região Norte reúne sete estados. Rios, vegetação e construções ajudam a reconhecer suas paisagens.",
  "nordeste": "O Nordeste reúne nove estados. Bahia e Maranhão pertencem à mesma região, apesar da diversidade de suas paisagens.",
  "centro-oeste": "O Centro-Oeste reúne Goiás, Mato Grosso, Mato Grosso do Sul e o Distrito Federal. Brasília é a capital do país.",
  "sudeste": "O Sudeste reúne Espírito Santo, Minas Gerais, Rio de Janeiro e São Paulo. Uma região pode ter paisagens urbanas e naturais muito diferentes.",
  "sul": "Paraná, Santa Catarina e Rio Grande do Sul formam a Região Sul, a única do Brasil com três estados."
};

const locaisRevisados = [
  {
    "id": "local-001",
    "nome": "Teatro Amazonas · Manaus, AM",
    "cidade": "Manaus",
    "uf": "AM",
    "lat": -3.1302,
    "lng": -60.0234,
    "heading": 135
  },
  {
    "id": "local-003",
    "nome": "Mercado Ver-o-Peso · Belém, PA",
    "cidade": "Belém",
    "uf": "PA",
    "lat": -1.4522,
    "lng": -48.5037,
    "heading": 300
  },
  {
    "id": "local-004",
    "nome": "Belém, PA",
    "cidade": "Belém",
    "uf": "PA",
    "lat": -1.4518,
    "lng": -48.5025,
    "heading": 90
  },
  {
    "id": "local-005",
    "nome": "Palácio Rio Branco · Salvador, BA",
    "cidade": "Salvador",
    "uf": "BA",
    "lat": -12.9722,
    "lng": -38.5109,
    "heading": 45
  },
  {
    "id": "local-006",
    "nome": "Belém, PA",
    "cidade": "Belém",
    "uf": "PA",
    "lat": -1.4563,
    "lng": -48.5021,
    "heading": 180
  },
  {
    "id": "local-007",
    "nome": "Parintins, AM",
    "cidade": "Parintins",
    "uf": "AM",
    "lat": -2.6284,
    "lng": -56.7358,
    "heading": 210
  },
  {
    "id": "local-008",
    "nome": "Santarém, PA",
    "cidade": "Santarém",
    "uf": "PA",
    "lat": -2.4433,
    "lng": -54.7084,
    "heading": 120
  },
  {
    "id": "local-009",
    "nome": "Macapá, AP",
    "cidade": "Macapá",
    "uf": "AP",
    "lat": 0.0335,
    "lng": -51.0539,
    "heading": 0
  },
  {
    "id": "local-011",
    "nome": "Palmas, TO",
    "cidade": "Palmas",
    "uf": "TO",
    "lat": -10.1842,
    "lng": -48.3337,
    "heading": 45
  },
  {
    "id": "local-012",
    "nome": "Rio Branco, AC",
    "cidade": "Rio Branco",
    "uf": "AC",
    "lat": -9.9742,
    "lng": -67.8101,
    "heading": 180
  },
  {
    "id": "local-013",
    "nome": "Porto Velho, RO",
    "cidade": "Porto Velho",
    "uf": "RO",
    "lat": -8.7675,
    "lng": -63.9031,
    "heading": 135
  },
  {
    "id": "local-018",
    "nome": "Boa Vista, RR",
    "cidade": "Boa Vista",
    "uf": "RR",
    "lat": 2.8204,
    "lng": -60.672,
    "heading": 200
  },
  {
    "id": "local-020",
    "nome": "Macapá, AP",
    "cidade": "Macapá",
    "uf": "AP",
    "lat": 0.0533,
    "lng": -51.0602,
    "heading": 100
  },
  {
    "id": "local-021",
    "nome": "Pelourinho · Salvador, BA",
    "cidade": "Salvador",
    "uf": "BA",
    "lat": -12.9716,
    "lng": -38.5089,
    "heading": 0
  },
  {
    "id": "local-022",
    "nome": "Salvador, BA",
    "cidade": "Salvador",
    "uf": "BA",
    "lat": -12.9753,
    "lng": -38.5129,
    "heading": 45
  },
  {
    "id": "local-023",
    "nome": "Natal, RN",
    "cidade": "Natal",
    "uf": "RN",
    "lat": -5.8856,
    "lng": -35.1719,
    "heading": 45
  },
  {
    "id": "local-025",
    "nome": "Recife, PE",
    "cidade": "Recife",
    "uf": "PE",
    "lat": -8.0632,
    "lng": -34.8715,
    "heading": 120
  },
  {
    "id": "local-027",
    "nome": "São Luís, MA",
    "cidade": "São Luís",
    "uf": "MA",
    "lat": -2.5309,
    "lng": -44.3028,
    "heading": 210
  },
  {
    "id": "local-028",
    "nome": "São Luís, MA",
    "cidade": "São Luís",
    "uf": "MA",
    "lat": -2.4956,
    "lng": -44.2783,
    "heading": 300
  },
  {
    "id": "local-030",
    "nome": "Fortaleza, CE",
    "cidade": "Fortaleza",
    "uf": "CE",
    "lat": -3.7272,
    "lng": -38.531,
    "heading": 270
  },
  {
    "id": "local-032",
    "nome": "Ipojuca, PE",
    "cidade": "Ipojuca",
    "uf": "PE",
    "lat": -8.5026,
    "lng": -35.0087,
    "heading": 135
  },
  {
    "id": "local-035",
    "nome": "Teresina, PI",
    "cidade": "Teresina",
    "uf": "PI",
    "lat": -5.0922,
    "lng": -42.8008,
    "heading": 45
  },
  {
    "id": "local-036",
    "nome": "Cabedelo, PB",
    "cidade": "Cabedelo",
    "uf": "PB",
    "lat": -6.9778,
    "lng": -34.8311,
    "heading": 300
  },
  {
    "id": "local-037",
    "nome": "João Pessoa, PB",
    "cidade": "João Pessoa",
    "uf": "PB",
    "lat": -7.1195,
    "lng": -34.845,
    "heading": 200
  },
  {
    "id": "local-039",
    "nome": "São Luís, MA",
    "cidade": "São Luís",
    "uf": "MA",
    "lat": -2.5089,
    "lng": -44.3019,
    "heading": 110
  },
  {
    "id": "local-041",
    "nome": "Brasília, DF",
    "cidade": "Brasília",
    "uf": "DF",
    "lat": -15.7821,
    "lng": -47.875,
    "heading": 180
  },
  {
    "id": "local-042",
    "nome": "Goiânia, GO",
    "cidade": "Goiânia",
    "uf": "GO",
    "lat": -16.6732,
    "lng": -49.2559,
    "heading": 180
  },
  {
    "id": "local-043",
    "nome": "Goiânia, GO",
    "cidade": "Goiânia",
    "uf": "GO",
    "lat": -16.677,
    "lng": -49.2615,
    "heading": 45
  },
  {
    "id": "local-044",
    "nome": "Cuiabá, MT",
    "cidade": "Cuiabá",
    "uf": "MT",
    "lat": -15.6091,
    "lng": -56.1103,
    "heading": 135
  },
  {
    "id": "local-045",
    "nome": "Arena Pantanal · Cuiabá, MT",
    "cidade": "Cuiabá",
    "uf": "MT",
    "lat": -15.6042,
    "lng": -56.1221,
    "heading": 0
  },
  {
    "id": "local-046",
    "nome": "Campo Grande, MS",
    "cidade": "Campo Grande",
    "uf": "MS",
    "lat": -20.4438,
    "lng": -54.6188,
    "heading": 210
  },
  {
    "id": "local-047",
    "nome": "Campo Grande, MS",
    "cidade": "Campo Grande",
    "uf": "MS",
    "lat": -20.4486,
    "lng": -54.6159,
    "heading": 300
  },
  {
    "id": "local-048",
    "nome": "Alto Paraíso de Goiás, GO",
    "cidade": "Alto Paraíso de Goiás",
    "uf": "GO",
    "lat": -14.1299,
    "lng": -47.5103,
    "heading": 90
  },
  {
    "id": "local-051",
    "nome": "Jardim, MS",
    "cidade": "Jardim",
    "uf": "MS",
    "lat": -21.4805,
    "lng": -56.1483,
    "heading": 180
  },
  {
    "id": "local-052",
    "nome": "Carolina, MA",
    "cidade": "Carolina",
    "uf": "MA",
    "lat": -7.3311,
    "lng": -47.4744,
    "heading": 45
  },
  {
    "id": "local-053",
    "nome": "Cristalina, GO",
    "cidade": "Cristalina",
    "uf": "GO",
    "lat": -16.7679,
    "lng": -47.6141,
    "heading": 200
  },
  {
    "id": "local-054",
    "nome": "Pirenópolis, GO",
    "cidade": "Pirenópolis",
    "uf": "GO",
    "lat": -15.8513,
    "lng": -48.9584,
    "heading": 80
  },
  {
    "id": "local-055",
    "nome": "Cáceres, MT",
    "cidade": "Cáceres",
    "uf": "MT",
    "lat": -16.0699,
    "lng": -57.6807,
    "heading": 110
  },
  {
    "id": "local-060",
    "nome": "Parque Ibirapuera · São Paulo, SP",
    "cidade": "São Paulo",
    "uf": "SP",
    "lat": -23.5862,
    "lng": -46.6588,
    "heading": 120
  },
  {
    "id": "local-061",
    "nome": "MASP · São Paulo, SP",
    "cidade": "São Paulo",
    "uf": "SP",
    "lat": -23.5617,
    "lng": -46.6558,
    "heading": 0
  },
  {
    "id": "local-062",
    "nome": "Santos, SP",
    "cidade": "Santos",
    "uf": "SP",
    "lat": -23.9604,
    "lng": -46.3338,
    "heading": 90
  },
  {
    "id": "local-063",
    "nome": "Campinas, SP",
    "cidade": "Campinas",
    "uf": "SP",
    "lat": -22.9068,
    "lng": -47.0612,
    "heading": 45
  },
  {
    "id": "local-064",
    "nome": "Copacabana · Rio de Janeiro, RJ",
    "cidade": "Rio de Janeiro",
    "uf": "RJ",
    "lat": -22.9711,
    "lng": -43.1843,
    "heading": 120
  },
  {
    "id": "local-065",
    "nome": "Cristo Redentor · Rio de Janeiro, RJ",
    "cidade": "Rio de Janeiro",
    "uf": "RJ",
    "lat": -22.9519,
    "lng": -43.2105,
    "heading": 180
  },
  {
    "id": "local-067",
    "nome": "Niterói, RJ",
    "cidade": "Niterói",
    "uf": "RJ",
    "lat": -22.8833,
    "lng": -43.1148,
    "heading": 15
  },
  {
    "id": "local-068",
    "nome": "Praça da Liberdade · Belo Horizonte, MG",
    "cidade": "Belo Horizonte",
    "uf": "MG",
    "lat": -19.9323,
    "lng": -43.938,
    "heading": 220
  },
  {
    "id": "local-069",
    "nome": "Belo Horizonte, MG",
    "cidade": "Belo Horizonte",
    "uf": "MG",
    "lat": -19.9362,
    "lng": -43.9134,
    "heading": 90
  },
  {
    "id": "local-070",
    "nome": "Praça Tiradentes · Ouro Preto, MG",
    "cidade": "Ouro Preto",
    "uf": "MG",
    "lat": -20.3856,
    "lng": -43.5036,
    "heading": 0
  },
  {
    "id": "local-072",
    "nome": "Uberlândia, MG",
    "cidade": "Uberlândia",
    "uf": "MG",
    "lat": -18.9357,
    "lng": -48.2818,
    "heading": 300
  },
  {
    "id": "local-073",
    "nome": "Vila Velha, ES",
    "cidade": "Vila Velha",
    "uf": "ES",
    "lat": -20.3323,
    "lng": -40.2876,
    "heading": 45
  },
  {
    "id": "local-076",
    "nome": "Rio de Janeiro, RJ",
    "cidade": "Rio de Janeiro",
    "uf": "RJ",
    "lat": -22.9034,
    "lng": -43.1718,
    "heading": 350
  },
  {
    "id": "local-077",
    "nome": "Poços de Caldas, MG",
    "cidade": "Poços de Caldas",
    "uf": "MG",
    "lat": -21.7875,
    "lng": -46.5626,
    "heading": 200
  },
  {
    "id": "local-078",
    "nome": "Campos do Jordão, SP",
    "cidade": "Campos do Jordão",
    "uf": "SP",
    "lat": -22.739,
    "lng": -45.5914,
    "heading": 110
  },
  {
    "id": "local-079",
    "nome": "Ópera de Arame · Curitiba, PR",
    "cidade": "Curitiba",
    "uf": "PR",
    "lat": -25.3853,
    "lng": -49.2765,
    "heading": 180
  },
  {
    "id": "local-081",
    "nome": "Curitiba, PR",
    "cidade": "Curitiba",
    "uf": "PR",
    "lat": -25.4284,
    "lng": -49.2733,
    "heading": 90
  },
  {
    "id": "local-083",
    "nome": "Londrina, PR",
    "cidade": "Londrina",
    "uf": "PR",
    "lat": -23.3104,
    "lng": -51.1623,
    "heading": 135
  },
  {
    "id": "local-084",
    "nome": "Ponte Hercílio Luz · Florianópolis, SC",
    "cidade": "Florianópolis",
    "uf": "SC",
    "lat": -27.5934,
    "lng": -48.5636,
    "heading": 300
  },
  {
    "id": "local-085",
    "nome": "Florianópolis, SC",
    "cidade": "Florianópolis",
    "uf": "SC",
    "lat": -27.5959,
    "lng": -48.5505,
    "heading": 210
  },
  {
    "id": "local-086",
    "nome": "Penha, SC",
    "cidade": "Penha",
    "uf": "SC",
    "lat": -26.7745,
    "lng": -48.6409,
    "heading": 15
  },
  {
    "id": "local-089",
    "nome": "Aeroporto Salgado Filho · Porto Alegre, RS",
    "cidade": "Porto Alegre",
    "uf": "RS",
    "lat": -29.9934,
    "lng": -51.1712,
    "heading": 15
  },
  {
    "id": "local-090",
    "nome": "Porto Alegre, RS",
    "cidade": "Porto Alegre",
    "uf": "RS",
    "lat": -30.0344,
    "lng": -51.2352,
    "heading": 270
  },
  {
    "id": "local-091",
    "nome": "Porto Alegre, RS",
    "cidade": "Porto Alegre",
    "uf": "RS",
    "lat": -30.0291,
    "lng": -51.2187,
    "heading": 45
  },
  {
    "id": "local-092",
    "nome": "Caxias do Sul, RS",
    "cidade": "Caxias do Sul",
    "uf": "RS",
    "lat": -29.1658,
    "lng": -51.1801,
    "heading": 120
  },
  {
    "id": "local-093",
    "nome": "Gramado, RS",
    "cidade": "Gramado",
    "uf": "RS",
    "lat": -29.3794,
    "lng": -50.8764,
    "heading": 0
  },
  {
    "id": "local-094",
    "nome": "Pelotas, RS",
    "cidade": "Pelotas",
    "uf": "RS",
    "lat": -31.7658,
    "lng": -52.338,
    "heading": 90
  },
  {
    "id": "local-096",
    "nome": "Maringá, PR",
    "cidade": "Maringá",
    "uf": "PR",
    "lat": -23.4253,
    "lng": -51.9392,
    "heading": 300
  },
  {
    "id": "local-097",
    "nome": "Cascavel, PR",
    "cidade": "Cascavel",
    "uf": "PR",
    "lat": -24.9559,
    "lng": -53.4555,
    "heading": 200
  },
  {
    "id": "local-098",
    "nome": "Joinville, SC",
    "cidade": "Joinville",
    "uf": "SC",
    "lat": -26.3043,
    "lng": -48.8456,
    "heading": 110
  },
  {
    "id": "local-099",
    "nome": "Santa Maria, RS",
    "cidade": "Santa Maria",
    "uf": "RS",
    "lat": -29.6845,
    "lng": -53.8063,
    "heading": 350
  }
];

const curiosidadesLocais = {
  "local-001": {
    "texto": "O Teatro Amazonas foi inaugurado em 1896, durante o ciclo da borracha, e é um símbolo cultural de Manaus.",
    "fonte": "https://www.manaus.am.gov.br/turismo/o-que-ver-e-fazer-em-manaus/",
    "instituicao": "Prefeitura de Manaus"
  },
  "local-070": {
    "texto": "Em 1980, Ouro Preto se tornou a primeira cidade brasileira reconhecida pela UNESCO como Patrimônio Mundial Cultural.",
    "fonte": "https://www.gov.br/iphan/pt-br/assuntos/noticias/ouro-preto-mg-celebra-45-anos-como-patrimonio-mundial-da-humanidade",
    "instituicao": "Iphan"
  }
};
