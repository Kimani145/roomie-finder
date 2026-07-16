const fs = require('fs');
const path = '/home/kimani/Projects/Roomie_Finder/roomie-finder/src/components/onboarding/OnboardingWizard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="flex flex-col gap-4">[\s\S]*?\{ROLE_OPTIONS\.map[\s\S]*?\}\)\}\s*<\/div>/g;

const replacer = `<div className="flex flex-col gap-4">
              {ROLE_OPTIONS.map((option) => {
                const selected = role === option.role
                
                let themeClassPattern = 'border-weaver-purple bg-weaver-purple/10 dark:bg-weaver-purple/20 text-weaver-purple dark:text-weaver-purple'
                if (option.role === 'HOST') {
                  themeClassPattern = 'border-card-dingley bg-card-dingley/10 dark:bg-card-dingley/20 text-card-dingley dark:text-card-dingley cursor-pointer'
                } else if (option.role === 'SEEKER') {
                  themeClassPattern = 'border-card-wine bg-card-wine/10 dark:bg-card-wine/20 text-card-wine dark:text-card-wine cursor-pointer'
                }
                
                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => setRole(option.role)}
                    className={[
                      'rounded-nest border p-5 text-left transition-colors',
                      selected
                        ? themeClassPattern
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500',
                    ].join(' ')}
                  >
                    <h2 className="font-syne text-lg font-bold mb-2">{option.title}</h2>
                    <p className="text-sm leading-relaxed opacity-80">{option.subtitle}</p>
                  </button>
                )
              })}
            </div>`;

content = content.replace(regex, replacer);
fs.writeFileSync(path, content);
