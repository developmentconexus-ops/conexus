import { PlusIcon } from 'lucide-react'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../alert-dialog.tsx'
import { Button } from '../button.tsx'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTrigger } from '../dialog.tsx'
import { Drawer, DrawerContent, DrawerTrigger } from '../drawer.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu.tsx'
import { Input } from '../input.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../popover.tsx'
import { Sheet, SheetContent, SheetTrigger } from '../sheet.tsx'
import { Slider } from '../slider.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip.tsx'

import { entry } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

const OVERLAY_TEXT = 'Isto abre por cima da página.'

export const OVERLAYS: readonly ShowcaseEntry[] = [
  entry('dialog.tsx', 'Sobreposições', 'Uma tarefa curta que pede a atenção inteira.', () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Abrir caixa</DialogTrigger>
      <DialogContent title="Convidar pessoa" description={OVERLAY_TEXT}>
        <DialogBody>
          <Input aria-label="E-mail" />
        </DialogBody>
        <DialogFooter>
          <Button variant="primary">Convidar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )),
  entry('alert-dialog.tsx', 'Sobreposições', 'Confirmar o que não se desfaz.', () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="danger" />}>Apagar</AlertDialogTrigger>
      <AlertDialogContent title="Apagar o Projeto?" description="Isto não se desfaz.">
        <Button variant="danger-confirm">Apagar</Button>
      </AlertDialogContent>
    </AlertDialog>
  )),
  entry(
    'alert-dialog.tsx',
    'Sobreposições',
    'Ler antes do sim, com a tela toda no celular.',
    () => (
      <AlertDialog>
        <AlertDialogTrigger render={<Button />}>Ler e ligar</AlertDialogTrigger>
        <AlertDialogContent size="page" title="Ligar venda v2?" description={OVERLAY_TEXT}>
          <Button variant="primary">Ligar</Button>
        </AlertDialogContent>
      </AlertDialog>
    ),
  ),
  entry(
    'sheet.tsx',
    'Sobreposições',
    'Um painel que desliza do lado, como a navegação do celular.',
    () => (
      <Sheet>
        <SheetTrigger render={<Button />}>Abrir painel</SheetTrigger>
        <SheetContent title="Navegação">{OVERLAY_TEXT}</SheetContent>
      </Sheet>
    ),
  ),
  entry('drawer.tsx', 'Sobreposições', 'Uma gaveta de baixo para cima no celular.', () => (
    <Drawer>
      <DrawerTrigger render={<Button />}>Abrir gaveta</DrawerTrigger>
      <DrawerContent title="Escolher">{OVERLAY_TEXT}</DrawerContent>
    </Drawer>
  )),
  entry('popover.tsx', 'Sobreposições', 'Um controle pequeno junto do gatilho.', () => (
    <Popover>
      <PopoverTrigger render={<Button />}>Raciocínio</PopoverTrigger>
      <PopoverContent>
        <Slider label="Raciocínio" min={0} max={4} step={1} defaultValue={3} />
      </PopoverContent>
    </Popover>
  )),
  entry('dropdown-menu.tsx', 'Sobreposições', 'Poucas ações sobre uma coisa.', () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Ações</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Renomear</DropdownMenuItem>
        <DropdownMenuItem>Apagar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )),
  entry('tooltip.tsx', 'Sobreposições', 'O nome de um botão só de ícone.', () => (
    <Tooltip>
      <TooltipTrigger render={<Button size="icon" aria-label="Enviar" />}>
        <PlusIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>Enviar</TooltipContent>
    </Tooltip>
  )),
]
