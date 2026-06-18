import type { ComponentType, SVGProps } from 'react';
import {
  RiCustomerService2Line,
  RiGlobalLine,
  RiFileTextLine,
  RiChatQuoteLine,
} from 'react-icons/ri';
import type { SourceTypeId } from '@/data/knowledgeSources';

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

// --- Brand marks --------------------------------------------------------------
// Official single-path marks (simple-icons) in true brand colour. These stand in
// for the Knowledge Hub's exact assets; swap for Hiver's own Hub marks when those
// are available. Each carries its own fill, so the consumer must NOT override the
// colour (the brand flag below tells it not to).
export const NotionIcon: IconCmp = (props) => (
  <svg viewBox="0 0 24 24" fill="#1A1A19" {...props}>
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
  </svg>
);

export const ConfluenceIcon: IconCmp = (props) => (
  <svg viewBox="0 0 24 24" fill="#2684FF" {...props}>
    <path d="M.87 18.257c-.248.382-.53.875-.763 1.245a.764.764 0 0 0 .255 1.04l4.965 3.054a.764.764 0 0 0 1.058-.26c.199-.332.454-.763.733-1.221 1.967-3.247 3.945-2.853 7.508-1.146l4.957 2.337a.764.764 0 0 0 1.028-.382l2.364-5.346a.764.764 0 0 0-.382-1 599.851 599.851 0 0 1-4.965-2.361C10.911 10.97 5.224 11.185.87 18.257zM23.131 5.743c.249-.405.531-.875.764-1.25a.764.764 0 0 0-.256-1.034L18.675.404a.764.764 0 0 0-1.058.26c-.195.335-.451.763-.734 1.225-1.966 3.246-3.945 2.85-7.508 1.146L4.437.694a.764.764 0 0 0-1.027.382L1.046 6.422a.764.764 0 0 0 .382 1c1.039.49 3.105 1.467 4.965 2.361 6.698 3.246 12.392 3.029 16.738-4.04z" />
  </svg>
);

export const GoogleDriveIcon: IconCmp = (props) => (
  <svg viewBox="0 0 24 24" fill="#1FA463" {...props}>
    <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z" />
  </svg>
);

// --- Type-icon map ------------------------------------------------------------
// Brand types carry their own colour (above); the rest use Remix glyphs that
// inherit currentColor (the consumer tints them with the muted ink). `brand`
// tells the consumer not to override the colour.
export const SOURCE_ICON: Record<SourceTypeId, IconCmp> = {
  help: RiCustomerService2Line,
  website: RiGlobalLine,
  document: RiFileTextLine,
  snippet: RiChatQuoteLine,
  notion: NotionIcon,
  confluence: ConfluenceIcon,
  gdrive: GoogleDriveIcon,
};

export const SOURCE_ICON_BRAND: Record<SourceTypeId, boolean> = {
  help: false,
  website: false,
  document: false,
  snippet: false,
  notion: true,
  confluence: true,
  gdrive: true,
};
