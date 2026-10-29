/** The address the documentation requires of every customer. */
function address(cidade: string, uf: string) {
  return {
    logradouro: 'Rua Inventada',
    numero: '10',
    bairro: 'Centro',
    cidade,
    codigoIbge: '0000000',
    uf,
    cep: '00000000',
  }
}

/** The custom fields the documentation's customer schema names. */
const ADICIONAIS = {
  AD_TESTE_API_CAMPO_ADICIONAL_1: 'a',
  AD_TESTE_API_CAMPO_ADICIONAL_2: 'b',
  AD_TESTE_API_CAMPO_ADICIONAL_3: 'c',
  AD_TESTE_API_CAMPO_ADICIONAL_4: 'd',
}

export const PEDIDOS = [
  {
    codigoNota: 101,
    numeroNota: 5001,
    serieNota: '1',
    codigoEmpresa: 1,
    cliente: { nome: 'Cliente Um', cnpjCpf: '00000000000' },
    dataNegociacao: '2026-10-01',
    confirmada: true,
    pendente: false,
    codigoVendedor: 7,
    nomeVendedor: 'Vendedor Sete',
    valorNota: 150.5,
    itens: [
      {
        sequencia: 1,
        codigoProduto: 11,
        descricaoProduto: 'Produto Onze',
        quantidade: 2,
        unidade: 'UN',
        valorUnitario: 50,
        valorTotal: 100,
        cfop: '5102',
        ncm: '00000000',
        cst: '00',
        valorICMS: 18,
        valorIPI: 0,
        impostos: [{ tipo: 'icms', cst: '00', aliquota: 18, valorBase: 100, valorImposto: 18 }],
      },
      {
        sequencia: 2,
        codigoProduto: 12,
        descricaoProduto: 'Produto Doze',
        quantidade: 1,
        unidade: 'UN',
        valorUnitario: 50.5,
        valorTotal: 50.5,
        cfop: '5102',
        ncm: '00000000',
        cst: '00',
        valorICMS: 9.09,
        valorIPI: 0,
        impostos: [],
      },
    ],
  },
  {
    codigoNota: 102,
    numeroNota: 5002,
    serieNota: '1',
    codigoEmpresa: 1,
    cliente: { nome: 'Cliente Dois', cnpjCpf: '00000000001' },
    dataNegociacao: '2026-10-02',
    confirmada: false,
    pendente: true,
    codigoVendedor: 8,
    nomeVendedor: 'Vendedor Oito',
    valorNota: 30,
    itens: [
      {
        sequencia: 1,
        codigoProduto: 13,
        descricaoProduto: 'Produto Treze',
        quantidade: 3,
        unidade: 'CX',
        valorUnitario: 10,
        valorTotal: 30,
      },
    ],
  },
]

export const PRODUTOS = [
  {
    codigoProduto: 11,
    nome: 'Produto Onze',
    referencia: 'P-11',
    codigoGrupoProduto: 1,
    nomeGrupoProduto: 'Grupo Um',
    marca: 'Marca A',
    ativo: true,
    ncm: '00000000',
  },
  {
    codigoProduto: 12,
    nome: 'Produto Doze',
    referencia: 'P-12',
    codigoGrupoProduto: 1,
    nomeGrupoProduto: 'Grupo Um',
    marca: 'Marca A',
    ativo: true,
    ncm: '00000000',
  },
  {
    codigoProduto: 13,
    nome: 'Produto Treze',
    referencia: 'P-13',
    codigoGrupoProduto: 2,
    nomeGrupoProduto: 'Grupo Dois',
    marca: 'Marca B',
    ativo: false,
    ncm: '00000000',
  },
]

export const CLIENTES = [
  {
    codigoCliente: 1,
    tipo: 'PJ',
    cnpjCpf: '00000000000100',
    nome: 'Cliente Um',
    razao: 'Cliente Um Ltda',
    email: 'um@example.test',
    endereco: address('Cidade Um', 'SP'),
    camposAdicionais: ADICIONAIS,
  },
  {
    codigoCliente: 2,
    tipo: 'PF',
    cnpjCpf: '00000000001',
    nome: 'Cliente Dois',
    razao: 'Cliente Dois',
    email: 'dois@example.test',
    endereco: address('Cidade Dois', 'RJ'),
    camposAdicionais: ADICIONAIS,
  },
]
