/* Caso fictício de demonstração. Este arquivo não é carregado pela página integrada. */
'use strict';
window.DETETIVE_CASO_DEMO = {
  patrimonioRoubado:'Peça histórica do museu',
  descricaoRoubo:'Uma peça do acervo foi roubada. Siga as pistas pelos estados brasileiros para recuperá-la.',
  criminoso:{nome:'Alex',apelido:'Sombra',descricao:'Jaqueta escura e mochila preta.',motivacao:'Venda ilegal da peça.'},
  rota:[
    {estadoAtual:'BA',nomeEstado:'Bahia',proximoEstado:'MG',ehEstadoFinal:false,npcs:[
      {nome:'Ana',profissao:'Artesã',dica:'Ele falou em cidades históricas, montanhas e pão de queijo.'},
      {nome:'João',profissao:'Motorista',dica:'Ouvi o suspeito perguntar por uma passagem para o estado cuja capital é Belo Horizonte.'},
      {nome:'Lúcia',profissao:'Guia local',dica:'Ele comentou que queria conhecer Ouro Preto e as cidades históricas do próximo estado.'}
    ]},
    {estadoAtual:'MG',nomeEstado:'Minas Gerais',proximoEstado:'RJ',ehEstadoFinal:false,npcs:[
      {nome:'Pedro',profissao:'Comerciante',dica:'Ele disse que veria o Cristo Redentor quando chegasse à próxima capital.'},
      {nome:'Bia',profissao:'Guia local',dica:'Ouvi uma conversa sobre Copacabana, o Pão de Açúcar e a Baía de Guanabara.'},
      {nome:'Marina',profissao:'Motorista',dica:'Na passagem, vi o nome do estado que tem a mesma denominação de sua capital, conhecida como Cidade Maravilhosa.'}
    ]},
    {estadoAtual:'RJ',nomeEstado:'Rio de Janeiro',proximoEstado:'SP',ehEstadoFinal:false,npcs:[
      {nome:'Rosa',profissao:'Artesã',dica:'Ele falou em se esconder na maior cidade do país, perto da Avenida Paulista.'},
      {nome:'Davi',profissao:'Motorista',dica:'Ele queria uma passagem para o estado cuja capital abriga a Praça da Sé e o MASP.'},
      {nome:'Paula',profissao:'Guia local',dica:'Ele mencionou o litoral de Santos e uma capital famosa pelos arranha-céus e pelo Parque Ibirapuera.'}
    ]},
    {estadoAtual:'SP',nomeEstado:'São Paulo',proximoEstado:'PR',ehEstadoFinal:false,npcs:[
      {nome:'Caio',profissao:'Comerciante',dica:'No mapa dele, o próximo destino era o estado cuja capital é Curitiba.'},
      {nome:'Laura',profissao:'Guia local',dica:'Ele comentou que passaria pelo estado brasileiro onde ficam as Cataratas do Iguaçu.'},
      {nome:'André',profissao:'Motorista',dica:'Ele seguiu para o Sul. O estado procurado fica entre São Paulo e Santa Catarina.'}
    ]},
    {estadoAtual:'PR',nomeEstado:'Paraná',proximoEstado:null,ehEstadoFinal:true,npcs:[
      {nome:'Carlos',profissao:'Porteiro',dica:'Um homem de jaqueta escura e mochila preta entrou no depósito desativado. Ele carregava uma caixa protegida.'},
      {nome:'Rita',profissao:'Comerciante',dica:'Vi uma peça antiga dentro da mochila do visitante. Ele foi em direção ao depósito.'},
      {nome:'Paulo',profissao:'Taxista',dica:'O passageiro se apresentou como Alex e pediu que eu o deixasse perto do depósito desativado.'}
    ]}
  ]
};
