const fs = require('fs');
let content = fs.readFileSync('roomie-finder/src/components/layout/Sidebar.tsx', 'utf8');

// Container
content = content.replace(
  /'hidden md:flex flex-col bg-white\/60 backdrop-blur-xl dark:bg-weaver-dark border-r border-slate-200 dark:border-weaver-dark.+'/,
  `'hidden md:flex flex-col bg-[#27034E] border-r border-[#411270] transition-all duration-300 sticky top-0 h-screen overflow-hidden shrink-0 shadow-lg z-20 hover:bg-[#2A0453]',`
);

// Header border
content = content.replace(
  'border-b border-slate-200 dark:border-weaver-dark',
  'border-b border-[#411270]'
);

// Logo text (Colony is white, Roomie Finder is orange) already done in previous step? Wait, let's keep it but just ensure it's white.
content = content.replace(
  'text-weaver-purple dark:text-white text-2xl',
  'text-white text-2xl'
);

// Nav items text
content = content.replace(
  'isActive\n                      ? \'bg-weaver-purple/10 dark:bg-weaver-dark/50 text-weaver-purple dark:text-weaver-orange font-bold rounded-nest shadow-sm dark:shadow-none border border-weaver-purple/20\'\n                      : \'text-slate-600 dark:text-slate-400 hover:text-weaver-purple dark:hover:text-weaver-orange hover:bg-nest-light/80 dark:hover:bg-weaver-dark/50 rounded-nest hover:translate-x-1\'',
  'isActive\n                      ? \'bg-weaver-purple/40 text-white font-bold rounded-xl shadow-inner border border-weaver-purple/50\'\n                      : \'text-white/60 hover:text-white hover:bg-weaver-purple/20 rounded-xl hover:translate-x-1\''
);

// Trust Widget
content = content.replace(
  'bg-gradient-to-br from-weaver-purple/5 to-weaver-verte/5 dark:from-weaver-dark dark:to-weaver-dark border border-slate-200 dark:border-weaver-dark',
  'bg-gradient-to-br from-[#4D0F8E] to-[#360965] border border-[#6B1DC5]'
);

content = content.replace(
  'text-slate-700 dark:text-slate-300 tracking-wide',
  'text-white/90 tracking-wide'
);

content = content.replace(
  'text-slate-500 dark:text-slate-400 mt-2 font-medium',
  'text-white/60 mt-2 font-medium'
);

content = content.replace(
  'bg-slate-200 dark:bg-slate-800 rounded-full',
  'bg-[#27034E] rounded-full shadow-inner'
);

// Bottom border and button
content = content.replace(
  'border-t border-slate-200 dark:border-weaver-dark',
  'border-t border-[#411270]'
);

content = content.replace(
  'text-slate-500 dark:text-slate-400 hover:text-weaver-purple dark:hover:text-weaver-orange hover:bg-weaver-purple/5 dark:hover:bg-weaver-dark',
  'text-white/50 hover:text-white hover:bg-[#4D0F8E]/50'
);

fs.writeFileSync('roomie-finder/src/components/layout/Sidebar.tsx', content);
