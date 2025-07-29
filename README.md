# RepSet - Your Ultimate Workout Companion

RepSet is a modern, progressive web application designed to help you plan, track, and achieve your fitness goals. Built with Next.js 13, it features a comprehensive exercise database, custom workout planning, and progress tracking capabilities.

## Features

- **Workout Planning**: Create and customize weekly workout routines
- **Exercise Database**: Access to a comprehensive library of exercises with detailed instructions
- **Weekly Calendar**: Visual calendar interface for planning workouts
- **Progress Tracking**: Monitor your fitness journey with detailed workout logs
- **PWA Support**: Install as a mobile app with offline functionality
- **Secure Authentication**: Google OAuth and email-based authentication
- **Fast Performance**: Optimized with Next.js 13 App Router and Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Google OAuth credentials (optional)
- Email server configuration (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/repset.git
cd repset
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
- MongoDB connection string
- NextAuth configuration
- Google OAuth credentials
- Email server settings

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **PWA**: next-pwa

## PWA Features

RepSet is a Progressive Web App with:

- **Offline Support**: Continue using the app without internet connection
- **Install Prompt**: Add to home screen on mobile devices
- **Service Worker**: Intelligent caching for optimal performance
- **Background Sync**: Sync data when connection is restored
- **Push Notifications**: Stay motivated with workout reminders (coming soon)

## Configuration

### SEO Optimization

The app includes comprehensive SEO features:

- Meta tags optimization
- Open Graph tags for social media
- Twitter Card integration
- Structured data (JSON-LD)
- Sitemap generation
- Robots.txt configuration

### PWA Configuration

Customize PWA behavior in `next.config.js`:

- Runtime caching strategies
- Offline page customization
- Icon configuration
- App manifest settings

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---

**RepSet** - Elevate your fitness journey, one rep at a time! 