import '../brand/tokens.css'
import { CSPProvider } from '@base-ui/react/csp-provider'
import { createRoot } from 'react-dom/client'
import { ConexusMark } from '../brand/mark.tsx'
import { Bubble, BubbleContent } from './bubble.tsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible.tsx'
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
} from './combobox.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from './input-group.tsx'
import { Marker, MarkerContent, MarkerIcon } from './marker.tsx'
import { Message, MessageContent, MessageFooter, MessageHeader } from './message.tsx'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from './message-scroller.tsx'
import { Popover, PopoverContent, PopoverTrigger } from './popover.tsx'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip.tsx'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from './trace.tsx'

// Every chat piece on one page, served only to the layout tests, which watch it under the Hub's
// CSP (web W22, testing T23).
const MODELS = [
  { provider: 'Anthropic', items: ['Claude Sonnet 4.5', 'Claude Opus 4.5'] },
  { provider: 'OpenAI', items: ['GPT-5'] },
]

function Pieces() {
  return (
    <TooltipProvider>
      <ResizablePanelGroup id="pieces" className="h-dvh">
        <ResizablePanel id="area" defaultSize="60%" minSize="30%">
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Prévia</TabsTrigger>
              <TabsTrigger value="project">Projeto</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">Prévia</TabsContent>
            <TabsContent value="project">Projeto</TabsContent>
          </Tabs>
          <ConexusMark working size={48} />
        </ResizablePanel>
        <ResizableHandle aria-label="Redimensionar" />
        <ResizablePanel id="chat" defaultSize="40%" minSize="20%">
          <MessageScrollerProvider>
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent>
                  <MessageScrollerItem>
                    <Message align="end">
                      <MessageContent>
                        <Bubble align="end">
                          <BubbleContent>Compare dois apps de encomenda</BubbleContent>
                        </Bubble>
                        <MessageFooter>10:42</MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                  <MessageScrollerItem scrollAnchor>
                    <Message>
                      <MessageContent>
                        <MessageHeader>Conexus</MessageHeader>
                        <Trace>
                          <TraceLine status="running">
                            <TraceTitle>Pensando…</TraceTitle>
                          </TraceLine>
                          <TraceCollapsible>
                            <TraceCollapsibleTrigger>
                              <TraceLine>
                                <TraceIcon />
                                <TraceTitle>Leu 3 páginas</TraceTitle>
                                <TraceDescription>9 s</TraceDescription>
                              </TraceLine>
                            </TraceCollapsibleTrigger>
                            <TraceCollapsibleContent>página 1</TraceCollapsibleContent>
                          </TraceCollapsible>
                        </Trace>
                        <Bubble variant="ghost">
                          <BubbleContent>Resposta</BubbleContent>
                        </Bubble>
                        <Marker>
                          <MarkerIcon />
                          <MarkerContent>As contas do modelo estão indisponíveis.</MarkerContent>
                        </Marker>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
          <InputGroup>
            <InputGroupTextarea aria-label="Mensagem" />
            <InputGroupAddon align="block-end">
              <Combobox items={MODELS}>
                <ComboboxValue />
                <ComboboxInput aria-label="Modelo" />
                <ComboboxContent>
                  <ComboboxEmpty>Nenhum modelo</ComboboxEmpty>
                  <ComboboxList>
                    {(group: (typeof MODELS)[number]) => (
                      <ComboboxGroup key={group.provider} items={group.items}>
                        <ComboboxLabel>{group.provider}</ComboboxLabel>
                        <ComboboxCollection>
                          {(model: string) => (
                            <ComboboxItem key={model} value={model}>
                              {model}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxGroup>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Popover>
                <PopoverTrigger render={<InputGroupButton aria-label="Raciocínio" />} />
                <PopoverContent>Raciocínio: Alto</PopoverContent>
              </Popover>
              <Tooltip>
                <TooltipTrigger render={<InputGroupButton aria-label="Enviar" />} />
                <TooltipContent>Enviar</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
          <Collapsible>
            <CollapsibleTrigger>Detalhes</CollapsibleTrigger>
            <CollapsibleContent>Aberto</CollapsibleContent>
          </Collapsible>
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}

const root = document.getElementById('root')
if (root !== null) {
  createRoot(root).render(
    <CSPProvider disableStyleElements>
      <Pieces />
    </CSPProvider>,
  )
}
