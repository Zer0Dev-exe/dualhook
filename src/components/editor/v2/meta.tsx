import { Columns2, File, Image, Images, Minus, MousePointerClick, RectangleHorizontal, Square, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import { make } from '@/lib/factory';
import type { ContainerChild, TopLevelComponent } from '@/lib/types';

interface Meta {
  name: string;
  icon: ReactNode;
  /** color del borde/acento en el editor */
  color: string;
}

export const V2_META: Record<number, Meta> = {
  1: { name: 'Fila de botones', icon: <RectangleHorizontal />, color: '#f472b6' },
  2: { name: 'Botón', icon: <MousePointerClick />, color: '#f472b6' },
  9: { name: 'Sección', icon: <Columns2 />, color: '#c084fc' },
  10: { name: 'Texto', icon: <Type />, color: '#9aa0aa' },
  11: { name: 'Miniatura', icon: <Image />, color: '#38bdf8' },
  12: { name: 'Galería', icon: <Images />, color: '#38bdf8' },
  13: { name: 'Archivo', icon: <File />, color: '#fb923c' },
  14: { name: 'Separador', icon: <Minus />, color: '#4b5563' },
  17: { name: 'Contenedor', icon: <Square />, color: '#2dc770' },
};

export const CHILD_TYPES: { type: ContainerChild['type']; label: string; create: () => ContainerChild }[] = [
  { type: 10, label: 'Texto', create: () => make.text() },
  { type: 9, label: 'Sección', create: () => make.section() },
  { type: 12, label: 'Galería', create: () => make.gallery() },
  { type: 13, label: 'Archivo', create: () => make.file() },
  { type: 14, label: 'Separador', create: () => make.separator() },
  { type: 1, label: 'Fila de botones', create: () => make.actionRow() },
];

export const ROOT_TYPES: { type: TopLevelComponent['type']; label: string; create: () => TopLevelComponent }[] = [
  { type: 17, label: 'Contenedor', create: () => make.container() },
  ...CHILD_TYPES,
];
