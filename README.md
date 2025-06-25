# R2R Next.js Chat Application

A RAG (Retrieval-Augmented Generation) chat application built with Next.js, R2R, and Vercel AI SDK. Upload documents and chat with them using AI-powered search and response generation.

## Features

- 🔒 Authentication required (NextAuth.js)
- 📄 Document upload (PDF, TXT, MD, DOCX)
- 🎯 Drag-and-drop file upload
- 💬 Real-time streaming chat
- 🔍 RAG-powered responses using R2R
- 🤖 Switch between RAG and Agent modes
- 🎨 Responsive UI with Tailwind CSS
- ⚡ Built with Next.js 15 App Router
- 📊 PostHog analytics integration

## Prerequisites

- Node.js 18+
- R2R server running locally or remotely
- OpenAI API key

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up R2R Server

Install and run R2R locally:

```bash
# Install R2R
pip install r2r

# Start R2R server (default port: 7272)
r2r serve
```

Or follow the [R2R installation guide](https://r2r-docs.sciphi.ai/installation) for other installation methods.

### 3. Configure environment variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Update the values in `.env.local`:

```env
# R2R Configuration
R2R_BASE_URL=http://localhost:7272  # Your R2R server URL
R2R_API_KEY=your_r2r_api_key_here   # Optional: R2R API key if authentication is enabled

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here  # Your OpenAI API key

# NextAuth Configuration (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here  # Generate with: openssl rand -base64 32

# PostHog Analytics (Optional)
# NEXT_PUBLIC_POSTHOG_API_KEY=your_posthog_api_key
# NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# NEXT_PUBLIC_DISABLE_TELEMETRY=true
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Login**: Access the application requires authentication. Use any username/password for demo purposes
2. **Upload Documents**: Click the upload area or drag and drop files (PDF, TXT, MD, DOCX)
3. **Choose Mode**: Select between RAG (traditional search) or Agent mode
4. **Start Chatting**: Type your questions in the chat input
5. **Get RAG Responses**: The app searches your documents and generates contextual responses
6. **Logout**: Click the logout button in the header when done

## Architecture

- **Frontend**: Next.js App Router with React hooks
- **Chat UI**: Vercel AI SDK's `useChat` hook
- **Backend**: API routes for chat and file upload
- **Search**: R2R for document ingestion and retrieval
- **LLM**: OpenAI GPT-4 for response generation

## API Routes

- `/api/chat` - Handles chat messages, searches documents via R2R, and streams AI responses
- `/api/upload` - Processes file uploads and ingests documents into R2R

## Troubleshooting

### R2R Connection Issues
- Ensure R2R server is running on the correct port
- Check if `R2R_BASE_URL` in `.env.local` matches your R2R server address
- Verify R2R API key if authentication is enabled

### File Upload Errors
- Check file size (max 10MB)
- Ensure file type is supported (PDF, TXT, MD, DOCX)
- Verify R2R server has write permissions

### Chat Not Working
- Confirm OpenAI API key is valid
- Check browser console for errors
- Ensure all environment variables are set correctly

## Development

### Project Structure

```
r2r-nextjs-chat/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth API routes
│   │   ├── chat/route.ts                # Chat API endpoint
│   │   └── upload/route.ts              # Upload API endpoint
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                # Main chat UI
│   ├── posthog-provider.tsx   # PostHog analytics provider
│   └── session-provider.tsx    # NextAuth session provider
├── components/                 # UI components
├── lib/
│   ├── r2r-client.ts          # R2R client configuration
│   └── posthog-client.ts      # PostHog configuration
├── auth.ts                     # NextAuth configuration
├── middleware.ts               # Authentication middleware
├── .env.example
├── package.json
└── README.md
```

### Adding Features

- **Custom Prompts**: Modify the system prompt in `/api/chat/route.ts`
- **File Types**: Add new MIME types in `/api/upload/route.ts`
- **UI Components**: Extend the chat interface in `/app/page.tsx`

### Authentication Customization

The application uses NextAuth.js for authentication. Currently configured for demo purposes with a credentials provider that accepts any username/password.

To implement proper authentication:

1. **Database Authentication**: Replace the demo authorize function in `auth.ts` with database user validation
2. **OAuth Providers**: Add providers like Google, GitHub, etc. in `auth.ts`
3. **Custom Login Page**: Modify `/app/login/page.tsx` for your branding
4. **Session Management**: Configure session strategy and expiry in `auth.ts`

## Deploy on Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

Note: Ensure your R2R server is accessible from your deployment environment.

## License

MIT
