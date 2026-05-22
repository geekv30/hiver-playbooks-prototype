import type { ComponentType, SVGProps } from 'react';
import { SummarizeIcon } from './Summarize';
import { KbIcon } from './Kb';
import { DraftIcon as DraftVerbIcon } from './DraftVerb';
import { NoteIcon } from './Note';
import { TagIcon } from './Tag';
import { AssignIcon } from './Assign';
import { ApprovalIcon } from './Approval';
import { WaitIcon } from './Wait';
import { EndIcon } from './End';
import { BranchIcon } from './Branch';
import { ExtractIcon } from './Extract';
import { ReplyIcon } from './Reply';
import { HttpIcon } from './Http';
import { SearchIcon } from './Search';

// Maps ActionDef.iconKey -> React SVG component.
// Consumed by the Chip atom (Task 20) for non-connector action icons.
export const ACTION_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  extract:      ExtractIcon,
  summarize:    SummarizeIcon,
  kb:           KbIcon,
  search:       SearchIcon,
  draft:        DraftVerbIcon,
  reply:        ReplyIcon,
  note:         NoteIcon,
  tag:          TagIcon,
  assign:       AssignIcon,
  approval:     ApprovalIcon,
  wait:         WaitIcon,
  end:          EndIcon,
  condition:    BranchIcon,
  branch:       BranchIcon,
  http:         HttpIcon,
};
