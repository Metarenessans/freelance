# Portfolio React Hub (React 19 + TypeScript + Modular SCSS)

Modern React application architecture for Oleg G. (@Metarenessans) freelance portfolio.

## Technical Stack
- React 19 (`react`, `react-dom`)
- TypeScript 5.7+
- Sass / Modular SCSS (`*.module.scss` with Dart Sass compiler)
- Vite 6+ Bundler

## Architecture & Component Hierarchy

```
portfolio-react/
├── public/
│   ├── avatar.png
│   ├── avatar.webp
│   └── favicon suite
├── src/
│   ├── App.tsx                      # Root orchestrator with Theme provider
│   ├── App.module.scss              # Layout SCSS module
│   ├── main.tsx                     # React 19 entry point
│   ├── vite-env.d.ts                # Ambient module definitions
│   ├── types/
│   │   └── index.ts                 # Domain models and route types
│   ├── styles/
│   │   ├── _variables.scss          # Design tokens and CSS custom properties
│   │   ├── _mixins.scss             # Breakpoints, flex, and typography mixins
│   │   └── globals.scss             # Global resets and animation keyframes
│   └── components/
│       ├── Navbar/                  # Fixed header, theme toggle & scroll progress
│       │   ├── Navbar.tsx
│       │   └── Navbar.module.scss
│       ├── Hero/                    # Introduction, portrait card, trust metrics
│       │   ├── Hero.tsx
│       │   └── Hero.module.scss
│       ├── ProjectMatrix/           # Flagship showcase + Client deliverables
│       │   ├── ProjectMatrix.tsx
│       │   └── ProjectMatrix.module.scss
│       ├── Console/                 # Interactive workspace container
│       │   ├── Console.tsx
│       │   ├── Console.module.scss
│       │   ├── ApiExplorer/         # OpenAPI route selector & JSON preview
│       │   │   ├── ApiExplorer.tsx
│       │   │   └── ApiExplorer.module.scss
│       │   ├── TelegramSimulator/   # Live order dispatch mock device
│       │   │   ├── TelegramSimulator.tsx
│       │   │   └── TelegramSimulator.module.scss
│       │   └── AdminPreview/        # Django back-office feature cards
│       │       ├── AdminPreview.tsx
│       │       └── AdminPreview.module.scss
│       ├── CicdGate/                # 4-stage pipeline & GitHub Actions terminal
│       │   ├── CicdGate.tsx
│       │   └── CicdGate.module.scss
│       ├── SkillsStrip/             # 4-column full-stack capabilities
│       │   ├── SkillsStrip.tsx
│       │   └── SkillsStrip.module.scss
│       ├── HireSection/             # Upwork direct collaboration card
│       │   ├── HireSection.tsx
│       │   └── HireSection.module.scss
│       └── Footer/                  # Copyright and repository links
│           ├── Footer.tsx
│           └── Footer.module.scss
```

## Developer Information
- Developer: Oleg G.
- GitHub: [@Metarenessans](https://github.com/Metarenessans)
- Upwork: [Hire Me](https://www.upwork.com/freelancers/~0126a1db3ee4419254)

## Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Compile TypeScript and build production bundle
npm run build

# Preview production build
npm run preview
```
