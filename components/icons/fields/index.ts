import type { FieldType } from '@/types/playbook';
import type { ComponentType, SVGProps } from 'react';
import { EmailIcon } from './Email';
import { TextIcon } from './Text';
import { LongTextIcon } from './LongText';
import { NumberIcon } from './Number';
import { DateIcon } from './DateIcon';
import { BoolIcon } from './Bool';
import { EnumIcon } from './Enum';
import { DocIcon } from './Doc';
import { DraftIcon } from './Draft';

export const FIELD_ICON: Record<FieldType, ComponentType<SVGProps<SVGSVGElement>>> = {
  email: EmailIcon,
  text: TextIcon,
  longtext: LongTextIcon,
  number: NumberIcon,
  date: DateIcon,
  bool: BoolIcon,
  enum: EnumIcon,
  doc: DocIcon,
  draft: DraftIcon,
};

export { EmailIcon, TextIcon, LongTextIcon, NumberIcon, DateIcon, BoolIcon, EnumIcon, DocIcon, DraftIcon };
