import { HomeIcon, PlusIcon, SettingsIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '../button.tsx'
import { DropdownMenuItem } from '../dropdown-menu.tsx'
import { Frame, FrameLink } from '../frame.tsx'
import { Input } from '../input.tsx'
import { PageTitle } from '../list.tsx'
import { PageHeader } from '../page-header.tsx'
import { Pager } from '../pager.tsx'
import { Separator } from '../separator.tsx'
import { SettingsIndex } from '../settings-index.tsx'
import { SettingsSection } from '../settings-section.tsx'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSkeleton,
  SidebarProvider,
} from '../sidebar.tsx'
import { SidebarRailButton } from '../sidebar-rail-button.tsx'
import { SidebarSelector } from '../sidebar-selector.tsx'
import { SidebarTrigger } from '../sidebar-trigger.tsx'
import { StepBar } from '../step-bar.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs.tsx'
import { WelcomeFrame } from '../welcome-frame.tsx'

import { Boxed, entry } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

const SECTIONS = [
  { to: '/', group: 'you', label: 'Perfil', icon: HomeIcon, summary: 'Seu nome.', order: 1 },
  {
    to: '/',
    group: 'company',
    label: 'Convites',
    icon: PlusIcon,
    summary: 'Quem entra.',
    order: 2,
  },
] as const

function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <Boxed>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        {children}
      </SidebarProvider>
    </Boxed>
  )
}

function Places() {
  return (
    <SidebarMenu>
      <FrameLink to="/" label="Início" icon={HomeIcon} current />
      <FrameLink to="/" label="Configurações" icon={SettingsIcon} />
    </SidebarMenu>
  )
}

export const NAVIGATION: readonly ShowcaseEntry[] = [
  entry(
    'tabs.tsx',
    'Navegação',
    'Alternar entre duas ou três visões da mesma coisa.',
    () => (
      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Prévia</TabsTrigger>
          <TabsTrigger value="project">Projeto</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">A Prévia do app.</TabsContent>
        <TabsContent value="project">Os arquivos do Projeto.</TabsContent>
      </Tabs>
    ),
    [
      [
        'Tabs.COMPACT',
        () => (
          <Tabs compact defaultValue="overview">
            <TabsList className="w-full border-b border-line">
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="columns">Colunas</TabsTrigger>
              <TabsTrigger value="runs">Rodadas</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              Quatro visões que cabem num celular sem rolar.
            </TabsContent>
          </Tabs>
        ),
      ],
    ],
  ),
  entry(
    'step-bar.tsx',
    'Navegação',
    'Mostrar em que passo de uma janela de vários passos a pessoa está.',
    () => (
      <StepBar
        label="Passos"
        steps={['Acesso', 'Testando e lendo', 'O que copiar', 'Quando copiar']}
        current={2}
        doneLabel="feito"
        phoneLine="Passo 3 de 4 · O que copiar"
      />
    ),
    [
      [
        'default',
        () => (
          <StepBar
            label="Passos"
            steps={['Acesso', 'Testando e lendo', 'O que copiar', 'Quando copiar']}
            current={null}
            doneLabel="feito"
            phoneLine="Todos os passos feitos"
          />
        ),
      ],
    ],
  ),
  entry('pager.tsx', 'Navegação', 'Andar por uma lista que o endereço guarda.', () => (
    <Pager next={{ kind: 'MORE', page: 'p2' }} param="pagina" page="p1" list="Clientes" />
  )),
  entry(
    'sidebar.tsx',
    'Navegação',
    'A lista de lugares ao lado da página; num celular vira gaveta.',
    () => (
      <Shell>
        <Sidebar label="Navegação">
          <SidebarHeader>Comercial</SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Lugares</SidebarGroupLabel>
              <Places />
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Shell>
    ),
    [
      [
        'loading',
        () => (
          <Shell>
            <SidebarMenuSkeleton />
          </Shell>
        ),
      ],
    ],
  ),
  entry('sidebar-trigger.tsx', 'Navegação', 'O botão que abre e fecha a lista de lugares.', () => (
    <Shell>
      <SidebarTrigger label="Abrir navegação">
        <PlusIcon aria-hidden="true" />
      </SidebarTrigger>
    </Shell>
  )),
  entry(
    'sidebar-selector.tsx',
    'Navegação',
    'Trocar de empresa ou de Projeto no alto da lista.',
    () => (
      <Shell>
        <SidebarSelector
          icon={<HomeIcon aria-hidden="true" />}
          title="Padaria Silva"
          label="Empresa"
        >
          <DropdownMenuItem>Outra empresa</DropdownMenuItem>
        </SidebarSelector>
      </Shell>
    ),
  ),
  entry(
    'sidebar-rail-button.tsx',
    'Navegação',
    'Um lugar no trilho de ícones, com o nome na dica.',
    () => (
      <Shell>
        <SidebarRailButton to="/" label="Início" icon={HomeIcon} />
      </Shell>
    ),
  ),
  entry(
    'frame.tsx',
    'Navegação',
    'O quadro de toda página com sessão: a lista e o conteúdo.',
    () => (
      <Boxed tall>
        <Frame header="Comercial" nav={<Places />} compact={false}>
          <PageTitle>Início</PageTitle>
        </Frame>
      </Boxed>
    ),
  ),
  entry(
    'welcome-frame.tsx',
    'Navegação',
    'Os passos da primeira entrada do dono, numa coluna só.',
    () => (
      <Boxed tall>
        <WelcomeFrame step={2} title="Como se chama a empresa?" exit={<Button>Sair</Button>}>
          <Input aria-label="Empresa" />
        </WelcomeFrame>
      </Boxed>
    ),
  ),
  entry(
    'settings-index.tsx',
    'Navegação',
    'O índice de Configurações, com busca, no lugar da lista.',
    () => (
      <Shell>
        <SettingsIndex sections={SECTIONS} groupName="Padaria Silva" />
      </Shell>
    ),
  ),
  entry(
    'settings-section.tsx',
    'Navegação',
    'Uma seção de Configurações: o título, a frase e o conteúdo.',
    () => (
      <SettingsSection id="perfil" title="Perfil" description="Como você aparece para a equipe.">
        <Input aria-label="Nome" />
      </SettingsSection>
    ),
  ),
  entry(
    'page-header.tsx',
    'Navegação',
    'O título de uma página com as ações dela no fim.',
    () => (
      <PageHeader title="Clientes" actions={<Button variant="primary">Cadastrar cliente</Button>} />
    ),
    [
      [
        'default',
        () => (
          <PageHeader
            title="Todos os projetos"
            intro={
              <p className="text-text-2">Os projetos da empresa, do mais novo ao mais antigo.</p>
            }
            actions={<Button variant="primary">Novo projeto</Button>}
          />
        ),
      ],
    ],
  ),
  entry('separator.tsx', 'Navegação', 'Uma linha fina entre dois blocos de uma coluna.', () => (
    <div className="flex w-64 flex-col gap-sm">
      <span>Acima</span>
      <Separator />
      <span>Abaixo</span>
    </div>
  )),
]
