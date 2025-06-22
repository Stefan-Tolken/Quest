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
- **User Profiles**: Track quest progress, completed quests leaderboards, personal user data
- **Bulk QR Generation**: Admins can generate and download QR codes for artefacts in bulk

## Technologies Used

### Frontend & Development
- [Next.js](https://nextjs.org/) (React framework for SSR and SSG)
- [TypeScript](https://www.typescriptlang.org/) (type safety and maintainability)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first styling)
- [React Context](https://reactjs.org/docs/context.html) (state management)
- [PWA APIs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) (offline support, install prompts)
- [Jest](https://jestjs.io/) (testing)
- [Typescript](https://www.typescriptlang.org/) (quality assurance)
- [Lucide React](https://lucide.dev/) (icon library)
- Custom Hooks & Components (for QR scanning, authentication, etc.)

### AWS Services
- [DynamoDB](https://aws.amazon.com/dynamodb/) (NoSQL database for storing artefacts, users, quests, and 3D models data)
- [S3](https://aws.amazon.com/s3/) (Object storage for QR codes, 3D models, profile images, and artefact images)
- [Cognito](https://aws.amazon.com/cognito/) (User authentication and authorization)
- [Lambda](https://aws.amazon.com/lambda/) (Serverless functions for bulk QR code generation)
- [IAM](https://aws.amazon.com/iam/) (Identity and access management for secure environment variables and user monitoring)

### Deployment
- [Vercel](https://vercel.com/) (frontend deployment and serverless functions)

## How It Works

1. Visitors use the Quest app on their device, scan QR codes placed near artefacts, and complete quests by collecting all required artefacts
2. Admins create and manage quests, artefacts, and hints through a dedicated dashboard
3. Progress is tracked per user, with hints and feedback provided to encourage learning and exploration
4. After a Quest is finished the Admins can then decide who gets the prize from the leaderboard provided to them

## Getting Started

### Prerequisites

- Node.js 18+ 
- Next.js v19
- npm or yarn

## Contributors

GitHub | Role | Contributions |
|----------|--------|------------------|
| [@Stefan Tolken](https://github.com/Stefan-Tolken) | Frontend Developer | UI components, user experience, quest hints, responsive design, authentication, full styling |
| [@James Cooks](https://github.com/JamesCooks589) | Backend Developer/Co-Leader | API development, database design, page builder design  |
| [@Marcel le Roux](https://github.com/MarcelAndreleRoux) | Full Stack Developer/Co-Leader | QR code integration, admin dashboard, quest builder, PWA implementation, leaderboards |
| [@Jerome Lou](https://github.com/MNJLou) |  Full Stack Developer | Landing page, 3D model integration, 3d model builder, GSAP integration |

## License

This project is licensed under The Univercity of Pretoria

## Support

For questions or issues, please contact us.