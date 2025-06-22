# Quest

## Overview

Quest is a Progressive Web App (PWA) designed to enhance the museum experience by engaging users in interactive quests. The app encourages visitors to explore exhibits, discover artefacts, and complete challenges, making museum visits more immersive and educational.

## Project Purpose

The core idea behind Quest is to motivate users—especially students and young visitors—to physically visit the museum and interact with its collections. By turning exploration into a quest, the app fosters curiosity, learning, and active participation.

## Key Features

- **Progressive Web App (PWA)**: Works seamlessly on mobile and desktop, with offline support and installability
- **QR Code Scanning**: Users scan artefact QR codes to collect items and progress through quests
- **Admin Dashboard**: Museum staff can manage artefacts, quests, and user progress through a secure admin interface
- **Hints & Sequential Quests**: Quests can be sequential, with hints provided to guide users to the next artefact
- **User Profiles**: Track quest progress, completed quests, and collected artefacts
- **Bulk QR Generation**: Admins can generate and download QR codes for artefacts in bulk

## Technologies Used

- [Next.js](https://nextjs.org/) (React framework for SSR and SSG)
- [TypeScript](https://www.typescriptlang.org/) (type safety and maintainability)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first styling)
- [React Context](https://reactjs.org/docs/context.html) (state management)
- [PWA APIs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) (offline support, install prompts)
- [Vercel](https://vercel.com/) (deployment and serverless functions)
- [Jest](https://jestjs.io/) (testing)
- [Lucide React](https://lucide.dev/) (icon library)
- Custom Hooks & Components (for QR scanning, authentication, etc.)

## How It Works

1. Visitors use the Quest app on their device, scan QR codes placed near artefacts, and complete quests by collecting all required artefacts
2. Admins create and manage quests, artefacts, and hints through a dedicated dashboard
3. Progress is tracked per user, with hints and feedback provided to encourage learning and exploration

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/username/quest.git
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Access the app at http://localhost:3000

## Contributors

| Name | GitHub | Role | Contributions |
|------|--------|------|---------------|
| [Name 1] | [@username1](https://github.com/username1) | Frontend Developer | UI components, PWA implementation, responsive design |
| [Name 2] | [@username2](https://github.com/username2) | Backend Developer | API development, database design, authentication |
| [Name 3] | [@username3](https://github.com/username3) | Full Stack Developer | QR code integration, admin dashboard, testing |
| [Name 4] | [@username4](https://github.com/username4) | UI/UX Designer | User interface design, user experience, prototyping |

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please [open an issue](https://github.com/username/quest/issues) or contact us.