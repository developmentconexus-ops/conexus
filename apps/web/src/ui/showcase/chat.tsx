import { AlertTriangleIcon, FileTextIcon } from 'lucide-react'
import {
  Attachment,
  AttachmentAction,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '../attachment.tsx'
import { Bubble, BubbleContent } from '../bubble.tsx'
import { Marker, MarkerContent, MarkerIcon } from '../marker.tsx'
import { Message, MessageContent, MessageFooter, MessageHeader } from '../message.tsx'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../message-scroller.tsx'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '../questionnaire.tsx'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../trace.tsx'

import { entry, noop } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

function Asking() {
  return (
    <Questionnaire onSubmit={noop}>
      <QuestionnaireItem name="q0" required>
        <QuestionnaireTitle>Para quem é o app?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="equipe">A equipe</QuestionnaireChoice>
          <QuestionnaireChoice value="clientes">Os clientes</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit>Enviar</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  )
}

export const CHAT: readonly ShowcaseEntry[] = [
  entry('attachment.tsx', 'Conversa', 'Um arquivo anexado à mensagem.', () => (
    <AttachmentGroup>
      <Attachment>
        <AttachmentMedia>
          <FileTextIcon aria-hidden="true" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>pedidos.csv</AttachmentTitle>
        </AttachmentContent>
        <AttachmentAction aria-label="Tirar anexo" />
      </Attachment>
    </AttachmentGroup>
  )),
  entry(
    'bubble.tsx',
    'Conversa',
    'A fala da pessoa em balão; a do Conexus vai solta, sem balão.',
    () => (
      <Bubble align="end">
        <BubbleContent>Compare dois apps de encomenda</BubbleContent>
      </Bubble>
    ),
    [
      [
        'default',
        () => (
          <Bubble variant="ghost">
            <BubbleContent>Resposta</BubbleContent>
          </Bubble>
        ),
      ],
    ],
  ),
  entry('marker.tsx', 'Conversa', 'Um aviso do sistema no meio da conversa.', () => (
    <Marker>
      <MarkerIcon>
        <AlertTriangleIcon aria-hidden="true" />
      </MarkerIcon>
      <MarkerContent>As contas do modelo estão indisponíveis.</MarkerContent>
    </Marker>
  )),
  entry('message.tsx', 'Conversa', 'Uma mensagem com quem fala e a hora.', () => (
    <Message>
      <MessageContent>
        <MessageHeader>Conexus</MessageHeader>
        <Bubble variant="ghost">
          <BubbleContent>Já montei a primeira versão.</BubbleContent>
        </Bubble>
        <MessageFooter>10:42</MessageFooter>
      </MessageContent>
    </Message>
  )),
  entry(
    'message-scroller.tsx',
    'Conversa',
    'A conversa rolável, que segue a última mensagem.',
    () => (
      <div className="h-40">
        <MessageScrollerProvider>
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent>
                <MessageScrollerItem scrollAnchor>Primeira mensagem</MessageScrollerItem>
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
    ),
  ),
  entry(
    'questionnaire.tsx',
    'Conversa',
    'O Conexus precisa de uma resposta antes de seguir.',
    () => <Asking />,
  ),
  entry(
    'trace.tsx',
    'Conversa',
    'O que o Conexus faz enquanto responde, em linhas que abrem.',
    () => (
      <Trace>
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
    ),
    [
      [
        'loading',
        () => (
          <Trace>
            <TraceLine status="running">
              <TraceTitle>Pensando…</TraceTitle>
            </TraceLine>
          </Trace>
        ),
      ],
    ],
  ),
]
