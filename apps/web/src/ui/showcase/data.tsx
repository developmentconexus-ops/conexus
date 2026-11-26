import { useId } from 'react'
import { Avatar, AvatarFallback } from '../avatar.tsx'
import { Badge } from '../badge.tsx'
import { Block, BlockSentence, Stamp } from '../block.tsx'
import { Button } from '../button.tsx'
import { Card, CardContent, CardFooter } from '../card.tsx'
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '../code-block.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible.tsx'
import { List, PageTitle, Row, SectionTitle, SettingsPageTitle } from '../list.tsx'
import { Meter, MeterLabel } from '../meter.tsx'
import { Page } from '../page.tsx'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../resizable.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table.tsx'

import { entry, HOVER } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

function Split() {
  const id = useId()
  return (
    <div className="h-32">
      <ResizablePanelGroup id={id}>
        <ResizablePanel defaultSize="60%" minSize="30%">
          Área
        </ResizablePanel>
        <ResizableHandle aria-label="Redimensionar" />
        <ResizablePanel defaultSize="40%" minSize="20%">
          Conversa
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export const DATA: readonly ShowcaseEntry[] = [
  entry('avatar.tsx', 'Dados', 'Quem é a pessoa, em duas letras.', () => (
    <Avatar>
      <AvatarFallback>MA</AvatarFallback>
    </Avatar>
  )),
  entry(
    'badge.tsx',
    'Dados',
    'O estado de algo: uma palavra com o ponto da sua cor.',
    () => <Badge tone="success">Publicado</Badge>,
    [
      ['default', () => <Badge>Rascunho</Badge>],
      ['error', () => <Badge tone="danger">Falhou</Badge>],
      ['loading', () => <Badge tone="warning">Publicando</Badge>],
    ],
  ),
  entry('card.tsx', 'Dados', 'Um bloco que se lê sozinho, com a ação no pé.', () => (
    <Card>
      <CardContent>Encomendas da semana: 12.</CardContent>
      <CardFooter>
        <Button>Abrir</Button>
      </CardFooter>
    </Card>
  )),
  entry('table.tsx', 'Dados', 'Linhas com as mesmas colunas, que a pessoa compara.', () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Pedido</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow {...HOVER}>
          <TableCell>Maria</TableCell>
          <TableCell>Bolo de cenoura</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )),
  entry('list.tsx', 'Dados', 'Títulos de página e de seção, e a lista de linhas simples.', () => (
    <>
      <PageTitle>Clientes</PageTitle>
      <SettingsPageTitle>Pessoas e convites</SettingsPageTitle>
      <SectionTitle>Recentes</SectionTitle>
      <List>
        <Row>Maria</Row>
        <Row>João</Row>
      </List>
    </>
  )),
  entry('page.tsx', 'Dados', 'A coluna de uma página do Início ou de um Projeto.', () => (
    <Page scrolls={false} gap="lg">
      <PageTitle>Automações</PageTitle>
      <List>
        <Row>Resumo das vendas da semana</Row>
      </List>
    </Page>
  )),
  entry('block.tsx', 'Dados', 'Um bloco de Configurações com título e linhas.', () => (
    <Block title="Equipe" action={<Stamp tone="success">Ativa</Stamp>}>
      <BlockSentence>Ninguém foi convidado ainda.</BlockSentence>
    </Block>
  )),
  entry('code-block.tsx', 'Dados', 'Um trecho de código com o nome do arquivo.', () => (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>pedido.ts</CodeBlockTitle>
      </CodeBlockHeader>
      <CodeBlockContent>
        <CodeBlockLine>const total = 12</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>
  )),
  entry('collapsible.tsx', 'Dados', 'Esconder o detalhe até a pessoa pedir.', () => (
    <Collapsible>
      <CollapsibleTrigger>Detalhes</CollapsibleTrigger>
      <CollapsibleContent>Aberto</CollapsibleContent>
    </Collapsible>
  )),
  entry('meter.tsx', 'Dados', 'Quanto de um limite já foi usado.', () => (
    <Meter value={64}>
      <MeterLabel>Memória</MeterLabel>
    </Meter>
  )),
  entry('resizable.tsx', 'Dados', 'Duas áreas lado a lado cuja largura a pessoa arrasta.', () => (
    <Split />
  )),
]
